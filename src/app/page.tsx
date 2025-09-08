'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Client-side wrapper component to handle Clerk functionality
function ClerkWrapper({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);
  const { user, isSignedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Redirect to dashboard if user is signed in
  useEffect(() => {
    if (isSignedIn && user) {
      router.push('/dashboard');
    }
  }, [isSignedIn, user, router]);

  // Show loading state during hydration
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-700 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (isSignedIn && user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-700 text-lg">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function HomePage() {
  // Force Vercel to rebuild with latest changes
  console.log('🚀 ProcureAI HomePage loaded - Latest commit:', process.env.VERCEL_GIT_COMMIT_SHA || 'local');
  
  // Add visible debug info to detect if our code is running
  if (typeof window !== 'undefined') {
    document.title = '🚀 ProcureAI - AI-Powered Procurement Platform';
  }

  return (
    <ClerkWrapper>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">
                  ProcureTrack
                </h1>
                <span className="ml-2 text-sm text-gray-600">
                  Procurement Intelligence
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
              Procurement Operations
              <span className="block text-blue-600">Intelligence Platform</span>
            </h1>
            <p className="mt-6 text-xl text-slate-700 max-w-3xl mx-auto">
              Transform your procurement process with AI-powered document analysis, 
              intelligent supplier management, and data-driven insights.
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => window.location.href = '/sign-up'}
                className="px-8 py-4 bg-blue-600 text-white text-lg font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
              >
                Get Started
              </button>
              <button
                onClick={() => window.location.href = '/sign-in'}
                className="px-8 py-4 bg-white text-blue-600 text-lg font-medium rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition-colors shadow-lg hover:shadow-xl"
              >
                Sign In
              </button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">AI Document Analysis</h3>
              <p className="text-slate-700">
                Automatically extract key information from invoices, contracts, and purchase orders using advanced AI.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">🏢</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Supplier Intelligence</h3>
              <p className="text-slate-700">
                Comprehensive supplier profiles with performance metrics, risk assessment, and relationship management.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Analytics & Insights</h3>
              <p className="text-slate-700">
                Data-driven insights and comparative analysis to optimize your procurement strategy and reduce costs.
              </p>
            </div>
          </div>
        </main>
      </div>
    </ClerkWrapper>
  );
}
