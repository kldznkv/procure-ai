import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, isAdminClientConfigured } from '../../../../lib/supabase-admin';
import { Webhook } from 'svix';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Check if admin client is configured
    if (!isAdminClientConfigured()) {
      console.error('❌ Clerk Webhook - Supabase admin client not configured');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const headerPayload = await headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.error('❌ Clerk Webhook - Missing svix headers');
      return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 });
    }

    // Get the body
    const payload = await request.json();
    const { type, data } = payload;

    console.log('🔔 Clerk Webhook - Received event:', type);

    // Handle user creation
    if (type === 'user.created') {
      const { id, email_addresses, first_name, last_name, created_at } = data;
      
      console.log('👤 Clerk Webhook - Creating user in Supabase:', {
        clerk_user_id: id,
        email: email_addresses?.[0]?.email_address,
        first_name,
        last_name
      });

      // Create user record in Supabase
      const { error: insertError } = await (getSupabaseAdmin() as any)
        .from('users')
        .insert([{
          clerk_user_id: id,
          email: email_addresses?.[0]?.email_address || null,
          first_name: first_name || null,
          last_name: last_name || null,
          created_at: new Date(created_at).toISOString(),
          status: 'active'
        }]);

      if (insertError) {
        console.error('❌ Clerk Webhook - Failed to create user in Supabase:', insertError);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
      }

      console.log('✅ Clerk Webhook - User created successfully in Supabase');
    }

    // Handle user updates
    if (type === 'user.updated') {
      const { id, email_addresses, first_name, last_name, updated_at } = data;
      
      console.log('👤 Clerk Webhook - Updating user in Supabase:', {
        clerk_user_id: id,
        email: email_addresses?.[0]?.email_address,
        first_name,
        last_name
      });

      // Update user record in Supabase
      const { error: updateError } = await (getSupabaseAdmin() as any)
        .from('users')
        .update({
          email: email_addresses?.[0]?.email_address || null,
          first_name: first_name || null,
          last_name: last_name || null,
          updated_at: new Date(updated_at).toISOString()
        })
        .eq('clerk_user_id', id);

      if (updateError) {
        console.error('❌ Clerk Webhook - Failed to update user in Supabase:', updateError);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
      }

      console.log('✅ Clerk Webhook - User updated successfully in Supabase');
    }

    // Handle user deletion
    if (type === 'user.deleted') {
      const { id } = data;
      
      console.log('👤 Clerk Webhook - Deleting user from Supabase:', { clerk_user_id: id });

      // Delete user record from Supabase
      const { error: deleteError } = await (getSupabaseAdmin() as any)
        .from('users')
        .delete()
        .eq('clerk_user_id', id);

      if (deleteError) {
        console.error('❌ Clerk Webhook - Failed to delete user from Supabase:', deleteError);
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
      }

      console.log('✅ Clerk Webhook - User deleted successfully from Supabase');
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Clerk Webhook - Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
