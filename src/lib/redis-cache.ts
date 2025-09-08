// REDIS COMPLETELY DISABLED FOR DEVELOPMENT
// import { createClient, RedisClientType } from 'redis'; // DISABLED FOR DEVELOPMENT
import { createHash } from 'crypto';

// Mock Redis types for development
type RedisClientType = any;

// FORCE EXIT - REDIS COMPLETELY DISABLED
console.log('🚫 Redis module loaded but completely disabled for development');

interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  ttl?: number; // Time to live in seconds
  enabled?: boolean; // Whether Redis is enabled
}

interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
}

class RedisCacheService {
  private client: RedisClientType | null = null;
  private config: CacheConfig;
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0
  };
  private isConnected = false;

  constructor(config: CacheConfig) {
    this.config = {
      ttl: 3600, // 1 hour default TTL
      ...config
    };
  }

  async connect(): Promise<boolean> {
    // REDIS COMPLETELY DISABLED FOR DEVELOPMENT
    console.log('🚫 Redis connect() called but completely disabled for development');
    this.isConnected = false;
    this.client = null;
    return false;
  }

  async disconnect(): Promise<void> {
    // REDIS COMPLETELY DISABLED FOR DEVELOPMENT
    console.log('🚫 Redis disconnect() called but completely disabled for development');
    this.isConnected = false;
    this.client = null;
  }

  private generateCacheKey(prefix: string, data: any): string {
    // Create a hash of the data to ensure consistent keys
    const dataString = JSON.stringify(data);
    const hash = createHash('sha256').update(dataString).digest('hex');
    return `${prefix}:${hash.substring(0, 16)}`;
  }

  async get<T>(prefix: string, data: any): Promise<T | null> {
    try {
      if (!this.client || !this.isConnected) {
        this.metrics.misses++;
        return null;
      }

      const key = this.generateCacheKey(prefix, data);
      const cached = await this.client.get(key);
      
      if (cached) {
        this.metrics.hits++;
        if (process.env.NODE_ENV === 'production') {
          console.log(`🎯 Redis Cache HIT for key: ${key}`);
        }
        return JSON.parse(cached);
      } else {
        this.metrics.misses++;
        if (process.env.NODE_ENV === 'production') {
          console.log(`❌ Redis Cache MISS for key: ${key}`);
        }
        return null;
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'production') {
        console.error('❌ Redis GET Error:', error);
      }
      this.metrics.errors++;
      return null;
    }
  }

  async set(prefix: string, data: any, value: any, ttl?: number): Promise<boolean> {
    try {
      if (!this.client || !this.isConnected) {
        return false;
      }

      const key = this.generateCacheKey(prefix, data);
      const serializedValue = JSON.stringify(value);
      const cacheTTL = ttl || this.config.ttl || 3600;

      await this.client.setEx(key, cacheTTL, serializedValue);
      this.metrics.sets++;
      if (process.env.NODE_ENV === 'production') {
        console.log(`💾 Redis Cache SET for key: ${key} (TTL: ${cacheTTL}s)`);
      }
      return true;
    } catch (error) {
      if (process.env.NODE_ENV === 'production') {
        console.error('❌ Redis SET Error:', error);
      }
      this.metrics.errors++;
      return false;
    }
  }

  async delete(prefix: string, data: any): Promise<boolean> {
    try {
      if (!this.client || !this.isConnected) {
        return false;
      }

      const key = this.generateCacheKey(prefix, data);
      await this.client.del(key);
      this.metrics.deletes++;
      console.log(`🗑️ Cache DELETE for key: ${key}`);
      return true;
    } catch (error) {
      console.error('❌ Redis DELETE Error:', error);
      this.metrics.errors++;
      return false;
    }
  }

  async clear(prefix?: string): Promise<boolean> {
    try {
      if (!this.client || !this.isConnected) {
        return false;
      }

      if (prefix) {
        const pattern = `${prefix}:*`;
        const keys = await this.client.keys(pattern);
        if (keys.length > 0) {
          await this.client.del(keys);
          console.log(`🗑️ Cache CLEAR for pattern: ${pattern} (${keys.length} keys)`);
        }
      } else {
        await this.client.flushDb();
        console.log('🗑️ Cache CLEAR all');
      }
      return true;
    } catch (error) {
      console.error('❌ Redis CLEAR Error:', error);
      this.metrics.errors++;
      return false;
    }
  }

  getMetrics(): CacheMetrics & { hitRate: number; isConnected: boolean } {
    const total = this.metrics.hits + this.metrics.misses;
    return {
      ...this.metrics,
      hitRate: total > 0 ? (this.metrics.hits / total) * 100 : 0,
      isConnected: this.isConnected
    };
  }

  async healthCheck(): Promise<{ status: string; latency: number; error?: string }> {
    try {
      if (!this.client || !this.isConnected) {
        return { status: 'disconnected', latency: 0, error: 'Not connected' };
      }

      const startTime = Date.now();
      await this.client.ping();
      const latency = Date.now() - startTime;

      return {
        status: 'healthy',
        latency
      };
    } catch (error) {
      return {
        status: 'error',
        latency: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Check if Redis is enabled before creating client
const isRedisEnabled = process.env.REDIS_ENABLED === 'true' || 
                      (process.env.NODE_ENV === 'production' && !!process.env.REDIS_HOST);

let redisCache: RedisCacheService | null = null;

// REDIS COMPLETELY DISABLED FOR DEVELOPMENT
// if (isRedisEnabled) {
//   // Only create Redis client if explicitly enabled
//   const redisConfig: CacheConfig = {
//     host: process.env.REDIS_HOST || 'localhost',
//     port: parseInt(process.env.REDIS_PORT || '6379'),
//     password: process.env.REDIS_PASSWORD,
//     db: parseInt(process.env.REDIS_DB || '0'),
//     ttl: parseInt(process.env.REDIS_TTL || '3600'), // 1 hour default
//     enabled: true
//   };

//   redisCache = new RedisCacheService(redisConfig);

//   // Initialize connection silently
//   redisCache.connect().then(connected => {
//     if (connected) {
//       console.log('✅ Redis Cache Service initialized');
//     } else if (process.env.NODE_ENV === 'production') {
//       console.log('⚠️ Redis Cache Service failed to initialize - will work without caching');
//     }
//     // In development, fail silently to avoid spam
//   });
// } else {
//   console.log('ℹ️ Redis disabled in development - using memory cache only');
// }

console.log('🚫 Redis completely disabled for development - using memory cache only');
redisCache = null;

// Export a proxy that handles null Redis client
export { redisCache };

// Create a proxy object that handles null Redis client gracefully
const redisCacheProxy = new Proxy({} as RedisCacheService, {
  get(target, prop) {
    if (redisCache) {
      return redisCache[prop as keyof RedisCacheService];
    }
    // Return no-op functions when Redis is disabled
    if (typeof prop === 'string' && typeof target[prop as keyof RedisCacheService] === 'function') {
      return async () => {
        // Return appropriate defaults for different methods
        if (prop === 'get') return null;
        if (prop === 'set') return false;
        if (prop === 'delete') return false;
        if (prop === 'healthCheck') return { status: 'disconnected', latency: 0, error: 'Redis disabled' };
        if (prop === 'getMetrics') return { hits: 0, misses: 0, sets: 0, deletes: 0, errors: 0, hitRate: 0, isConnected: false, size: 0 };
        return undefined;
      };
    }
    return undefined;
  }
});

export default redisCacheProxy;
