import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const period = searchParams.get('period') || '6months';
    
    console.log('📊 Cost Trends API - GET request:', { userId, period });
    
    // Return mock data for now
    const mockTrends = {
      '2024-01': [
        { amount: 1500, supplier_name: 'Supplier A' },
        { amount: 2300, supplier_name: 'Supplier B' }
      ],
      '2024-02': [
        { amount: 1800, supplier_name: 'Supplier A' },
        { amount: 2100, supplier_name: 'Supplier C' }
      ],
      '2024-03': [
        { amount: 1200, supplier_name: 'Supplier B' },
        { amount: 2500, supplier_name: 'Supplier A' }
      ]
    };
    
    return NextResponse.json({
      success: true,
      data: {
        trends: mockTrends,
        total_spend: 13400,
        average_monthly: 4466.67
      },
      message: 'API working - mock cost trends data'
    });
    
  } catch (error) {
    console.error('❌ Cost Trends API Error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Cost Trends API Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}