import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as subscribePOST } from "@/app/api/push/subscribe/route";
import { POST as unsubscribePOST } from "@/app/api/push/unsubscribe/route";
import { POST as sendHourlyPOST } from "@/app/api/push/send-hourly/route";
import { redis } from "@/services/redis";
import webPush from "web-push";

// Mock Redis client
vi.mock("@/services/redis", () => ({
  redis: {
    sadd: vi.fn(),
    srem: vi.fn(),
    smembers: vi.fn(),
  },
}));

// Mock Web Push library
vi.mock("web-push", () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn(),
  },
}));

describe("백그라운드 푸시 백엔드 API 및 스케줄러 테스트", () => {
  const mockSubscription = {
    endpoint: "https://fcm.googleapis.com/fcm/send/mock-device-id",
    keys: {
      p256dh: "mock-p256dh",
      auth: "mock-auth",
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "super-secret-token";
  });

  describe("POST /api/push/subscribe", () => {
    // Scenario Outline: 백그라운드 푸시 알림 설정 토글 (Action: On)
    it("올바른 구독 정보를 전송하면 DB에 등록되고 200 OK를 반환한다", async () => {
      // Given 사용자가 백그라운드 푸시 설정을 활성화하여 구독 객체가 생성되었다
      const req = new Request("http://localhost/api/push/subscribe", {
        method: "POST",
        body: JSON.stringify(mockSubscription),
      });

      // When 서버 백엔드 API "/api/push/subscribe"로 구독 정보가 전송된다
      const res = await subscribePOST(req);

      // Then 서버는 성공 응답(200 OK)을 반환한다
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);

      // And 구독 정보가 데이터베이스(Redis)에 저장된다
      expect(redis.sadd).toHaveBeenCalledWith(
        "push_subscriptions",
        JSON.stringify(mockSubscription)
      );
    });

    it("구독 정보가 비어있으면 400 Bad Request를 반환한다", async () => {
      // Given 클라이언트가 올바르지 않은 구독 정보를 전송하려고 한다
      const req = new Request("http://localhost/api/push/subscribe", {
        method: "POST",
        body: JSON.stringify({}),
      });

      // When 서버 백엔드 API "/api/push/subscribe"로 전송된다
      const res = await subscribePOST(req);

      // Then 서버는 400 Bad Request 에러 응답을 반환한다
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/push/unsubscribe", () => {
    // Scenario Outline: 백그라운드 푸시 알림 설정 토글 (Action: Off)
    it("구독 취소를 요청하면 DB에서 해당 구독이 제거되고 200 OK를 반환한다", async () => {
      // Given 사용자가 백그라운드 푸시 설정을 비활성화하였다
      const req = new Request("http://localhost/api/push/unsubscribe", {
        method: "POST",
        body: JSON.stringify(mockSubscription),
      });

      // When 서버 백엔드 API "/api/push/unsubscribe"로 구독 해제 요청이 전송된다
      const res = await unsubscribePOST(req);

      // Then 서버는 성공 응답(200 OK)을 반환한다
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);

      // And 해당 구독 정보가 데이터베이스(Redis)에서 제거된다
      expect(redis.srem).toHaveBeenCalledWith(
        "push_subscriptions",
        JSON.stringify(mockSubscription)
      );
    });
  });

  describe("POST /api/push/send-hourly", () => {
    // Scenario: 매 정각 1시간 주기 백그라운드 푸시 스케줄링 발송 및 실패 구독 정리 (Cron)
    it("CRON_SECRET 보안 토큰이 올바르지 않으면 401 Unauthorized를 반환한다", async () => {
      // Given 헤더 토큰이 올바르지 않은 크론 트리거 요청이 유입된다
      const req = new Request("http://localhost/api/push/send-hourly", {
        method: "POST",
        headers: {
          Authorization: "Bearer invalid-token",
        },
      });

      // When 배치 크론이 "/api/push/send-hourly"를 호출한다
      const res = await sendHourlyPOST(req);

      // Then 서버는 401 Unauthorized 에러 응답을 반환한다
      expect(res.status).toBe(401);
    });

    // Scenario: 매 정각 1시간 주기 백그라운드 푸시 스케줄링 발송 및 실패 구독 정리 (Cron)
    it("등록된 구독 대상이 있으면 모두에게 푸시를 발송한다", async () => {
      // Given 데이터베이스에 구독 정보 목록이 저장되어 있다
      vi.mocked(redis.smembers).mockResolvedValue([
        JSON.stringify(mockSubscription),
      ]);
      vi.mocked(webPush.sendNotification).mockResolvedValue({
        statusCode: 201,
        body: "",
        headers: {},
      });

      const req = new Request("http://localhost/api/push/send-hourly", {
        method: "POST",
        headers: {
          Authorization: "Bearer super-secret-token",
        },
      });

      // When 매 정각 배치 크론이 헤더 토큰과 함께 "/api/push/send-hourly"를 호출한다
      const res = await sendHourlyPOST(req);

      // Then 서버는 모든 유효한 구독 기기로 웹 푸시 알림을 발송한다
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.sentCount).toBe(1);

      expect(webPush.sendNotification).toHaveBeenCalledWith(
        mockSubscription,
        expect.any(String)
      );
    });

    // Scenario: 매 정각 1시간 주기 백그라운드 푸시 스케줄링 발송 및 실패 구독 정리 (Cron)
    it("푸시 전송에 실패한(만료된) 구독은 DB에서 자동으로 삭제한다", async () => {
      // Given 데이터베이스에 구독 정보 목록이 저장되어 있다
      vi.mocked(redis.smembers).mockResolvedValue([
        JSON.stringify(mockSubscription),
      ]);
      
      // And 그 중 만료되거나 유효하지 않은 구독 정보가 포함되어 있다 (410 Gone 에러 모킹)
      const goneError = new Error("Subscription expired");
      (goneError as any).statusCode = 410;
      vi.mocked(webPush.sendNotification).mockRejectedValue(goneError);

      const req = new Request("http://localhost/api/push/send-hourly", {
        method: "POST",
        headers: {
          Authorization: "Bearer super-secret-token",
        },
      });

      // When 매 정각 배치 크론이 헤더 토큰과 함께 "/api/push/send-hourly"를 호출한다
      const res = await sendHourlyPOST(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.sentCount).toBe(0);

      // Then 만료되거나 유효하지 않은 구독 정보는 데이터베이스에서 삭제(정리)된다
      expect(redis.srem).toHaveBeenCalledWith(
        "push_subscriptions",
        JSON.stringify(mockSubscription)
      );
    });
  });
});
