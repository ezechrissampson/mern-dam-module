import Redis from 'ioredis';
import env from './env.js';
import logger from '../utils/logger.js';

/**
 * Redis is optional. If REDIS_URL is not configured, the module falls back
 * to a no-op cache client so the rest of the application never has to
 * special-case "is caching enabled?" — every call site just calls
 * cache.get/set/del and gets sane behavior either way.
 */
class NoopCache {
  async get() {
    return null;
  }
  async set() {
    return 'OK';
  }
  async del() {
    return 0;
  }
  async keys() {
    return [];
  }
  async flushPattern() {
    return 0;
  }
}

class RedisCache {
  constructor(client) {
    this.client = client;
  }

  async get(key) {
    const raw = await this.client.get(key);
    return raw ? JSON.parse(raw) : null;
  }

  async set(key, value, ttlSeconds = env.redis.ttlSeconds) {
    return this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  }

  async del(key) {
    return this.client.del(key);
  }

  async keys(pattern) {
    return this.client.keys(pattern);
  }

  /** Invalidate every cache key matching a prefix, e.g. "media:list:*" */
  async flushPattern(pattern) {
    const matches = await this.client.keys(pattern);
    if (!matches.length) return 0;
    return this.client.del(...matches);
  }
}

let cache;

if (env.redis.url) {
  const client = new Redis(env.redis.url, {
    maxRetriesPerRequest: 2,
    retryStrategy: (times) => Math.min(times * 200, 2000),
  });

  client.on('connect', () => logger.info('[redis] connected'));
  client.on('error', (err) => logger.error(`[redis] error: ${err.message}`));

  cache = new RedisCache(client);
} else {
  logger.warn('[redis] REDIS_URL not set — running with in-memory no-op cache (dev only)');
  cache = new NoopCache();
}

export default cache;
