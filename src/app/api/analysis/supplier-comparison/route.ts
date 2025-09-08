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
    const supplierIds = searchParams.get('supplier_ids');

    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'user_id parameter is required' 
      }, { status: 400 });
    }

    if (!supplierIds) {
      return NextResponse.json({ 
        success: false, 
        error: 'supplier_ids parameter is required' 
      }, { status: 400 });
    }

    const supplierIdArray = supplierIds.split(',');

    console.log('🔍 Supplier Comparison API - Analyzing suppliers:', {
      userId,
      supplierIds: supplierIdArray
    });

    // Fetch supplier data
    const { data: suppliers, error: suppliersError } = await (supabaseAdmin as any)
      .from('suppliers')
      .select('*')
      .eq('user_id', userId)
      .in('id', supplierIdArray);

    if (suppliersError) {
      console.error('❌ Supplier Comparison API - Suppliers fetch error:', suppliersError);
      throw suppliersError;
    }

    // Fetch procurement data for these suppliers
    const { data: procurementData, error: procurementError } = await (supabaseAdmin as any)
      .from('procurement_documents')
      .select('*')
      .eq('user_id', userId)
      .in('supplier_id', supplierIdArray)
      .not('supplier_id', 'is', null);

    if (procurementError) {
      console.error('❌ Supplier Comparison API - Procurement data fetch error:', procurementError);
      throw procurementError;
    }

    // Generate comparison metrics
    const comparisonData = suppliers.map((supplier: any) => {
      const supplierDocuments = procurementData.filter((doc: any) => doc.supplier_id === supplier.id);
      const totalSpend = supplierDocuments.reduce((sum: number, doc: any) => sum + (doc.amount || 0), 0);
      const documentCount = supplierDocuments.length;
      const averageAmount = documentCount > 0 ? totalSpend / documentCount : 0;

      return {
        supplier_id: supplier.id,
        supplier_name: supplier.name,
        total_spend: totalSpend,
        document_count: documentCount,
        average_amount: averageAmount,
        performance_rating: supplier.performance_rating || 0,
        contact_email: supplier.contact_email,
        contact_phone: supplier.contact_phone,
        tax_id: supplier.tax_id,
        website: supplier.website,
        payment_terms: supplier.payment_terms,
        credit_limit: supplier.credit_limit,
        notes: supplier.notes
      };
    });

    // Sort by total spend (highest first)
    comparisonData.sort((a: any, b: any) => b.total_spend - a.total_spend);

    console.log('✅ Supplier Comparison API - Analysis completed for', comparisonData.length, 'suppliers');
    return NextResponse.json({ 
      success: true, 
      data: comparisonData,
      metadata: {
        total_suppliers: comparisonData.length,
        total_documents: procurementData.length,
        analysis_timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Supplier Comparison API - Error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });

    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Analysis failed' 
    }, { status: 500 });
  }
}
