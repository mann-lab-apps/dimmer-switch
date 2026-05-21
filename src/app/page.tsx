"use client";

import { useState, useEffect, useRef } from "react";

// VAPID 키 변환 헬퍼 함수
const urlBase64ToUint8Array = (base64String: string) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export default function Home() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [message, setMessage] = useState<string>("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [isBackgroundPushEnabled, setIsBackgroundPushEnabled] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 1시간 주기 응원 알림 스케줄러 등록
  const startScheduler = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const sendHourlyNotification = () => {
      if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification("화이팅 만마에!", {
            body: "오늘 하루도 힘차게 극복해봐요!",
            icon: "/icons/icon-192x192.png",
            badge: "/icons/icon-192x192.png",
            tag: "hourly-cheer",
          });
        });
      }
    };

    // 1시간마다 푸시 알림 트리거 (60분 * 60초 * 1000ms)
    timerRef.current = setInterval(sendHourlyNotification, 60 * 60 * 1000);
  };

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
      if (Notification.permission === "granted") {
        startScheduler();
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // 알림 권한 요청 처리
  const requestPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setMessage("이 브라우저는 알림을 지원하지 않습니다.");
      setMessageType("error");
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === "granted") {
        setMessage("알림이 활성화되었습니다");
        setMessageType("success");
        startScheduler();
      } else if (result === "denied") {
        setMessage("알림 권한이 거부되었습니다. 브라우저 설정에서 허용해주세요");
        setMessageType("error");
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
    } catch (error) {
      console.error("알림 권한 요청 중 오류 발생:", error);
    }
  };

  // 즉시 테스트 알림 전송
  const sendTestNotification = async () => {
    if (permission !== "granted") return;

    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        registration.showNotification("화이팅 만마에!", {
          body: "즉시 테스트 알림입니다. 언제나 응원합니다!",
          icon: "/icons/icon-192x192.png",
          badge: "/icons/icon-192x192.png",
          tag: "test-cheer",
        });
      } catch (error) {
        console.error("즉시 테스트 알림 발송 중 오류 발생:", error);
      }
    }
  };

  // 백그라운드 푸시 토글 핸들러
  const handleToggleBackgroundPush = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setIsBackgroundPushEnabled(checked);
    
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      setMessage("백그라운드 푸시를 지원하지 않는 브라우저입니다.");
      setMessageType("error");
      setIsBackgroundPushEnabled(false);
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      if (checked) {
        // 실제 테스트용 VAPID 키 (배포 시 환경변수 사용 권장)
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "BHgu5aPshcrPQ-2jjoaT4g-z5zs3VG1imvdctF5WhUx9ubRGCi2HKG19sOhkFwBe0CnBg8eZw0XpWdcGqsc7DHU";
        const applicationServerKey = urlBase64ToUint8Array(vapidKey);
        
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey,
        });

        // 서버 DB에 구독 정보 등록 요청
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(subscription),
        });
        
        console.log("=== 백그라운드 푸시 구독 정보 (복사해서 테스트에 사용하세요) ===");
        console.log(JSON.stringify(subscription));
        console.log("===============================================================");
        
        setMessage("백그라운드 알림이 켜졌습니다");
        setMessageType("success");
      } else {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          // 서버 DB에서 구독 정보 삭제 요청
          await fetch("/api/push/unsubscribe", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(subscription),
          });

          await subscription.unsubscribe();
        }
        setMessage("백그라운드 알림이 꺼졌습니다");
        setMessageType("success");
      }
    } catch (error) {
      console.error("백그라운드 푸시 설정 중 오류:", error);
      setMessage("설정 중 오류가 발생했습니다.");
      setMessageType("error");
      setIsBackgroundPushEnabled(!checked); // 상태 롤백
    }
  };

  // 헬퍼: 배지 텍스트 및 클래스명 매핑
  const getStatusConfig = () => {
    switch (permission) {
      case "granted":
        return { text: "알림 상태: 활성화됨", className: "granted" };
      case "denied":
        return { text: "알림 상태: 거부됨", className: "denied" };
      default:
        return { text: "알림 상태: 설정 필요", className: "default" };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <main className="app-container">
      <div className="glass-card">
        {/* 로고 영역 */}
        <div style={{ marginBottom: "20px" }}>
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a5b4fc" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
        </div>

        <h1 className="app-title">Dimmer Switch</h1>
        <p className="app-description">
          마음이 지칠 때 빛을 켜듯 긍정을 켭니다.<br />
          매 시간 당신에게 따뜻한 응원을 전송합니다.
        </p>

        {/* 상태 표시 영역 */}
        <div className={`status-badge ${statusConfig.className}`}>
          <span className="status-dot"></span>
          <span>{statusConfig.text}</span>
        </div>

        {/* 피드백 메시지 안내 */}
        {message && (
          <div className={`feedback-message ${messageType}`}>{message}</div>
        )}

        {/* 인터랙션 버튼 영역 */}
        {permission !== "granted" ? (
          <button className="btn btn-primary" onClick={requestPermission}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginRight: "4px" }}
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            알림 활성화
          </button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <button className="btn btn-primary" onClick={sendTestNotification}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ marginRight: "4px" }}
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
              즉시 테스트 알림 받기
            </button>

            {/* 백그라운드 푸시 스위치 UI */}
            <label
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                background: "rgba(255, 255, 255, 0.05)",
                borderRadius: "8px",
                cursor: "pointer",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <span style={{ fontSize: "15px", fontWeight: "500" }}>백그라운드 푸시</span>
              <input
                type="checkbox"
                checked={isBackgroundPushEnabled}
                onChange={handleToggleBackgroundPush}
                aria-label="백그라운드 푸시"
                style={{
                  width: "20px",
                  height: "20px",
                  accentColor: "#6366f1",
                  cursor: "pointer",
                }}
              />
            </label>
          </div>
        )}

        {permission === "denied" && (
          <button
            className="btn btn-secondary"
            disabled
            style={{ marginTop: "8px" }}
          >
            차단 해제는 브라우저 설정을 참고하세요
          </button>
        )}
      </div>
    </main>
  );
}
