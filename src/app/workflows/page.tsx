'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import UnifiedNavigation from '../../components/UnifiedNavigation';

interface WorkflowItem {
  id?: string;
  type?: string;
  status: string;
  priority?: string;
  urgency?: string;
  confidence_score?: number;
  days_until_renewal?: number;
  days_in_queue?: number;
  supplier_name?: string;
  document_name?: string;
  amount?: number;
  recommendations?: string[];
  required_approvers?: string[];
}

interface WorkflowData {
  type: string;
  workflows: WorkflowItem[];
  total_pending: number;
}

interface AllWorkflows {
  workflows: {
    supplier_matching: WorkflowData;
    contract_renewal: WorkflowData;
    approval: WorkflowData;
  };
  summary: {
    total_workflows: number;
    supplier_matching: number;
    contract_renewal: number;
    approval: number;
  };
}

export default function WorkflowsPage() {
  const { user, isSignedIn } = useUser();
  const [workflows, setWorkflows] = useState<AllWorkflows | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [expandedWorkflows, setExpandedWorkflows] = useState<Set<string>>(new Set());

  // Load workflows on component mount
  useEffect(() => {
    if (isSignedIn && user) {
      loadWorkflows();
    }
  }, [isSignedIn, user]);

  // Load workflow data
  const loadWorkflows = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/workflow?user_id=${user.id}`);
      if (response.ok) {
        const result = await response.json();
        setWorkflows(result.data);
      }
    } catch (error) {
      console.error('Error loading workflows:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Toggle workflow expansion
  const toggleWorkflowExpansion = (workflowId: string) => {
    const newExpanded = new Set(expandedWorkflows);
    if (newExpanded.has(workflowId)) {
      newExpanded.delete(workflowId);
    } else {
      newExpanded.add(workflowId);
    }
    setExpandedWorkflows(newExpanded);
  };

  // Handle workflow action
  const handleWorkflowAction = async (workflowId: string, action: string, workflowType: string) => {
    try {
      const response = await fetch('/api/workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
          workflowType,
          data: { workflowId, action }
        }),
      });

      if (response.ok) {
        // Reload workflows after action
        await loadWorkflows();
      }
    } catch (error) {
      console.error('Error performing workflow action:', error);
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get urgency color
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_review': return 'text-blue-600 bg-blue-100';
      case 'renewal_required': return 'text-orange-600 bg-orange-100';
      case 'pending_approval': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please sign in to access workflows</h1>
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
            <p className="mt-4 text-gray-600">Loading workflows...</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Workflow Management</h1>
          <p className="text-gray-600">Automated workflows and intelligent process management</p>
        </div>

        {/* Workflow Summary Cards */}
        {workflows && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Workflows</p>
                  <p className="text-2xl font-bold text-gray-900">{workflows.summary.total_workflows}</p>
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
                  <p className="text-sm font-medium text-gray-600">Supplier Matching</p>
                  <p className="text-2xl font-bold text-gray-900">{workflows.summary.supplier_matching}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Contract Renewals</p>
                  <p className="text-2xl font-bold text-gray-900">{workflows.summary.contract_renewal}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                  <p className="text-2xl font-bold text-gray-900">{workflows.summary.approval}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Workflow Type Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Workflow Type</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Workflows</option>
            <option value="supplier-matching">Supplier Matching</option>
            <option value="contract-renewal">Contract Renewals</option>
            <option value="approval">Approvals</option>
          </select>
        </div>

        {/* Workflow Sections */}
        {workflows && (
          <>
            {/* Supplier Matching Workflows */}
            {selectedType === 'all' || selectedType === 'supplier-matching' ? (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Supplier Matching</h2>
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  {workflows.workflows.supplier_matching.workflows.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {workflows.workflows.supplier_matching.workflows.map((workflow, index) => (
                        <div key={workflow.id || `supplier_matching_${index}`} className="p-6 hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <h3 className="text-lg font-medium text-gray-900">{workflow.document_name}</h3>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(workflow.status)}`}>
                                  {workflow.status.replace('_', ' ')}
                                </span>
                                {workflow.confidence_score && (
                                  <span className="text-sm text-gray-500">
                                    Confidence: {Math.round(workflow.confidence_score * 100)}%
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                Document Type: {workflow.type} • Supplier: {workflow.supplier_name || 'Not identified'}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => toggleWorkflowExpansion(workflow.id || `supplier_matching_${index}`)}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                {expandedWorkflows.has(workflow.id || `supplier_matching_${index}`) ? 'Hide Details' : 'View Details'}
                              </button>
                              <button
                                onClick={() => handleWorkflowAction(workflow.id || `supplier_matching_${index}`, 'approve', 'supplier-matching')}
                                className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                              >
                                Approve Match
                              </button>
                            </div>
                          </div>
                          
                          {expandedWorkflows.has(workflow.id || `supplier_matching_${index}`) && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                              <h4 className="font-medium text-gray-900 mb-2">Matching Suggestions</h4>
                              {/* Add detailed matching suggestions here */}
                              <p className="text-sm text-gray-600">Detailed supplier matching analysis and recommendations...</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-gray-500">
                      No supplier matching workflows pending
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* Contract Renewal Workflows */}
            {selectedType === 'all' || selectedType === 'contract-renewal' ? (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Contract Renewals</h2>
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  {workflows.workflows.contract_renewal.workflows.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {workflows.workflows.contract_renewal.workflows.map((workflow, index) => (
                        <div key={workflow.id || `contract_renewal_${index}`} className="p-6 hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <h3 className="text-lg font-medium text-gray-900">{workflow.document_name}</h3>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getUrgencyColor(workflow.urgency || 'low')}`}>
                                  {workflow.urgency} urgency
                                </span>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(workflow.status)}`}>
                                  {workflow.status.replace('_', ' ')}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                Supplier: {workflow.supplier_name} • Value: ${workflow.amount || 0}
                              </p>
                              {workflow.days_until_renewal && (
                                <p className="text-sm text-gray-600">
                                  Renewal in {workflow.days_until_renewal} days
                                </p>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => toggleWorkflowExpansion(workflow.id || `contract_renewal_${index}`)}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                {expandedWorkflows.has(workflow.id || `contract_renewal_${index}`) ? 'Hide Details' : 'View Details'}
                              </button>
                              <button
                                onClick={() => handleWorkflowAction(workflow.id || `contract_renewal_${index}`, 'schedule_renewal', 'contract-renewal')}
                                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                              >
                                Schedule Renewal
                              </button>
                            </div>
                          </div>
                          
                          {expandedWorkflows.has(workflow.id || `contract_renewal_${index}`) && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                              <h4 className="font-medium text-gray-900 mb-2">Recommended Actions</h4>
                              {/* Add recommended actions here */}
                              <p className="text-sm text-gray-600">Contract renewal strategy and action items...</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-gray-500">
                      No contract renewal alerts pending
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* Approval Workflows */}
            {selectedType === 'all' || selectedType === 'approval' ? (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Approval Workflows</h2>
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  {workflows.workflows.approval.workflows.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {workflows.workflows.approval.workflows.map((workflow, index) => (
                        <div key={workflow.id || `approval_${index}`} className="p-6 hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <h3 className="text-lg font-medium text-gray-900">{workflow.document_name}</h3>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(workflow.priority || 'low')}`}>
                                  {workflow.priority} priority
                                </span>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(workflow.status)}`}>
                                  {workflow.status.replace('_', ' ')}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                Document Type: {workflow.type} • Supplier: {workflow.supplier_name} • Amount: ${workflow.amount || 0}
                              </p>
                              {workflow.days_in_queue && (
                                <p className="text-sm text-gray-600">
                                  In queue for {workflow.days_in_queue} days
                                </p>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => toggleWorkflowExpansion(workflow.id || `approval_${index}`)}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                {expandedWorkflows.has(workflow.id || `approval_${index}`) ? 'Hide Details' : 'View Details'}
                              </button>
                              <button
                                onClick={() => handleWorkflowAction(workflow.id || `approval_${index}`, 'approve', 'approval')}
                                className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleWorkflowAction(workflow.id || `approval_${index}`, 'reject', 'approval')}
                                className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                          
                          {expandedWorkflows.has(workflow.id || `approval_${index}`) && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                              <h4 className="font-medium text-gray-900 mb-2">Approval Details</h4>
                              <p className="text-sm text-gray-600">
                                Required approvers: {workflow.required_approvers?.join(', ') || 'Manager'}
                              </p>
                              <p className="text-sm text-gray-600">
                                Next action: {workflow.next_action}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-gray-500">
                      No approval workflows pending
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </>
        )}

        {/* No Workflows State */}
        {workflows && workflows.summary.total_workflows === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No workflows pending</h3>
            <p className="text-gray-600">All your procurement processes are up to date!</p>
          </div>
        )}
      </div>
    </div>
  );
}
