// lib/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Helper to determine if we are running in full mock mode
export const isSupabaseConfigured = () => {
  return (
    supabaseUrl &&
    supabaseUrl !== '' &&
    !supabaseUrl.includes('placeholder') &&
    !supabaseUrl.includes('your-supabase-project') &&
    supabaseAnonKey &&
    supabaseAnonKey !== '' &&
    !supabaseAnonKey.includes('placeholder')
  );
};

// Client-safe standard Supabase client
export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Secure Admin-level Supabase client (only to be used in server-side API routes)
export const supabaseAdmin = isSupabaseConfigured() && supabaseServiceKey && !supabaseServiceKey.includes('placeholder')
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

if (!isSupabaseConfigured()) {
  console.warn(
    '⚠️ Supabase is not fully configured. The application is running in MOCK mode. Balance and tasks will be stored in client-side state / localStorage.'
  );
}
