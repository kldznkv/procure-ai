import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check if environment variables are available
const adminClientConfigured = !!(supabaseUrl && supabaseServiceRole);

// Create admin client only if environment variables are available
export const supabaseAdmin = adminClientConfigured 
  ? createClient(supabaseUrl, supabaseServiceRole, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Helper function to check if admin client is properly configured
export function isAdminClientConfigured(): boolean {
  return adminClientConfigured;
}

// Log admin client configuration status (for debugging)
if (process.env.NODE_ENV === 'development') {
  console.log('🔐 Supabase Admin Client Configuration:', {
    url: supabaseUrl ? '✅ Configured' : '❌ Missing',
    serviceRole: supabaseServiceRole ? '✅ Configured' : '❌ Missing',
    adminClientReady: adminClientConfigured
  });
}
