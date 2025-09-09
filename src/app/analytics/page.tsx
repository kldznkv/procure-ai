'use client';

import { useState, useEffect, useCallback } from 'react';
// TEMPORARILY DISABLED FOR RAILWAY DEBUGGING
// import { useUser } from '@clerk/nextjs';
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
  payment_terms?: string;
  credit_limit?: number;
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
  supplier_id: string;
}

interface SupplierAnalytics {
  id: string;
  name: string;
  totalSpend: number;
  documentCount: number;
  averageAmount: number;
  onTimeDelivery: number;
  qualityScore: number;
  costEfficiency: number;
  riskScore: number;
  aiInsights: string[];
  recommendations: string[];
}

export default function AnalyticsPage() {
  // TEMPORARILY DISABLED FOR RAILWAY DEBUGGING
  // const { user, isSignedIn } = useUser();
  const user = { id: 'test-user-id' };
  const isSignedIn = true;
  
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [documents, setDocuments] = useState<SupplierDocument[]>([]);
  const [analytics, setAnalytics] = useState<SupplierAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [comparisonMode, setComparisonMode] = useState<'overview' | 'detailed' | 'ai'>('overview');
  const [aiAnalysis, setAiAnalysis] = useState<{
    comparison: {
      costAnalysis: {
        bestValue: string;
        costEfficiency: Array<{
          id: string;
          name?: string;
          score: number;
        }>;
      };
      performanceAnalysis: {
        topPerformer: string;
        performanceMetrics: Array<{
          id: string;
          name?: string;
          delivery: number;
          quality: number;
          reliability: number;
        }>;
      };
      riskAssessment: {
        riskLevels: Array<{
          id: string;
          name?: string;
          risk: number;
          factors: string[];
        }>;
      };
    };
    recommendations: string[];
    insights: string[];
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    
    try {
      // Load suppliers
      const suppliersResponse = await fetch(`/api/suppliers?user_id=${user.id}`);
      if (suppliersResponse.ok) {
        const result = await suppliersResponse.json();
        if (result.success) {
          setSuppliers(result.data || []);
        }
      }
      
      // Load documents
      const documentsResponse = await fetch(`/api/documents?user_id=${user.id}&processed=true`);
      if (documentsResponse.ok) {
        const result = await documentsResponse.json();
        if (result.success) {
          setDocuments(result.data || []);
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isSignedIn && user) {
      loadData();
    }
  }, [isSignedIn, user, loadData]);

  // Generate analytics data
  useEffect(() => {
    if (suppliers.length > 0 && documents.length > 0) {
      const analyticsData = suppliers.map(supplier => {
        const supplierDocs = documents.filter(doc => doc.supplier_id === supplier.id);
        const totalSpend = supplierDocs.reduce((sum, doc) => sum + (doc.amount || 0), 0);
        const averageAmount = supplierDocs.length > 0 ? totalSpend / supplierDocs.length : 0;
        
        // Calculate performance metrics (simplified for now)
        const onTimeDelivery = Math.random() * 100; // This would come from real data
        const qualityScore = Math.random() * 100;
        const costEfficiency = Math.random() * 100;
        const riskScore = Math.random() * 100;

        return {
          id: supplier.id,
          name: supplier.name,
          totalSpend,
          documentCount: supplierDocs.length,
          averageAmount,
          onTimeDelivery,
          qualityScore,
          costEfficiency,
          riskScore,
          aiInsights: [],
          recommendations: []
        };
      });
      
      setAnalytics(analyticsData);
    }
  }, [suppliers, documents]);

  const toggleSupplierSelection = (supplierId: string) => {
    setSelectedSuppliers(prev => 
      prev.includes(supplierId) 
        ? prev.filter(id => id !== supplierId)
        : [...prev, supplierId]
    );
  };

  const performAIAnalysis = async () => {
    if (selectedSuppliers.length < 2) return;
    
    setIsAnalyzing(true);
    
    try {
      // Simulate AI analysis (in real implementation, this would call your AI service)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const analysis = {
        comparison: {
          costAnalysis: {
            bestValue: selectedSuppliers[0],
            costEfficiency: selectedSuppliers.map(id => ({
              id,
              name: suppliers.find(s => s.id === id)?.name,
              score: Math.random() * 100
            }))
          },
          performanceAnalysis: {
            topPerformer: selectedSuppliers[1],
            performanceMetrics: selectedSuppliers.map(id => ({
              id,
              name: suppliers.find(s => s.id === id)?.name,
              delivery: Math.random() * 100,
              quality: Math.random() * 100,
              reliability: Math.random() * 100
            }))
          },
          riskAssessment: {
            riskLevels: selectedSuppliers.map(id => ({
              id,
              name: suppliers.find(s => s.id === id)?.name,
              risk: Math.random() * 100,
              factors: ['Financial stability', 'Delivery reliability', 'Quality consistency']
            }))
          }
        },
        recommendations: [
          'Consider consolidating orders with top performers to improve efficiency',
          'Implement quality monitoring for suppliers with lower quality scores',
          'Develop risk mitigation strategies for higher-risk suppliers',
          'Negotiate better payment terms with high-performing suppliers'
        ],
        insights: [
          'Supplier A shows the best cost-efficiency ratio',
          'Supplier B has the highest quality consistency',
          'Consider dual-sourcing strategy for critical items',
          'Payment terms can be optimized based on performance'
        ]
      };
      
      setAiAnalysis(analysis);
      setComparisonMode('ai');
    } catch (error) {
      console.error('AI analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
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
      <UnifiedNavigation pageTitle="AI Supplier Analytics" />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-700 text-lg">Loading analytics data...</p>
          </div>
        ) : (
          <div className="px-4 sm:px-0">
            {/* Page Description */}
            <div className="mb-8">
              <p className="text-gray-700 text-lg">Compare suppliers and get AI-powered insights for better procurement decisions</p>
            </div>

            {/* Mode Selection */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Analysis Mode</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => setComparisonMode('overview')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    comparisonMode === 'overview'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  📊 Overview
                </button>
                <button
                  onClick={() => setComparisonMode('detailed')}
                  disabled={selectedSuppliers.length === 0}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    comparisonMode === 'detailed'
                      ? 'bg-blue-600 text-white'
                      : selectedSuppliers.length === 0
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  🔍 Detailed
                </button>
                <button
                  onClick={() => setComparisonMode('ai')}
                  disabled={selectedSuppliers.length < 2}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    comparisonMode === 'ai'
                      ? 'bg-blue-600 text-white'
                      : selectedSuppliers.length < 2
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  🤖 AI Analysis
                </button>
              </div>
            </div>

            {/* Supplier Selection */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Select Suppliers for Comparison</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {suppliers.map((supplier) => (
                  <div
                    key={supplier.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      selectedSuppliers.includes(supplier.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleSupplierSelection(supplier.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        selectedSuppliers.includes(supplier.id)
                          ? 'bg-blue-500 border-blue-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedSuppliers.includes(supplier.id) && (
                          <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{supplier.name}</h4>
                        <p className="text-sm text-gray-600">
                          ${supplier.total_spend.toLocaleString()} • {supplier.performance_rating.toFixed(1)}/5.0
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {selectedSuppliers.length > 0 && (
                <div className="mt-6 flex items-center justify-between">
                  <p className="text-sm text-gray-700">
                    {selectedSuppliers.length} supplier(s) selected for comparison
                  </p>
                  <button
                    onClick={performAIAnalysis}
                    disabled={selectedSuppliers.length < 2 || isAnalyzing}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {isAnalyzing ? (
                      <span className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Analyzing...</span>
                      </span>
                    ) : (
                      '🤖 Run AI Analysis'
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Analytics Content */}
            {comparisonMode === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Performance Overview */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Overview</h3>
                  <div className="space-y-4">
                    {analytics.slice(0, 5).map((supplier) => (
                      <div key={supplier.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{supplier.name}</p>
                          <p className="text-sm text-gray-600">
                            {supplier.documentCount} documents • ${supplier.totalSpend.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-blue-600">
                            {supplier.qualityScore.toFixed(1)}%
                          </p>
                          <p className="text-xs text-gray-600">Quality Score</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cost Analysis */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Cost Analysis</h3>
                  <div className="space-y-4">
                    {analytics
                      .sort((a, b) => b.totalSpend - a.totalSpend)
                      .slice(0, 5)
                      .map((supplier) => (
                        <div key={supplier.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{supplier.name}</p>
                            <p className="text-sm text-gray-600">
                              Avg: ${supplier.averageAmount.toFixed(0)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-600">
                              ${supplier.totalSpend.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-600">Total Spend</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {comparisonMode === 'detailed' && selectedSuppliers.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Detailed Comparison</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Metric
                        </th>
                        {selectedSuppliers.map(supplierId => {
                          const supplier = suppliers.find(s => s.id === supplierId);
                          return (
                            <th key={supplierId} className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                              {supplier?.name}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          Total Spend
                        </td>
                        {selectedSuppliers.map(supplierId => {
                          const supplierAnalytics = analytics.find(a => a.id === supplierId);
                          return (
                            <td key={supplierId} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ${supplierAnalytics?.totalSpend.toLocaleString() || '0'}
                            </td>
                          );
                        })}
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          Document Count
                        </td>
                        {selectedSuppliers.map(supplierId => {
                          const supplierAnalytics = analytics.find(a => a.id === supplierId);
                          return (
                            <td key={supplierId} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {supplierAnalytics?.documentCount || '0'}
                            </td>
                          );
                        })}
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          Quality Score
                        </td>
                        {selectedSuppliers.map(supplierId => {
                          const supplierAnalytics = analytics.find(a => a.id === supplierId);
                          return (
                            <td key={supplierId} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {supplierAnalytics?.qualityScore.toFixed(1) || '0'}%
                            </td>
                          );
                        })}
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          Risk Score
                        </td>
                        {selectedSuppliers.map(supplierId => {
                          const supplierAnalytics = analytics.find(a => a.id === supplierId);
                          return (
                            <td key={supplierId} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {supplierAnalytics?.riskScore.toFixed(1) || '0'}%
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {comparisonMode === 'ai' && aiAnalysis && (
              <div className="space-y-6">
                {/* AI Insights */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">🤖 AI Insights</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Cost Analysis</h4>
                      <div className="space-y-2">
                        {aiAnalysis.comparison.costAnalysis.costEfficiency.map((item: { id: string; name?: string; score: number }) => (
                          <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <span className="text-sm text-gray-700">{item.name}</span>
                            <span className="text-sm font-medium text-blue-600">{item.score.toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Performance Analysis</h4>
                      <div className="space-y-2">
                        {aiAnalysis.comparison.performanceAnalysis.performanceMetrics.map((item: { id: string; name?: string; delivery: number; quality: number; reliability: number }) => (
                          <div key={item.id} className="p-2 bg-gray-50 rounded">
                            <p className="text-sm font-medium text-gray-900">{item.name}</p>
                            <p className="text-xs text-gray-600">
                              Delivery: {item.delivery.toFixed(1)}% • Quality: {item.quality.toFixed(1)}% • Reliability: {item.reliability.toFixed(1)}%
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">💡 AI Recommendations</h3>
                  <div className="space-y-3">
                    {aiAnalysis.recommendations.map((recommendation: string, index: number) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <span className="text-blue-600 text-lg">💡</span>
                        <p className="text-gray-700">{recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key Insights */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">🔍 Key Insights</h3>
                  <div className="space-y-3">
                    {aiAnalysis.insights.map((insight: string, index: number) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <span className="text-green-600 text-lg">🔍</span>
                        <p className="text-gray-700">{insight}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
