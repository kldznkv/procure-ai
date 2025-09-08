import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isAdminClientConfigured } from '../../../../lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    // Check if admin client is configured
    if (!isAdminClientConfigured()) {
      return NextResponse.json({ 
        success: false, 
        error: 'Supabase admin client not configured' 
      }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const period = searchParams.get('period') || 'monthly'; // monthly, quarterly, yearly
    const supplierId = searchParams.get('supplier_id'); // optional filter

    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'user_id parameter is required' 
      }, { status: 400 });
    }

    console.log('🔍 Cost Trends API - Analyzing cost trends:', {
      userId,
      period,
      supplierId
    });

    // Build query for procurement documents
    let query = supabaseAdmin
      .from('procurement_documents')
      .select('*')
      .eq('user_id', userId)
      .not('amount', 'is', null)
      .not('amount', 'eq', 0);

    if (supplierId) {
      query = query.eq('supplier_id', supplierId);
    }

    const { data: documents, error: documentsError } = await query;

    if (documentsError) {
      console.error('❌ Cost Trends API - Documents fetch error:', documentsError);
      throw documentsError;
    }

    // Group documents by time period
    const trendsData = groupDocumentsByPeriod(documents, period);

    // Calculate trend metrics
    const trendMetrics = calculateTrendMetrics(trendsData);

    console.log('✅ Cost Trends API - Analysis completed for', documents.length, 'documents');
    return NextResponse.json({ 
      success: true, 
      data: {
        trends: trendsData,
        metrics: trendMetrics,
        period: period,
        total_documents: documents.length,
        total_spend: documents.reduce((sum, doc) => sum + (doc.amount || 0), 0)
      },
      metadata: {
        analysis_timestamp: new Date().toISOString(),
        period_type: period
      }
    });

  } catch (error) {
    console.error('❌ Cost Trends API - Error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });

    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Analysis failed' 
    }, { status: 500 });
  }
}

function groupDocumentsByPeriod(documents: any[], period: string) {
  const grouped: Record<string, any[]> = {};
  
  documents.forEach(doc => {
    const date = new Date(doc.created_at);
    let key: string;
    
    switch (period) {
      case 'monthly':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'quarterly':
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        key = `${date.getFullYear()}-Q${quarter}`;
        break;
      case 'yearly':
        key = `${date.getFullYear()}`;
        break;
      default:
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
    
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(doc);
  });
  
  return grouped;
}

function calculateTrendMetrics(trendsData: Record<string, any[]>) {
  const periods = Object.keys(trendsData).sort();
  const metrics = {
    total_periods: periods.length,
    average_spend_per_period: 0,
    highest_spend_period: '',
    lowest_spend_period: '',
    trend_direction: 'stable', // increasing, decreasing, stable
    growth_rate: 0
  };
  
  if (periods.length === 0) return metrics;
  
  const periodTotals = periods.map(period => {
    const total = trendsData[period].reduce((sum, doc) => sum + (doc.amount || 0), 0);
    return { period, total };
  });
  
  // Calculate averages and find extremes
  const totalSpend = periodTotals.reduce((sum, pt) => sum + pt.total, 0);
  metrics.average_spend_per_period = totalSpend / periods.length;
  
  const highest = periodTotals.reduce((max, pt) => pt.total > max.total ? pt : max);
  const lowest = periodTotals.reduce((min, pt) => pt.total < min.total ? pt : min);
  
  metrics.highest_spend_period = highest.period;
  metrics.lowest_spend_period = lowest.period;
  
  // Calculate trend direction and growth rate
  if (periods.length >= 2) {
    const firstPeriod = periodTotals[0];
    const lastPeriod = periodTotals[periods.length - 1];
    
    if (lastPeriod.total > firstPeriod.total) {
      metrics.trend_direction = 'increasing';
      metrics.growth_rate = ((lastPeriod.total - firstPeriod.total) / firstPeriod.total) * 100;
    } else if (lastPeriod.total < firstPeriod.total) {
      metrics.trend_direction = 'decreasing';
      metrics.growth_rate = ((firstPeriod.total - lastPeriod.total) / firstPeriod.total) * 100;
    }
  }
  
  return metrics;
}
