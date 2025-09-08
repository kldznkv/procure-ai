import { NextRequest, NextResponse } from 'next/server';
// import { redisCache } from '../../../../lib/redis-cache'; // DISABLED FOR DEVELOPMENT
import { memoryCache } from '../../../../lib/memory-cache';
import { aiCache } from '../../../../lib/ai-cache';

export async function GET(request: NextRequest) {
  try {
    const redisEnabled = process.env.REDIS_ENABLED === 'true' || 
                        (process.env.NODE_ENV === 'production' && !!process.env.REDIS_HOST);
    
    // REDIS COMPLETELY DISABLED FOR DEVELOPMENT
    const redisHealth = { 
      status: 'disconnected', 
      latency: 0, 
      error: 'Redis completely disabled' 
    };
    
    const memoryHealth = await memoryCache.healthCheck();
    const aiStats = aiCache.getStats();
    
    return NextResponse.json({
      success: true,
      cache_status: {
        redis: {
          enabled: redisEnabled,
          connected: redisHealth.status === 'healthy',
          status: redisHealth.status,
          latency: redisHealth.latency,
          error: redisHealth.error
        },
        memory: {
          enabled: true,
          connected: memoryHealth.status === 'healthy',
          status: memoryHealth.status,
          latency: memoryHealth.latency,
          size: memoryCache.getMetrics().size
        },
        ai_cache: {
          total_requests: aiStats.total_requests,
          cache_hits: aiStats.cache_hits,
          cache_misses: aiStats.cache_misses,
          hit_rate: aiStats.hitRate,
          time_saved: aiStats.time_saved
        }
      },
      active_cache: redisEnabled && redisHealth.status === 'healthy' ? 'redis' : 'memory',
      recommendations: [
        redisEnabled && redisHealth.status !== 'healthy' ? 
          '⚠️ Redis is enabled but not connected - using memory cache' : 
          '✅ Cache configuration is optimal',
        aiStats.hitRate > 50 ? 
          '✅ Cache hit rate is good' : 
          '⚠️ Low cache hit rate - consider warming cache',
        process.env.NODE_ENV === 'development' && !redisEnabled ? 
          'ℹ️ Development mode: Redis disabled, using memory cache' : 
          'ℹ️ Production mode: Redis enabled'
      ]
    });

  } catch (error) {
    console.error('❌ Cache status error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
