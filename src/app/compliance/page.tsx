'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import UnifiedNavigation from '../../components/UnifiedNavigation';

interface ComplianceCheck {
  document_id: string;
  document_name: string;
  document_type: string;
  supplier_name: string;
  amount: number;
  compliance_status: string;
  compliance_score: number;
  violations: string[];
  recommendations: string[];
  last_check: string;
}

interface RegulatoryCompliance {
  type: string;
  overall_score: number;
  total_documents: number;
  compliant_documents: number;
  non_compliant_documents: number;
  compliance_checks: ComplianceCheck[];
  summary: {
    high_risk: number;
    medium_risk: number;
    low_risk: number;
  };
}

interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  entity_type: string;
  entity_id: string;
  entity_name: string;
  user_id: string;
  details: Record<string, unknown>;
}

interface AuditTrail {
  type: string;
  total_entries: number;
  audit_entries: AuditEntry[];
  summary: {
    documents: number;
    suppliers: number;
    last_activity: string | null;
  };
}

interface RiskAssessment {
  type: string;
  overall_risk_score: number;
  risk_level: string;
  assessment_date: string;
  risk_categories: {
    document_risks: Record<string, unknown>;
    supplier_risks: Record<string, unknown>;
    process_risks: Record<string, unknown>;
  };
  recommendations: string[];
}

interface ComplianceData {
  compliance: {
    regulatory: RegulatoryCompliance;
    audit_trail: AuditTrail;
    risk_assessment: RiskAssessment;
  };
  summary: {
    overall_compliance_score: number;
    overall_risk_score: number;
    total_audit_entries: number;
    last_assessment: string;
  };
}

