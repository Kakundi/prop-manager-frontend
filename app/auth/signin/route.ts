import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

// ==========================================
// 1. GET HANDLER: Legacy Redirect
// ==========================================
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  // Redirect /auth/signin GET requests along with search params to /login
  return NextResponse.redirect(
    new URL(`/login${requestUrl.search}`, requestUrl.origin)
  );
}

// ==========================================
// 2. POST HANDLER: Password Authentication & Check
// ==========================================
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Failed to initialize session client.' },
        { status: 500 }
      );
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    // Authenticate user with password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return NextResponse.json(
        { error: error?.message || 'Invalid login credentials.' },
        { status: 401 }
      );
    }

    // Check if the user is logging in with a temporary password
    const mustChangePassword =
      data.user.user_metadata?.must_change_password === true;

    if (mustChangePassword) {
      return NextResponse.json(
        {
          message: 'Password reset required.',
          mustChangePassword: true,
          redirectTo: '/auth/update-password',
        },
        { status: 200 }
      );
    }

    // Standard successful authentication
    return NextResponse.json(
      {
        message: 'Signed in successfully.',
        mustChangePassword: false,
        redirectTo: '/dashboard',
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error('[SIGNIN_ERROR]', err.message);
    return NextResponse.json(
      { error: err.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}