import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseAdmin: SupabaseClient | null = null;

export const getSupabaseAdmin = (): SupabaseClient => {
  if (!supabaseAdmin) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  
  return supabaseAdmin;
};

// Helper function to check if admin client is properly configured
export function isAdminClientConfigured(): boolean {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return !!(supabaseUrl && supabaseServiceRole);
}

// Log admin client configuration status (for debugging)
if (process.env.NODE_ENV === 'development') {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  console.log('🔐 Supabase Admin Client Configuration:', {
    url: supabaseUrl ? '✅ Configured' : '❌ Missing',
    serviceRole: supabaseServiceRole ? '✅ Configured' : '❌ Missing',
    adminClientReady: isAdminClientConfigured()
  });
}
