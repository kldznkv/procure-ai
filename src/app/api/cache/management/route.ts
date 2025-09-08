import { NextRequest, NextResponse } from 'next/server';
import { aiCache } from '../../../../lib/ai-cache';
// import { redisCache } from '../../../../lib/redis-cache'; // DISABLED FOR DEVELOPMENT
import { memoryCache } from '../../../../lib/memory-cache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'stats';

    switch (action) {
      case 'stats':
        const aiStats = aiCache.getStats();
        const redisEnabled = process.env.REDIS_ENABLED === 'true' || 
                            (process.env.NODE_ENV === 'production' && !!process.env.REDIS_HOST);
        
        // REDIS COMPLETELY DISABLED FOR DEVELOPMENT
        const redisHealth = { 
          status: 'disconnected', 
          latency: 0, 
          error: 'Redis completely disabled' 
        };
        const redisMetrics = { 
          hits: 0, 
          misses: 0, 
          sets: 0, 
          deletes: 0, 
          errors: 0, 
          hitRate: 0, 
          isConnected: false, 
          size: 0 
        };
        const memoryMetrics = memoryCache.getMetrics();
        const memoryHealth = await memoryCache.healthCheck();

        return NextResponse.json({
          success: true,
          cache_stats: {
            ai_cache: aiStats,
            redis_cache: {
              ...redisMetrics,
              health: redisHealth
            },
            memory_cache: {
              ...memoryMetrics,
              health: memoryHealth
            }
          },
          performance_metrics: {
            average_response_time: aiStats.average_response_time,
            average_cached_time: aiStats.average_cached_time,
            time_saved_percentage: aiStats.timeSavedPercentage,
            hit_rate: aiStats.hitRate,
            total_requests: aiStats.total_requests
          }
        });

      case 'health':
        const health = await aiCache.getHealthStatus();
        return NextResponse.json({
          success: true,
          health
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: stats, health, clear'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Cache management error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'clear':
        const { prefix } = body;
        const cleared = await aiCache.clearCache();
        
        return NextResponse.json({
          success: cleared,
          message: cleared ? 'Cache cleared successfully' : 'Failed to clear cache'
        });

      case 'invalidate':
        const { document_type } = body;
        const invalidated = await aiCache.invalidateByType(document_type);
        
        return NextResponse.json({
          success: invalidated,
          message: invalidated ? `Cache invalidated for ${document_type}` : 'Failed to invalidate cache'
        });

      case 'warm':
        // Warm up cache with common document types
        const warmResults = await warmUpCache();
        
        return NextResponse.json({
          success: true,
          message: 'Cache warmed up successfully',
          results: warmResults
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: clear, invalidate, warm'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Cache management error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function warmUpCache(): Promise<any[]> {
  const commonDocuments = [
    {
      name: 'Invoice Template',
      type: 'Invoice',
      content: `INVOICE
Invoice #: INV-2024-001
Date: 2024-01-01
Due Date: 2024-02-01

Bill To:
Company Name
123 Business Street
City, State 12345

Description: Professional Services
Amount: $1,000.00 USD
Tax (8%): $80.00 USD
Total: $1,080.00 USD

Payment Terms: Net 30`
    },
    {
      name: 'Receipt Template',
      type: 'Receipt',
      content: `RECEIPT
Receipt #: RCP-2024-001
Date: 2024-01-01

Payment From: Customer Name
Amount: $500.00 USD
Payment Method: Credit Card
Reference: TXN-123456

Thank you for your business!`
    }
  ];

  const results = [];
  
  for (const doc of commonDocuments) {
    try {
      const cacheRequest = {
        document_text: doc.content,
        document_type: doc.type,
        prompt_template: 'PROCUREMENT_EXTRACTION_PROMPT'
      };
      
      // Check if already cached
      const cached = await aiCache.getCachedResponse(cacheRequest);
      if (!cached) {
        // Simulate a response for warming
        const mockResponse = {
          supplier_name: 'Template Company',
          amount: doc.type === 'Invoice' ? 1000 : 500,
          currency: 'USD',
          confidence_score: 0.9
        };
        
        await aiCache.cacheResponse(cacheRequest, mockResponse, 100);
        results.push({ document: doc.name, status: 'warmed' });
      } else {
        results.push({ document: doc.name, status: 'already_cached' });
      }
    } catch (error) {
      results.push({ document: doc.name, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
  
  return results;
}
