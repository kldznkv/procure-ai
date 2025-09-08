// Database constraint validation utilities
// This file ensures consistency with database schema constraints

// Valid status values for procurement_documents table
export const VALID_DOCUMENT_STATUSES = [
  'pending',
  'approved', 
  'rejected',
  'paid',
  'overdue',
  'cancelled'
] as const;

// Valid document types for procurement_documents table
export const VALID_DOCUMENT_TYPES = [
  'PO',
  'Invoice', 
  'Contract',
  'Quote',
  'Specification',
  'Receipt',
  'Image Document',  // Generic image document processed with OCR
  'Image Invoice',   // Image-based invoice processed with OCR
  'Image Receipt',   // Image-based receipt processed with OCR
  'Image Quote',     // Image-based quote processed with OCR
  'Other'
] as const;

// Valid supplier types for suppliers table
export const VALID_SUPPLIER_TYPES = [
  'manufacturer',
  'distributor',
  'service_provider',
  'consultant',
  'other'
] as const;

// Valid workflow action types
export const VALID_WORKFLOW_ACTIONS = [
  'uploaded',
  'reviewed',
  'approved',
  'rejected',
  'ordered',
  'communicated',
  'paid',
  'followed_up',
  'escalated'
] as const;

// Valid payment types
export const VALID_PAYMENT_TYPES = [
  'advance',
  'partial',
  'final',
  'refund',
  'adjustment'
] as const;

// Type definitions for better type safety
export type DocumentStatus = typeof VALID_DOCUMENT_STATUSES[number];
export type DocumentType = typeof VALID_DOCUMENT_TYPES[number];
export type SupplierType = typeof VALID_SUPPLIER_TYPES[number];
export type WorkflowAction = typeof VALID_WORKFLOW_ACTIONS[number];
export type PaymentType = typeof VALID_PAYMENT_TYPES[number];

// Validation functions
export function isValidDocumentStatus(status: string): status is DocumentStatus {
  return VALID_DOCUMENT_STATUSES.includes(status as DocumentStatus);
}

export function isValidDocumentType(type: string): type is DocumentType {
  return VALID_DOCUMENT_TYPES.includes(type as DocumentType);
}

export function isValidSupplierType(type: string): type is SupplierType {
  return VALID_SUPPLIER_TYPES.includes(type as SupplierType);
}

export function isValidWorkflowAction(action: string): action is WorkflowAction {
  return VALID_WORKFLOW_ACTIONS.includes(action as WorkflowAction);
}

export function isValidPaymentType(type: string): type is PaymentType {
  return VALID_PAYMENT_TYPES.includes(type as PaymentType);
}

// Error messages for constraint violations
export const CONSTRAINT_ERROR_MESSAGES = {
  document_status: `Invalid document status. Allowed values: ${VALID_DOCUMENT_STATUSES.join(', ')}`,
  document_type: `Invalid document type. Allowed values: ${VALID_DOCUMENT_TYPES.join(', ')}`,
  supplier_type: `Invalid supplier type. Allowed values: ${VALID_SUPPLIER_TYPES.join(', ')}`,
  workflow_action: `Invalid workflow action. Allowed values: ${VALID_WORKFLOW_ACTIONS.join(', ')}`,
  payment_type: `Invalid payment type. Allowed values: ${VALID_PAYMENT_TYPES.join(', ')}`
} as const;

// Database error code constants
export const DATABASE_ERROR_CODES = {
  CHECK_CONSTRAINT_VIOLATION: '23514',
  UNIQUE_CONSTRAINT_VIOLATION: '23505',
  FOREIGN_KEY_CONSTRAINT_VIOLATION: '23503',
  NOT_NULL_VIOLATION: '23502'
} as const;

// Function to handle database constraint violations
export function handleDatabaseConstraintError(error: any): Error {
  if (!error.code) {
    return new Error(`Database error: ${error.message || 'Unknown error'}`);
  }

  switch (error.code) {
    case DATABASE_ERROR_CODES.CHECK_CONSTRAINT_VIOLATION:
      const constraintName = error.constraint || 'unknown_constraint';
      
      if (constraintName.includes('status_check')) {
        return new Error(CONSTRAINT_ERROR_MESSAGES.document_status);
      } else if (constraintName.includes('document_type')) {
        return new Error(CONSTRAINT_ERROR_MESSAGES.document_type);
      } else if (constraintName.includes('supplier_type')) {
        return new Error(CONSTRAINT_ERROR_MESSAGES.supplier_type);
      } else if (constraintName.includes('action_type')) {
        return new Error(CONSTRAINT_ERROR_MESSAGES.workflow_action);
      } else if (constraintName.includes('payment_type')) {
        return new Error(CONSTRAINT_ERROR_MESSAGES.payment_type);
      } else {
        return new Error(`Database constraint violation: ${error.message}`);
      }

    case DATABASE_ERROR_CODES.UNIQUE_CONSTRAINT_VIOLATION:
      return new Error(`Duplicate entry: ${error.message}`);

    case DATABASE_ERROR_CODES.FOREIGN_KEY_CONSTRAINT_VIOLATION:
      return new Error(`Referenced record not found: ${error.message}`);

    case DATABASE_ERROR_CODES.NOT_NULL_VIOLATION:
      return new Error(`Required field missing: ${error.message}`);

    default:
      return new Error(`Database error (${error.code}): ${error.message}`);
  }
}

// Function to validate document data before database operations
export function validateDocumentData(data: {
  status?: string;
  document_type?: string;
  supplier_type?: string;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (data.status && !isValidDocumentStatus(data.status)) {
    errors.push(CONSTRAINT_ERROR_MESSAGES.document_status);
  }

  if (data.document_type && !isValidDocumentType(data.document_type)) {
    errors.push(CONSTRAINT_ERROR_MESSAGES.document_type);
  }

  if (data.supplier_type && !isValidSupplierType(data.supplier_type)) {
    errors.push(CONSTRAINT_ERROR_MESSAGES.supplier_type);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Function to get the default status for new documents
export function getDefaultDocumentStatus(): DocumentStatus {
  return 'pending';
}

// Function to get the default document type
export function getDefaultDocumentType(): DocumentType {
  return 'Other';
}

// Function to get the default supplier type
export function getDefaultSupplierType(): SupplierType {
  return 'other';
}
