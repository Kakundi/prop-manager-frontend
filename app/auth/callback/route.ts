import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { type EmailOtpType } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/auth/accept-invite';

  // Construct target redirect URL
  const response = NextResponse.redirect(`${origin}${next}`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.headers
            .get('cookie')
            ?.split('; ')
            .map((cookie) => {
              const [name, ...rest] = cookie.split('=');
              return { name, value: rest.join('=') };
            }) ?? [];
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Path A: Standard PKCE Code Exchange (e.g., OAuth / standard sign-ins)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return response;
    }
    console.error('[CALLBACK_CODE_ERROR]', error.message);
  }

  // Path B: Server-Side OTP Verification for Admin Invites / Magic Links
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) {
      return response;
    }
    console.error('[CALLBACK_VERIFY_OTP_ERROR]', error.message);
  }

  // Fallback: If both fail or query parameters are completely missing
  return NextResponse.redirect(`${origin}/auth/signin?error=invalid_link`);
}