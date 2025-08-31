import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isAdminClientConfigured } from '../../../lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    // Check if admin client is configured
    if (!isAdminClientConfigured()) {
      return NextResponse.json({ 
        success: false, 
        error: 'Supabase admin client not configured' 
      }, { status: 500 });
    }

    const body = await request.json();
    const { user_id, filename, file_url, document_type, processed, extracted_text, extracted_data, ai_analysis } = body;

    console.log('🔍 Documents API - Inserting document:', {
      user_id,
      filename,
      file_url,
      document_type,
      processed,
      has_extracted_text: !!extracted_text,
      has_extracted_data: !!extracted_data,
      has_ai_analysis: !!ai_analysis
    });

    // Insert document with extracted data if provided
    const { data, error } = await supabaseAdmin!
      .from('procurement_documents')
      .insert([{
        user_id,
        filename, 
        file_path: file_url,
        file_size: 0,
        mime_type: 'application/octet-stream',
        document_type,
        processed: processed || false,
        extracted_text: extracted_text || null,
        extracted_data: extracted_data || null,
        ai_analysis: ai_analysis || null,
        supplier_name: extracted_data?.supplier_name || null,
        amount: extracted_data?.amount || null,
        currency: extracted_data?.currency || 'USD',
        issue_date: extracted_data?.issue_date || null,
        due_date: extracted_data?.due_date || null,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ Documents API - Database insert error:', error);
      throw error;
    }

    console.log('✅ Documents API - Document inserted successfully:', data);
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
    const processed = searchParams.get('processed');
    const supplierId = searchParams.get('supplier_id');

    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'user_id parameter is required' 
      }, { status: 400 });
    }

    console.log('🔍 Documents API - Fetching documents for user:', userId, 'supplier_id:', supplierId);

    let query = supabaseAdmin!
      .from('procurement_documents')
      .select('id, filename, file_path, document_type, processed, created_at, extracted_text, ai_analysis, supplier_id, supplier_name, amount, currency, issue_date, status')
      .eq('user_id', userId);

    if (processed !== null) {
      query = query.eq('processed', processed === 'true');
    }

    if (supplierId) {
      query = query.eq('supplier_id', supplierId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Documents API - Database query error:', error);
      throw error;
    }

    console.log('✅ Documents API - Retrieved', data?.length || 0, 'documents');
    return NextResponse.json({ success: true, data: data || [] });

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
export async function PUT(request: NextRequest) {
  try {
    // Check if admin client is configured
    if (!isAdminClientConfigured()) {
      return NextResponse.json({ 
        success: false, 
        error: 'Supabase admin client not configured' 
      }, { status: 500 });
    }

    const body = await request.json();
    const { id, extracted_text, extracted_data, ai_analysis, processed } = body;

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Document ID is required' 
      }, { status: 400 });
    }

    console.log('🔍 Documents API - Updating document:', {
      id,
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

    const { data, error } = await supabaseAdmin!
      .from('procurement_documents')
      .update(updateData)
      .eq('id', id)
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

export async function DELETE(request: NextRequest) {
  try {
    // Check if admin client is configured
    if (!isAdminClientConfigured()) {
      return NextResponse.json({ 
        success: false, 
        error: 'Supabase admin client not configured' 
      }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Document ID is required' 
      }, { status: 400 });
    }

    console.log('🔍 Documents API - Deleting document:', id);

    const { error } = await supabaseAdmin!
      .from('documents')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Documents API - Database delete error:', error);
      throw error;
    }

    console.log('✅ Documents API - Document deleted successfully');
    return NextResponse.json({ success: true });

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

