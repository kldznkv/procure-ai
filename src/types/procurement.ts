// PROCURETRACK - TypeScript Types for Procurement System
// These types match the database schema in database/procurement_schema.sql

// =====================================================
// CORE PROCUREMENT TYPES
// =====================================================

export interface Supplier {
  id: string;
  user_id: string;
  name: string;
  contact_email?: string;
  contact_phone?: string;
  contact_address?: string;
  tax_id?: string;
  website?: string;
  supplier_type?: 'manufacturer' | 'distributor' | 'service_provider' | 'consultant' | 'other';
  performance_rating: number; // 0.00 to 5.00
  total_spend: number;
  payment_terms?: string;
  credit_limit?: number;
  status: 'active' | 'inactive' | 'suspended';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ProcurementDocument {
  id: string;
  user_id: string;
  supplier_id?: string;
  filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  public_url?: string;
  
  // Document Classification
  document_type: 'PO' | 'Invoice' | 'Contract' | 'Quote' | 'Specification' | 'Receipt' | 'Other';
  
  // Procurement Metadata
  supplier_name?: string;
  amount?: number;
  currency: string;
  issue_date?: string;
  due_date?: string;
  delivery_date?: string;
  payment_terms?: string;
  
  // Document Status
  status: 'pending' | 'approved' | 'rejected' | 'paid' | 'overdue' | 'cancelled';
  
  // Processing Status
  processed: boolean;
  processing_error?: string;
  
  // Extracted Data
  extracted_text?: string;
  extracted_data?: ProcurementExtractedData;
  ai_analysis?: ProcurementAIAnalysis;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

export interface WorkflowAction {
  id: string;
  document_id: string;
  user_id: string;
  action_type: 'uploaded' | 'reviewed' | 'approved' | 'rejected' | 'ordered' | 'communicated' | 'paid' | 'followed_up' | 'escalated';
  action_date: string;
  notes?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface ProcurementCategory {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  parent_category_id?: string;
  color?: string; // Hex color
  created_at: string;
}

export interface DocumentCategory {
  document_id: string;
  category_id: string;
}

export interface PaymentRecord {
  id: string;
  document_id: string;
  supplier_id: string;
  user_id: string;
  
  payment_type: 'advance' | 'partial' | 'final' | 'refund' | 'adjustment';
  amount: number;
  currency: string;
  payment_date: string;
  payment_method?: string;
  reference_number?: string;
  notes?: string;
  
  created_at: string;
}

// =====================================================
// EXTRACTED DATA TYPES
// =====================================================

export interface ProcurementExtractedData {
  // Supplier Information
  supplier_name?: string;
  supplier_aliases?: string[];
  supplier_type?: 'manufacturer' | 'distributor' | 'service_provider' | 'consultant' | 'other';
  supplier_address?: string;
  supplier_phone?: string;
  supplier_email?: string;
  supplier_tax_id?: string;
  supplier_website?: string;
  supplier_confidence_score?: number;
  supplier_identification_notes?: string;
  
  // Financial Information
  amount?: number;
  currency?: string;
  tax_amount?: number;
  total_amount?: number;
  payment_terms?: string;
  credit_limit?: number;
  
  // Date Information
  issue_date?: string;
  due_date?: string;
  delivery_date?: string;
  contract_start_date?: string;
  contract_end_date?: string;
  
  // Document Information
  document_number?: string;
  po_number?: string;
  invoice_number?: string;
  contract_number?: string;
  reference_number?: string;
  
  // Product/Service Information
  line_items?: ProcurementLineItem[];
  total_quantity?: number;
  unit_price?: number;
  
  // Terms and Conditions
  payment_terms_days?: number;
  late_fee_percentage?: number;
  warranty_period?: string;
  delivery_terms?: string;
  
  // Additional Metadata
  notes?: string;
  special_instructions?: string;
  quality_standards?: string;
  compliance_requirements?: string;
}

export interface ProcurementLineItem {
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  sku?: string;
  category?: string;
}

// =====================================================
// AI ANALYSIS TYPES
// =====================================================

export interface ProcurementAIAnalysis {
  // Document Summary
  summary: string;
  key_points: string[];
  
  // Risk Assessment
  risk_level: 'low' | 'medium' | 'high';
  risk_factors: string[];
  recommendations: string[];
  
  // Compliance Check
  compliance_status: 'compliant' | 'non_compliant' | 'requires_review';
  compliance_issues: string[];
  compliance_notes: string;
  
  // Financial Analysis
  financial_impact: 'low' | 'medium' | 'high';
  cost_savings_opportunities: string[];
  budget_implications: string;
  
  // Supplier Analysis
  supplier_reliability: 'excellent' | 'good' | 'fair' | 'poor';
  supplier_notes: string;
  alternative_suppliers?: string[];
  
  // Action Items
  required_actions: string[];
  priority_level: 'low' | 'medium' | 'high' | 'urgent';
  deadlines?: string[];
  
  // Metadata
  analysis_timestamp: string;
  confidence_score: number; // 0.0 to 1.0
  model_version: string;
}

// =====================================================
// API REQUEST/RESPONSE TYPES
// =====================================================

export interface CreateSupplierRequest {
  name: string;
  contact_email?: string;
  contact_phone?: string;
  contact_address?: string;
  tax_id?: string;
  website?: string;
  payment_terms?: string;
  credit_limit?: number;
  notes?: string;
}

export interface UpdateSupplierRequest extends Partial<CreateSupplierRequest> {
  performance_rating?: number;
  status?: 'active' | 'inactive' | 'suspended';
}

export interface CreateDocumentRequest {
  filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  document_type: ProcurementDocument['document_type'];
  supplier_name?: string;
  amount?: number;
  currency?: string;
  issue_date?: string;
  due_date?: string;
  payment_terms?: string;
}

export interface UpdateDocumentRequest {
  supplier_name?: string;
  amount?: number;
  currency?: string;
  issue_date?: string;
  due_date?: string;
  delivery_date?: string;
  payment_terms?: string;
  status?: ProcurementDocument['status'];
  extracted_data?: ProcurementExtractedData;
  ai_analysis?: ProcurementAIAnalysis;
}

export interface CreateWorkflowActionRequest {
  document_id: string;
  action_type: WorkflowAction['action_type'];
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface CreatePaymentRecordRequest {
  document_id: string;
  supplier_id: string;
  payment_type: PaymentRecord['payment_type'];
  amount: number;
  currency: string;
  payment_date: string;
  payment_method?: string;
  reference_number?: string;
  notes?: string;
}

// =====================================================
// FILTER AND SEARCH TYPES
// =====================================================

export interface DocumentFilters {
  document_type?: ProcurementDocument['document_type'];
  status?: ProcurementDocument['status'];
  supplier_id?: string;
  amount_min?: number;
  amount_max?: number;
  date_from?: string;
  date_to?: string;
  processed?: boolean;
  category_id?: string;
}

export interface SupplierFilters {
  status?: Supplier['status'];
  performance_rating_min?: number;
  performance_rating_max?: number;
  total_spend_min?: number;
  total_spend_max?: number;
}

export interface SearchFilters {
  query: string;
  document_types?: ProcurementDocument['document_type'][];
  date_range?: {
    from: string;
    to: string;
  };
  amount_range?: {
    min: number;
    max: number;
  };
  suppliers?: string[];
  categories?: string[];
}

// =====================================================
// DASHBOARD AND ANALYTICS TYPES
// =====================================================

export interface ProcurementMetrics {
  total_documents: number;
  total_spend: number;
  active_suppliers: number;
  pending_approvals: number;
  overdue_documents: number;
  monthly_spend: number;
  documents_this_month: number;
  new_suppliers_this_month: number;
}

export interface SpendByCategory {
  category_name: string;
  total_spend: number;
  document_count: number;
  percentage_of_total: number;
}

export interface SpendBySupplier {
  supplier_name: string;
  total_spend: number;
  document_count: number;
  last_order_date: string;
  performance_rating: number;
}

export interface DocumentStatusBreakdown {
  status: ProcurementDocument['status'];
  count: number;
  total_amount: number;
  percentage: number;
}

export interface MonthlySpendTrend {
  month: string;
  total_spend: number;
  document_count: number;
  average_amount: number;
}

// =====================================================
// UTILITY TYPES
// =====================================================

export type DocumentType = ProcurementDocument['document_type'];
export type DocumentStatus = ProcurementDocument['status'];
export type SupplierStatus = Supplier['status'];
export type WorkflowActionType = WorkflowAction['action_type'];
export type PaymentType = PaymentRecord['payment_type'];

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// =====================================================
// ALL TYPES ARE ALREADY EXPORTED AS INTERFACES
// =====================================================
