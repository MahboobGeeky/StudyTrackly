import { getRedis } from "./redis.js";

/** Namespace prefix — short to keep key sizes small */
const NS = "st";

// ─── Key builder ────────────────────────────────────────────────────────────

/**
 * Build a namespaced cache key.
 * Example: cacheKey("user123", "stats", "dashboard") → "st:user123:stats:dashboard"
 */
export function cacheKey(userId, ...parts) {
  return `${NS}:${userId}:${parts.join(":")}`;
}

// ─── Core helpers ────────────────────────────────────────────────────────────

/**
 * Read from cache. Returns null on miss, error, or if Redis is disabled.
 */
export async function cacheGet(key) {
  const redis = getRedis();
  if (!redis) {
    return null;
  }
  try {
    const data = await redis.get(key);
    console.log(`[cache] GET ${key} -> ${data ? "HIT" : "MISS"}`);
    if (!data) return null;
    return JSON.parse(data);
  } catch (err) {
    console.warn("[cache] GET error for key", key, err);
    return null;
  }
}

/**
 * Write to cache. Silently ignored if Redis is disabled.
 * @param {string} key
 * @param {unknown} value
 * @param {number} ttl - Time-to-live in seconds (default 60 s)
 */
export async function cacheSet(key, value, ttl = 60) {
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
export async function cacheInvalidatePattern(pattern) {
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
export async function invalidateStatsCache(userId) {
  await cacheInvalidatePattern(`${NS}:${userId}:stats:*`);
}

/**
 * Invalidate courses cache for a user.
 */
export async function invalidateCoursesCache(userId) {
  await cacheInvalidatePattern(`${NS}:${userId}:courses:*`);
}

/**
 * Invalidate sessions cache for a user.
 */
export async function invalidateSessionsCache(userId) {
  await cacheInvalidatePattern(`${NS}:${userId}:sessions:*`);
}

/**
 * Invalidate terms cache for a user.
 */
export async function invalidateTermsCache(userId) {
  await cacheInvalidatePattern(`${NS}:${userId}:terms:*`);
}

/**
 * Full user cache wipe — call this after major mutations (e.g. term create/delete).
 */
export async function invalidateAllUserCache(userId) {
  await cacheInvalidatePattern(`${NS}:${userId}:*`);
}
