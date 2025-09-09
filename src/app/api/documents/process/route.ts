import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { documentId } = await request.json();
    
    if (!documentId) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
    }
    
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

    return NextResponse.json({ 
      success: true, 
      analysis,
      message: 'Document processed successfully' 
    });
  } catch (error) {
    console.error('Document processing error:', error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}