import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting configuration
const RATE_LIMIT_MAX = 100; // requests per window
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // CORS headers
  const origin = request.headers.get('origin');
  const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'];
  
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }
  
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: response.headers });
  }

  // Rate limiting for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const clientId = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous';
    const now = Date.now();
    
    // Clean up expired entries
    for (const [key, value] of rateLimitStore.entries()) {
      if (now > value.resetTime) {
        rateLimitStore.delete(key);
      }
    }

    // Check rate limit
    const clientData = rateLimitStore.get(clientId);
    if (clientData) {
      if (now < clientData.resetTime) {
        if (clientData.count >= RATE_LIMIT_MAX) {
          return new Response(
            JSON.stringify({ 
              error: 'Rate limit exceeded',
              retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
            }),
            { 
              status: 429,
              headers: {
                'Content-Type': 'application/json',
                'Retry-After': Math.ceil((clientData.resetTime - now) / 1000).toString(),
                ...Object.fromEntries(response.headers.entries())
              }
            }
          );
        }
        clientData.count++;
      } else {
        rateLimitStore.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
      }
    } else {
      rateLimitStore.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    }
  }

  // Block suspicious requests
  const userAgent = request.headers.get('user-agent') || '';
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
  ];

  if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
    // Allow legitimate bots but log them
    console.log(`Bot detected: ${userAgent} from ${request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'}`);
  }

  // Block requests with suspicious paths
  const suspiciousPaths = [
    '/.env',
    '/wp-admin',
    '/admin',
    '/phpmyadmin',
    '/.git',
    '/config',
  ];

  if (suspiciousPaths.some(path => request.nextUrl.pathname.includes(path))) {
    return new Response('Not Found', { status: 404 });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