export default function CompliancePage() {
  const { user, isSignedIn, isLoaded } = useUser();
  const [complianceData, setComplianceData] = useState<ComplianceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Load compliance data on component mount
  useEffect(() => {
    if (isSignedIn && user) {
      loadComplianceData();
    }
  }, [isSignedIn, user]);

  // Load compliance data
  const loadComplianceData = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/compliance?user_id=${user.id}`);
      if (response.ok) {
        const result = await response.json();
        setComplianceData(result.data);
      }
    } catch (error) {
      console.error('Error loading compliance data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Toggle item expansion
  const toggleItemExpansion = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  // Handle compliance action
  const handleComplianceAction = async (actionType: string, data: Record<string, unknown>) => {
    try {
      const response = await fetch('/api/compliance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
          complianceType: actionType,
          data
        }),
      });

      if (response.ok) {
        // Reload compliance data after action
        await loadComplianceData();
      }
    } catch (error) {
      console.error('Error performing compliance action:', error);
    }
  };

  // Get compliance status color
  const getComplianceStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'text-green-600 bg-green-100';
      case 'partially_compliant': return 'text-yellow-600 bg-yellow-100';
      case 'non_compliant': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get risk level color
  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get compliance score color
  const getComplianceScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please sign in to access compliance</h1>
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
            <p className="mt-4 text-gray-600">Loading compliance data...</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Compliance Monitoring</h1>
          <p className="text-gray-600">Regulatory compliance, audit trails, and risk assessment</p>
        </div>

        {/* Compliance Summary Cards */}
        {complianceData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Overall Compliance</p>
                  <p className={`text-2xl font-bold ${getComplianceScoreColor(complianceData.summary.overall_compliance_score)}`}>
                    {complianceData.summary.overall_compliance_score}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Overall Risk Score</p>
                  <p className={`text-2xl font-bold ${getRiskLevelColor(complianceData.summary.overall_risk_score >= 70 ? 'high' : complianceData.summary.overall_risk_score >= 40 ? 'medium' : 'low')}`}>
                    {complianceData.summary.overall_risk_score}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Documents</p>
                  <p className="text-2xl font-bold text-gray-900">{complianceData.compliance.regulatory.total_documents}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Audit Entries</p>
                  <p className="text-2xl font-bold text-gray-900">{complianceData.summary.total_audit_entries}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Compliance Type Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Compliance Type</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Compliance</option>
            <option value="regulatory">Regulatory Compliance</option>
            <option value="audit-trail">Audit Trail</option>
            <option value="risk-assessment">Risk Assessment</option>
          </select>
        </div>

        {/* Compliance Sections */}
        {complianceData && (
          <>
            {/* Regulatory Compliance Section */}
            {selectedType === 'all' || selectedType === 'regulatory' ? (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Regulatory Compliance</h2>
                
                {/* Compliance Score Chart */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Compliance Overview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-2">
                        {complianceData.compliance.regulatory.compliant_documents}
                      </div>
                      <div className="text-sm text-gray-600">Compliant Documents</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-yellow-600 mb-2">
                        {complianceData.compliance.regulatory.summary.medium_risk}
                      </div>
                      <div className="text-sm text-gray-600">Partially Compliant</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-red-600 mb-2">
                        {complianceData.compliance.regulatory.non_compliant_documents}
                      </div>
                      <div className="text-sm text-gray-600">Non-Compliant</div>
                    </div>
                  </div>
                </div>

                {/* Compliance Checks Table */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Document Compliance Checks</h3>
                  </div>
                  {complianceData.compliance.regulatory.compliance_checks.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {complianceData.compliance.regulatory.compliance_checks.map((check) => (
                        <div key={check.document_id} className="p-6 hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <h4 className="text-lg font-medium text-gray-900">{check.document_name}</h4>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getComplianceStatusColor(check.compliance_status)}`}>
                                  {check.compliance_status.replace('_', ' ')}
                                </span>
                                <span className={`text-sm font-medium ${getComplianceScoreColor(check.compliance_score)}`}>
                                  Score: {check.compliance_score}%
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                Type: {check.document_type} • Supplier: {check.supplier_name || 'Not identified'} • Amount: ${check.amount || 0}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => toggleItemExpansion(check.document_id)}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                {expandedItems.has(check.document_id) ? 'Hide Details' : 'View Details'}
                              </button>
                              <button
                                onClick={() => handleComplianceAction('regulatory-check', { documentId: check.document_id })}
                                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                              >
                                Recheck
                              </button>
                            </div>
                          </div>
                          
                          {expandedItems.has(check.document_id) && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                              {check.violations.length > 0 && (
                                <div className="mb-4">
                                  <h5 className="font-medium text-red-700 mb-2">Violations Found:</h5>
                                  <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                                    {check.violations.map((violation, index) => (
                                      <li key={index}>{violation}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              {check.recommendations.length > 0 && (
                                <div>
                                  <h5 className="font-medium text-blue-700 mb-2">Recommendations:</h5>
                                  <ul className="list-disc list-inside text-sm text-blue-600 space-y-1">
                                    {check.recommendations.map((recommendation, index) => (
                                      <li key={index}>{recommendation}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-gray-500">
                      No compliance checks available
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* Audit Trail Section */}
            {selectedType === 'all' || selectedType === 'audit-trail' ? (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Audit Trail</h2>
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Activity Log</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Last activity: {complianceData.compliance.audit_trail.summary.last_activity ? 
                        new Date(complianceData.compliance.audit_trail.summary.last_activity).toLocaleString() : 'No activity'
                      }
                    </p>
                  </div>
                  {complianceData.compliance.audit_trail.audit_entries.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {complianceData.compliance.audit_trail.audit_entries.map((entry) => (
                        <div key={entry.id} className="p-6 hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <h4 className="text-lg font-medium text-gray-900">{entry.action}</h4>
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-600">
                                  {entry.entity_type}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                Entity: {entry.entity_name} • {new Date(entry.timestamp).toLocaleString()}
                              </p>
                            </div>
                            <button
                              onClick={() => toggleItemExpansion(entry.id)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              {expandedItems.has(entry.id) ? 'Hide Details' : 'View Details'}
                            </button>
                          </div>
                          
                          {expandedItems.has(entry.id) && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                              <h5 className="font-medium text-gray-900 mb-2">Details:</h5>
                              <pre className="text-sm text-gray-600 bg-white p-2 rounded border">
                                {JSON.stringify(entry.details, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-gray-500">
                      No audit entries available
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* Risk Assessment Section */}
            {selectedType === 'all' || selectedType === 'risk-assessment' ? (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Risk Assessment</h2>
                
                {/* Risk Overview */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Risk Overview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className={`text-3xl font-bold mb-2 ${getRiskLevelColor(complianceData.compliance.risk_assessment.risk_level)}`}>
                        {complianceData.compliance.risk_assessment.overall_risk_score}
                      </div>
                      <div className="text-sm text-gray-600">Overall Risk Score</div>
                      <div className={`text-xs font-medium mt-1 px-2 py-1 rounded-full ${getRiskLevelColor(complianceData.compliance.risk_assessment.risk_level)}`}>
                        {complianceData.compliance.risk_assessment.risk_level.toUpperCase()} RISK
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-900 mb-2">
                        {new Date(complianceData.compliance.risk_assessment.assessment_date).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-600">Last Assessment</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        {complianceData.compliance.risk_assessment.recommendations.length}
                      </div>
                      <div className="text-sm text-gray-600">Risk Recommendations</div>
                    </div>
                  </div>
                </div>

                {/* Risk Recommendations */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Risk Recommendations</h3>
                  </div>
                  {complianceData.compliance.risk_assessment.recommendations.length > 0 ? (
                    <div className="p-6">
                      <ul className="space-y-3">
                        {complianceData.compliance.risk_assessment.recommendations.map((recommendation, index) => (
                          <li key={index} className="flex items-start space-x-3">
                            <div className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                            <span className="text-gray-700">{recommendation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-gray-500">
                      No risk recommendations available
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </>
        )}

        {/* No Compliance Data State */}
        {complianceData && complianceData.compliance.regulatory.total_documents === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No compliance data available</h3>
            <p className="text-gray-600">Upload documents to start compliance monitoring</p>
          </div>
        )}
      </div>
    </div>
  );
}
