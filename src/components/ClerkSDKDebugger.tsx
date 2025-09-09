'use client';

import { useEffect } from 'react';

export default function ClerkSDKDebugger() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    console.log('🔧 Clerk SDK Debugger Started');

    // Monitor Clerk SDK initialization
    const checkClerkSDK = () => {
      const clerk = (window as any).__clerk;
      const clerkLoaded = (window as any).__clerk_loaded;
      
      console.log('🔧 Clerk SDK Status:', {
        clerk: !!clerk,
        clerkLoaded: !!clerkLoaded,
        clerkVersion: clerk?.version || 'unknown',
        clerkEnvironment: clerk?.environment || 'unknown',
        clerkPublishableKey: clerk?.publishableKey ? 
          `${clerk.publishableKey.substring(0, 10)}...` : 'unknown',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        platform: 'client'
      });

      if (clerk) {
        console.log('🔧 Clerk SDK Details:', {
          frontendApi: clerk.frontendApi,
          domain: clerk.domain,
          isSatellite: clerk.isSatellite,
          isProduction: clerk.isProduction,
          isDevelopment: clerk.isDevelopment,
          proxyUrl: clerk.proxyUrl,
          signInUrl: clerk.signInUrl,
          signUpUrl: clerk.signUpUrl,
          afterSignInUrl: clerk.afterSignInUrl,
          afterSignUpUrl: clerk.afterSignUpUrl
        });
      }
    };

    // Check immediately
    checkClerkSDK();

    // Check periodically
    const interval = setInterval(checkClerkSDK, 2000);

    // Monitor for Clerk events
    const handleClerkEvent = (event: Event) => {
      console.log('🔧 Clerk Event:', {
        type: event.type,
        detail: (event as CustomEvent).detail,
        timestamp: new Date().toISOString()
      });
    };

    // Listen for Clerk events
    window.addEventListener('clerk:loaded', handleClerkEvent);
    window.addEventListener('clerk:error', handleClerkEvent);
    window.addEventListener('clerk:user:created', handleClerkEvent);
    window.addEventListener('clerk:user:updated', handleClerkEvent);
    window.addEventListener('clerk:user:deleted', handleClerkEvent);
    window.addEventListener('clerk:session:created', handleClerkEvent);
    window.addEventListener('clerk:session:updated', handleClerkEvent);
    window.addEventListener('clerk:session:deleted', handleClerkEvent);

    // Monitor console for Clerk-related messages
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    console.log = function(...args: any[]) {
      const message = args.join(' ');
      if (message.toLowerCase().includes('clerk')) {
        console.log('🔧 Clerk Console Log:', {
          message,
          timestamp: new Date().toISOString(),
          stack: new Error().stack
        });
      }
      return originalConsoleLog.apply(console, args);
    };

    console.error = function(...args: any[]) {
      const message = args.join(' ');
      if (message.toLowerCase().includes('clerk')) {
        console.error('🔧 Clerk Console Error:', {
          message,
          timestamp: new Date().toISOString(),
          stack: new Error().stack
        });
      }
      return originalConsoleError.apply(console, args);
    };

    console.warn = function(...args: any[]) {
      const message = args.join(' ');
      if (message.toLowerCase().includes('clerk')) {
        console.warn('🔧 Clerk Console Warn:', {
          message,
          timestamp: new Date().toISOString(),
          stack: new Error().stack
        });
      }
      return originalConsoleWarn.apply(console, args);
    };

    return () => {
      clearInterval(interval);
      window.removeEventListener('clerk:loaded', handleClerkEvent);
      window.removeEventListener('clerk:error', handleClerkEvent);
      window.removeEventListener('clerk:user:created', handleClerkEvent);
      window.removeEventListener('clerk:user:updated', handleClerkEvent);
      window.removeEventListener('clerk:user:deleted', handleClerkEvent);
      window.removeEventListener('clerk:session:created', handleClerkEvent);
      window.removeEventListener('clerk:session:updated', handleClerkEvent);
      window.removeEventListener('clerk:session:deleted', handleClerkEvent);
      
      // Restore original console functions
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  }, []);

  return null;
}
