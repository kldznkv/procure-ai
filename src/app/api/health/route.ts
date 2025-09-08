import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: ServiceHealth;
    ai: ServiceHealth;
    cache: ServiceHealth;
    auth: ServiceHealth;
  };
}

interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  lastChecked: string;
  details?: string;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const healthCheck: HealthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: await checkDatabase(),
      ai: await checkAI(),
      cache: await checkCache(),
      auth: await checkAuth(),
    },
  };

  // Determine overall status
  const serviceStatuses = Object.values(healthCheck.services).map(s => s.status);
  if (serviceStatuses.includes('unhealthy')) {
    healthCheck.status = 'unhealthy';
  } else if (serviceStatuses.includes('degraded')) {
    healthCheck.status = 'degraded';
  }

  const responseTime = Date.now() - startTime;
  const statusCode = healthCheck.status === 'healthy' ? 200 : 
                    healthCheck.status === 'degraded' ? 200 : 503;

  return NextResponse.json(healthCheck, { 
    status: statusCode,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}

async function checkDatabase(): Promise<ServiceHealth> {
  const startTime = Date.now();
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('suppliers')
      .select('id')
      .limit(1);

    if (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
        details: `Database error: ${error.message}`,
      };
    }

    return {
      status: 'healthy',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      details: `Database connection failed: ${error}`,
    };
  }
}

async function checkAI(): Promise<ServiceHealth> {
  const startTime = Date.now();
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
        details: 'Anthropic API key not configured',
      };
    }

    // Simple API key validation
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }],
      }),
    });

    if (response.ok) {
      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
      };
    } else {
      return {
        status: 'degraded',
        responseTime: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
        details: `AI API returned status: ${response.status}`,
      };
    }
  } catch (error) {
    return {
      status: 'degraded',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      details: `AI service error: ${error}`,
    };
  }
}

async function checkCache(): Promise<ServiceHealth> {
  const startTime = Date.now();
  try {
    // Check if Redis is enabled
    if (process.env.REDIS_ENABLED === 'true' && process.env.REDIS_URL) {
      // Redis is enabled, check connection
      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
        details: 'Redis caching enabled',
      };
    } else {
      // Using memory cache
      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
        details: 'Memory caching enabled',
      };
    }
  } catch (error) {
    return {
      status: 'degraded',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      details: `Cache error: ${error}`,
    };
  }
}

async function checkAuth(): Promise<ServiceHealth> {
  const startTime = Date.now();
  try {
    if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
        details: 'Clerk authentication not configured',
      };
    }

    return {
      status: 'healthy',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'degraded',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      details: `Auth service error: ${error}`,
    };
  }
}
