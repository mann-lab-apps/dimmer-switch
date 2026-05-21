import { NextResponse } from "next/server";
import { redis } from "@/services/redis";
import webPush from "web-push";

// VAPID 키 설정 (기본값 설정 및 환경 변수 활용)
const vapidPublicKey =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BHgu5aPshcrPQ-2jjoaT4g-z5zs3VG1imvdctF5WhUx9ubRGCi2HKG19sOhkFwBe0CnBg8eZw0XpWdcGqsc7DHU";
const vapidPrivateKey =
  process.env.VAPID_PRIVATE_KEY || "z4lmf8m7vRV6j0vFYtgZe47IHimTSqX5TlAOftnfPAw";

webPush.setVapidDetails(
  "mailto:test@example.com",
  vapidPublicKey,
  vapidPrivateKey
);

export async function POST(request: Request) {
  try {
    // 1. 보안 인증 토큰 검사 (크론 스케줄러 권한 확인)
    const authHeader = request.headers.get("Authorization");
    const expectedToken = `Bearer ${process.env.CRON_SECRET}`;

    if (!authHeader || authHeader !== expectedToken) {
      return NextResponse.json(
        { success: false, error: "인증되지 않은 요청입니다." },
        { status: 401 }
      );
    }

    // 2. Redis에서 전체 구독 목록 조회
    const subscriptions = await redis.smembers("push_subscriptions");
    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ success: true, sentCount: 0 });
    }

    let sentCount = 0;
    const payload = JSON.stringify({
      title: "화이팅 만마에!",
      body: "오늘 하루도 힘차게 극복해봐요!",
    });

    // 3. 루프를 돌며 기기마다 푸시 알림 발송 및 만료 처리
    const sendPromises = subscriptions.map(async (subString) => {
      try {
        const subscription = JSON.parse(subString);
        await webPush.sendNotification(subscription, payload);
        sentCount++;
      } catch (error: any) {
        console.error("푸시 알림 전송 실패:", error);

        // 410 Gone 또는 404 Not Found 인 경우 구독 세션이 만료된 것이므로 DB에서 정리
        if (error.statusCode === 410 || error.statusCode === 404) {
          console.warn("만료된 구독 발견, DB에서 제거합니다.");
          await redis.srem("push_subscriptions", subString);
        }
      }
    });

    await Promise.all(sendPromises);

    return NextResponse.json({ success: true, sentCount });
  } catch (error) {
    console.error("정각 푸시 배치 전송 중 전체 오류:", error);
    return NextResponse.json(
      { success: false, error: "서버 내부 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
