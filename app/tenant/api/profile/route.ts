import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();

    // Standard SSR Client
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

    // 1. Get authenticated user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fallback Admin Client using Service Role key (bypasses any local auth cookie bugs)
    const adminSupabase = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
      : supabase;

    // 3. Query profiles table directly (where ID matches auth user ID)
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('full_name, email, role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
    }

    // 4. Extract real full name from DB -> Auth Metadata -> Email fallback
    const resolvedName =
      profile?.full_name ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'Tenant User';

    return NextResponse.json({
      profile: {
        full_name: resolvedName,
        property_name: '',
        unit_number: '',
        caretaker_name: '',
        caretaker_phone: ''
      }
    });
  } catch (err) {
    console.error('Fatal API error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}