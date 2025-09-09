import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    
    console.log('📊 Spending Patterns API - GET request:', { userId });
    
    // Return mock data for now
    const mockPatterns = [
      { category: 'Office Supplies', amount: 2500, percentage: 35 },
      { category: 'IT Services', amount: 1800, percentage: 25 },
      { category: 'Consulting', amount: 1500, percentage: 21 },
      { category: 'Travel', amount: 1200, percentage: 17 },
      { category: 'Other', amount: 200, percentage: 2 }
    ];
    
    return NextResponse.json({
      success: true,
      data: mockPatterns,
      message: 'API working - mock spending patterns data'
    });
    
  } catch (error) {
    console.error('❌ Spending Patterns API Error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Spending Patterns API Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}