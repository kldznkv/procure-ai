import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
import ClerkErrorBoundary from '@/components/ClerkErrorBoundary';
import NetworkDebugger from '@/components/NetworkDebugger';
import ClerkAPIDebugger from '@/components/ClerkAPIDebugger';
import ClerkSDKDebugger from '@/components/ClerkSDKDebugger';
import EnvironmentDebugger from '@/components/EnvironmentDebugger';
import ClerkEndpointDebugger from '@/components/ClerkEndpointDebugger';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ProcureAI - AI-Powered Procurement Platform",
  description: "Transform your procurement process with AI-powered document analysis, intelligent supplier management, and data-driven insights.",
};

// Get the Clerk publishable key with proper fallback and debugging
function getClerkPublishableKey(): string | undefined {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  
  // Debug logging for Railway troubleshooting
  console.log('🔐 Clerk Key Debug:', {
    hasKey: !!key,
    keyLength: key?.length || 0,
    keyPrefix: key?.substring(0, 10) || 'none',
    isDefault: key === 'your_clerk_publishable_key',
    isEmpty: key?.trim() === '',
    environment: process.env.NODE_ENV,
    platform: typeof window !== 'undefined' ? 'client' : 'server'
  });
  
  // During static generation, if the key is not available, return undefined
  // This will prevent the ClerkProvider from throwing an error
  if (!key || key === 'your_clerk_publishable_key' || key.trim() === '') {
    console.warn('⚠️ Clerk key not available or invalid');
    return undefined;
  }
  
  console.log('✅ Clerk key validated successfully');
  return key;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clerkPublishableKey = getClerkPublishableKey();

  return (
    <html lang="en">
      <head>
        {/* CSP is handled in next.config.js */}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {clerkPublishableKey ? (
          <ClerkErrorBoundary>
            <ClerkProvider 
              publishableKey={clerkPublishableKey}
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
          </ClerkErrorBoundary>
        ) : (
          // Fallback for when Clerk is not configured (e.g., during static generation)
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-700 text-lg">Loading ProcureAI...</p>
              <p className="mt-2 text-gray-500 text-sm">Setting up authentication...</p>
              <p className="mt-2 text-red-500 text-xs">Debug: Clerk key not available</p>
            </div>
          </div>
        )}
        <NetworkDebugger />
        <ClerkAPIDebugger />
        <ClerkSDKDebugger />
        <EnvironmentDebugger />
        <ClerkEndpointDebugger />
      </body>
    </html>
  );
}
