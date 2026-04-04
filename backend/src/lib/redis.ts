import { Redis } from "ioredis";

let _redis: Redis | null = null;
let _initialized = false;

/**
 * Returns a Redis client if REDIS_URL is set, otherwise returns null so the
 * app keeps working without Redis (cache miss on every request).
 */
export function getRedis(): Redis | null {
  if (_initialized) return _redis;
  _initialized = true;

  const url = process.env.REDIS_URL?.trim();

  if (!url) {
    console.warn(
      "[redis] Redis not configured — set REDIS_URL to enable caching."
    );
    return null;
  }

  try {
    _redis = new Redis(url);
    _redis.on("error", (err) => console.error("[redis] Connection error:", err));
    console.log("[redis] Redis connected ✓");
  } catch (err) {
    console.error("[redis] Failed to initialise Redis client:", err);
    _redis = null;
  }

  return _redis;
}

export function isRedisEnabled(): boolean {
  return getRedis() !== null;
}
