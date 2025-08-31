'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface CostTrendsData {
  month: string;
  count: number;
  total_spend: number;
  average_spend: number;
}

interface CostTrendsChartProps {
  data: CostTrendsData[];
  title?: string;
  height?: number;
  showArea?: boolean;
}

export default function CostTrendsChart({ 
  data, 
  title = "Cost Trends Over Time", 
  height = 400,
  showArea = false 
}: CostTrendsChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        <div className="text-center text-gray-500 py-8">
          No trend data available
        </div>
      </div>
    );
  }

  // Format data for the chart
  const chartData = data.map(item => ({
    period: item.month,
    'Total Spend': Math.round(item.total_spend * 100) / 100,
    'Average Spend': Math.round(item.average_spend * 100) / 100,
    'Document Count': item.count
  }));

  // Calculate trend metrics
  const totalSpend = data.reduce((sum, item) => sum + item.total_spend, 0);
  const totalDocuments = data.reduce((sum, item) => sum + item.count, 0);
  const averageSpend = totalSpend / totalDocuments;
  
  // Determine trend direction
  let trendDirection = 'stable';
  let trendColor = 'text-gray-600';
  if (data.length >= 2) {
    const firstPeriod = data[0];
    const lastPeriod = data[data.length - 1];
    if (lastPeriod.total_spend > firstPeriod.total_spend) {
      trendDirection = 'increasing';
      trendColor = 'text-red-600';
    } else if (lastPeriod.total_spend < firstPeriod.total_spend) {
      trendDirection = 'decreasing';
      trendColor = 'text-green-600';
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      
      <div className="mb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {data.length}
            </div>
            <div className="text-gray-600">Periods</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              ${Math.round(totalSpend * 100) / 100}
            </div>
            <div className="text-gray-600">Total Spend</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {totalDocuments}
            </div>
            <div className="text-gray-600">Documents</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${trendColor}`}>
              {trendDirection.charAt(0).toUpperCase() + trendDirection.slice(1)}
            </div>
            <div className="text-gray-600">Trend</div>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        {showArea ? (
          <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
            <Tooltip 
              formatter={(value, name) => [
                name === 'Total Spend' || name === 'Average Spend' ? `$${value}` : value,
                name
              ]}
            />
            <Legend />
            <Area 
              yAxisId="left"
              type="monotone" 
              dataKey="Total Spend" 
              stackId="1"
              stroke="#8884d8" 
              fill="#8884d8" 
              fillOpacity={0.6}
            />
            <Area 
              yAxisId="left"
              type="monotone" 
              dataKey="Average Spend" 
              stackId="2"
              stroke="#82ca9d" 
              fill="#82ca9d" 
              fillOpacity={0.6}
            />
          </AreaChart>
        ) : (
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
            <Tooltip 
              formatter={(value, name) => [
                name === 'Total Spend' || name === 'Average Spend' ? `$${value}` : value,
                name
              ]}
            />
            <Legend />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="Total Spend" 
              stroke="#8884d8" 
              strokeWidth={3}
              dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
            />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="Average Spend" 
              stroke="#82ca9d" 
              strokeWidth={3}
              dot={{ fill: '#82ca9d', strokeWidth: 2, r: 4 }}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="Document Count" 
              stroke="#ffc658" 
              strokeWidth={2}
              dot={{ fill: '#ffc658', strokeWidth: 2, r: 3 }}
            />
          </LineChart>
        )}
      </ResponsiveContainer>

      <div className="mt-4 text-xs text-gray-500 text-center">
        {showArea ? 'Area chart showing spend distribution' : 'Line chart showing spend trends over time'}
      </div>
    </div>
  );
}
