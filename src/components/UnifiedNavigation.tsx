'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
// import { UserButton } from '@clerk/nextjs'; // DISABLED FOR DEPLOYMENT

interface UnifiedNavigationProps {
  showBackButton?: boolean;
  backUrl?: string;
  backText?: string;
  pageTitle?: string;
}

export default function UnifiedNavigation({ 
  showBackButton = false, 
  backUrl = '/dashboard', 
  backText = 'Back to Dashboard',
  pageTitle 
}: UnifiedNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(path);
  };

  return (
    <>
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              {showBackButton && (
                <Link href={backUrl} className="text-blue-600 hover:text-blue-800 font-medium">
                  ← {backText}
                </Link>
              )}
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">
                  ProcureTrack
                </h1>
                <span className="ml-2 text-sm text-gray-600">
                  Procurement Intelligence
                </span>
              </div>
            </div>
            <div className="px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-md">User Menu</div>
          </div>
        </div>
      </header>

      {/* Unified Navigation Menu */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-6">
            <button
              onClick={() => router.push('/dashboard')}
              className={`py-4 px-3 text-sm font-medium transition-colors ${
                isActive('/dashboard')
                  ? 'text-blue-600 border-b-2 border-blue-500'
                  : 'text-gray-700 hover:text-blue-600 hover:border-b-2 hover:border-blue-300'
              }`}
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => router.push('/suppliers')}
              className={`py-4 px-3 text-sm font-medium transition-colors ${
                isActive('/suppliers')
                  ? 'text-blue-600 border-b-2 border-blue-500'
                  : 'text-gray-700 hover:text-blue-600 hover:border-b-2 hover:border-blue-300'
              }`}
            >
              🏢 Suppliers
            </button>
            <button
              onClick={() => router.push('/documents')}
              className={`py-4 px-3 text-sm font-medium transition-colors ${
                isActive('/documents')
                  ? 'text-blue-600 border-b-2 border-blue-500'
                  : 'text-gray-700 hover:text-blue-600 hover:border-b-2 hover:border-blue-300'
              }`}
            >
              📄 Documents
            </button>
          </div>
        </div>
      </nav>

      {/* Page Title (if provided) */}
      {pageTitle && (
        <div className="bg-gray-50 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <h2 className="text-2xl font-bold text-gray-900">{pageTitle}</h2>
          </div>
        </div>
      )}
    </>
  );
}
