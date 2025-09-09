'use client';

import { useEffect } from 'react';

export default function ClerkAPIDebugger() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    console.log('🔍 Clerk API Debugger Started');

    // Store original fetch function
    const originalFetch = window.fetch;

    // Override fetch to intercept all requests
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      const method = init?.method || 'GET';
      
      // Check if this is a Clerk-related request
      const isClerkRequest = url.includes('clerk') || url.includes('clerk.com') || url.includes('clerk.accounts.dev');
      
      if (isClerkRequest) {
        console.log('🔐 Clerk API Request:', {
          url,
          method,
          headers: init?.headers,
          body: init?.body,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          environment: process.env.NODE_ENV,
          platform: 'client',
          referrer: document.referrer,
          location: window.location.href
        });
      }

      try {
        const response = await originalFetch(input, init);
        
        if (isClerkRequest) {
          console.log('🔐 Clerk API Response:', {
            url,
            method,
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            ok: response.ok,
            timestamp: new Date().toISOString()
          });

          // Log response body for failed requests
          if (!response.ok) {
            try {
              const responseText = await response.clone().text();
              console.log('🔐 Clerk API Error Response Body:', {
                url,
                status: response.status,
                body: responseText
              });
            } catch (e) {
              console.log('🔐 Clerk API Error - Could not read response body:', e);
            }
          }
        }
        
        return response;
      } catch (error) {
        if (isClerkRequest) {
          console.error('🔐 Clerk API Request Failed:', {
            url,
            method,
            error: error instanceof Error ? error.message : error,
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString()
          });
        }
        throw error;
      }
    };

    // Store original XMLHttpRequest
    const originalXHR = window.XMLHttpRequest;
    
    // Override XMLHttpRequest to intercept all requests
    window.XMLHttpRequest = function() {
      const xhr = new originalXHR();
      const originalOpen = xhr.open;
      const originalSend = xhr.send;
      
      xhr.open = function(method: string, url: string | URL, async?: boolean, user?: string | null, password?: string | null) {
        const urlString = typeof url === 'string' ? url : url.toString();
        const isClerkRequest = urlString.includes('clerk') || urlString.includes('clerk.com') || urlString.includes('clerk.accounts.dev');
        
        if (isClerkRequest) {
          console.log('🔐 Clerk XHR Request:', {
            url: urlString,
            method,
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV,
            platform: 'client'
          });
        }
        
        return originalOpen.call(this, method, url, async ?? true, user, password);
      };
      
      xhr.send = function(data?: any) {
        const url = this.responseURL || 'unknown';
        const isClerkRequest = url.includes('clerk') || url.includes('clerk.com') || url.includes('clerk.accounts.dev');
        
        if (isClerkRequest) {
          console.log('🔐 Clerk XHR Send:', {
            url,
            data,
            timestamp: new Date().toISOString()
          });
        }
        
        // Add event listeners for response
        this.addEventListener('load', function() {
          if (isClerkRequest) {
            console.log('🔐 Clerk XHR Response:', {
              url: this.responseURL,
              status: this.status,
              statusText: this.statusText,
              response: this.response,
              timestamp: new Date().toISOString()
            });
          }
        });
        
        this.addEventListener('error', function() {
          if (isClerkRequest) {
            console.error('🔐 Clerk XHR Error:', {
              url: this.responseURL,
              status: this.status,
              statusText: this.statusText,
              timestamp: new Date().toISOString()
            });
          }
        });
        
        return originalSend.call(this, data);
      };
      
      return xhr;
    } as any;

    // Monitor for Clerk-specific errors
    const handleError = (event: ErrorEvent) => {
      if (event.message?.includes('clerk') || event.filename?.includes('clerk')) {
        console.error('🚨 Clerk Error:', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error,
          timestamp: new Date().toISOString()
        });
      }
    };

    window.addEventListener('error', handleError);

    // Monitor network errors
    const handleNetworkError = (event: Event) => {
      console.log('🌐 Network Event:', {
        type: event.type,
        target: event.target,
        timestamp: new Date().toISOString()
      });
    };

    window.addEventListener('online', handleNetworkError);
    window.addEventListener('offline', handleNetworkError);

    return () => {
      // Restore original functions
      window.fetch = originalFetch;
      window.XMLHttpRequest = originalXHR;
      window.removeEventListener('error', handleError);
      window.removeEventListener('online', handleNetworkError);
      window.removeEventListener('offline', handleNetworkError);
    };
  }, []);

  return null;
}
