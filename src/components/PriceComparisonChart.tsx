'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PriceComparisonData {
  supplier_name: string;
  total_spend: number;
  document_count: number;
  average_amount: number;
  performance_rating: number;
}

interface PriceComparisonChartProps {
  data: PriceComparisonData[];
  title?: string;
  height?: number;
}

export default function PriceComparisonChart({ data, title = "Supplier Price Comparison", height = 400 }: PriceComparisonChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        <div className="text-center text-gray-500 py-8">
          No data available for comparison
        </div>
      </div>
    );
  }

  // Format data for the chart
  const chartData = data.map(item => ({
    name: item.supplier_name.length > 20 ? item.supplier_name.substring(0, 20) + '...' : item.supplier_name,
    'Total Spend': Math.round(item.total_spend * 100) / 100,
    'Average Amount': Math.round(item.average_amount * 100) / 100,
    'Document Count': item.document_count,
    'Performance Rating': item.performance_rating
  }));

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      
      <div className="mb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {data.length}
            </div>
            <div className="text-gray-600">Suppliers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              ${Math.round(data.reduce((sum, item) => sum + item.total_spend, 0) * 100) / 100}
            </div>
            <div className="text-gray-600">Total Spend</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {data.reduce((sum, item) => sum + item.document_count, 0)}
            </div>
            <div className="text-gray-600">Documents</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {Math.round(data.reduce((sum, item) => sum + item.performance_rating, 0) / data.length * 10) / 10}
            </div>
            <div className="text-gray-600">Avg Rating</div>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
          />
          <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
          <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
          <Tooltip 
            formatter={(value, name) => [
              name === 'Total Spend' || name === 'Average Amount' ? `$${value}` : value,
              name
            ]}
          />
          <Legend />
          <Bar yAxisId="left" dataKey="Total Spend" fill="#8884d8" name="Total Spend ($)" />
          <Bar yAxisId="left" dataKey="Average Amount" fill="#82ca9d" name="Average Amount ($)" />
          <Bar yAxisId="right" dataKey="Document Count" fill="#ffc658" name="Document Count" />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 text-xs text-gray-500 text-center">
        Hover over bars for detailed information
      </div>
    </div>
  );
}
