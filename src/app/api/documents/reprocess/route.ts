import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isAdminClientConfigured } from '../../../../lib/supabase-admin';

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
    const { document_id } = body;

    if (!document_id) {
      return NextResponse.json({ 
        success: false, 
        error: 'document_id is required' 
      }, { status: 400 });
    }

    console.log('🔍 Reprocessing - Starting reprocess for document:', document_id);

    // Get the document
    const { data: document, error: fetchError } = await supabaseAdmin
      .from('procurement_documents')
      .select('*')
      .eq('id', document_id)
      .single();

    if (fetchError || !document) {
      console.error('❌ Reprocessing - Document fetch error:', fetchError);
      return NextResponse.json({ 
        success: false, 
        error: 'Document not found' 
      }, { status: 404 });
    }

    // Check if document already has AI analysis
    if (document.processed && document.ai_analysis) {
      return NextResponse.json({ 
        success: false, 
        error: 'Document already processed with AI' 
      }, { status: 400 });
    }

    // Call the AI processing endpoint
    const processResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/documents/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        document_id: document.id,
        document_text: document.extracted_text || `[Document: ${document.filename}]`,
        document_type: document.document_type
      })
    });

    if (!processResponse.ok) {
      const errorData = await processResponse.json();
      throw new Error(`AI processing failed: ${errorData.error || 'Unknown error'}`);
    }

    const processResult = await processResponse.json();
    console.log('✅ Reprocessing - Document reprocessed successfully');

    return NextResponse.json({ 
      success: true, 
      data: processResult.data,
      message: 'Document reprocessed successfully'
    });

  } catch (error) {
    console.error('❌ Reprocessing - Error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });

    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
