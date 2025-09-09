'use client';

import { ClerkProvider } from '@clerk/nextjs';

interface ClerkWrapperProps {
  children: React.ReactNode;
}

export function ClerkWrapper({ children }: ClerkWrapperProps) {
  // Always render ClerkProvider to prevent static generation issues
  // The publishableKey will be available at runtime
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_placeholder';

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
