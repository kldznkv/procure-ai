'use client';

import { useEffect } from 'react';

export default function NetworkDebugger() {
  useEffect(() => {
    // Debug network connectivity and CSP issues
    console.log('🌐 Network Debugger Started');
    
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      console.log('🌐 Running on server side');
      return;
    }

    // Log current environment
    console.log('🌐 Environment Debug:', {
      userAgent: navigator.userAgent,
      url: window.location.href,
      protocol: window.location.protocol,
      hostname: window.location.hostname,
      port: window.location.port,
      isLocalhost: window.location.hostname === 'localhost',
      isRailway: window.location.hostname.includes('railway'),
      isProduction: process.env.NODE_ENV === 'production'
    });

    // Test Clerk API connectivity
    const testClerkConnectivity = async () => {
      try {
        console.log('🔍 Testing Clerk API connectivity...');
        
        // Test if we can reach Clerk domains
        const clerkDomains = [
          'https://clerk.com',
          'https://api.clerk.com',
          'https://above-fox-71.clerk.accounts.dev'
        ];

        for (const domain of clerkDomains) {
          try {
            const response = await fetch(domain, { 
              method: 'HEAD',
              mode: 'no-cors' // This will work even with CORS issues
            });
            console.log(`✅ ${domain} - Reachable`);
          } catch (error) {
            console.log(`❌ ${domain} - Not reachable:`, error);
          }
        }
      } catch (error) {
        console.error('🚨 Clerk connectivity test failed:', error);
      }
    };

    // Test CSP by trying to create a worker
    const testCSP = () => {
      try {
        console.log('🔍 Testing CSP permissions...');
        
        // Test worker creation
        try {
          const blob = new Blob(['console.log("test")'], { type: 'application/javascript' });
          const workerUrl = URL.createObjectURL(blob);
          const worker = new Worker(workerUrl);
          worker.terminate();
          URL.revokeObjectURL(workerUrl);
          console.log('✅ Worker creation allowed');
        } catch (error) {
          console.log('❌ Worker creation blocked by CSP:', error);
        }

        // Test eval
        try {
          eval('console.log("eval test")');
          console.log('✅ Eval allowed');
        } catch (error) {
          console.log('❌ Eval blocked by CSP:', error);
        }

        // Test inline scripts
        try {
          const script = document.createElement('script');
          script.textContent = 'console.log("inline test")';
          document.head.appendChild(script);
          document.head.removeChild(script);
          console.log('✅ Inline scripts allowed');
        } catch (error) {
          console.log('❌ Inline scripts blocked by CSP:', error);
        }

      } catch (error) {
        console.error('🚨 CSP test failed:', error);
      }
    };

    // Run tests after a short delay
    setTimeout(() => {
      testClerkConnectivity();
      testCSP();
    }, 1000);

    // Monitor for network errors
    const handleError = (event: ErrorEvent) => {
      console.error('🚨 Global error caught:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('🚨 Unhandled promise rejection:', event.reason);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return null; // This component doesn't render anything
}
