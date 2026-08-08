// lib/supabaseClient.ts
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables in .env.local');
}

/**
 * Creates a browser-side Supabase client using @supabase/ssr.
 * This automatically syncs session tokens into browser cookies,
 * making them accessible to Next.js middleware and API routes.
 */
export function createClient() {
  return createBrowserClient(supabaseUrl!, supabaseAnonKey!);
}

// Singleton fallback for backward compatibility
export const supabase = createClient();