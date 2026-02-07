/**
 * Redis Cache Client
 * Abstraction over Redis/in-memory caching for both local and production use
 */

import { createLogger } from '@/lib/logger';

const logger = createLogger('cache:redis');

export interface CacheOptions {
  ttlSeconds?: number;
}

export interface CacheResult<T> {
  data: T;
  fromCache: boolean;
  cachedAt?: Date;
}

/**
 * In-memory cache implementation (for local development)
 */
export class InMemoryCache {
  private cache = new Map<string, { data: string; expiresAt: number }>();
  private readonly maxSize = 1000;

  /**
   * Get a value from cache
   */
  async get(key: string): Promise<string | null> {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    // Check expiration
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set a value in cache
   */
  async set(key: string, value: string, ttlSeconds: number = 3600): Promise<void> {
    // Cleanup old entries if cache is too large
    if (this.cache.size >= this.maxSize) {
      const now = Date.now();
      const entriesToDelete = Array.from(this.cache.entries())
        .filter(([, { expiresAt }]) => expiresAt < now)
        .map(([k]) => k)
        .slice(0, Math.floor(this.maxSize * 0.1)); // Delete 10% of size

      entriesToDelete.forEach((k) => this.cache.delete(k));
    }

    this.cache.set(key, {
      data: value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Delete a value from cache
   */
  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{ size: number; keys: string[] }> {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

/**
 * Redis cache implementation (for production)
 */
export class RedisCache {
  private client: any;
  private readonly defaultTtl: number;

  constructor(redisUrl: string, defaultTtlSeconds: number = 3600) {
    this.defaultTtl = defaultTtlSeconds;
    // TODO: Initialize Redis client
    // This requires the redis package to be imported
  }

  /**
   * Get a value from cache
   */
  async get(key: string): Promise<string | null> {
    // TODO: Implement Redis get
    return null;
  }

  /**
   * Set a value in cache
   */
  async set(key: string, value: string, ttlSeconds: number = this.defaultTtl): Promise<void> {
    // TODO: Implement Redis set with TTL
  }

  /**
   * Delete a value from cache
   */
  async delete(key: string): Promise<void> {
    // TODO: Implement Redis delete
  }

  /**
   * Clear all cache (use with caution!)
   */
  async clear(): Promise<void> {
    // TODO: Implement Redis flush
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{ size: number; keys: string[] }> {
    // TODO: Implement Redis stats
    return { size: 0, keys: [] };
  }
}

/**
 * Global cache instance (in-memory by default, Redis if configured)
 */
let cacheInstance: InMemoryCache | RedisCache | null = null;

/**
 * Initialize cache (call once at startup)
 */
export function initializeCache(): InMemoryCache | RedisCache {
  if (cacheInstance) {
    return cacheInstance;
  }

  const redisUrl = process.env.REDIS_URL;
  const cacheTtl = parseInt(process.env.CACHE_TTL_SECONDS || '3600', 10);

  if (redisUrl) {
    logger.info(`Initializing Redis cache at ${redisUrl}`);
    cacheInstance = new RedisCache(redisUrl, cacheTtl);
  } else {
    logger.info('Initializing in-memory cache (Redis not configured)');
    cacheInstance = new InMemoryCache();
  }

  return cacheInstance;
}

/**
 * Get the cache instance
 */
export function getCache(): InMemoryCache | RedisCache {
  if (!cacheInstance) {
    return initializeCache();
  }
  return cacheInstance;
}

/**
 * Create a cache key from components
 */
export function createCacheKey(...parts: string[]): string {
  return parts.filter((p) => p !== undefined && p !== null).join(':');
}

/**
 * Hash a string for cache key (ensures reasonable length)
 */
export function hashCacheKey(input: string): string {
  // Simple hash function (for production, consider crypto.createHash)
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char; // eslint-disable-line no-bitwise
    hash = hash & hash; // eslint-disable-line no-bitwise
  }
  return Math.abs(hash).toString(36);
}

/**
 * Serialize data for caching
 */
export function serializeForCache<T>(data: T): string {
  return JSON.stringify(data);
}

/**
 * Deserialize data from cache
 */
export function deserializeFromCache<T>(data: string): T {
  return JSON.parse(data);
}
