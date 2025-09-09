'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import UnifiedNavigation from '../../components/UnifiedNavigation';
import PriceComparisonChart from '../../components/PriceComparisonChart';
import CostTrendsChart from '../../components/CostTrendsChart';
import SpendingAnalysisChart from '../../components/SpendingAnalysisChart';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

interface Document {
  id: string;
  filename: string;
  document_type: string;
  amount: number;
  currency: string;
  supplier_name: string;
  status: string;
  created_at: string;
  processed: boolean;
}

interface Supplier {
  id: string;
  name: string;
  contact_email: string;
  contact_phone: string;
  performance_rating: number;
  total_spend: number;
  document_count: number;
}

interface DashboardMetrics {
  totalDocuments: number;
  totalSuppliers: number;
  totalSpend: number;
  averageDocumentValue: number;
  processedDocuments: number;
  pendingDocuments: number;
  topSuppliers: Supplier[];
  recentDocuments: Document[];
}

export default function DashboardPage() {
  const { user, isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
                const [comparisonData, setComparisonData] = useState<Array<{
                supplier: string;
                total_spend: number;
                document_count: number;
                performance_rating: number;
              }>>([]);
              const [trendsData, setTrendsData] = useState<Array<{
                month: string;
                count: number;
                total_spend: number;
                average_spend: number;
              }>>([]);
              const [patternsData, setPatternsData] = useState<Record<string, unknown> | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);

  // Load data on component mount
  useEffect(() => {
    if (isSignedIn && user) {
      loadData();
    }
  }, [isSignedIn, user]);

  // Load dashboard data
  const loadData = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      // Load documents and suppliers in parallel
      const [documentsResponse, suppliersResponse] = await Promise.all([
        fetch(`/api/documents?user_id=${user.id}&processed=true`),
        fetch(`/api/suppliers?user_id=${user.id}`)
      ]);

      if (documentsResponse.ok && suppliersResponse.ok) {
        const documentsData = await documentsResponse.json();
        const suppliersData = await suppliersResponse.json();

        setDocuments(documentsData.data || []);
        setSuppliers(suppliersData.data || []);

        // Calculate metrics
        const calculatedMetrics = calculateMetrics(documentsData.data || [], suppliersData.data || []);
        setMetrics(calculatedMetrics);

        // Load analysis data
        await loadAnalysisData();
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Load analysis data
  const loadAnalysisData = async () => {
    if (!user?.id) return;

    try {
      // Load cost trends
      const trendsResponse = await fetch(`/api/analysis/cost-trends?user_id=${user.id}&period=${selectedPeriod}`);
      if (trendsResponse.ok) {
        const trendsResult = await trendsResponse.json();
        // Convert grouped trends object to array format for charts
        const trendsObject = trendsResult.data.trends || {};
        const trendsArray = Object.entries(trendsObject).map(([period, docs]) => ({
          month: period,
          count: (docs as any[]).length,
          total_spend: (docs as any[]).reduce((sum, doc) => sum + (doc.amount || 0), 0),
          average_spend: (docs as any[]).reduce((sum, doc) => sum + (doc.amount || 0), 0) / (docs as any[]).length || 0
        }));
        setTrendsData(trendsArray);
      }

      // Load spending patterns
      const patternsResponse = await fetch(`/api/analysis/spending-patterns?user_id=${user.id}`);
      if (patternsResponse.ok) {
        const patternsResult = await patternsResponse.json();
        setPatternsData(patternsResult.data);
      }
    } catch (error) {
      console.error('Error loading analysis data:', error);
    }
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Step 1: Upload file metadata
      const documentType = getDocumentType(file.name);
      const fileUrl = `procurement/${user.id}/${Date.now()}_${file.name}`;

      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          filename: file.name,
          file_url: fileUrl,
          document_type: documentType,
          processed: false
        }),
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error('Upload failed');
      }

      const documentId = result.data.id;
      setUploadProgress(50);

      // Step 2: Extract text from file (client-side)
      console.log('📄 Extracting text from file...');
      const extractedText = await extractTextFromFile(file);
      console.log('✅ Text extraction completed, length:', extractedText.length);
      setUploadProgress(70);

      // Step 3: Process document with AI using the new endpoint
      console.log('🤖 Processing document with AI...');
      const processResponse = await fetch('/api/documents/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_id: documentId,
          document_text: extractedText,
          document_type: documentType,
          user_id: user.id
        }),
      });

      if (processResponse.ok) {
        const processResult = await processResponse.json();
        console.log('✅ AI processing completed:', processResult);
        setUploadProgress(90);
      } else {
        console.warn('⚠️ AI processing failed, document uploaded without analysis');
      }

      // Step 5: Reload data and complete
      await loadData();
      setUploadProgress(100);
      setTimeout(() => {
        setUploadProgress(0);
        setIsUploading(false);
      }, 1000);

    } catch (error) {
      console.error('Upload error:', error);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Helper function to extract text from files
  const extractTextFromFile = async (file: File): Promise<string> => {
    try {
      // Import the PDF extractor
      const { extractTextFromFile: extractText, validateExtractedText } = await import('../../lib/pdf-extractor');
      
      console.log('📄 Starting text extraction for:', file.name, 'type:', file.type);
      
      // Extract text using the proper utility
      const result = await extractText(file);
      
      if (!result.success) {
        console.error('❌ Text extraction failed:', result.error);
        throw new Error(`Text extraction failed: ${result.error}`);
      }
      
      // Validate the extracted text
      const validation = validateExtractedText(result.text, file.name);
      
      if (!validation.isValid) {
        console.warn('⚠️ Text extraction quality issues:', validation.issues);
        console.warn('💡 Suggestions:', validation.suggestions);
      }
      
      console.log('✅ Text extraction completed successfully');
      console.log('📄 Text length:', result.text.length);
      console.log('📄 Quality:', validation.quality);
      console.log('📄 Text preview (first 200 chars):', result.text.substring(0, 200));
      
      return result.text;
      
    } catch (error) {
      console.error('❌ Text extraction error:', error);
      throw new Error(`Failed to extract text from ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Helper function to determine document type from filename
  const getDocumentType = (filename: string): string => {
    const lowerFilename = filename.toLowerCase();
    
    // Check for image files first
    if (lowerFilename.match(/\.(jpg|jpeg|png|gif|bmp|tiff)$/)) {
      if (lowerFilename.includes('invoice') || lowerFilename.includes('faktura')) {
        return 'Invoice'; // Use existing Invoice type for image invoices
      } else if (lowerFilename.includes('receipt') || lowerFilename.includes('paragon')) {
        return 'Receipt'; // Use existing Receipt type for image receipts
      } else if (lowerFilename.includes('quote') || lowerFilename.includes('oferta')) {
        return 'Quote'; // Use existing Quote type for image quotes
      } else {
        return 'Other'; // Use existing Other type for generic image documents
      }
    }
    
    // Regular document type detection
    if (lowerFilename.includes('invoice') || lowerFilename.includes('faktura')) {
      return 'Invoice';
    } else if (lowerFilename.includes('purchase') || lowerFilename.includes('po') || lowerFilename.includes('order')) {
      return 'PO';
    } else if (lowerFilename.includes('contract') || lowerFilename.includes('umowa')) {
      return 'Contract';
    } else if (lowerFilename.includes('quote') || lowerFilename.includes('oferta')) {
      return 'Quote';
    } else if (lowerFilename.includes('receipt') || lowerFilename.includes('paragon')) {
      return 'Receipt';
    } else if (lowerFilename.includes('specification') || lowerFilename.includes('specyfikacja')) {
      return 'Specification';
    } else {
      return 'Other';
    }
  };

  // Calculate dashboard metrics
  const calculateMetrics = (docs: Document[], supps: Supplier[]): DashboardMetrics => {
    const totalSpend = docs.reduce((sum, doc) => sum + (doc.amount || 0), 0);
    const processedDocs = docs.filter(doc => doc.processed).length;
    const pendingDocs = docs.filter(doc => !doc.processed).length;

    // Calculate supplier metrics
    const suppliersWithMetrics = supps.map(supplier => {
      const supplierDocs = docs.filter(doc => doc.supplier_name === supplier.name);
      const supplierSpend = supplierDocs.reduce((sum, doc) => sum + (doc.amount || 0), 0);
      return {
        ...supplier,
        total_spend: supplierSpend,
        document_count: supplierDocs.length
      };
    });

    // Sort suppliers by total spend
    const topSuppliers = suppliersWithMetrics
      .sort((a, b) => b.total_spend - a.total_spend)
      .slice(0, 5);

    return {
      totalDocuments: docs.length,
      totalSuppliers: supps.length,
      totalSpend,
      averageDocumentValue: docs.length > 0 ? totalSpend / docs.length : 0,
      processedDocuments: processedDocs,
      pendingDocuments: pendingDocs,
      topSuppliers,
      recentDocuments: docs
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
    };
  };

  // Handle supplier selection for comparison
  const handleSupplierSelection = async (supplierIds: string[]) => {
    if (supplierIds.length < 2) {
      setComparisonData([]);
      return;
    }

    try {
      const response = await fetch(
        `/api/analysis/supplier-comparison?user_id=${user?.id}&supplier_ids=${supplierIds.join(',')}`
      );
      if (response.ok) {
        const result = await response.json();
        setComparisonData(result.data || []);
      }
    } catch (error) {
      console.error('Error loading supplier comparison:', error);
    }
  };

  // Handle period change
  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    loadAnalysisData();
  };

  // Navigate to suppliers page
  const navigateToSuppliers = () => router.push('/suppliers');

  // Navigate to documents page
  const navigateToDocuments = () => router.push('/documents');

  // Navigate to analytics page
  const navigateToAnalytics = () => router.push('/analytics');

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please sign in to access the dashboard</h1>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <UnifiedNavigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UnifiedNavigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Procurement Dashboard</h1>
          <p className="text-gray-600">Monitor your procurement operations and supplier performance</p>
        </div>

        {/* Document Upload Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Upload New Document</h2>
            <div className="flex items-center space-x-2">
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.bmp,.tiff"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors font-medium ${
                  isUploading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isUploading ? 'Uploading...' : '📤 Choose File'}
              </label>
            </div>
          </div>
          
          {isUploading && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}
          
          <p className="text-sm text-gray-600 mt-2">
            Supported formats: PDF, DOC, DOCX, TXT. Documents will be automatically analyzed using AI.
          </p>
        </div>

        {/* Key Metrics Cards */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Documents</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.totalDocuments}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Suppliers</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.totalSuppliers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Spend</p>
                  <p className="text-2xl font-bold text-gray-900">${Math.round(metrics.totalSpend * 100) / 100}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Document Value</p>
                  <p className="text-2xl font-bold text-gray-900">${Math.round(metrics.averageDocumentValue * 100) / 100}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button
            onClick={navigateToSuppliers}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer text-left"
          >
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Manage Suppliers</h3>
                <p className="text-gray-600">View and manage supplier relationships</p>
              </div>
            </div>
          </button>

          <button
            onClick={navigateToDocuments}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer text-left"
          >
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">View Documents</h3>
                <p className="text-gray-600">Browse all procurement documents</p>
              </div>
            </div>
          </button>

                                <button
                        onClick={navigateToAnalytics}
                        className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer text-left"
                      >
                        <div className="flex items-center">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          </div>
                          <div className="ml-4">
                            <h3 className="text-lg font-semibold text-gray-900">Advanced Analytics</h3>
                            <p className="text-gray-600">Deep dive into procurement insights</p>
                          </div>
                        </div>
                      </button>
                    </div>

                    {/* Phase 3 Features */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <button
                        onClick={() => router.push('/workflows')}
                        className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer text-left"
                      >
                        <div className="flex items-center">
                          <div className="p-2 bg-orange-100 rounded-lg">
                            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                          <div className="ml-4">
                            <h3 className="text-lg font-semibold text-gray-900">Workflow Automation</h3>
                            <p className="text-gray-600">Automated supplier matching and approval workflows</p>
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => router.push('/compliance')}
                        className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer text-left"
                      >
                        <div className="flex items-center">
                          <div className="p-2 bg-red-100 rounded-lg">
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="ml-4">
                            <h3 className="text-lg font-semibold text-gray-900">Compliance Monitoring</h3>
                            <p className="text-gray-600">Regulatory compliance and risk assessment</p>
                          </div>
                        </div>
                      </button>
        </div>

        {/* Analysis Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Procurement Analysis</h2>
          
          {/* Period Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Analysis Period</label>
            <select
              value={selectedPeriod}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Cost Trends Chart */}
            <CostTrendsChart 
              data={trendsData} 
              title={`Cost Trends (${selectedPeriod})`}
              height={350}
            />

            {/* Spending Analysis Chart */}
            <SpendingAnalysisChart 
              data={patternsData as any || { by_document_type: [], by_supplier: [], by_month: [], top_suppliers: [], top_document_types: [], spending_distribution: { low: 0, medium: 0, high: 0, very_high: 0 } }} 
              title="Spending Patterns"
              height={350}
            />
          </div>
        </div>

        {/* Supplier Comparison Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Supplier Comparison</h2>
          
          {/* Supplier Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Suppliers to Compare (min 2)</label>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {suppliers.map((supplier) => (
                <label key={supplier.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedSuppliers.includes(supplier.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSuppliers([...selectedSuppliers, supplier.id]);
                      } else {
                        setSelectedSuppliers(selectedSuppliers.filter(id => id !== supplier.id));
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 truncate">{supplier.name}</span>
                </label>
              ))}
            </div>
            <button
              onClick={() => handleSupplierSelection(selectedSuppliers)}
              disabled={selectedSuppliers.length < 2}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Compare Selected Suppliers
            </button>
          </div>

          {/* Comparison Chart */}
          {comparisonData.length > 0 && (
            <PriceComparisonChart 
              data={comparisonData as any} 
              title="Supplier Comparison Analysis"
              height={400}
            />
          )}
        </div>

        {/* Recent Activity */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Latest Documents</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {metrics?.recentDocuments.map((doc) => (
                <div key={doc.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{doc.filename}</p>
                      <p className="text-sm text-gray-500">
                        {doc.document_type} • {doc.supplier_name || 'No supplier'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        ${Math.round((doc.amount || 0) * 100) / 100}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
