import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Simple health check - no database calls
    return NextResponse.json({ 
      status: 'healthy',
      message: 'API working - simplified health check',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0'
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    return NextResponse.json({ 
      status: 'error',
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

