'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

interface ClerkWrapperProps {
  children: React.ReactNode;
}

export function ClerkWrapper({ children }: ClerkWrapperProps) {
  const [publishableKey, setPublishableKey] = useState<string | undefined>(undefined);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Only run on client side
    setIsClient(true);
    
    // Get the publishable key from environment variables
    const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    
    if (key && key !== 'your_clerk_publishable_key' && key.trim() !== '') {
      setPublishableKey(key);
    }
  }, []);

  // During build time or when key is not available, render children without Clerk
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-700 text-lg">Loading ProcureAI...</p>
          <p className="mt-2 text-gray-500 text-sm">Setting up authentication...</p>
        </div>
      </div>
    );
  }

  // If no publishable key, render children without Clerk
  if (!publishableKey) {
    return <>{children}</>;
  }

  // Render with ClerkProvider when key is available
  return (
    <ClerkProvider 
      publishableKey={publishableKey}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
      appearance={{
        baseTheme: undefined,
        variables: {
          colorPrimary: "#2563eb",
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}
