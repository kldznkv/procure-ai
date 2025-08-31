-- PROCURETRACK - Procurement Database Schema
-- Run this in your Supabase SQL editor to set up the procurement system

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS TABLE (Clerk Integration)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_user_id TEXT UNIQUE NOT NULL, -- Clerk user ID
    email VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on clerk_user_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_clerk_user_id ON users(clerk_user_id);

-- =====================================================
-- SUPPLIERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL, -- Clerk user ID
    name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    contact_address TEXT,
    tax_id VARCHAR(100),
    website VARCHAR(255),
    supplier_type VARCHAR(50) CHECK (supplier_type IN ('manufacturer', 'distributor', 'service_provider', 'consultant', 'other')),
    performance_rating DECIMAL(3,2) DEFAULT 0.00, -- 0.00 to 5.00
    total_spend DECIMAL(15,2) DEFAULT 0.00,
    payment_terms VARCHAR(100),
    credit_limit DECIMAL(15,2),
    status VARCHAR(50) DEFAULT 'active', -- active, inactive, suspended
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PROCUREMENT DOCUMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS procurement_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL, -- Clerk user ID
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL, -- Supabase Storage path
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    public_url TEXT,
    
    -- Document Classification
    document_type VARCHAR(50) NOT NULL CHECK (
        document_type IN ('PO', 'Invoice', 'Contract', 'Quote', 'Specification', 'Receipt', 'Other')
    ),
    
    -- Procurement Metadata
    supplier_name VARCHAR(255), -- Extracted or manually entered
    amount DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'USD',
    issue_date DATE,
    due_date DATE,
    delivery_date DATE,
    payment_terms VARCHAR(100),
    
    -- Document Status
    status VARCHAR(50) DEFAULT 'pending' CHECK (
        status IN ('pending', 'approved', 'rejected', 'paid', 'overdue', 'cancelled')
    ),
    
    -- Processing Status
    processed BOOLEAN DEFAULT FALSE,
    processing_error TEXT,
    
    -- Extracted Data
    extracted_text TEXT, -- Full text content
    extracted_data JSONB, -- Structured procurement data
    ai_analysis JSONB, -- Claude AI analysis results
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- WORKFLOW ACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS workflow_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES procurement_documents(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL, -- Clerk user ID
    action_type VARCHAR(50) NOT NULL CHECK (
        action_type IN ('uploaded', 'reviewed', 'approved', 'rejected', 'ordered', 'communicated', 'paid', 'followed_up', 'escalated')
    ),
    action_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    metadata JSONB, -- Additional action-specific data
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PROCUREMENT CATEGORIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS procurement_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL, -- Clerk user ID
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_category_id UUID REFERENCES procurement_categories(id),
    color VARCHAR(7), -- Hex color for UI
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- DOCUMENT CATEGORIES (Many-to-Many)
-- =====================================================
CREATE TABLE IF NOT EXISTS document_categories (
    document_id UUID REFERENCES procurement_documents(id) ON DELETE CASCADE,
    category_id UUID REFERENCES procurement_categories(id) ON DELETE CASCADE,
    PRIMARY KEY (document_id, category_id)
);

-- =====================================================
-- PAYMENT RECORDS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS payment_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES procurement_documents(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL, -- Clerk user ID
    
    payment_type VARCHAR(50) CHECK (
        payment_type IN ('advance', 'partial', 'final', 'refund', 'adjustment')
    ),
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_date DATE NOT NULL,
    payment_method VARCHAR(100),
    reference_number VARCHAR(100),
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Suppliers indexes
CREATE INDEX IF NOT EXISTS idx_suppliers_user_id ON suppliers(user_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status);
CREATE INDEX IF NOT EXISTS idx_suppliers_performance ON suppliers(performance_rating);

-- Documents indexes
CREATE INDEX IF NOT EXISTS idx_procurement_documents_user_id ON procurement_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_procurement_documents_supplier_id ON procurement_documents(supplier_id);
CREATE INDEX IF NOT EXISTS idx_procurement_documents_type ON procurement_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_procurement_documents_status ON procurement_documents(status);
CREATE INDEX IF NOT EXISTS idx_procurement_documents_processed ON procurement_documents(processed);
CREATE INDEX IF NOT EXISTS idx_procurement_documents_due_date ON procurement_documents(due_date);
CREATE INDEX IF NOT EXISTS idx_procurement_documents_amount ON procurement_documents(amount);
CREATE INDEX IF NOT EXISTS idx_procurement_documents_created_at ON procurement_documents(created_at);

-- Full-text search index for extracted text
CREATE INDEX IF NOT EXISTS idx_procurement_documents_text_search 
ON procurement_documents USING GIN (to_tsvector('english', extracted_text));

-- Workflow indexes
CREATE INDEX IF NOT EXISTS idx_workflow_actions_document_id ON workflow_actions(document_id);
CREATE INDEX IF NOT EXISTS idx_workflow_actions_user_id ON workflow_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_actions_type ON workflow_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_workflow_actions_date ON workflow_actions(action_date);

-- Payment indexes
CREATE INDEX IF NOT EXISTS idx_payment_records_document_id ON payment_records(document_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_supplier_id ON payment_records(supplier_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_date ON payment_records(payment_date);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;

-- Suppliers RLS policies
CREATE POLICY "Users can view own suppliers" ON suppliers
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own suppliers" ON suppliers
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own suppliers" ON suppliers
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own suppliers" ON suppliers
    FOR DELETE USING (auth.uid()::text = user_id);

-- Documents RLS policies
CREATE POLICY "Users can view own documents" ON procurement_documents
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own documents" ON procurement_documents
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own documents" ON procurement_documents
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own documents" ON procurement_documents
    FOR DELETE USING (auth.uid()::text = user_id);

-- Workflow actions RLS policies
CREATE POLICY "Users can view own workflow actions" ON workflow_actions
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own workflow actions" ON workflow_actions
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own workflow actions" ON workflow_actions
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own workflow actions" ON workflow_actions
    FOR DELETE USING (auth.uid()::text = user_id);

-- Categories RLS policies
CREATE POLICY "Users can view own categories" ON procurement_categories
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own categories" ON procurement_categories
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own categories" ON procurement_categories
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own categories" ON procurement_categories
    FOR DELETE USING (auth.uid()::text = user_id);

-- Document categories RLS policies
CREATE POLICY "Users can view own document categories" ON document_categories
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM procurement_documents 
            WHERE id = document_categories.document_id 
            AND user_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can insert own document categories" ON document_categories
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM procurement_documents 
            WHERE id = document_categories.document_id 
            AND user_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can delete own document categories" ON document_categories
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM procurement_documents 
            WHERE id = document_categories.document_id 
            AND user_id = auth.uid()::text
        )
    );

-- Payment records RLS policies
CREATE POLICY "Users can view own payment records" ON payment_records
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own payment records" ON payment_records
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own payment records" ON payment_records
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own payment records" ON payment_records
    FOR DELETE USING (auth.uid()::text = user_id);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at columns
CREATE TRIGGER update_suppliers_updated_at 
    BEFORE UPDATE ON suppliers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_procurement_documents_updated_at 
    BEFORE UPDATE ON procurement_documents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to calculate total spend for a supplier
CREATE OR REPLACE FUNCTION calculate_supplier_total_spend(supplier_uuid UUID)
RETURNS DECIMAL(15,2) AS $$
BEGIN
    RETURN COALESCE((
        SELECT SUM(amount) 
        FROM procurement_documents 
        WHERE supplier_id = supplier_uuid 
        AND status IN ('approved', 'paid')
    ), 0.00);
END;
$$ LANGUAGE plpgsql;

-- Function to get overdue documents count
CREATE OR REPLACE FUNCTION get_overdue_documents_count(user_uuid TEXT)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*) 
        FROM procurement_documents 
        WHERE user_id = user_uuid 
        AND due_date < CURRENT_DATE 
        AND status NOT IN ('paid', 'cancelled')
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Insert sample procurement categories
INSERT INTO procurement_categories (user_id, name, description, color) VALUES
('sample_user', 'Raw Materials', 'Basic materials for production', '#3B82F6'),
('sample_user', 'Equipment', 'Machinery and tools', '#10B981'),
('sample_user', 'Services', 'Professional services and consulting', '#F59E0B'),
('sample_user', 'Office Supplies', 'General office materials', '#8B5CF6'),
('sample_user', 'Transportation', 'Shipping and logistics', '#EF4444')
ON CONFLICT DO NOTHING;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE suppliers IS 'Stores supplier information and performance metrics';
COMMENT ON TABLE procurement_documents IS 'Core table for all procurement documents with extracted data';
COMMENT ON TABLE workflow_actions IS 'Tracks all actions taken on procurement documents';
COMMENT ON TABLE procurement_categories IS 'Organizes documents into logical categories';
COMMENT ON TABLE payment_records IS 'Tracks payment history and financial transactions';

COMMENT ON COLUMN suppliers.performance_rating IS 'Supplier rating from 0.00 to 5.00 based on performance';
COMMENT ON COLUMN suppliers.total_spend IS 'Total amount spent with this supplier';
COMMENT ON COLUMN procurement_documents.extracted_data IS 'Structured data extracted by AI (supplier, amounts, dates, etc.)';
COMMENT ON COLUMN procurement_documents.ai_analysis IS 'Claude AI analysis results and insights';
COMMENT ON COLUMN workflow_actions.metadata IS 'Additional action-specific data in JSON format';

-- =====================================================
-- SCHEMA COMPLETE
-- =====================================================

-- This schema provides a complete foundation for:
-- 1. Supplier management with performance tracking
-- 2. Document processing with AI extraction
-- 3. Workflow tracking for procurement processes
-- 4. Category organization for documents
-- 5. Payment tracking and financial records
-- 6. Full-text search capabilities
-- 7. Secure multi-tenant architecture
-- 8. Performance optimization with proper indexing

-- Next steps:
-- 1. Run this schema in Supabase SQL editor
-- 2. Update environment variables if needed
-- 3. Test with sample data
-- 4. Build procurement document processor
