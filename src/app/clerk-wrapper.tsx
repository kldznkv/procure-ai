'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { useState, useEffect } from 'react';

interface ClerkWrapperProps {
  children: React.ReactNode;
}

export function ClerkWrapper({ children }: ClerkWrapperProps) {
  const [publishableKey, setPublishableKey] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setPublishableKey(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || null);
  }, []);

  // During SSR or if no publishable key, render children without Clerk
  if (!isClient || !publishableKey || publishableKey === 'your_clerk_publishable_key' || publishableKey.trim() === '') {
    return <>{children}</>;
  }

  // Render with ClerkProvider when key is available on client
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
