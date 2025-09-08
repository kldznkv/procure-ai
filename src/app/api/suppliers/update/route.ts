import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const { supplierId, updateData, userId } = await request.json();

    if (!supplierId || !updateData || !userId) {
      return NextResponse.json(
        { error: 'Missing supplierId, updateData, or userId' },
        { status: 400 }
      );
    }

    // Check if admin client is available
    if (!getSupabaseAdmin()) {
      return NextResponse.json(
        { error: 'Supabase admin client not configured' },
        { status: 500 }
      );
    }

    console.log('🔍 API: Updating supplier:', supplierId, 'with data:', updateData);

    // Update supplier with document information
    const { error: updateError } = await (getSupabaseAdmin() as any)
      .from('suppliers')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', supplierId)
      .eq('user_id', userId);

    if (updateError) {
      console.error('❌ API: Supplier update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update supplier' },
        { status: 500 }
      );
    }

    console.log('✅ API: Supplier updated successfully:', supplierId);

    return NextResponse.json({
      success: true,
      message: 'Supplier updated successfully'
    });

  } catch (error) {
    console.error('❌ API: Supplier update failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
