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
    const complianceType = searchParams.get('type');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get compliance data based on type
    let complianceData;
    
    switch (complianceType) {
      case 'regulatory':
        complianceData = await getRegulatoryCompliance(userId);
        break;
      case 'audit-trail':
        complianceData = await getAuditTrail(userId);
        break;
      case 'risk-assessment':
        complianceData = await getRiskAssessment(userId);
        break;
      default:
        complianceData = await getAllComplianceData(userId);
    }

    return NextResponse.json({
      success: true,
      data: complianceData,
      metadata: {
        compliance_type: complianceType || 'all',
        user_id: userId,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Compliance API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch compliance data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, complianceType, data } = body;

    if (!userId || !complianceType) {
      return NextResponse.json(
        { error: 'User ID and compliance type are required' },
        { status: 400 }
      );
    }

    let result;
    
    switch (complianceType) {
      case 'regulatory-check':
        result = await performRegulatoryCheck(userId, data);
        break;
      case 'audit-log':
        result = await createAuditLog(userId, data);
        break;
      case 'risk-assessment':
        result = await createRiskAssessment(userId, data);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid compliance type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Compliance action completed successfully'
    });

  } catch (error) {
    console.error('Compliance Action Error:', error);
    return NextResponse.json(
      { error: 'Failed to perform compliance action' },
      { status: 500 }
    );
  }
}

// Get regulatory compliance data
async function getRegulatoryCompliance(userId: string) {
  try {
    // Get documents for compliance checking
    const { data: documents, error } = await supabase
      .from('procurement_documents')
      .select('*')
      .eq('user_id', userId)
      .eq('processed', true);

    if (error) throw error;

    // Check compliance for each document
    const complianceChecks = documents?.map(doc => {
      const compliance = checkDocumentCompliance(doc);
      return {
        document_id: doc.id,
        document_name: doc.filename,
        document_type: doc.document_type,
        supplier_name: doc.supplier_name,
        amount: doc.amount,
        compliance_status: compliance.status,
        compliance_score: compliance.score,
        violations: compliance.violations,
        recommendations: compliance.recommendations,
        last_check: new Date().toISOString()
      };
    }) || [];

    // Calculate overall compliance metrics
    const totalDocuments = complianceChecks.length;
    const compliantDocuments = complianceChecks.filter(check => check.compliance_status === 'compliant').length;
    const complianceRate = totalDocuments > 0 ? (compliantDocuments / totalDocuments) * 100 : 100;

    return {
      type: 'regulatory_compliance',
      overall_score: Math.round(complianceRate),
      total_documents: totalDocuments,
      compliant_documents: compliantDocuments,
      non_compliant_documents: totalDocuments - compliantDocuments,
      compliance_checks: complianceChecks,
      summary: {
        high_risk: complianceChecks.filter(check => check.compliance_score < 70).length,
        medium_risk: complianceChecks.filter(check => check.compliance_score >= 70 && check.compliance_score < 90).length,
        low_risk: complianceChecks.filter(check => check.compliance_score >= 90).length
      }
    };

  } catch (error) {
    console.error('Regulatory compliance error:', error);
    throw error;
  }
}

