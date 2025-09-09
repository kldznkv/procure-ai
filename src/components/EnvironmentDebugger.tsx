'use client';

import { useEffect } from 'react';

export default function EnvironmentDebugger() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    console.log('🌍 Environment Debugger Started');

    // Detect environment
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isRailway = window.location.hostname.includes('railway') || window.location.hostname.includes('railway.app');
    const isProduction = process.env.NODE_ENV === 'production';
    const isDevelopment = process.env.NODE_ENV === 'development';

    console.log('🌍 Environment Detection:', {
      hostname: window.location.hostname,
      port: window.location.port,
      protocol: window.location.protocol,
      href: window.location.href,
      isLocalhost,
      isRailway,
      isProduction,
      isDevelopment,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });

    // Check environment variables
    console.log('🌍 Environment Variables:', {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? 
        `${process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.substring(0, 10)}...` : 'not set',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 
        `${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 20)}...` : 'not set',
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? 'set' : 'not set',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'not set'
    });

    // Check for Railway-specific environment variables
    const railwayEnvVars = Object.keys(process.env).filter(key => 
      key.includes('RAILWAY') || key.includes('PORT') || key.includes('HOST')
    );
    
    if (railwayEnvVars.length > 0) {
      console.log('🌍 Railway Environment Variables:', 
        railwayEnvVars.reduce((acc, key) => {
          acc[key] = process.env[key] ? 'set' : 'not set';
          return acc;
        }, {} as Record<string, string>)
      );
    }

    // Check network connectivity
    const checkConnectivity = async () => {
      const testUrls = [
        'https://api.clerk.com',
        'https://above-fox-71.clerk.accounts.dev',
        'https://clerk.com',
        'https://above-fox-71.clerk.accounts.dev/.well-known/jwks.json'
      ];

      for (const url of testUrls) {
        try {
          const start = Date.now();
          const response = await fetch(url, { 
            method: 'HEAD',
            mode: 'no-cors'
          });
          const duration = Date.now() - start;
          
          console.log('🌍 Connectivity Test:', {
            url,
            status: response.status || 'no-cors',
            duration: `${duration}ms`,
            success: true,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.log('🌍 Connectivity Test Failed:', {
            url,
            error: error instanceof Error ? error.message : error,
            success: false,
            timestamp: new Date().toISOString()
          });
        }
      }
    };

    // Run connectivity test
    setTimeout(checkConnectivity, 1000);

    // Monitor for environment-specific issues
    const monitorEnvironment = () => {
      // Check if we're in a different environment than expected
      if (isRailway && !isProduction) {
        console.warn('🌍 Railway Environment Warning: NODE_ENV is not production');
      }
      
      if (isLocalhost && isProduction) {
        console.warn('🌍 Localhost Environment Warning: NODE_ENV is production');
      }

      // Check for missing environment variables
      if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
        console.error('🌍 Missing Environment Variable: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY');
      }

      // Check for development vs production Clerk keys
      const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
      if (clerkKey) {
        const isTestKey = clerkKey.startsWith('pk_test_');
        const isLiveKey = clerkKey.startsWith('pk_live_');
        
        console.log('🌍 Clerk Key Analysis:', {
          keyType: isTestKey ? 'test' : isLiveKey ? 'live' : 'unknown',
          isTestKey,
          isLiveKey,
          keyPrefix: clerkKey.substring(0, 10),
          environment: process.env.NODE_ENV,
          expectedType: process.env.NODE_ENV === 'production' ? 'live' : 'test'
        });

        if (isProduction && isTestKey) {
          console.warn('🌍 Clerk Key Warning: Using test key in production environment');
        }
        
        if (isDevelopment && isLiveKey) {
          console.warn('🌍 Clerk Key Warning: Using live key in development environment');
        }
      }
    };

    monitorEnvironment();

    // Monitor for changes in environment
    const interval = setInterval(monitorEnvironment, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return null;
}
