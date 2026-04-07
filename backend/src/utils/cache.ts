import redis from "../config/redis";
import { logger } from "./logger";

// ── TTLs (seconds) ─────────────────────────────────────────────────────
export const TTL = {
  USER_DASHBOARD:   60,        // user dashboard overview & analytics — 1 min
  USER_PROFILE:     120,       // user profile — 2 min
  ADMIN_DASHBOARD:  60,        // admin dashboard KPIs — 1 min
  ADMIN_STATS:      120,       // admin credits/payments/domain stats — 2 min
  PROJECTS:         120,
  ANSWERS:          120,
  MEMORIES:         120,
  RESUMES:          120,
  WALLET:           60,
} as const;

// ── Key builders ───────────────────────────────────────────────────────
export const CacheKey = {
  userDashboardOverview:  (uid: string) => `user:${uid}:dashboard:overview`,
  userDashboardAnalytics: (uid: string) => `user:${uid}:dashboard:analytics`,
  userProfile:            (uid: string) => `user:${uid}:profile`,
  userProjects:           (uid: string) => `user:${uid}:projects`,
  userAnswers:            (uid: string) => `user:${uid}:answers`,
  userMemories:           (uid: string) => `user:${uid}:memories`,
  userResumes:            (uid: string) => `user:${uid}:resumes`,
  userWallet:             (uid: string) => `user:${uid}:wallet`,
  adminDashboard:         ()             => `admin:dashboard`,
  adminCredits:           ()             => `admin:credits`,
  adminDomains:           ()             => `admin:domains`,
  adminAiUsage:           ()             => `admin:ai-usage`,
  adminReferrals:         ()             => `admin:referrals`,
};

// ── Core helpers ───────────────────────────────────────────────────────

/**
 * Get a cached value. Returns null on miss or Redis error.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const raw = await redis.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Set a value in cache with a TTL. Fire-and-forget — never throws.
 */
export function cacheSet(key: string, value: unknown, ttlSeconds: number): void {
  redis.set(key, JSON.stringify(value), "EX", ttlSeconds).catch((err) => {
    logger.warn("cache", "SET failed", { key, message: (err as Error).message });
  });
}

/**
 * Delete one or more cache keys. Fire-and-forget.
 */
export function cacheDel(...keys: string[]): void {
  if (keys.length === 0) return;
  redis.del(...keys).catch((err) => {
    logger.warn("cache", "DEL failed", { keys, message: (err as Error).message });
  });
}

/**
 * Delete all keys matching a pattern (e.g. `user:abc123:*`).
 * Uses SCAN to avoid blocking Redis.
 */
export async function cacheDelPattern(pattern: string): Promise<void> {
  try {
    let cursor = "0";
    do {
      const [next, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
      cursor = next;
      if (keys.length > 0) await redis.del(...keys);
    } while (cursor !== "0");
  } catch (err) {
    logger.warn("cache", "DEL pattern failed", { pattern, message: (err as Error).message });
  }
}

/**
 * Cache-aside helper: try cache first, fall back to loader, then cache the result.
 */
export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>
): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached !== null) return cached;

  const fresh = await loader();
  cacheSet(key, fresh, ttlSeconds);
  return fresh;
}
