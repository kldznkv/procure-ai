'use client';

import Link from 'next/link';

interface SupplierCardProps {
  supplier: {
    id: string;
    name: string;
    contact_email?: string;
    contact_phone?: string;
    performance_rating: number;
    total_spend: number;
    status: 'active' | 'inactive' | 'suspended';
  };
  showActions?: boolean;
}

export default function SupplierCard({ supplier, showActions = true }: SupplierCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{supplier.name}</h3>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(supplier.status)}`}>
          {supplier.status}
        </span>
      </div>
      
      <div className="space-y-2 mb-4">
        {supplier.contact_email && (
          <p className="text-sm text-gray-600">📧 {supplier.contact_email}</p>
        )}
        {supplier.contact_phone && (
          <p className="text-sm text-gray-600">📞 {supplier.contact_phone}</p>
        )}
      </div>

      <div className="flex justify-between items-center mb-4">
        <div>
          <p className="text-sm text-gray-500">Performance</p>
          <p className="text-lg font-semibold text-gray-900">
            {supplier.performance_rating.toFixed(1)}/5.0
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Total Spend</p>
          <p className="text-lg font-semibold text-gray-900">
            ${supplier.total_spend.toLocaleString()}
          </p>
        </div>
      </div>

      {showActions && (
        <div className="flex gap-2">
          <Link
            href={`/suppliers/${supplier.id}`}
            className="flex-1 px-3 py-2 text-sm text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 text-center"
          >
            View Details
          </Link>
          <button
            onClick={() => {/* TODO: Open edit modal */}}
            className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Edit
          </button>
        </div>
      )}
    </div>
  );
}
