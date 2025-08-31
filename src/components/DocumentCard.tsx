'use client';

import { useState } from 'react';

interface ProcurementDocument {
  id: string;
  filename: string;
  document_type: 'PO' | 'Invoice' | 'Contract' | 'Quote' | 'Specification';
  supplier_name: string;
  amount: number;
  currency: string;
  issue_date: string;
  due_date: string;
  status: 'pending' | 'approved' | 'paid' | 'overdue';
  payment_terms: string;
  extracted_data: Record<string, unknown>;
  created_at: string;
}

interface DocumentCardProps {
  document: ProcurementDocument;
  onRefresh: () => void;
}

export default function DocumentCard({ document, onRefresh }: DocumentCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/documents?id=${document.id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        onRefresh();
      } else {
        console.error('Failed to delete document');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'paid': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getDocumentTypeIcon = (type: string) => {
    switch (type) {
      case 'PO': return '📋';
      case 'Invoice': return '🧾';
      case 'Contract': return '📄';
      case 'Quote': return '💬';
      case 'Specification': return '📝';
      default: return '📄';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">{getDocumentTypeIcon(document.document_type)}</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 truncate max-w-xs">
                {document.filename}
              </h3>
              <p className="text-sm text-gray-500">
                {document.document_type} • {new Date(document.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(document.status)}`}>
            {document.status}
          </span>
        </div>

        {/* Document Details */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Supplier</p>
            <p className="text-sm text-gray-900">{document.supplier_name || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Amount</p>
            <p className="text-sm text-gray-900">
              {document.amount ? `${document.currency} ${document.amount.toLocaleString()}` : 'Not specified'}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Issue Date</p>
            <p className="text-sm text-gray-900">
              {document.issue_date ? new Date(document.issue_date).toLocaleDateString() : 'Not specified'}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Due Date</p>
            <p className="text-sm text-gray-900">
              {document.due_date ? new Date(document.due_date).toLocaleDateString() : 'Not specified'}
            </p>
          </div>
        </div>

        {/* Payment Terms */}
        {document.payment_terms && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-500">Payment Terms</p>
            <p className="text-sm text-gray-900">{document.payment_terms}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <button className="px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors">
              👁️ View Details
            </button>
            <button className="px-3 py-2 text-sm bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors">
              ⬇️ Download
            </button>
          </div>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-3 py-2 text-sm bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            {isDeleting ? '🗑️ Deleting...' : '🗑️ Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
