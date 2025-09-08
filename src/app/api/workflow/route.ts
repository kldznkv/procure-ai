import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const workflowType = searchParams.get('type');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get workflow data based on type
    let workflowData;
    
    switch (workflowType) {
      case 'supplier-matching':
        workflowData = await getSupplierMatchingWorkflows(userId);
        break;
      case 'contract-renewal':
        workflowData = await getContractRenewalAlerts(userId);
        break;
      case 'approval':
        workflowData = await getApprovalWorkflows(userId);
        break;
      default:
        workflowData = await getAllWorkflows(userId);
    }

    return NextResponse.json({
      success: true,
      data: workflowData,
      metadata: {
        workflow_type: workflowType || 'all',
        user_id: userId,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Workflow API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, workflowType, data } = body;

    if (!userId || !workflowType) {
      return NextResponse.json(
        { error: 'User ID and workflow type are required' },
        { status: 400 }
      );
    }

    let result;
    
    switch (workflowType) {
      case 'supplier-matching':
        result = await createSupplierMatchingWorkflow(userId, data);
        break;
      case 'contract-renewal':
        result = await createContractRenewalAlert(userId, data);
        break;
      case 'approval':
        result = await createApprovalWorkflow(userId, data);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid workflow type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Workflow created successfully'
    });

  } catch (error) {
    console.error('Workflow Creation Error:', error);
    return NextResponse.json(
      { error: 'Failed to create workflow' },
      { status: 500 }
    );
  }
}

// Get supplier matching workflows
async function getSupplierMatchingWorkflows(userId: string) {
  try {
    // Get documents that need supplier matching
    const { data: documents, error } = await supabase
      .from('procurement_documents')
      .select('*')
      .eq('user_id', userId)
      .is('supplier_id', null)
      .eq('processed', true);

    if (error) throw error;

    // Get existing suppliers for matching
    const { data: suppliers, error: supplierError } = await supabase
      .from('suppliers')
      .select('*')
      .eq('user_id', userId);

    if (supplierError) throw supplierError;

    // Generate supplier matching suggestions
    const matchingSuggestions = documents?.map(doc => {
      const suggestions = generateSupplierMatches(doc, suppliers || []);
      return {
        id: `supplier_matching_${doc.id}`,
        document_id: doc.id,
        document_name: doc.filename,
        document_type: doc.document_type,
        extracted_supplier: doc.supplier_name,
        suggestions,
        confidence_score: calculateMatchConfidence(doc, suggestions),
        status: 'pending_review'
      };
    }) || [];

    return {
      type: 'supplier_matching',
      workflows: matchingSuggestions,
      total_pending: matchingSuggestions.length
    };

  } catch (error) {
    console.error('Supplier matching workflow error:', error);
    throw error;
  }
}

