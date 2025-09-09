'use client';

import Link from 'next/link';

// Force dynamic rendering to prevent Clerk static generation issues
export const dynamic = 'force-dynamic';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                ProcureAI
              </h1>
              <span className="ml-2 text-sm text-gray-600">
                AI-Powered Procurement Platform
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            AI-Powered Procurement Platform
          </h1>
          <p className="mt-6 text-xl text-slate-700 max-w-3xl mx-auto">
            Transform your procurement process with intelligent automation, data-driven insights, and seamless supplier management.
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10 shadow-lg transition duration-300 ease-in-out transform hover:-translate-y-1"
            >
              Get Started
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex items-center justify-center px-8 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10 shadow-lg transition duration-300 ease-in-out transform hover:-translate-y-1"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
          <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
            <div className="text-blue-600 text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-900">Intelligent Document Analysis</h3>
            <p className="mt-3 text-slate-700">
              Automate data extraction from invoices, contracts, and other procurement documents with AI.
            </p>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
            <div className="text-green-600 text-4xl mb-4">🤝</div>
            <h3 className="text-xl font-semibold text-gray-900">Streamlined Supplier Management</h3>
            <p className="mt-3 text-slate-700">
              Manage supplier relationships, performance, and compliance all in one place.
            </p>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
            <div className="text-purple-600 text-4xl mb-4">💡</div>
            <h3 className="text-xl font-semibold text-gray-900">Data-Driven Insights</h3>
            <p className="text-slate-700">
              Data-driven insights and comparative analysis to optimize your procurement strategy and reduce costs.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
