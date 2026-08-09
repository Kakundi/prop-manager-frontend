import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/auth/accept-invite';

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
              // Safe catch when invoked from Server Components
            }
          },
        },
      }
    );

    // Exchange the single-use authorization code for an active session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Forward the user to the target destination with active session cookies attached
      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error('[PKCE_CALLBACK_ERROR] Code exchange failed:', error.message);
  } else {
    console.error('[PKCE_CALLBACK_ERROR] No authorization code found in request params.');
  }

  // Fallback redirect if token exchange fails
  return NextResponse.redirect(`${origin}/auth/accept-invite?error=Authentication+failed`);
}