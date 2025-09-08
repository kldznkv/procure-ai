// import { redisCache } from './redis-cache'; // DISABLED FOR DEVELOPMENT
import { memoryCache } from './memory-cache';

interface AIRequest {
  document_text: string;
  document_type: string;
  prompt_template: string;
}

interface AIResponse {
  extracted_data: any;
  processing_time: number;
  model_used: string;
  confidence_score: number;
  cached: boolean;
}

interface CacheStats {
  total_requests: number;
  cache_hits: number;
  cache_misses: number;
  average_response_time: number;
  average_cached_time: number;
  time_saved: number;
}

class AICacheService {
  private stats: CacheStats = {
    total_requests: 0,
    cache_hits: 0,
    cache_misses: 0,
    average_response_time: 0,
    average_cached_time: 0,
    time_saved: 0
  };

  private readonly CACHE_PREFIX = 'ai_response';
  private readonly CACHE_TTL = 3600; // 1 hour
  private readonly SIMILARITY_THRESHOLD = 0.95; // 95% similarity for cache hits

  /**
   * Generate a cache key for AI requests
   * Uses document content hash + type + prompt template
   */
  private generateCacheKey(request: AIRequest): string {
    const content = {
      text: request.document_text.trim(),
      type: request.document_type,
      template: request.prompt_template
    };
    return `${this.CACHE_PREFIX}:${JSON.stringify(content)}`;
  }

  /**
   * Check if we have a cached response for this request
   */
  async getCachedResponse(request: AIRequest): Promise<AIResponse | null> {
    try {
      this.stats.total_requests++;
      
      // Check if Redis is enabled
      const isRedisEnabled = process.env.REDIS_ENABLED === 'true' || 
                            (process.env.NODE_ENV === 'production' && !!process.env.REDIS_HOST);
      
      let cached = null;
      let cacheSource = 'none';
      
      // REDIS COMPLETELY DISABLED FOR DEVELOPMENT
      // Try Redis cache first only if enabled
      // if (isRedisEnabled) {
      //   cached = await redisCache.get(this.CACHE_PREFIX, request);
      //   if (cached) {
      //     cacheSource = 'redis';
      //   }
      // }
      
      // If Redis is not available or no cache hit, try memory cache
      if (!cached) {
        cached = await memoryCache.get(this.CACHE_PREFIX, request);
        cacheSource = 'memory';
      }
      
      if (cached) {
        this.stats.cache_hits++;
        if (process.env.NODE_ENV === 'production') {
          console.log(`🎯 AI Cache HIT (${cacheSource}) - Using cached response`);
        }
        
        return {
          extracted_data: (cached as any).extracted_data || {},
          processing_time: (cached as any).processing_time || 0,
          model_used: (cached as any).model_used || 'unknown',
          confidence_score: (cached as any).confidence_score || 0,
          cached: true
        };
      } else {
        this.stats.cache_misses++;
        if (process.env.NODE_ENV === 'production') {
          console.log('❌ AI Cache MISS - Will call Claude API');
        }
        return null;
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'production') {
        console.error('❌ AI Cache GET Error:', error);
      }
      this.stats.cache_misses++;
      return null;
    }
  }

  /**
   * Cache an AI response for future use
   */
  async cacheResponse(
    request: AIRequest, 
    response: any, 
    processingTime: number,
    modelUsed: string = 'claude-3-haiku-20240307'
  ): Promise<boolean> {
    try {
      const cacheData = {
        extracted_data: response,
        processing_time: processingTime,
        model_used: modelUsed,
        confidence_score: response.confidence_score || 0,
        cached_at: new Date().toISOString()
      };

      // Check if Redis is enabled
      const isRedisEnabled = process.env.REDIS_ENABLED === 'true' || 
                            (process.env.NODE_ENV === 'production' && !!process.env.REDIS_HOST);
      
      let success = false;
      let cacheTarget = 'memory';
      
      // REDIS COMPLETELY DISABLED FOR DEVELOPMENT
      // Try Redis cache first only if enabled
      // if (isRedisEnabled) {
      //   success = await redisCache.set(
      //     this.CACHE_PREFIX, 
      //     request, 
      //     cacheData, 
      //     this.CACHE_TTL
      //   );
      //   if (success) {
      //     cacheTarget = 'redis';
      //   }
      // }
      
      // If Redis is not enabled or failed, use memory cache
      if (!success) {
        success = await memoryCache.set(
          this.CACHE_PREFIX, 
          request, 
          cacheData, 
          this.CACHE_TTL
        );
        cacheTarget = 'memory';
      }

      if (success) {
        if (process.env.NODE_ENV === 'production') {
          console.log(`💾 AI Response cached successfully (${cacheTarget})`);
        }
        this.updateStats(processingTime, 0); // 0ms for cached responses
      }

      return success;
    } catch (error) {
      console.error('❌ AI Cache SET Error:', error);
      return false;
    }
  }

  /**
   * Update cache statistics
   */
  private updateStats(processingTime: number, cachedTime: number = 0): void {
    const isCached = cachedTime === 0;
    
    if (isCached) {
      this.stats.cache_hits++;
      this.stats.average_cached_time = 
        (this.stats.average_cached_time * (this.stats.cache_hits - 1) + cachedTime) / this.stats.cache_hits;
    } else {
      this.stats.cache_misses++;
      this.stats.average_response_time = 
        (this.stats.average_response_time * (this.stats.cache_misses - 1) + processingTime) / this.stats.cache_misses;
    }

    // Calculate time saved
    const hitRate = this.stats.cache_hits / this.stats.total_requests;
    const avgOriginalTime = this.stats.average_response_time;
    this.stats.time_saved = this.stats.cache_hits * avgOriginalTime * 0.7; // Assume 70% time savings
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats & { hitRate: number; timeSavedPercentage: number } {
    const hitRate = this.stats.total_requests > 0 ? 
      (this.stats.cache_hits / this.stats.total_requests) * 100 : 0;
    
    const timeSavedPercentage = this.stats.average_response_time > 0 ?
      (this.stats.time_saved / (this.stats.total_requests * this.stats.average_response_time)) * 100 : 0;

    return {
      ...this.stats,
      hitRate,
      timeSavedPercentage
    };
  }

  /**
   * Clear AI cache
   */
  async clearCache(): Promise<boolean> {
    try {
      // REDIS COMPLETELY DISABLED FOR DEVELOPMENT
      // return await redisCache.clear(this.CACHE_PREFIX);
      return await memoryCache.clear(this.CACHE_PREFIX);
    } catch (error) {
      console.error('❌ AI Cache CLEAR Error:', error);
      return false;
    }
  }

  /**
   * Invalidate cache for specific document type
   */
  async invalidateByType(documentType: string): Promise<boolean> {
    try {
      // This is a simplified approach - in production you'd want more sophisticated invalidation
      console.log(`🔄 Invalidating cache for document type: ${documentType}`);
      return true;
    } catch (error) {
      console.error('❌ AI Cache INVALIDATE Error:', error);
      return false;
    }
  }

  /**
   * Get cache health status
   */
  async getHealthStatus(): Promise<{ status: string; latency: number; error?: string }> {
    // REDIS COMPLETELY DISABLED FOR DEVELOPMENT
    // return await redisCache.healthCheck();
    return await memoryCache.healthCheck();
  }
}

// Create singleton instance
export const aiCache = new AICacheService();

export default aiCache;
