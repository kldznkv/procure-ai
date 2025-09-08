-- Add image document types to procurement_documents table
-- This migration adds support for image-based documents processed with OCR

-- First, drop the existing constraint
ALTER TABLE procurement_documents 
DROP CONSTRAINT IF EXISTS procurement_documents_document_type_check;

-- Add the new constraint with image document types
ALTER TABLE procurement_documents 
ADD CONSTRAINT procurement_documents_document_type_check 
CHECK (document_type IN (
    'PO', 
    'Invoice', 
    'Contract', 
    'Quote', 
    'Specification', 
    'Receipt', 
    'Image Document',  -- New: Generic image document
    'Image Invoice',   -- New: Image-based invoice
    'Image Receipt',   -- New: Image-based receipt
    'Image Quote',     -- New: Image-based quote
    'Other'
));

-- Add comment explaining the new types
COMMENT ON COLUMN procurement_documents.document_type IS 'Document type classification. Image Document types are processed using OCR technology.';
