import { getSupabaseAdmin, isAdminClientConfigured } from './supabase-admin';

export interface SupplierData {
  id?: string;
  name: string;
  contact_email?: string;
  contact_phone?: string;
  contact_address?: string;
  tax_id?: string;
  website?: string;
  supplier_type?: string;
  performance_rating?: number;
  total_spend?: number;
  payment_terms?: string;
  credit_limit?: number;
  status?: string;
  notes?: string;
}

export interface SupplierLookupResult {
  supplier: SupplierData | null;
  created: boolean;
  message: string;
}

/**
 * Find or create a supplier based on extracted supplier name
 */
export async function findOrCreateSupplier(
  userId: string, 
  supplierName: string, 
  additionalData?: Partial<SupplierData>
): Promise<SupplierLookupResult> {
  try {
    if (!isAdminClientConfigured()) {
      throw new Error('Supabase admin client not configured');
    }

    if (!supplierName || supplierName.trim().length === 0) {
      return {
        supplier: null,
        created: false,
        message: 'No supplier name provided'
      };
    }

    console.log('🔍 Supplier Manager - Looking up supplier:', supplierName);

    // First, try to find existing supplier by name (case-insensitive)
    const { data: existingSuppliers, error: lookupError } = await getSupabaseAdmin()!
      .from('suppliers')
      .select('*')
      .eq('user_id', userId)
      .ilike('name', supplierName.trim())
      .limit(1);

    if (lookupError) {
      console.error('❌ Supplier Manager - Lookup error:', lookupError);
      throw lookupError;
    }

    // If supplier exists, return it
    if (existingSuppliers && existingSuppliers.length > 0) {
      const supplier = existingSuppliers[0];
      console.log('✅ Supplier Manager - Found existing supplier:', supplier.name);
      
      // Update total spend if we have amount data
      if (additionalData?.total_spend && additionalData.total_spend > 0) {
        const newTotalSpend = (supplier.total_spend || 0) + additionalData.total_spend;
        await updateSupplierTotalSpend(supplier.id, newTotalSpend);
        supplier.total_spend = newTotalSpend;
      }

      return {
        supplier,
        created: false,
        message: `Found existing supplier: ${supplier.name}`
      };
    }

    // Supplier doesn't exist, create new one
    console.log('🆕 Supplier Manager - Creating new supplier:', supplierName);

    const newSupplierData: SupplierData = {
      name: supplierName.trim(),
      contact_email: additionalData?.contact_email || undefined,
      contact_phone: additionalData?.contact_phone || undefined,
      contact_address: additionalData?.contact_address || undefined,
      tax_id: additionalData?.tax_id || undefined,
      website: additionalData?.website || undefined,
      performance_rating: additionalData?.performance_rating || 3.0,
      total_spend: additionalData?.total_spend || 0.0,
      payment_terms: additionalData?.payment_terms || undefined,
      credit_limit: additionalData?.credit_limit || undefined,
      status: 'active',
      notes: additionalData?.notes || `Auto-created from document processing on ${new Date().toISOString()}`
    };

    const { data: newSupplier, error: createError } = await getSupabaseAdmin()!
      .from('suppliers')
      .insert([{
        user_id: userId,
        name: newSupplierData.name,
        contact_email: newSupplierData.contact_email,
        contact_phone: newSupplierData.contact_phone,
        contact_address: newSupplierData.contact_address,
        tax_id: newSupplierData.tax_id,
        website: newSupplierData.website,
        performance_rating: newSupplierData.performance_rating,
        total_spend: newSupplierData.total_spend,
        payment_terms: newSupplierData.payment_terms,
        credit_limit: newSupplierData.credit_limit,
        status: newSupplierData.status,
        notes: newSupplierData.notes
      }])
      .select()
      .single();

    if (createError) {
      console.error('❌ Supplier Manager - Create error:', createError);
      console.error('❌ Supplier Manager - Error details:', {
        code: createError.code,
        message: createError.message,
        details: createError.details,
        hint: createError.hint
      });
      throw createError;
    }

    console.log('✅ Supplier Manager - Created new supplier:', newSupplier.name);
    
    return {
      supplier: newSupplier,
      created: true,
      message: `Created new supplier: ${newSupplier.name}`
    };

  } catch (error) {
    console.error('❌ Supplier Manager - Error:', error);
    console.error('❌ Supplier Manager - Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    throw new Error(`Supplier management failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Update supplier total spend
 */
async function updateSupplierTotalSpend(supplierId: string, newTotalSpend: number): Promise<void> {
  try {
    const { error } = await getSupabaseAdmin()!
      .from('suppliers')
      .update({ 
        total_spend: newTotalSpend,
        updated_at: new Date().toISOString()
      })
      .eq('id', supplierId);

    if (error) {
      console.error('❌ Supplier Manager - Update total spend error:', error);
      throw error;
    }

    console.log('✅ Supplier Manager - Updated total spend for supplier:', supplierId, 'to', newTotalSpend);
  } catch (error) {
    console.error('❌ Supplier Manager - Error updating total spend:', error);
    // Don't throw here, as this is not critical for the main flow
  }
}

/**
 * Find suppliers by partial name match
 */
export async function findSuppliersByName(
  userId: string, 
  searchTerm: string, 
  limit: number = 10
): Promise<SupplierData[]> {
  try {
    if (!isAdminClientConfigured()) {
      throw new Error('Supabase admin client not configured');
    }

    if (!searchTerm || searchTerm.trim().length === 0) {
      return [];
    }

    const { data: suppliers, error } = await getSupabaseAdmin()!
      .from('suppliers')
      .select('*')
      .eq('user_id', userId)
      .ilike('name', `%${searchTerm.trim()}%`)
      .order('name', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('❌ Supplier Manager - Search error:', error);
      throw error;
    }

    return suppliers || [];
  } catch (error) {
    console.error('❌ Supplier Manager - Search error:', error);
    return [];
  }
}

/**
 * Get supplier by ID
 */
export async function getSupplierById(supplierId: string): Promise<SupplierData | null> {
  try {
    if (!isAdminClientConfigured()) {
      throw new Error('Supabase admin client not configured');
    }

    const { data: supplier, error } = await getSupabaseAdmin()!
      .from('suppliers')
      .select('*')
      .eq('id', supplierId)
      .single();

    if (error) {
      console.error('❌ Supplier Manager - Get by ID error:', error);
      return null;
    }

    return supplier;
  } catch (error) {
    console.error('❌ Supplier Manager - Get by ID error:', error);
    return null;
  }
}

/**
 * Extract supplier data from document extracted data
 */
export function extractSupplierDataFromDocument(extractedData: any): Partial<SupplierData> {
  const supplierData: Partial<SupplierData> = {};

  if (extractedData.supplier_name) {
    supplierData.name = extractedData.supplier_name;
  }

  if (extractedData.amount) {
    supplierData.total_spend = parseFloat(extractedData.amount) || 0;
  }

  if (extractedData.payment_terms) {
    supplierData.payment_terms = extractedData.payment_terms;
  }

  // You can add more extraction logic here based on your document structure
  // For example, if you have supplier contact information in the extracted data

  return supplierData;
}
