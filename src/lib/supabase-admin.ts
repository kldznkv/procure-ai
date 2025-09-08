import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy initialization of admin client
let adminClient: SupabaseClient | null = null;

// Get admin client (lazy initialization)
export const getSupabaseAdminClient = (): SupabaseClient => {
  if (!adminClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRole) {
      console.error('Supabase admin environment variables are not configured');
      throw new Error('Supabase admin environment variables are not configured. Please check your .env.local file.');
    }

    adminClient = createClient(supabaseUrl, supabaseServiceRole, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return adminClient;
};

// For backward compatibility - create a proxy that looks like a SupabaseClient
export const supabaseAdmin = new Proxy({} as any, {
  get(target, prop) {
    const client = getSupabaseAdminClient();
    return (client as any)[prop];
  }
}) as SupabaseClient;

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
