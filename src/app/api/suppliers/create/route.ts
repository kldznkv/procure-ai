import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const { supplierName, userId } = await request.json();

    if (!supplierName || !userId) {
      return NextResponse.json(
        { error: 'Missing supplierName or userId' },
        { status: 400 }
      );
    }

    // Check if admin client is available
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase admin client not configured' },
        { status: 500 }
      );
    }

    console.log('🔍 API: Searching for existing supplier:', supplierName, 'for user:', userId);

    // First, try to find existing supplier - use admin client to bypass RLS
    const { data: existingSuppliers, error: searchError } = await supabaseAdmin
      .from('suppliers')
      .select('id, name')
      .eq('user_id', userId)
      .ilike('name', `%${supplierName}%`);

    if (searchError) {
      console.error('❌ API: Supplier search error:', searchError);
      return NextResponse.json(
        { error: 'Failed to search for existing supplier' },
        { status: 500 }
      );
    }

    console.log('🔍 API: Search results:', existingSuppliers);

    if (existingSuppliers && existingSuppliers.length > 0) {
      console.log('✅ API: Found existing supplier:', existingSuppliers[0].name, 'ID:', existingSuppliers[0].id);
      return NextResponse.json({
        success: true,
        supplierId: existingSuppliers[0].id,
        isNew: false,
        supplier: existingSuppliers[0]
      });
    }

    console.log('🆕 API: No existing supplier found, creating new one...');

    // Create new supplier if none found - use admin client to bypass RLS
    const { data: newSupplier, error: createError } = await supabaseAdmin
      .from('suppliers')
      .insert({
        user_id: userId,
        name: supplierName,
        status: 'active',
        performance_rating: 0,
        total_spend: 0
      })
      .select('id, name')
      .single();

    if (createError) {
      console.error('❌ API: Supplier creation error:', createError);
      return NextResponse.json(
        { error: 'Failed to create supplier' },
        { status: 500 }
      );
    }

    console.log('✅ API: New supplier created:', newSupplier.name, 'ID:', newSupplier.id);

    return NextResponse.json({
      success: true,
      supplierId: newSupplier.id,
      isNew: true,
      supplier: newSupplier
    });

  } catch (error) {
    console.error('❌ API: Supplier creation failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
