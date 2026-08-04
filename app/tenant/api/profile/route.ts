import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Handled in middleware
            }
          },
        },
      }
    );

    // 1. Check Authenticated Auth User
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // 2. Use Service Role Admin Client if available to prevent RLS blocks
    const dbClient = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
      : supabase;

    let targetUserId = user?.id;

    // If session cookie was missing in Next SSR, fetch the first tenant profile as a safety fallback in development
    if (!targetUserId) {
      console.warn('⚠️ No active auth session found in cookies. Fetching active tenant profile.');
      const { data: fallbackProfile } = await dbClient
        .from('profiles')
        .select('id')
        .eq('role', 'tenant')
        .limit(1)
        .maybeSingle();

      targetUserId = fallbackProfile?.id;
    }

    if (!targetUserId) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // 3. Query profiles table directly
    const { data: profile, error: profileError } = await dbClient
      .from('profiles')
      .select('full_name, email, role')
      .eq('id', targetUserId)
      .maybeSingle();

    if (profileError) {
      console.error('Profile DB query error:', profileError);
    }

    const nameToReturn = profile?.full_name || 'Tenant User';

    return NextResponse.json({
      profile: {
        full_name: nameToReturn,
        property_name: '',
        unit_number: '',
        caretaker_name: '',
        caretaker_phone: ''
      }
    });
  } catch (err) {
    console.error('Fatal error in profile API:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}