// Get contract renewal alerts
async function getContractRenewalAlerts(userId: string) {
  try {
    // Get contracts approaching renewal
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const { data: contracts, error } = await supabase
      .from('procurement_documents')
      .select('*')
      .eq('user_id', userId)
      .eq('document_type', 'Contract')
      .gte('due_date', new Date().toISOString())
      .lte('due_date', thirtyDaysFromNow.toISOString());

    if (error) throw error;

    const renewalAlerts = contracts?.map(contract => {
      const daysUntilRenewal = Math.ceil(
        (new Date(contract.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        id: `contract_renewal_${contract.id}`,
        contract_id: contract.id,
        contract_name: contract.filename,
        supplier_name: contract.supplier_name,
        current_value: contract.amount,
        renewal_date: contract.due_date,
        days_until_renewal: daysUntilRenewal,
        urgency: daysUntilRenewal <= 7 ? 'high' : daysUntilRenewal <= 14 ? 'medium' : 'low',
        status: 'renewal_required',
        recommended_actions: generateRenewalActions(contract, daysUntilRenewal)
      };
    }) || [];

    return {
      type: 'contract_renewal',
      workflows: renewalAlerts,
      total_pending: renewalAlerts.length
    };

  } catch (error) {
    console.error('Contract renewal alert error:', error);
    throw error;
  }
}

// Get approval workflows
async function getApprovalWorkflows(userId: string) {
  try {
    // Get documents requiring approval
    const { data: documents, error } = await supabase
      .from('procurement_documents')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending_approval');

    if (error) throw error;

    const approvalWorkflows = documents?.map(doc => {
      return {
        id: `approval_${doc.id}`,
        document_id: doc.id,
        document_name: doc.filename,
        document_type: doc.document_type,
        supplier_name: doc.supplier_name,
        amount: doc.amount,
        submitted_date: doc.created_at,
        days_in_queue: Math.ceil(
          (new Date().getTime() - new Date(doc.created_at).getTime()) / (1000 * 60 * 60 * 24)
        ),
        priority: calculateApprovalPriority(doc),
        status: 'pending_approval',
        required_approvers: getRequiredApprovers(doc),
        next_action: 'review_and_approve'
      };
    }) || [];

    return {
      type: 'approval',
      workflows: approvalWorkflows,
      total_pending: approvalWorkflows.length
    };

  } catch (error) {
    console.error('Approval workflow error:', error);
    throw error;
  }
}

// Get all workflows
async function getAllWorkflows(userId: string) {
  try {
    const [supplierMatching, contractRenewal, approval] = await Promise.all([
      getSupplierMatchingWorkflows(userId),
      getContractRenewalAlerts(userId),
      getApprovalWorkflows(userId)
    ]);

    return {
      workflows: {
        supplier_matching: supplierMatching,
        contract_renewal: contractRenewal,
        approval: approval
      },
      summary: {
        total_workflows: supplierMatching.total_pending + contractRenewal.total_pending + approval.total_pending,
        supplier_matching: supplierMatching.total_pending,
        contract_renewal: contractRenewal.total_pending,
        approval: approval.total_pending
      }
    };

  } catch (error) {
    console.error('All workflows error:', error);
    throw error;
  }
}

// Helper functions
function generateSupplierMatches(document: Record<string, unknown>, suppliers: Array<Record<string, unknown>>) {
  const documentSupplier = (document.supplier_name as string)?.toLowerCase();
  if (!documentSupplier) return [];

  return suppliers
    .map(supplier => {
      const supplierName = (supplier.name as string).toLowerCase();
      const similarity = calculateSimilarity(documentSupplier, supplierName);
      
      return {
        supplier_id: supplier.id,
        supplier_name: supplier.name,
        similarity_score: similarity,
        match_type: similarity > 0.8 ? 'exact' : similarity > 0.6 ? 'high' : similarity > 0.4 ? 'medium' : 'low',
        confidence: similarity > 0.8 ? 'high' : similarity > 0.6 ? 'medium' : 'low'
      };
    })
    .filter(match => match.similarity_score > 0.3)
    .sort((a, b) => b.similarity_score - a.similarity_score)
    .slice(0, 5);
}

function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

function calculateMatchConfidence(document: Record<string, unknown>, suggestions: Array<Record<string, unknown>>): number {
  if (suggestions.length === 0) return 0;
  
  const bestMatch = suggestions[0];
  const baseConfidence = bestMatch.similarity_score;
  
  // Boost confidence based on document type and supplier info
  let boost = 0;
  if (document.supplier_name && (document.supplier_name as string).trim()) boost += 0.2;
  if (document.amount) boost += 0.1;
  if (document.document_type === 'Contract' || document.document_type === 'Invoice') boost += 0.1;
  
  return Math.min(1.0, (baseConfidence as number) + boost);
}

function generateRenewalActions(contract: Record<string, unknown>, daysUntilRenewal: number): string[] {
  const actions = [];
  
  if (daysUntilRenewal <= 7) {
    actions.push('Immediate supplier contact required');
    actions.push('Prepare renewal negotiation strategy');
    actions.push('Review performance metrics');
  } else if (daysUntilRenewal <= 14) {
    actions.push('Schedule renewal meeting');
    actions.push('Analyze market conditions');
    actions.push('Prepare negotiation terms');
  } else {
    actions.push('Plan renewal strategy');
    actions.push('Review contract performance');
    actions.push('Assess market alternatives');
  }
  
  return actions;
}

function calculateApprovalPriority(document: Record<string, unknown>): string {
  const amount = (document.amount as number) || 0;
  const daysInQueue = Math.ceil(
    (new Date().getTime() - new Date(document.created_at as string).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  if (amount > 10000 || daysInQueue > 5) return 'high';
  if (amount > 5000 || daysInQueue > 3) return 'medium';
  return 'low';
}

function getRequiredApprovers(document: Record<string, unknown>): string[] {
  const amount = (document.amount as number) || 0;
  
  if (amount > 10000) return ['Manager', 'Director', 'Finance'];
  if (amount > 5000) return ['Manager', 'Finance'];
  return ['Manager'];
}

// Create workflow functions
async function createSupplierMatchingWorkflow(userId: string, data: Record<string, unknown>) {
  // Implementation for creating supplier matching workflow
  return { id: 'workflow_' + Date.now(), type: 'supplier_matching', status: 'created' };
}

async function createContractRenewalAlert(userId: string, data: Record<string, unknown>) {
  // Implementation for creating contract renewal alert
  return { id: 'alert_' + Date.now(), type: 'contract_renewal', status: 'created' };
}

async function createApprovalWorkflow(userId: string, data: Record<string, unknown>) {
  // Implementation for creating approval workflow
  return { id: 'approval_' + Date.now(), type: 'approval', status: 'created' };
}
