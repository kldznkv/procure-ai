import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    console.log('Document processing POST called');
    
    const body = await request.json();
    console.log('Processing request body:', body);
    
    const { documentId } = body;
    
    if (!documentId) {
      console.log('No document ID provided');
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
    }
    
    console.log('Processing document:', documentId);
    
    // Simulate processing with mock AI analysis
    const analysis = {
      supplier_name: "Sample Supplier",
      total_amount: 1500.00,
      currency: "USD",
      items: ["Office supplies", "Software license"],
      confidence: 0.95,
      document_type: "invoice",
      processed_at: new Date().toISOString()
    };

    console.log('Analysis completed:', analysis);
    
    return NextResponse.json({ 
      success: true, 
      analysis,
      message: 'Document processed successfully' 
    });
  } catch (error) {
    console.error('Document processing error:', error);
    return NextResponse.json(
      { error: 'Processing failed', details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
}