import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isAdminClientConfigured } from '../../../../lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    // Check if admin client is configured
    if (!isAdminClientConfigured()) {
      return NextResponse.json({ 
        success: false, 
        error: 'Supabase admin client not configured' 
      }, { status: 500 });
    }

    const body = await request.json();
    const { clerk_user_id, email, first_name, last_name } = body;

    if (!clerk_user_id) {
      return NextResponse.json({ 
        success: false, 
        error: 'clerk_user_id is required' 
      }, { status: 400 });
    }

    console.log('👤 Manual User Creation - Creating user:', {
      clerk_user_id,
      email,
      first_name,
      last_name
    });

    // Check if user already exists
    const { data: existingUser, error: checkError } = await (supabaseAdmin as any)
      .from('users')
      .select('id')
      .eq('clerk_user_id', clerk_user_id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('❌ Manual User Creation - Error checking existing user:', checkError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to check existing user' 
      }, { status: 500 });
    }

    if (existingUser) {
      console.log('👤 Manual User Creation - User already exists:', existingUser.id);
      return NextResponse.json({ 
        success: true, 
        message: 'User already exists',
        data: existingUser
      });
    }

    // Create user record in Supabase
    const { data: newUser, error: insertError } = await (supabaseAdmin as any)
      .from('users')
      .insert([{
        clerk_user_id,
        email: email || null,
        first_name: first_name || null,
        last_name: last_name || null,
        status: 'active'
      }])
      .select()
      .single();

    if (insertError) {
      console.error('❌ Manual User Creation - Failed to create user:', insertError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create user' 
      }, { status: 500 });
    }

    console.log('✅ Manual User Creation - User created successfully:', newUser);
    return NextResponse.json({ 
      success: true, 
      data: newUser,
      message: 'User created successfully'
    });

  } catch (error) {
    console.error('❌ Manual User Creation - Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
