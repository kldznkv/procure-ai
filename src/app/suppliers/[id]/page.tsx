'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
// import { useUser } from '@clerk/nextjs'; // DISABLED FOR DEPLOYMENT
import { useParams } from 'next/navigation';
import UnifiedNavigation from '@/components/UnifiedNavigation';
import { safeApiCall, handleApiError } from '@/lib/api-utils';

interface Supplier {
  id: string;
  name: string;
  contact_email?: string;
  contact_phone?: string;
  contact_address?: string;
  tax_id?: string;
  website?: string;
  performance_rating: number;
  total_spend: number;
  payment_terms?: string;
  credit_limit?: number;
  status: 'active' | 'inactive' | 'suspended';
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface SupplierDocument {
  id: string;
  filename: string;
  document_type: string;
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

export default function SupplierDetailPage() {
  // const { user, isSignedIn, isLoaded } = useUser(); // DISABLED FOR DEPLOYMENT
  const user = { id: 'temp-user' }; // TEMPORARY FIX
  const isSignedIn = true; // TEMPORARY FIX
  const isLoaded = true; // TEMPORARY FIX
  const params = useParams();
  const supplierId = params.id as string;
  
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [documents, setDocuments] = useState<SupplierDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Supplier>>({});
  const [selectedDocument, setSelectedDocument] = useState<SupplierDocument | null>(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [documentAction, setDocumentAction] = useState<'view' | 'edit' | 'approve' | 'reject' | null>(null);

  const loadSupplierData = useCallback(async () => {
    if (isLoading || hasLoaded) return; // PREVENT DUPLICATE CALLS
    
    setIsLoading(true);
    try {
      // Load supplier details with safe API call
      const supplierResult = await safeApiCall(
        `/api/suppliers/${supplierId}`,
        { method: 'GET' },
        { timeout: 5000, maxRetries: 2 }
      );
      
      if (supplierResult.success) {
        setSupplier(supplierResult.data);
        setEditForm(supplierResult.data);
      }

      // Load supplier documents with safe API call
      const documentsResult = await safeApiCall(
        `/api/documents?user_id=${user?.id}&supplier_id=${supplierId}`,
        { method: 'GET' },
        { timeout: 5000, maxRetries: 2 }
      );
      
      if (documentsResult.success) {
        setDocuments(documentsResult.data || []);
        setHasLoaded(true);
      }
    } catch (error) {
      console.error('Failed to load supplier data:', error);
      setSupplier(null);
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasLoaded, supplierId, user?.id]);

  useEffect(() => {
    loadSupplierData();
  }, []); // Empty array - run once only

  const handleSave = async () => {
    try {
      const result = await safeApiCall(
        `/api/suppliers/${supplierId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editForm)
        },
        { timeout: 5000, maxRetries: 2 }
      );
      
      if (result.success) {
        setSupplier(result.data);
        setEditForm(result.data);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to update supplier:', error);
    }
  };

  // Document action handlers
  const handleDocumentAction = (document: SupplierDocument, action: 'view' | 'edit' | 'approve' | 'reject') => {
    setSelectedDocument(document);
    setDocumentAction(action);
    setShowDocumentModal(true);
  };

  const handleDocumentStatusUpdate = async (documentId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        // Refresh documents to show updated status
        loadSupplierData();
        setShowDocumentModal(false);
        setSelectedDocument(null);
        setDocumentAction(null);
      }
    } catch (error) {
      console.error('Failed to update document status:', error);
    }
  };

  const downloadDocument = async (docItem: SupplierDocument) => {
    if (docItem.file_path) {
      try {
        const response = await fetch(`/api/documents/download?file_path=${encodeURIComponent(docItem.file_path)}`);
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = docItem.filename;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }
      } catch (error) {
        console.error('Failed to download document:', error);
      }
    }
  };

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-700 text-lg">Loading supplier...</p>
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Supplier not found</h1>
          <button 
            onClick={() => window.location.href = '/suppliers'} 
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Suppliers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UnifiedNavigation 
        showBackButton={true} 
        backUrl="/suppliers" 
        backText="Back to Suppliers" 
        pageTitle="Supplier Details" 
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Supplier Details</h2>
          <p className="text-gray-700 text-lg">Manage supplier information and view associated documents</p>
        </div>

        {/* Supplier Info Card */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{supplier.name}</h2>
              <p className="text-gray-600">Supplier ID: {supplier.id}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
              {isEditing && (
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                >
                  Save Changes
                </button>
              )}
            </div>
          </div>

          {isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={editForm.contact_email || ''}
                  onChange={(e) => setEditForm({...editForm, contact_email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={editForm.contact_phone || ''}
                  onChange={(e) => setEditForm({...editForm, contact_phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={editForm.status || 'active'}
                  onChange={(e) => setEditForm({...editForm, status: e.target.value as 'active' | 'inactive' | 'suspended'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <textarea
                  value={editForm.contact_address || ''}
                  onChange={(e) => setEditForm({...editForm, contact_address: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={editForm.notes || ''}
                  onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-3">
                  {supplier.contact_email && (
                    <div className="flex items-center space-x-3">
                      <span className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs">📧</span>
                      <span className="text-gray-700">{supplier.contact_email}</span>
                    </div>
                  )}
                  {supplier.contact_phone && (
                    <div className="flex items-center space-x-3">
                      <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-xs">📞</span>
                      <span className="text-gray-700">{supplier.contact_phone}</span>
                    </div>
                  )}
                  {supplier.contact_address && (
                    <div className="flex items-center space-x-3">
                      <span className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-xs">📍</span>
                      <span className="text-gray-700">{supplier.contact_address}</span>
                    </div>
                  )}
                  {supplier.tax_id && (
                    <div className="flex items-center space-x-3">
                      <span className="w-5 h-5 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 text-xs">🏢</span>
                      <span className="text-gray-700">Tax ID: {supplier.tax_id}</span>
                    </div>
                  )}
                  {supplier.website && (
                    <div className="flex items-center space-x-3">
                      <span className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-xs">🌐</span>
                      <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                        {supplier.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Metrics</h3>
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-700 font-medium mb-1">Performance Rating</p>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-blue-200 rounded-full h-3">
                        <div 
                          className="bg-blue-500 h-3 rounded-full transition-all duration-300" 
                          style={{ width: `${(supplier.performance_rating / 5) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-lg font-bold text-blue-800">
                        {supplier.performance_rating.toFixed(1)}/5.0
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                    <p className="text-sm text-green-700 font-medium mb-1">Total Spend</p>
                    <p className="text-2xl font-bold text-green-800">
                      ${supplier.total_spend.toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                    <p className="text-sm text-purple-700 font-medium mb-1">Status</p>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                      supplier.status === 'active' ? 'bg-green-100 text-green-800 border border-green-200' :
                      supplier.status === 'inactive' ? 'bg-gray-100 text-gray-800 border border-gray-200' :
                      'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                      {supplier.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Documents Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Associated Documents</h3>
          
          {documents.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-700 text-lg">No documents associated with this supplier</p>
              <p className="text-gray-600 text-base mt-2">Documents will appear here when uploaded and processed</p>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                      📄
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{doc.filename}</h4>
                      <p className="text-sm text-gray-600">
                        {doc.document_type} • {doc.currency} {doc.amount?.toLocaleString() || 'N/A'} • {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      doc.status === 'approved' ? 'bg-green-100 text-green-800 border border-green-200' :
                      doc.status === 'paid' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                      doc.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                      'bg-gray-100 text-gray-800 border border-gray-200'
                    }`}>
                      {doc.status}
                    </span>
                    
                    <button
                      onClick={() => handleDocumentAction(doc, 'view')}
                      className="px-3 py-1 text-blue-600 border border-blue-300 rounded hover:bg-blue-50 text-sm font-medium transition-colors"
                    >
                      View
                    </button>
                    
                    <button
                      onClick={() => handleDocumentAction(doc, 'edit')}
                      className="px-3 py-1 text-green-600 border border-green-300 rounded hover:bg-green-50 text-sm font-medium transition-colors"
                    >
                      Edit
                    </button>
                    
                    <button
                      onClick={() => downloadDocument(doc)}
                      className="px-3 py-1 text-purple-600 border border-purple-300 rounded hover:bg-purple-50 text-sm font-medium transition-colors"
                    >
                      Download
                    </button>
                    
                    <div className="relative">
                      <button
                        onClick={() => handleDocumentAction(doc, 'approve')}
                        className="px-3 py-1 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 text-sm font-medium transition-colors"
                      >
                        Actions
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Document Action Modal */}
      {showDocumentModal && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                {documentAction === 'view' && 'View Document'}
                {documentAction === 'edit' && 'Edit Document'}
                {documentAction === 'approve' && 'Approve Document'}
                {documentAction === 'reject' && 'Reject Document'}
              </h3>
              <button
                onClick={() => setShowDocumentModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {documentAction === 'view' && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Document Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Filename:</p>
                      <p className="text-gray-900 font-medium">{selectedDocument.filename}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Type:</p>
                      <p className="text-gray-900 font-medium">{selectedDocument.document_type}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Amount:</p>
                      <p className="text-gray-900 font-medium">
                        {selectedDocument.currency} {selectedDocument.amount?.toLocaleString() || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Status:</p>
                      <p className="text-gray-900 font-medium">{selectedDocument.status}</p>
                    </div>
                  </div>
                </div>
                
                {selectedDocument.extracted_text && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Extracted Text</h4>
                    <div className="bg-gray-50 p-4 rounded-lg max-h-40 overflow-y-auto">
                      <p className="text-sm text-gray-700">{selectedDocument.extracted_text}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {documentAction === 'edit' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={selectedDocument.status}
                    onChange={(e) => setSelectedDocument({...selectedDocument, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Document Type</label>
                  <select
                    value={selectedDocument.document_type}
                    onChange={(e) => setSelectedDocument({...selectedDocument, document_type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  >
                    <option value="PO">Purchase Order</option>
                    <option value="Invoice">Invoice</option>
                    <option value="Contract">Contract</option>
                    <option value="Quote">Quote</option>
                    <option value="Specification">Specification</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                  <input
                    type="number"
                    value={selectedDocument.amount || ''}
                    onChange={(e) => setSelectedDocument({...selectedDocument, amount: parseFloat(e.target.value) || undefined})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="Enter amount"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                  <select
                    value={selectedDocument.currency}
                    onChange={(e) => setSelectedDocument({...selectedDocument, currency: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="PLN">PLN</option>
                  </select>
                </div>
              </div>
            )}

            {(documentAction === 'approve' || documentAction === 'reject') && (
              <div className="space-y-4">
                <p className="text-gray-700">
                  Are you sure you want to {documentAction === 'approve' ? 'approve' : 'reject'} this document?
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleDocumentStatusUpdate(selectedDocument.id, documentAction === 'approve' ? 'approved' : 'rejected')}
                    className={`px-4 py-2 text-white rounded-lg font-medium transition-colors ${
                      documentAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {documentAction === 'approve' ? 'Approve' : 'Reject'}
                  </button>
                  <button
                    onClick={() => setShowDocumentModal(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {documentAction === 'edit' && (
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => setShowDocumentModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Handle save logic here
                    setShowDocumentModal(false);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                >
                  Save Changes
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
