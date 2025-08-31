# 🗄️ PROCURETRACK Database Setup

This directory contains the database schema and setup instructions for the ProcureTrack procurement intelligence platform.

## 📋 What's Included

- **`procurement_schema.sql`** - Complete database schema with all tables, indexes, and security policies
- **`README.md`** - This setup guide

## 🚀 Quick Setup

### 1. Access Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**

### 2. Run the Schema

1. Copy the entire contents of `procurement_schema.sql`
2. Paste it into the SQL Editor
3. Click **Run** to execute the schema

### 3. Verify Setup

After running the schema, you should see:
- ✅ All tables created successfully
- ✅ Indexes created for performance
- ✅ Row Level Security (RLS) enabled
- ✅ Security policies applied
- ✅ Helper functions created

## 🏗️ Database Structure

### **Core Tables**

| Table | Purpose | Key Features |
|-------|---------|--------------|
| **`suppliers`** | Supplier management | Performance tracking, spend analytics |
| **`procurement_documents`** | Document storage | AI extraction, status tracking |
| **`workflow_actions`** | Process tracking | Action history, audit trail |
| **`procurement_categories`** | Organization | Hierarchical categories, colors |
| **`payment_records`** | Financial tracking | Payment history, reconciliation |

### **Key Features**

- 🔒 **Multi-tenant security** - Users only see their own data
- 🔍 **Full-text search** - Search across document content
- 📊 **Performance indexes** - Fast queries and filtering
- 🎯 **AI-ready structure** - Optimized for Claude integration
- 📈 **Analytics support** - Built-in metrics and reporting

## 🔐 Security Features

### **Row Level Security (RLS)**
- All tables have RLS enabled
- Users can only access their own data
- Secure by default

### **Security Policies**
- **SELECT**: Users can view their own records
- **INSERT**: Users can create records for themselves
- **UPDATE**: Users can modify their own records
- **DELETE**: Users can delete their own records

## 📊 Performance Optimizations

### **Indexes Created**
- User ID lookups (fast user data retrieval)
- Document type and status (efficient filtering)
- Amount ranges (financial queries)
- Date ranges (temporal queries)
- Full-text search (content queries)

### **Helper Functions**
- `calculate_supplier_total_spend()` - Supplier spend calculations
- `get_overdue_documents_count()` - Overdue document tracking

## 🧪 Testing the Setup

### **1. Check Tables Exist**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%procurement%';
```

### **2. Verify RLS Policies**
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename LIKE '%procurement%';
```

### **3. Test Sample Data**
The schema includes sample procurement categories for testing.

## 🔧 Customization Options

### **Adding New Document Types**
```sql
ALTER TABLE procurement_documents 
DROP CONSTRAINT IF EXISTS procurement_documents_document_type_check;

ALTER TABLE procurement_documents 
ADD CONSTRAINT procurement_documents_document_type_check 
CHECK (document_type IN ('PO', 'Invoice', 'Contract', 'Quote', 'Specification', 'Receipt', 'Other', 'YourNewType'));
```

### **Adding New Workflow Actions**
```sql
ALTER TABLE workflow_actions 
DROP CONSTRAINT IF EXISTS workflow_actions_action_type_check;

ALTER TABLE workflow_actions 
ADD CONSTRAINT workflow_actions_action_type_check 
CHECK (action_type IN ('uploaded', 'reviewed', 'approved', 'rejected', 'ordered', 'communicated', 'paid', 'followed_up', 'escalated', 'YourNewAction'));
```

## 🚨 Troubleshooting

### **Common Issues**

1. **Permission Denied**
   - Ensure you're running as a database owner
   - Check if RLS policies are properly applied

2. **Extension Not Found**
   - The `uuid-ossp` extension should be available by default
   - Contact Supabase support if issues persist

3. **Constraint Violations**
   - Check that sample data doesn't conflict with existing data
   - Remove any conflicting data before running schema

### **Reset Database (Development Only)**
```sql
-- WARNING: This will delete all data!
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

## 📚 Next Steps

After setting up the database:

1. **Update Environment Variables** - Ensure Supabase connection is configured
2. **Test API Routes** - Verify database connectivity
3. **Build Document Processor** - Create procurement-specific extraction
4. **Implement Dashboard** - Connect UI to database

## 🔗 Related Files

- **`src/types/procurement.ts`** - TypeScript types matching this schema
- **`src/app/dashboard/page.tsx`** - Dashboard using these types
- **API routes** - Will be built to interact with this database

## 📞 Support

If you encounter issues:
1. Check the Supabase logs for detailed error messages
2. Verify all SQL statements executed successfully
3. Ensure your Supabase project has the necessary permissions

---

**🎉 Database setup complete!** Your ProcureTrack system now has a solid foundation for procurement intelligence.
