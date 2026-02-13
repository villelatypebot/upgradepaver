import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Standard client for public operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for server-side write operations (don't use in client-side code!)
export const supabaseAdmin = (() => {
    if (!supabaseServiceRoleKey) {
        console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY is missing. Falling back to anon client. Write operations may fail due to RLS.');
        return supabase;
    }
    return createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
})();
