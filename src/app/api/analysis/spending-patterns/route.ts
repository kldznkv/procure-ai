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
    const category = searchParams.get('category'); // optional filter by document type
    const supplierId = searchParams.get('supplier_id'); // optional filter by supplier

    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'user_id parameter is required' 
      }, { status: 400 });
    }

    console.log('🔍 Spending Patterns API - Analyzing spending patterns:', {
      userId,
      category,
      supplierId
    });

    // Build query for procurement documents
    let query = supabaseAdmin!
      .from('procurement_documents')
      .select('*')
      .eq('user_id', userId)
      .not('amount', 'is', null)
      .not('amount', 'eq', 0);

    if (category) {
      query = query.eq('document_type', category);
    }

    if (supplierId) {
      query = query.eq('supplier_id', supplierId);
    }

    const { data: documents, error: documentsError } = await query;

    if (documentsError) {
      console.error('❌ Spending Patterns API - Documents fetch error:', documentsError);
      throw documentsError;
    }

    // Analyze spending patterns
    const patterns = analyzeSpendingPatterns(documents);

    console.log('✅ Spending Patterns API - Analysis completed for', documents.length, 'documents');
    return NextResponse.json({ 
      success: true, 
      data: patterns,
      metadata: {
        total_documents: documents.length,
        total_spend: documents.reduce((sum, doc) => sum + (doc.amount || 0), 0),
        analysis_timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Spending Patterns API - Error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });

    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Analysis failed' 
    }, { status: 500 });
  }
}

function analyzeSpendingPatterns(documents: any[]) {
  const patterns = {
    by_document_type: [] as any[],
    by_supplier: [] as any[],
    by_amount_range: {},
    by_month: [] as any[],
    top_suppliers: [] as any[],
    top_document_types: [] as any[],
    spending_distribution: {
      low: 0,      // 0-1000
      medium: 0,   // 1000-10000
      high: 0,     // 10000-100000
      very_high: 0 // 100000+
    }
  };

  // Initialize counters
  const documentTypeCounts: Record<string, { count: number; total: number }> = {};
  const supplierCounts: Record<string, { count: number; total: number; name: string }> = {};
  const monthCounts: Record<string, { count: number; total: number }> = {};

  documents.forEach(doc => {
    const amount = doc.amount || 0;
    const docType = doc.document_type || 'Unknown';
    const supplierId = doc.supplier_id || 'Unknown';
    const supplierName = doc.supplier_name || 'Unknown';
    const date = new Date(doc.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    // Count by document type
    if (!documentTypeCounts[docType]) {
      documentTypeCounts[docType] = { count: 0, total: 0 };
    }
    documentTypeCounts[docType].count++;
    documentTypeCounts[docType].total += amount;

    // Count by supplier
    if (!supplierCounts[supplierId]) {
      supplierCounts[supplierId] = { count: 0, total: 0, name: supplierName };
    }
    supplierCounts[supplierId].count++;
    supplierCounts[supplierId].total += amount;

    // Count by month
    if (!monthCounts[monthKey]) {
      monthCounts[monthKey] = { count: 0, total: 0 };
    }
    monthCounts[monthKey].count++;
    monthCounts[monthKey].total += amount;

    // Categorize by amount range
    if (amount <= 1000) {
      patterns.spending_distribution.low++;
    } else if (amount <= 10000) {
      patterns.spending_distribution.medium++;
    } else if (amount <= 100000) {
      patterns.spending_distribution.high++;
    } else {
      patterns.spending_distribution.very_high++;
    }
  });

  // Convert to arrays and sort
  patterns.by_document_type = Object.entries(documentTypeCounts).map(([type, data]) => ({
    document_type: type,
    count: data.count,
    total_spend: data.total,
    average_spend: data.total / data.count
  })).sort((a, b) => b.total_spend - a.total_spend);

  patterns.by_supplier = Object.entries(supplierCounts).map(([id, data]) => ({
    supplier_id: id,
    supplier_name: data.name,
    count: data.count,
    total_spend: data.total,
    average_spend: data.total / data.count
  })).sort((a, b) => b.total_spend - a.total_spend);

  patterns.by_month = Object.entries(monthCounts).map(([month, data]) => ({
    month: month,
    count: data.count,
    total_spend: data.total,
    average_spend: data.total / data.count
  })).sort((a, b) => a.month.localeCompare(b.month));

  // Get top 5 suppliers and document types
  patterns.top_suppliers = patterns.by_supplier.slice(0, 5);
  patterns.top_document_types = patterns.by_document_type.slice(0, 5);

  return patterns;
}
