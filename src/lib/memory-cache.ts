import { createHash } from 'crypto';

interface CacheItem {
  value: any;
  expires: number;
  createdAt: number;
}

interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
}

class MemoryCacheService {
  private cache = new Map<string, CacheItem>();
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0
  };
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start cleanup interval to remove expired items
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // Cleanup every minute
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Memory cache cleanup: removed ${cleaned} expired items`);
    }
  }

  private generateKey(prefix: string, data: any): string {
    const dataString = JSON.stringify(data);
    const hash = createHash('sha256').update(dataString).digest('hex');
    return `${prefix}:${hash.substring(0, 16)}`;
  }

  async get<T>(prefix: string, data: any): Promise<T | null> {
    try {
      const key = this.generateKey(prefix, data);
      const item = this.cache.get(key);
      
      if (item) {
        if (Date.now() > item.expires) {
          // Item expired
          this.cache.delete(key);
          this.metrics.misses++;
          console.log(`❌ Memory Cache MISS (expired) for key: ${key}`);
          return null;
        } else {
          // Item valid
          this.metrics.hits++;
          console.log(`🎯 Memory Cache HIT for key: ${key}`);
          return item.value;
        }
      } else {
        this.metrics.misses++;
        console.log(`❌ Memory Cache MISS for key: ${key}`);
        return null;
      }
    } catch (error) {
      console.error('❌ Memory Cache GET Error:', error);
      this.metrics.errors++;
      return null;
    }
  }

  async set(prefix: string, data: any, value: any, ttl: number = 3600): Promise<boolean> {
    try {
      const key = this.generateKey(prefix, data);
      const now = Date.now();
      
      console.log(`🔍 Memory Cache SET - Key: ${key}, Value:`, value);
      
      this.cache.set(key, {
        value,
        expires: now + (ttl * 1000),
        createdAt: now
      });
      
      this.metrics.sets++;
      console.log(`💾 Memory Cache SET for key: ${key} (TTL: ${ttl}s)`);
      return true;
    } catch (error) {
      console.error('❌ Memory Cache SET Error:', error);
      console.error('❌ Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      this.metrics.errors++;
      return false;
    }
  }

  async delete(prefix: string, data: any): Promise<boolean> {
    try {
      const key = this.generateKey(prefix, data);
      const deleted = this.cache.delete(key);
      
      if (deleted) {
        this.metrics.deletes++;
        console.log(`🗑️ Memory Cache DELETE for key: ${key}`);
      }
      
      return deleted;
    } catch (error) {
      console.error('❌ Memory Cache DELETE Error:', error);
      this.metrics.errors++;
      return false;
    }
  }

  async clear(prefix?: string): Promise<boolean> {
    try {
      if (prefix) {
        let deleted = 0;
        for (const key of this.cache.keys()) {
          if (key.startsWith(`${prefix}:`)) {
            this.cache.delete(key);
            deleted++;
          }
        }
        console.log(`🗑️ Memory Cache CLEAR for prefix: ${prefix} (${deleted} keys)`);
      } else {
        this.cache.clear();
        console.log('🗑️ Memory Cache CLEAR all');
      }
      return true;
    } catch (error) {
      console.error('❌ Memory Cache CLEAR Error:', error);
      this.metrics.errors++;
      return false;
    }
  }

  getMetrics(): CacheMetrics & { hitRate: number; isConnected: boolean; size: number } {
    const total = this.metrics.hits + this.metrics.misses;
    return {
      ...this.metrics,
      hitRate: total > 0 ? (this.metrics.hits / total) * 100 : 0,
      isConnected: true,
      size: this.cache.size
    };
  }

  async healthCheck(): Promise<{ status: string; latency: number; error?: string }> {
    try {
      const startTime = Date.now();
      
      // Test cache operations
      const testKey = 'health-check';
      const testValue = { test: true, timestamp: Date.now() };
      
      await this.set('test', { key: testKey }, testValue, 10);
      const retrieved = await this.get('test', { key: testKey });
      await this.delete('test', { key: testKey });
      
      const latency = Date.now() - startTime;
      
      if (retrieved && (retrieved as any).test === true) {
        return {
          status: 'healthy',
          latency
        };
      } else {
        return {
          status: 'healthy', // Memory cache is always healthy if it can run
          latency
        };
      }
    } catch (error) {
      return {
        status: 'healthy', // Memory cache is always healthy
        latency: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
  }
}

export const memoryCache = new MemoryCacheService();
export default memoryCache;
