'use client';

import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SpendingPatternsData {
  by_document_type: Array<{
    document_type: string;
    count: number;
    total_spend: number;
    average_spend: number;
  }>;
  by_supplier: Array<{
    supplier_name: string;
    count: number;
    total_spend: number;
    average_spend: number;
  }>;
  spending_distribution: {
    low: number;
    medium: number;
    high: number;
    very_high: number;
  };
  top_suppliers: Array<{
    supplier_name: string;
    total_spend: number;
  }>;
  top_document_types: Array<{
    document_type: string;
    total_spend: number;
  }>;
}

interface SpendingAnalysisChartProps {
  data: SpendingPatternsData;
  title?: string;
  height?: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function SpendingAnalysisChart({ 
  data, 
  title = "Spending Analysis", 
  height = 400 
}: SpendingAnalysisChartProps) {
  if (!data || !data.by_document_type || data.by_document_type.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        <div className="text-center text-gray-500 py-8">
          No spending data available for analysis
        </div>
      </div>
    );
  }

  // Prepare pie chart data for document types
  const documentTypeData = data.by_document_type.map((item, index) => ({
    name: item.document_type,
    value: item.total_spend,
    count: item.count,
    color: COLORS[index % COLORS.length]
  }));

  // Prepare bar chart data for top suppliers
  const topSuppliersData = data.top_suppliers.map(item => ({
    name: item.supplier_name.length > 20 ? item.supplier_name.substring(0, 20) + '...' : item.supplier_name,
    'Total Spend': Math.round(item.total_spend * 100) / 100
  }));

  // Calculate summary metrics
  const totalSpend = data.by_document_type.reduce((sum, item) => sum + item.total_spend, 0);
  const totalDocuments = data.by_document_type.reduce((sum, item) => sum + item.count, 0);
  const averageSpend = totalSpend / totalDocuments;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      
      {/* Summary Metrics */}
      <div className="mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              ${Math.round(totalSpend * 100) / 100}
            </div>
            <div className="text-gray-600">Total Spend</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {totalDocuments}
            </div>
            <div className="text-gray-600">Documents</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              ${Math.round(averageSpend * 100) / 100}
            </div>
            <div className="text-gray-600">Avg Spend</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {data.by_document_type.length}
            </div>
            <div className="text-gray-600">Categories</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document Type Distribution - Pie Chart */}
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-3">Spending by Document Type</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={documentTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {documentTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name) => [`$${Math.round(Number(value) * 100) / 100}`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Suppliers - Bar Chart */}
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-3">Top Suppliers by Spend</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topSuppliersData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [`$${value}`, name]}
              />
              <Bar dataKey="Total Spend" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Spending Distribution */}
      <div className="mt-6">
        <h4 className="text-md font-medium text-gray-700 mb-3">Spending Distribution by Amount Range</h4>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-lg font-bold text-blue-600">{data.spending_distribution.low}</div>
            <div className="text-sm text-blue-600">Low ($0-1K)</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-lg font-bold text-green-600">{data.spending_distribution.medium}</div>
            <div className="text-sm text-green-600">Medium ($1K-10K)</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-lg font-bold text-yellow-600">{data.spending_distribution.high}</div>
            <div className="text-sm text-yellow-600">High ($10K-100K)</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-lg font-bold text-red-600">{data.spending_distribution.very_high}</div>
            <div className="text-sm text-red-600">Very High ($100K+)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
