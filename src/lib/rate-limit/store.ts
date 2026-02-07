/**
 * Rate Limiting Store Abstraction
 * Supports both in-memory (development) and Redis (production)
 */

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

export interface RateLimitStore {
  check(key: string, limit: number, windowMs: number): Promise<RateLimitResult>;
}

/**
 * In-memory rate limit store
 * Good for development and single-server deployments
 */
export class MemoryRateLimitStore implements RateLimitStore {
  private store = new Map<string, { count: number; resetAt: number }>();

  async check(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    const now = Date.now();
    const entry = this.store.get(key);

    // Clean up expired entries periodically
    if (this.store.size > 10000) {
      for (const [k, v] of this.store.entries()) {
        if (v.resetAt < now) {
          this.store.delete(k);
        }
      }
    }

    if (!entry || now > entry.resetAt) {
      this.store.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
    }

    entry.count++;
    const allowed = entry.count <= limit;
    const remaining = Math.max(0, limit - entry.count);

    if (!allowed) {
      return {
        allowed: false,
        remaining,
        resetAt: entry.resetAt,
        retryAfter: Math.ceil((entry.resetAt - now) / 1000),
      };
    }

    return { allowed, remaining, resetAt: entry.resetAt };
  }
}

/**
 * Redis-backed rate limit store
 * Recommended for production and multi-server deployments
 */
export class RedisRateLimitStore implements RateLimitStore {
  constructor(private redis: any) {}

  async check(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    const count = await this.redis.incr(key);
    
    if (count === 1) {
      await this.redis.pexpire(key, windowMs);
    }

    const ttl = await this.redis.pttl(key);
    const resetAt = Date.now() + (ttl > 0 ? ttl : windowMs);
    const allowed = count <= limit;
    const remaining = Math.max(0, limit - count);

    return {
      allowed,
      remaining,
      resetAt,
      retryAfter: allowed ? undefined : Math.ceil((resetAt - Date.now()) / 1000),
    };
  }
}
