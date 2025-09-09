'use client';

// import { ClerkProvider } from '@clerk/nextjs'; // DISABLED FOR DEPLOYMENT

interface ClerkWrapperProps {
  children: React.ReactNode;
}

export function ClerkWrapper({ children }: ClerkWrapperProps) {
  // TEMPORARY: Always render children without Clerk for deployment
  return <>{children}</>;
}
