import { Redis } from "@upstash/redis";

// Redis 클라이언트 초기화 (Singleton)
export const redis = new Redis({
  url: process.env.REDIS_URL || "",
  token: process.env.REDIS_TOKEN || "",
});
