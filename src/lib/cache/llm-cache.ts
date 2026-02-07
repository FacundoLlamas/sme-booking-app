/**
 * LLM Response Cache
 * Caches LLM classification responses to reduce API costs and improve performance
 */

import { createHash } from 'crypto';
import { createLogger } from '@/lib/logger';
import {
  getCache,
  createCacheKey,
  hashCacheKey,
  serializeForCache,
  deserializeFromCache,
} from './redis-client';

const logger = createLogger('cache:llm');

export interface CachedClassification {
  service_type: string;
  urgency: string;
  confidence: number;
  reasoning: string;
  estimated_duration_minutes: number;
  cached_at: string;
  cache_version: number;
}

export interface ClassificationCacheEntry {
  data: CachedClassification;
  timestamp: number;
}

// Cache version (increment when changing schema)
const CACHE_VERSION = 1;
const CACHE_TTL_SECONDS = 24 * 60 * 60; // 24 hours
const CACHE_PREFIX = 'llm:classification';

/**
 * Generate cache key from customer message
 * Creates a deterministic hash of the message to use as cache key
 */
export function generateClassificationCacheKey(
  serviceType: string,
  customerMessage: string
): string {
  // Normalize message for consistent hashing
  const normalizedMessage = customerMessage.toLowerCase().trim();

  // Create SHA256 hash of message
  const hash = createHash('sha256')
    .update(normalizedMessage)
    .digest('hex')
    .substring(0, 16); // Use first 16 chars for brevity

  return createCacheKey(CACHE_PREFIX, serviceType, hash);
}

/**
 * Get cached classification if available
 */
export async function getCachedClassification(
  serviceType: string,
  customerMessage: string
): Promise<{ data: CachedClassification; isCached: true } | { isCached: false }> {
  try {
    const cache = getCache();
    const cacheKey = generateClassificationCacheKey(serviceType, customerMessage);

    const cached = await cache.get(cacheKey);
    if (!cached) {
      return { isCached: false };
    }

    const entry: ClassificationCacheEntry = deserializeFromCache(cached);

    // Verify cache version matches
    if (entry.data.cache_version !== CACHE_VERSION) {
      logger.debug(`Cache version mismatch, invalidating: ${cacheKey}`);
      await cache.delete(cacheKey);
      return { isCached: false };
    }

    logger.debug(`Cache hit for: ${cacheKey}`);
    return { data: entry.data, isCached: true };
  } catch (error) {
    logger.error('Error retrieving from cache:', error);
    return { isCached: false };
  }
}

/**
 * Cache a classification result
 */
export async function cacheClassification(
  serviceType: string,
  customerMessage: string,
  classification: Omit<CachedClassification, 'cached_at' | 'cache_version'>
): Promise<void> {
  try {
    const cache = getCache();
    const cacheKey = generateClassificationCacheKey(serviceType, customerMessage);

    const entry: ClassificationCacheEntry = {
      data: {
        ...classification,
        cached_at: new Date().toISOString(),
        cache_version: CACHE_VERSION,
      },
      timestamp: Date.now(),
    };

    await cache.set(cacheKey, serializeForCache(entry), CACHE_TTL_SECONDS);
    logger.debug(`Cached classification: ${cacheKey}`);
  } catch (error) {
    logger.error('Error caching classification:', error);
    // Non-fatal error - continue without cache
  }
}

/**
 * Invalidate cache for a specific classification
 */
export async function invalidateClassificationCache(
  serviceType: string,
  customerMessage: string
): Promise<void> {
  try {
    const cache = getCache();
    const cacheKey = generateClassificationCacheKey(serviceType, customerMessage);
    await cache.delete(cacheKey);
    logger.debug(`Invalidated cache: ${cacheKey}`);
  } catch (error) {
    logger.error('Error invalidating cache:', error);
  }
}

/**
 * Clear all LLM classification cache
 */
export async function clearAllClassificationCache(): Promise<void> {
  try {
    const cache = getCache();
    const stats = await cache.getStats();

    // Only clear LLM-related keys
    const keysToDelete = stats.keys.filter((k) => k.startsWith(CACHE_PREFIX));

    for (const key of keysToDelete) {
      await cache.delete(key);
    }

    logger.info(`Cleared ${keysToDelete.length} cached classifications`);
  } catch (error) {
    logger.error('Error clearing classification cache:', error);
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  totalSize: number;
  cachePrefix: string;
  ttlSeconds: number;
  cacheVersion: number;
}> {
  try {
    const cache = getCache();
    const stats = await cache.getStats();

    return {
      totalSize: stats.size,
      cachePrefix: CACHE_PREFIX,
      ttlSeconds: CACHE_TTL_SECONDS,
      cacheVersion: CACHE_VERSION,
    };
  } catch (error) {
    logger.error('Error getting cache stats:', error);
    return {
      totalSize: 0,
      cachePrefix: CACHE_PREFIX,
      ttlSeconds: CACHE_TTL_SECONDS,
      cacheVersion: CACHE_VERSION,
    };
  }
}

/**
 * Wrap a classification function with caching
 * Transparently adds caching layer
 */
export async function withClassificationCache<T extends { service_type: string }>(
  serviceType: string,
  customerMessage: string,
  classificationFn: () => Promise<T>
): Promise<T & { fromCache: boolean }> {
  // Check cache first
  const cached = await getCachedClassification(serviceType, customerMessage);
  if (cached.isCached) {
    return {
      ...(cached.data as unknown as T),
      fromCache: true,
    };
  }

  // Call the function if not cached
  const result = await classificationFn();

  // Cache the result (async, don't wait)
  cacheClassification(
    serviceType,
    customerMessage,
    result as unknown as Omit<CachedClassification, 'cached_at' | 'cache_version'>
  ).catch((error) => {
    logger.error('Error in background cache operation:', error);
  });

  return {
    ...result,
    fromCache: false,
  };
}