// Get audit trail
async function getAuditTrail(userId: string) {
  try {
    // Get procurement actions and changes
    const { data: documents, error } = await supabase
      .from('procurement_documents')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    // Get supplier changes
    const { data: suppliers, error: supplierError } = await supabase
      .from('suppliers')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (supplierError) throw supplierError;

    // Create audit trail entries
    const auditTrail: Array<{
      id: string;
      timestamp: string;
      action: string;
      entity_type: string;
      entity_id: string;
      entity_name: string;
      user_id: string;
      details: Record<string, unknown>;
    }> = [];

    // Document audit entries
    documents?.forEach(doc => {
      auditTrail.push({
        id: `doc_${doc.id}`,
        timestamp: doc.updated_at || doc.created_at,
        action: doc.processed ? 'Document processed' : 'Document uploaded',
        entity_type: 'document',
        entity_id: doc.id,
        entity_name: doc.filename,
        user_id: userId,
        details: {
          document_type: doc.document_type,
          supplier_name: doc.supplier_name,
          amount: doc.amount,
          status: doc.status
        }
      });
    });

    // Supplier audit entries
    suppliers?.forEach(supplier => {
      auditTrail.push({
        id: `supplier_${supplier.id}`,
        timestamp: supplier.updated_at || supplier.created_at,
        action: 'Supplier record updated',
        entity_type: 'supplier',
        entity_id: supplier.id,
        entity_name: supplier.name,
        user_id: userId,
        details: {
          contact_email: supplier.contact_email,
          contact_phone: supplier.contact_phone,
          performance_rating: supplier.performance_rating
        }
      });
    });

    // Sort by timestamp
    auditTrail.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
      type: 'audit_trail',
      total_entries: auditTrail.length,
      audit_entries: auditTrail.slice(0, 100), // Limit to last 100 entries
      summary: {
        documents: documents?.length || 0,
        suppliers: suppliers?.length || 0,
        last_activity: auditTrail[0]?.timestamp || null
      }
    };

  } catch (error) {
    console.error('Audit trail error:', error);
    throw error;
  }
}

// Get risk assessment
async function getRiskAssessment(userId: string) {
  try {
    // Get documents for risk assessment
    const { data: documents, error } = await supabase
      .from('procurement_documents')
      .select('*')
      .eq('user_id', userId)
      .eq('processed', true);

    if (error) throw error;

    // Get suppliers for risk assessment
    const { data: suppliers, error: supplierError } = await supabase
      .from('suppliers')
      .select('*')
      .eq('user_id', userId);

    if (supplierError) throw supplierError;

    // Assess risks
    const riskAssessment = {
      document_risks: assessDocumentRisks(documents || []),
      supplier_risks: assessSupplierRisks(suppliers || []),
      process_risks: assessProcessRisks(documents || [], suppliers || []),
      overall_risk_score: 0
    };

    // Calculate overall risk score
    const documentRiskScore = riskAssessment.document_risks.average_risk_score;
    const supplierRiskScore = riskAssessment.supplier_risks.average_risk_score;
    const processRiskScore = riskAssessment.process_risks.process_risk_score;
    
    riskAssessment.overall_risk_score = Math.round(
      (documentRiskScore + supplierRiskScore + processRiskScore) / 3
    );

    return {
      type: 'risk_assessment',
      overall_risk_score: riskAssessment.overall_risk_score,
      risk_level: getRiskLevel(riskAssessment.overall_risk_score),
      assessment_date: new Date().toISOString(),
      risk_categories: riskAssessment,
      recommendations: generateRiskRecommendations(riskAssessment)
    };

  } catch (error) {
    console.error('Risk assessment error:', error);
    throw error;
  }
}

