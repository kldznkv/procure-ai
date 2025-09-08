import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, isAdminClientConfigured } from '../../../../lib/supabase-admin';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if admin client is configured
    if (!isAdminClientConfigured()) {
      return NextResponse.json({ 
        success: false, 
        error: 'Supabase admin client not configured' 
      }, { status: 500 });
    }

    const { id: documentId } = await params;
    const body = await request.json();
    const { extracted_text, extracted_data, ai_analysis, processed } = body;

    console.log('🔍 Documents API - Updating document:', {
      id: documentId,
      hasExtractedText: !!extracted_text,
      hasExtractedData: !!extracted_data,
      hasAIAnalysis: !!ai_analysis,
      processed
    });

    const updateData: Record<string, unknown> = {};
    if (extracted_text !== undefined) updateData.extracted_text = extracted_text;
    if (extracted_data !== undefined) updateData.extracted_data = extracted_data;
    if (ai_analysis !== undefined) updateData.ai_analysis = ai_analysis;
    if (processed !== undefined) updateData.processed = processed;

    const { data, error } = await (getSupabaseAdmin() as any)
      .from('procurement_documents')
      .update(updateData)
      .eq('id', documentId)
      .select()
      .single();

    if (error) {
      console.error('❌ Documents API - Database update error:', error);
      throw error;
    }

    console.log('✅ Documents API - Document updated successfully:', data);
    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('❌ Documents API - Error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });

    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params;

    console.log('🔍 Documents API - Fetching document:', documentId);

    const { data, error } = await (getSupabaseAdmin() as any)
      .from('procurement_documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (error) {
      console.error('❌ Documents API - Database query error:', error);
      throw error;
    }

    console.log('✅ Documents API - Document retrieved successfully:', documentId);
    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('❌ Documents API - Error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });

    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
