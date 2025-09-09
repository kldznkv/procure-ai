import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    
    console.log('🏢 Suppliers API - GET request:', { userId });
    
    // Return mock data for now
    const mockSuppliers = [
      {
        id: '1',
        name: 'Acme Corporation',
        contact_email: 'contact@acme.com',
        contact_phone: '+1-555-0123',
        address: '123 Business St, City, State 12345',
        status: 'active',
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Global Supplies Ltd',
        contact_email: 'info@globalsupplies.com',
        contact_phone: '+1-555-0456',
        address: '456 Commerce Ave, City, State 67890',
        status: 'active',
        created_at: new Date().toISOString()
      }
    ];
    
    return NextResponse.json({
      success: true,
      data: mockSuppliers,
      message: 'API working - mock suppliers data'
    });
    
  } catch (error) {
    console.error('❌ Suppliers API Error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Suppliers API Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🏢 Suppliers API - POST request:', { name: body.name });
    
    // Return mock success response
    return NextResponse.json({
      success: true,
      data: {
        id: 'mock-' + Date.now(),
        name: body.name || 'New Supplier',
        status: 'active',
        created_at: new Date().toISOString()
      },
      message: 'API working - mock supplier created'
    });
    
  } catch (error) {
    console.error('❌ Suppliers API Error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Suppliers API Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}