import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";

describe("PWA 웹 푸쉬 / 알림 기능 테스트 (SW)", () => {
  let mockShowNotification: any;
  let eventListeners: Record<string, Function> = {};
  
  beforeEach(() => {
    mockShowNotification = vi.fn().mockResolvedValue(undefined);
    eventListeners = {};
    
    // 서비스 워커의 전역 객체인 'self'를 Mocking 합니다.
    const mockSelf = {
      addEventListener: (eventName: string, callback: Function) => {
        eventListeners[eventName] = callback;
      },
      registration: {
        showNotification: mockShowNotification,
      },
      skipWaiting: vi.fn(),
      clients: {
        claim: vi.fn(),
      }
    };
    
    vi.stubGlobal("self", mockSelf);
  });
  
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("앱이 백그라운드 상태일 때 푸시 이벤트 수신 및 알림 노출 (Service Worker)", async () => {
    // Given 알림 권한 상태가 "granted" 이고 백그라운드 푸시가 활성화되어 있다
    vi.stubGlobal("Notification", { permission: "granted" });

    // And   앱이 종료되었거나 백그라운드 상태에 있다
    const swPath = path.resolve(__dirname, "../../public/sw.js");
    const swCode = fs.readFileSync(swPath, "utf-8");
    eval(swCode); // 백그라운드 서비스 워커(sw.js) 로드 및 대기 상태 진입
    
    // When 푸시 서버로부터 서비스 워커로 "push" 이벤트가 도착한다
    const pushEvent = {
      waitUntil: vi.fn((promise) => promise),
      // 실제 웹 푸시 Payload에서 올 수 있는 데이터 Mocking
      data: {
        json: () => ({}),
        text: () => "",
      }
    };
    
    // 서비스 워커에 'push' 이벤트 리스너가 등록되어 있다면 실행(트리거)
    if (eventListeners["push"]) {
      await eventListeners["push"](pushEvent);
    }
    
    // Then 서비스 워커는 시스템에 "화이팅 만마에!" 내용의 알림 카드 노출을 요청한다
    expect(mockShowNotification).toHaveBeenCalled();
    expect(mockShowNotification).toHaveBeenCalledWith(
      "화이팅 만마에!",
      expect.objectContaining({
        body: expect.any(String),
      })
    );
  });
});
