'use client';

import { ClerkProvider } from '@clerk/nextjs';

interface ClerkWrapperProps {
  children: React.ReactNode;
}

export function ClerkWrapper({ children }: ClerkWrapperProps) {
  // Get the publishable key from environment variables
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  
  // If no publishable key, render children without Clerk to prevent errors
  if (!publishableKey || publishableKey === 'your_clerk_publishable_key' || publishableKey.trim() === '') {
    return <>{children}</>;
  }

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
