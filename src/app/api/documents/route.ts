import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const processed = searchParams.get('processed');
    
    console.log('📄 Documents API - GET request:', { user_id, processed });
    
    // Return mock data for now
    const mockDocuments = [
      {
        id: '1',
        filename: 'sample-invoice.pdf',
        document_type: 'invoice',
        supplier_name: 'Sample Supplier',
        amount: 1500.00,
        currency: 'USD',
        status: 'processed',
        created_at: new Date().toISOString(),
        processed: true
      },
      {
        id: '2', 
        filename: 'contract-draft.docx',
        document_type: 'contract',
        supplier_name: 'Another Supplier',
        amount: 5000.00,
        currency: 'USD',
        status: 'pending',
        created_at: new Date().toISOString(),
        processed: false
      }
    ];
    
    return NextResponse.json({
      success: true,
      data: mockDocuments,
      message: 'API working - mock documents data'
    });
    
  } catch (error) {
    console.error('❌ Documents API Error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Documents API Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📄 Documents API - POST request:', { filename: body.filename });
    
    // Return mock success response
    return NextResponse.json({
      success: true,
      data: {
        id: 'mock-' + Date.now(),
        filename: body.filename || 'uploaded-file.pdf',
        status: 'uploaded',
        created_at: new Date().toISOString()
      },
      message: 'API working - mock document upload'
    });
    
  } catch (error) {
    console.error('❌ Documents API Error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Documents API Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}