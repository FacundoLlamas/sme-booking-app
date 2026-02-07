/**
 * Cache Module Exports
 * LLM response caching with Redis/in-memory support
 */

export {
  InMemoryCache,
  RedisCache,
  initializeCache,
  getCache,
  createCacheKey,
  hashCacheKey,
  serializeForCache,
  deserializeFromCache,
  type CacheOptions,
  type CacheResult,
} from './redis-client';

export {
  generateClassificationCacheKey,
  getCachedClassification,
  cacheClassification,
  invalidateClassificationCache,
  clearAllClassificationCache,
  getCacheStats,
  withClassificationCache,
  type CachedClassification,
  type ClassificationCacheEntry,
} from './llm-cache';
