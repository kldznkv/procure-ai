'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import UnifiedNavigation from '@/components/UnifiedNavigation';

interface Supplier {
  id: string;
  name: string;
  contact_email?: string;
  contact_phone?: string;
  contact_address?: string;
  performance_rating: number;
  total_spend: number;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
}

export default function SuppliersPage() {
  const { user, isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  // Debug logging for Railway troubleshooting
  useEffect(() => {
    console.log('🔐 Suppliers Page Debug:', {
      isLoaded,
      isSignedIn,
      hasUser: !!user,
      userId: user?.id,
      environment: process.env.NODE_ENV,
      platform: 'client'
    });
  }, [isLoaded, isSignedIn, user]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const loadSuppliers = useCallback(async () => {
    try {
      const response = await fetch(`/api/suppliers?user_id=${user?.id}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSuppliers(result.data || []);
        }
      }
    } catch (error) {
      console.error('Failed to load suppliers:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const navigateToSupplier = useCallback((supplierId: string) => {
    router.push(`/suppliers/${supplierId}`);
  }, [router]);

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      console.log('🔄 Loading suppliers for user:', user.id);
      loadSuppliers();
    }
  }, [isLoaded, isSignedIn, user, loadSuppliers]);

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.contact_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || supplier.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Show loading state while Clerk is initializing
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-700 text-lg">Loading ProcureAI...</p>
          <p className="mt-2 text-gray-500 text-sm">Initializing authentication...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please sign in to continue</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UnifiedNavigation pageTitle="Supplier Management" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Description */}
        <div className="mb-8">
          <p className="text-gray-700 text-lg">Manage your suppliers and view their performance metrics</p>
        </div>

        {/* Controls */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="🔍 Search suppliers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-600"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
            <button
              onClick={() => {/* TODO: Open add supplier modal */}}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-colors"
            >
              + Add Supplier
            </button>
          </div>
        </div>

        {/* Suppliers List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-700 text-lg">Loading suppliers...</p>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-700 text-lg font-medium">
              {searchTerm || statusFilter ? 'No suppliers match your filters' : 'No suppliers yet'}
            </p>
            <p className="text-gray-600 text-base mt-2">
              {searchTerm || statusFilter ? 'Try adjusting your search or filters' : 'Add your first supplier to get started'}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredSuppliers.map((supplier) => (
              <div 
                key={supplier.id} 
                className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 hover:bg-gradient-to-br hover:from-blue-50 hover:to-white transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                onClick={() => navigateToSupplier(supplier.id)}
                title="Click to view supplier details"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{supplier.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      supplier.status === 'active' ? 'bg-green-100 text-green-800 border border-green-200' :
                      supplier.status === 'inactive' ? 'bg-gray-100 text-gray-800 border border-gray-200' :
                      'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                      {supplier.status}
                    </span>
                    <span className="text-blue-500 text-lg group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
                
                <div className="space-y-3 mb-4">
                  {supplier.contact_email && (
                    <div className="flex items-center space-x-2 text-sm text-gray-700">
                      <span className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs">📧</span>
                      <span className="truncate">{supplier.contact_email}</span>
                    </div>
                  )}
                  {supplier.contact_phone && (
                    <div className="flex items-center space-x-2 text-sm text-gray-700">
                      <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-xs">📞</span>
                      <span className="truncate">{supplier.contact_phone}</span>
                    </div>
                  )}
                  {supplier.contact_address && (
                    <div className="flex items-center space-x-2 text-sm text-gray-700">
                      <span className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-xs">📍</span>
                      <span className="truncate">{supplier.contact_address}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-700 font-medium mb-1">Performance</p>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-blue-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${(supplier.performance_rating / 5) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold text-blue-800">
                        {supplier.performance_rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-lg border border-green-200">
                    <p className="text-xs text-green-700 font-medium mb-1">Total Spend</p>
                    <p className="text-lg font-bold text-green-800">
                      ${supplier.total_spend.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Navigation hint */}
                <div className="text-center mt-4 pt-3 border-t border-gray-100">
                  <div className="inline-flex items-center space-x-2 text-xs text-gray-500 group-hover:text-blue-500 transition-colors">
                    <span>Click to view details</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
