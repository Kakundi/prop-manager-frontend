import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { type EmailOtpType } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/auth/accept-invite';

  const redirectTo = `${origin}${next}`;
  const response = NextResponse.redirect(redirectTo);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // 1. PKCE Code Exchange
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return response;
    }
    console.error('[CALLBACK_CODE_ERROR]', error.message);
    return NextResponse.redirect(`${origin}/login?error=invalid_link`);
  }

  // 2. Token Hash / OTP Verification
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) {
      return response;
    }
    console.error('[CALLBACK_VERIFY_OTP_ERROR]', error.message);
    return NextResponse.redirect(`${origin}/login?error=invalid_link`);
  }

  // 3. Direct Redirect (preserves URL hash fragments like #access_token=... for client-side parsing)
  return response;
}