/**
 * Cache Service
 * Uses Redis when REDIS_URL is set, otherwise in-memory cache
 * Used for social proof data, leaderboards, and frequently accessed data
 */

import Redis from 'ioredis';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const REDIS_URL = process.env.REDIS_URL;
const CACHE_PREFIX = 'vormex:';

function createRedisClient(): Redis | null {
  if (!REDIS_URL) return null;
  try {
    return new Redis(REDIS_URL, { maxRetriesPerRequest: 2 });
  } catch {
    return null;
  }
}

const redis = createRedisClient();

class CacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();

  private prefixed(key: string): string {
    return `${CACHE_PREFIX}${key}`;
  }

  /**
   * Get a cached value
   */
  async get<T>(key: string): Promise<T | null> {
    if (redis) {
      try {
        const raw = await redis.get(this.prefixed(key));
        if (!raw) return null;
        return JSON.parse(raw) as T;
      } catch {
        return null;
      }
    }
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.value as T;
  }

  /**
   * Set a cached value with TTL in seconds
   */
  async set<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
    if (redis) {
      try {
        await redis.setex(
          this.prefixed(key),
          ttlSeconds,
          JSON.stringify(value)
        );
      } catch {
        // Fall through to memory
      }
    }
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Delete a cached value
   */
  async del(key: string): Promise<void> {
    if (redis) {
      try {
        await redis.del(this.prefixed(key));
      } catch {}
    }
    this.cache.delete(key);
  }

  /**
   * Delete multiple keys by pattern (e.g. "user:*")
   */
  async delPattern(pattern: string): Promise<void> {
    if (redis) {
      try {
        const keys = await redis.keys(this.prefixed(pattern));
        if (keys.length > 0) await redis.del(...keys);
      } catch {}
    }
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    for (const key of this.cache.keys()) {
      if (regex.test(key)) this.cache.delete(key);
    }
  }

  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    if (redis) {
      try {
        return (await redis.exists(this.prefixed(key))) === 1;
      } catch {
        return false;
      }
    }
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Increment a numeric value
   */
  async incr(key: string): Promise<number> {
    if (redis) {
      try {
        const n = await redis.incr(this.prefixed(key));
        const ttl = await redis.ttl(this.prefixed(key));
        if (ttl === -1) await redis.expire(this.prefixed(key), 3600);
        return n;
      } catch {}
    }
    const current = await this.get<number>(key);
    const newValue = (current || 0) + 1;
    await this.set(key, newValue, 3600);
    return newValue;
  }

  /**
   * Add to a set
   */
  async sadd(key: string, ...members: string[]): Promise<number> {
    if (redis) {
      try {
        return await redis.sadd(this.prefixed(key), ...members);
      } catch {}
    }
    const current = await this.get<Set<string>>(key) || new Set<string>();
    let added = 0;
    for (const member of members) {
      if (!current.has(member)) {
        current.add(member);
        added++;
      }
    }
    await this.set(key, current, 3600);
    return added;
  }

  /**
   * Get set members
   */
  async smembers(key: string): Promise<string[]> {
    if (redis) {
      try {
        return await redis.smembers(this.prefixed(key));
      } catch {}
    }
    const current = await this.get<Set<string>>(key);
    return current ? Array.from(current) : [];
  }

  /**
   * Clear all cache entries (memory only; Redis not cleared)
   */
  async clear(): Promise<void> {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  getStats() {
    return {
      backend: redis ? 'redis' : 'memory',
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

export const cacheService = new CacheService();
