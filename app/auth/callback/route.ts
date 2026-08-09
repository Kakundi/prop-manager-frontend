import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/auth/accept-invite';

  console.log('[AUTH_CALLBACK] Triggered. Code present:', !!code);

  if (code) {
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
              // Server component read-only safety catch
            }
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      console.log('[AUTH_CALLBACK] Session created successfully for user:', data.user?.email);
      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error('[AUTH_CALLBACK] Code exchange failed:', error.message);
  } else {
    console.error('[AUTH_CALLBACK] No code parameter found in callback URL.');
  }

  return NextResponse.redirect(`${origin}/auth/accept-invite?error=Authentication+failed`);
}