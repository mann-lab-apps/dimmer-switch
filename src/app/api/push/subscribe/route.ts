import { NextResponse } from "next/server";
import { redis } from "@/services/redis";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 유효한 구독 객체인지 최소한의 필드 검증 (endpoint 필드 필요)
    if (!body || !body.endpoint) {
      return NextResponse.json(
        { success: false, error: "유효하지 않은 구독 정보입니다." },
        { status: 400 }
      );
    }

    // Redis Set에 문자열 형태로 구독 객체 추가
    const subscriptionString = JSON.stringify(body);
    await redis.sadd("push_subscriptions", subscriptionString);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("구독 등록 중 오류 발생:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
