import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Exporting the client instance directly
export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);

// Helper function to maintain compatibility with app/login/page.tsx
export function createClient() {
  return supabase;
}