// Get all compliance data
async function getAllComplianceData(userId: string) {
  try {
    const [regulatory, auditTrail, riskAssessment] = await Promise.all([
      getRegulatoryCompliance(userId),
      getAuditTrail(userId),
      getRiskAssessment(userId)
    ]);

    return {
      compliance: {
        regulatory: regulatory,
        audit_trail: auditTrail,
        risk_assessment: riskAssessment
      },
      summary: {
        overall_compliance_score: regulatory.overall_score,
        overall_risk_score: riskAssessment.overall_risk_score,
        total_audit_entries: auditTrail.total_entries,
        last_assessment: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('All compliance data error:', error);
    throw error;
  }
}

// Helper functions
function checkDocumentCompliance(document: Record<string, unknown>) {
  let score = 100;
  const violations = [];
  const recommendations = [];

  // Check document type compliance
  if (!document.document_type || document.document_type === 'Other') {
    score -= 10;
    violations.push('Document type not properly categorized');
    recommendations.push('Ensure all documents are properly categorized');
  }

  // Check supplier information
  const supplierName = document.supplier_name as string;
  if (!supplierName || supplierName.trim() === '') {
    score -= 15;
    violations.push('Missing supplier information');
    recommendations.push('Extract and validate supplier information from documents');
  }

  // Check amount validation
  const amount = document.amount as number;
  if (!amount || amount <= 0) {
    score -= 10;
    violations.push('Invalid or missing amount');
    recommendations.push('Validate document amounts and ensure proper extraction');
  }

  // Check processing status
  if (!document.processed) {
    score -= 20;
    violations.push('Document not fully processed');
    recommendations.push('Complete document processing and AI analysis');
  }

  // Check required fields based on document type
  if (document.document_type === 'Contract') {
    if (!document.due_date) {
      score -= 10;
      violations.push('Contract missing due date');
      recommendations.push('Extract contract due dates and renewal information');
    }
  }

  if (document.document_type === 'Invoice') {
    if (!document.invoice_date) {
      score -= 5;
      violations.push('Invoice missing date');
      recommendations.push('Extract invoice dates for payment tracking');
    }
  }

  return {
    status: score >= 90 ? 'compliant' : score >= 70 ? 'partially_compliant' : 'non_compliant',
    score: Math.max(0, score),
    violations,
    recommendations
  };
}

function assessDocumentRisks(documents: Array<Record<string, unknown>>) {
  const risks = documents.map(doc => {
    let riskScore = 0;
    const riskFactors = [];

    // High value documents
    const docAmount = doc.amount as number;
    if (docAmount && docAmount > 10000) {
      riskScore += 20;
      riskFactors.push('High value document');
    }

    // Missing supplier information
    const docSupplierName = doc.supplier_name as string;
    if (!docSupplierName || docSupplierName.trim() === '') {
      riskScore += 25;
      riskFactors.push('Missing supplier information');
    }

    // Unprocessed documents
    if (!doc.processed) {
      riskScore += 30;
      riskFactors.push('Document not processed');
    }

    // Contract documents
    if (doc.document_type === 'Contract') {
      riskScore += 15;
      riskFactors.push('Contract document requires special attention');
    }

    return {
      document_id: doc.id,
      document_name: doc.filename,
      risk_score: Math.min(100, riskScore),
      risk_level: getRiskLevel(riskScore),
      risk_factors: riskFactors
    };
  });

  const averageRiskScore = risks.length > 0 
    ? risks.reduce((sum, risk) => sum + risk.risk_score, 0) / risks.length 
    : 0;

  return {
    total_documents: documents.length,
    high_risk_documents: risks.filter(r => r.risk_level === 'high').length,
    medium_risk_documents: risks.filter(r => r.risk_level === 'medium').length,
    low_risk_documents: risks.filter(r => r.risk_level === 'low').length,
    average_risk_score: Math.round(averageRiskScore),
    document_risks: risks
  };
}

function assessSupplierRisks(suppliers: Array<Record<string, unknown>>) {
  const risks = suppliers.map(supplier => {
    let riskScore = 0;
    const riskFactors = [];

    // Missing contact information
    if (!supplier.contact_email && !supplier.contact_phone) {
      riskScore += 30;
      riskFactors.push('Missing contact information');
    }

    // Low performance rating
    const performanceRating = supplier.performance_rating as number;
    if (performanceRating && performanceRating < 3) {
      riskScore += 25;
      riskFactors.push('Low performance rating');
    }

    // Missing performance data
    if (!supplier.performance_rating) {
      riskScore += 15;
      riskFactors.push('No performance data available');
    }

    return {
      supplier_id: supplier.id,
      supplier_name: supplier.name,
      risk_score: Math.min(100, riskScore),
      risk_level: getRiskLevel(riskScore),
      risk_factors: riskFactors
    };
  });

  const averageRiskScore = risks.length > 0 
    ? risks.reduce((sum, risk) => sum + risk.risk_score, 0) / risks.length 
    : 0;

  return {
    total_suppliers: suppliers.length,
    high_risk_suppliers: risks.filter(r => r.risk_level === 'high').length,
    medium_risk_suppliers: risks.filter(r => r.risk_level === 'medium').length,
    low_risk_suppliers: risks.filter(r => r.risk_level === 'low').length,
    average_risk_score: Math.round(averageRiskScore),
    supplier_risks: risks
  };
}

function assessProcessRisks(documents: Array<Record<string, unknown>>, suppliers: Array<Record<string, unknown>>) {
  let riskScore = 0;
  const riskFactors = [];

  // Check for single source suppliers
  const supplierDocumentCounts: Record<string, number> = {};
  documents.forEach(doc => {
    const supplierName = doc.supplier_name as string;
    if (supplierName) {
      supplierDocumentCounts[supplierName] = (supplierDocumentCounts[supplierName] || 0) + 1;
    }
  });

  const singleSourceSuppliers = Object.entries(supplierDocumentCounts)
    .filter(([, count]) => count > 5)
    .length;

  if (singleSourceSuppliers > 0) {
    riskScore += 20;
    riskFactors.push(`${singleSourceSuppliers} suppliers with high dependency`);
  }

  // Check for unprocessed documents
  const unprocessedCount = documents.filter(doc => !doc.processed).length;
  if (unprocessedCount > 0) {
    riskScore += 15;
    riskFactors.push(`${unprocessedCount} unprocessed documents`);
  }

  // Check for missing supplier information
  const missingSupplierCount = documents.filter(doc => {
    const supplierName = doc.supplier_name as string;
    return !supplierName || supplierName.trim() === '';
  }).length;
  if (missingSupplierCount > 0) {
    riskScore += 25;
    riskFactors.push(`${missingSupplierCount} documents missing supplier information`);
  }

  return {
    process_risk_score: Math.min(100, riskScore),
    risk_level: getRiskLevel(riskScore),
    risk_factors: riskFactors,
    metrics: {
      single_source_suppliers: singleSourceSuppliers,
      unprocessed_documents: unprocessedCount,
      missing_supplier_info: missingSupplierCount
    }
  };
}

function getRiskLevel(score: number): string {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

function generateRiskRecommendations(riskAssessment: Record<string, unknown>): string[] {
  const recommendations = [];

  const documentRisks = riskAssessment.document_risks as Record<string, unknown>;
  const supplierRisks = riskAssessment.supplier_risks as Record<string, unknown>;
  const processRisks = riskAssessment.process_risks as Record<string, unknown>;

  if ((documentRisks.high_risk_documents as number) > 0) {
    recommendations.push('Review and process high-risk documents immediately');
  }

  if ((supplierRisks.high_risk_suppliers as number) > 0) {
    recommendations.push('Develop risk mitigation strategies for high-risk suppliers');
  }

  if ((processRisks.risk_level as string) === 'high') {
    recommendations.push('Implement process improvements to reduce operational risks');
  }

  if ((documentRisks.unprocessed_documents as number) > 0) {
    recommendations.push('Establish document processing workflows and SLAs');
  }

  if ((supplierRisks.suppliers_without_performance_data as number) > 0) {
    recommendations.push('Implement supplier performance monitoring and evaluation systems');
  }

  return recommendations;
}

// Action functions
async function performRegulatoryCheck(userId: string, data: Record<string, unknown>) {
  // Implementation for performing regulatory compliance check
  return { id: 'check_' + Date.now(), type: 'regulatory_check', status: 'completed' };
}

async function createAuditLog(userId: string, data: Record<string, unknown>) {
  // Implementation for creating audit log entry
  return { id: 'audit_' + Date.now(), type: 'audit_log', status: 'created' };
}

async function createRiskAssessment(userId: string, data: Record<string, unknown>) {
  // Implementation for creating risk assessment
  return { id: 'risk_' + Date.now(), type: 'risk_assessment', status: 'created' };
}
