'use client';

// import { SignIn } from '@clerk/nextjs'; // DISABLED FOR DEPLOYMENT

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
          <p className="mt-2 text-gray-600">Sign in to your ProcureTrack account</p>
        </div>
        <div className="bg-white p-8 rounded-lg shadow-xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Sign In</h2>
          <p className="text-gray-600 mb-6">Authentication temporarily disabled for deployment</p>
          <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
            Sign In (Coming Soon)
          </button>
        </div>
      </div>
    </div>
  );
}
