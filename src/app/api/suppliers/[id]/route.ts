import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('🏢 Suppliers API - GET by ID:', { id });
    
    // Return mock data for now
    const mockSupplier = {
      id: id,
      name: 'Sample Supplier',
      contact_email: 'contact@sample.com',
      contact_phone: '+1-555-0123',
      address: '123 Business St, City, State 12345',
      status: 'active',
      created_at: new Date().toISOString()
    };
    
    return NextResponse.json({
      success: true,
      data: mockSupplier,
      message: 'API working - mock supplier data'
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    console.log('🏢 Suppliers API - PUT request:', { id, name: body.name });
    
    // Return mock success response
    return NextResponse.json({
      success: true,
      data: {
        id: id,
        ...body,
        updated_at: new Date().toISOString()
      },
      message: 'API working - mock supplier updated'
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