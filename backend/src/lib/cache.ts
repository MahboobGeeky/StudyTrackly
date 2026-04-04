import { getRedis } from "./redis.js";

/** Namespace prefix — short to keep key sizes small */
const NS = "st";

// ─── Key builder ────────────────────────────────────────────────────────────

/**
 * Build a namespaced cache key.
 * Example: cacheKey("user123", "stats", "dashboard") → "st:user123:stats:dashboard"
 */
export function cacheKey(userId: string, ...parts: string[]): string {
  return `${NS}:${userId}:${parts.join(":")}`;
}

// ─── Core helpers ────────────────────────────────────────────────────────────

/**
 * Read from cache. Returns null on miss, error, or if Redis is disabled.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (!redis) {
    // console.warn("[cache] GET ignored: redis is disabled");
    return null;
  }
  try {
    const data = await redis.get(key);
    console.log(`[cache] GET ${key} -> ${data ? 'HIT' : 'MISS'}`);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch (err) {
    console.warn("[cache] GET error for key", key, err);
    return null;
  }
}

/**
 * Write to cache. Silently ignored if Redis is disabled.
 * @param ttl  Time-to-live in seconds (default 60 s)
 */
export async function cacheSet(
  key: string,
  value: unknown,
  ttl = 60
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttl);
    console.log(`[cache] SET ${key} (ttl: ${ttl}s)`);
  } catch (err) {
    console.warn("[cache] SET error for key", key, err);
  }
}

// ─── Invalidation helpers ───────────────────────────────────────────────────

/**
 * Delete all keys matching a glob pattern (e.g. "st:userId:stats:*").
 * Uses SCAN to avoid blocking Redis on large keyspaces.
 */
export async function cacheInvalidatePattern(pattern: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    let cursor = "0";
    do {
      const [nextCursor, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
      cursor = nextCursor;
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== "0");
  } catch (err) {
    console.warn("[cache] INVALIDATE error for pattern", pattern, err);
  }
}

/**
 * Invalidate all stat-related cache for a user (call after any session/course/term mutation).
 */
export async function invalidateStatsCache(userId: string): Promise<void> {
  await cacheInvalidatePattern(`${NS}:${userId}:stats:*`);
}

/**
 * Invalidate courses cache for a user.
 */
export async function invalidateCoursesCache(userId: string): Promise<void> {
  await cacheInvalidatePattern(`${NS}:${userId}:courses:*`);
}

/**
 * Invalidate sessions cache for a user.
 */
export async function invalidateSessionsCache(userId: string): Promise<void> {
  await cacheInvalidatePattern(`${NS}:${userId}:sessions:*`);
}

/**
 * Invalidate terms cache for a user.
 */
export async function invalidateTermsCache(userId: string): Promise<void> {
  await cacheInvalidatePattern(`${NS}:${userId}:terms:*`);
}

/**
 * Full user cache wipe — call this after major mutations (e.g. term create/delete).
 */
export async function invalidateAllUserCache(userId: string): Promise<void> {
  await cacheInvalidatePattern(`${NS}:${userId}:*`);
}
