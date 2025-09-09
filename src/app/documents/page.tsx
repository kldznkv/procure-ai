'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import UnifiedNavigation from '@/components/UnifiedNavigation';

interface ProcurementDocument {
  id: string;
  filename: string;
  document_type: string;
  supplier_name?: string;
  amount?: number;
  currency: string;
  issue_date?: string;
  due_date?: string;
  status: string;
  created_at: string;
  file_path?: string;
  extracted_text?: string;
  ai_analysis?: Record<string, unknown>;
}

export default function DocumentsPage() {
  const { user, isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [documents, setDocuments] = useState<ProcurementDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const loadDocuments = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`/api/documents?user_id=${user.id}&processed=true`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setDocuments(result.data || []);
        }
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isSignedIn && user) {
      loadDocuments();
    }
  }, [isSignedIn, user, loadDocuments]);

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !typeFilter || doc.document_type === typeFilter;
    const matchesStatus = !statusFilter || doc.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'paid': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'PO': return '📋';
      case 'Invoice': return '🧾';
      case 'Contract': return '📄';
      case 'Quote': return '💲';
      case 'Specification': return '📝';
      default: return '📄';
    }
  };

  const handleReprocess = async (documentId: string) => {
    try {
      const response = await fetch('/api/documents/reprocess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: documentId })
      });

      if (response.ok) {
        // Reload documents to show updated status
        await loadDocuments();
        alert('Document reprocessed successfully!');
      } else {
        const error = await response.json();
        alert(`Reprocessing failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Reprocessing error:', error);
      alert('Failed to reprocess document');
    }
  };

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
      <UnifiedNavigation pageTitle="Document Management" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Description */}
        <div className="mb-8">
          <p className="text-gray-700 text-lg">Manage and analyze your procurement documents with AI-powered insights</p>
        </div>

        {/* Controls */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="🔍 Search documents or suppliers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-600"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            >
              <option value="">All Types</option>
              <option value="PO">Purchase Order</option>
              <option value="Invoice">Invoice</option>
              <option value="Contract">Contract</option>
              <option value="Quote">Quote</option>
              <option value="Specification">Specification</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-colors"
            >
              📤 Upload Document
            </button>
          </div>
        </div>

        {/* Documents List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-700 text-lg">Loading documents...</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-700 text-lg font-medium">
              {searchTerm || typeFilter || statusFilter ? 'No documents match your filters' : 'No documents yet'}
            </p>
            <p className="text-gray-600 text-base mt-2">
              {searchTerm || typeFilter || statusFilter ? 'Try adjusting your search or filters' : 'Upload your first document to get started'}
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Upload Document
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDocuments.map((doc) => (
              <div 
                key={doc.id} 
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-300"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">
                      {getTypeIcon(doc.document_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">{doc.filename}</h3>
                        <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(doc.status)}`}>
                          {doc.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="space-y-1">
                          <p className="text-gray-600 font-medium">Document Type</p>
                          <p className="text-gray-900 font-semibold">{doc.document_type}</p>
                        </div>
                        {doc.supplier_name && (
                          <div className="space-y-1">
                            <p className="text-gray-600 font-medium">Supplier</p>
                            <p className="text-gray-900 font-semibold">{doc.supplier_name}</p>
                          </div>
                        )}
                        {doc.amount && (
                          <div className="space-y-1">
                            <p className="text-gray-600 font-medium">Amount</p>
                            <p className="text-gray-900 font-semibold">
                              {doc.currency} {doc.amount.toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4 flex items-center space-x-4 text-sm text-gray-600">
                        {doc.issue_date && (
                          <span>📅 Issued: {new Date(doc.issue_date).toLocaleDateString()}</span>
                        )}
                        {doc.due_date && (
                          <span>⏰ Due: {new Date(doc.due_date).toLocaleDateString()}</span>
                        )}
                        <span>📅 Created: {new Date(doc.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => {/* TODO: View document details */}}
                      className="px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-colors"
                    >
                      View
                    </button>
                    <button
                      onClick={() => {/* TODO: Download document */}}
                      className="px-4 py-2 text-green-600 border border-green-300 rounded-lg hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 font-medium transition-colors"
                    >
                      Download
                    </button>
                    {(!doc.ai_analysis || (doc as any).processing_error) && (
                      <button
                        onClick={() => handleReprocess(doc.id)}
                        className="px-4 py-2 text-orange-600 border border-orange-300 rounded-lg hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium transition-colors"
                      >
                        🔄 Reprocess
                      </button>
                    )}
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
