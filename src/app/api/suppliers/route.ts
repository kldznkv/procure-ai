import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// GET /api/suppliers - List all suppliers for user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'user_id parameter is required' 
      }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('suppliers')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// POST /api/suppliers - Create/update supplier
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      user_id, 
      name, 
      contact_email, 
      contact_phone, 
      contact_address, 
      tax_id, 
      website, 
      // supplier_type, // Temporarily commented out until database schema is updated
      performance_rating,
      total_spend,
      payment_terms, 
      credit_limit, 
      notes 
    } = body;

    if (!user_id || !name) {
      return NextResponse.json({ 
        success: false, 
        error: 'user_id and name are required' 
      }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('suppliers')
      .insert([{
        user_id,
        name,
        contact_email,
        contact_phone,
        contact_address,
        tax_id,
        website,
        // supplier_type, // Temporarily commented out until database schema is updated
        performance_rating: performance_rating || 3.0,
        total_spend: total_spend || 0.0,
        payment_terms,
        credit_limit,
        notes
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
