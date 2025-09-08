import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
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

// Get the Clerk publishable key with proper fallback
function getClerkPublishableKey(): string | undefined {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  
  // During static generation, if the key is not available, return undefined
  // This will prevent the ClerkProvider from throwing an error
  if (!key || key === 'your_clerk_publishable_key' || key.trim() === '') {
    return undefined;
  }
  
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
          <ClerkProvider publishableKey={clerkPublishableKey}>
            {children}
          </ClerkProvider>
        ) : (
          // Fallback for when Clerk is not configured (e.g., during static generation)
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-700 text-lg">Loading ProcureAI...</p>
              <p className="mt-2 text-gray-500 text-sm">Setting up authentication...</p>
            </div>
          </div>
        )}
      </body>
    </html>
  );
}
