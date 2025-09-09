'use client';

import { useEffect } from 'react';

export default function ClerkEndpointDebugger() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    console.log('🎯 Clerk Endpoint Debugger Started');

    // Test specific failing endpoints
    const testFailingEndpoints = async () => {
      const failingEndpoints = [
        {
          name: 'api.clerk.com',
          url: 'https://api.clerk.com',
          method: 'GET',
          expectedStatus: 200
        },
        {
          name: 'above-fox-71.clerk.accounts.dev',
          url: 'https://above-fox-71.clerk.accounts.dev',
          method: 'GET',
          expectedStatus: 200
        },
        {
          name: 'JWKS endpoint',
          url: 'https://above-fox-71.clerk.accounts.dev/.well-known/jwks.json',
          method: 'GET',
          expectedStatus: 200
        },
        {
          name: 'Clerk Frontend API',
          url: 'https://above-fox-71.clerk.accounts.dev/v1/client',
          method: 'GET',
          expectedStatus: 200
        }
      ];

      for (const endpoint of failingEndpoints) {
        try {
          console.log(`🎯 Testing ${endpoint.name}:`, {
            url: endpoint.url,
            method: endpoint.method,
            timestamp: new Date().toISOString()
          });

          const start = Date.now();
          const response = await fetch(endpoint.url, {
            method: endpoint.method,
            headers: {
              'Accept': 'application/json',
              'User-Agent': navigator.userAgent,
              'Origin': window.location.origin,
              'Referer': window.location.href
            }
          });
          const duration = Date.now() - start;

          console.log(`🎯 ${endpoint.name} Response:`, {
            url: endpoint.url,
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            duration: `${duration}ms`,
            success: response.ok,
            expectedStatus: endpoint.expectedStatus,
            timestamp: new Date().toISOString()
          });

          if (!response.ok) {
            try {
              const responseText = await response.clone().text();
              console.log(`🎯 ${endpoint.name} Error Body:`, {
                url: endpoint.url,
                status: response.status,
                body: responseText,
                timestamp: new Date().toISOString()
              });
            } catch (e) {
              console.log(`🎯 ${endpoint.name} Error - Could not read body:`, e);
            }
          }
        } catch (error) {
          console.error(`🎯 ${endpoint.name} Request Failed:`, {
            url: endpoint.url,
            error: error instanceof Error ? error.message : error,
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString()
          });
        }
      }
    };

    // Test endpoints after a delay
    setTimeout(testFailingEndpoints, 2000);

    // Monitor for specific Clerk API patterns
    const monitorClerkAPIPatterns = () => {
      // Check if Clerk is making requests to the right endpoints
      const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
      if (clerkKey) {
        const keyParts = clerkKey.split('_');
        if (keyParts.length >= 3) {
          const instanceId = keyParts[2];
          const expectedDomain = `${instanceId}.clerk.accounts.dev`;
          
          console.log('🎯 Expected Clerk Domain:', {
            instanceId,
            expectedDomain,
            currentKey: clerkKey.substring(0, 20) + '...',
            timestamp: new Date().toISOString()
          });

          // Test the expected domain
          fetch(`https://${expectedDomain}`, { method: 'HEAD' })
            .then(response => {
              console.log('🎯 Expected Domain Test:', {
                domain: expectedDomain,
                status: response.status,
                success: response.ok,
                timestamp: new Date().toISOString()
              });
            })
            .catch(error => {
              console.error('🎯 Expected Domain Test Failed:', {
                domain: expectedDomain,
                error: error.message,
                timestamp: new Date().toISOString()
              });
            });
        }
      }
    };

    // Monitor patterns after a delay
    setTimeout(monitorClerkAPIPatterns, 3000);

    // Monitor for Clerk SDK making requests
    const monitorClerkSDKRequests = () => {
      // Check if Clerk SDK is loaded and making requests
      const clerk = (window as any).__clerk;
      if (clerk) {
        console.log('🎯 Clerk SDK Request Monitoring:', {
          frontendApi: clerk.frontendApi,
          domain: clerk.domain,
          isSatellite: clerk.isSatellite,
          proxyUrl: clerk.proxyUrl,
          timestamp: new Date().toISOString()
        });

        // Check if Clerk is using the right domain
        if (clerk.frontendApi && !clerk.frontendApi.includes('above-fox-71')) {
          console.warn('🎯 Clerk SDK Domain Mismatch:', {
            expected: 'above-fox-71.clerk.accounts.dev',
            actual: clerk.frontendApi,
            timestamp: new Date().toISOString()
          });
        }
      }
    };

    // Monitor SDK requests periodically
    const interval = setInterval(monitorClerkSDKRequests, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return null;
}
