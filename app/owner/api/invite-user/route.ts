import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getSiteUrl } from '@/lib/utils/url';

export const dynamic = 'force-dynamic';

// GET Handler: Handles "Refresh Directory" and fetching managed user profiles
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    // 1. Authenticate requesting user session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: Session token missing or expired.' },
        { status: 401 }
      );
    }

    const admin = getSupabaseAdmin();

    // 2. Query directory profiles from database
    const { data: profiles, error: fetchError } = await admin
      .from('profiles')
      .select('id, full_name, email, phone, role, status, created_at')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('[INVITE_USER_GET] Fetch Profiles Error:', fetchError.message);
      return NextResponse.json({ error: fetchError.message }, { status: 400 });
    }

    return NextResponse.json({ users: profiles }, { status: 200 });
  } catch (error: any) {
    console.error('[INVITE_USER_GET] Server Crash:', error.message);
    return NextResponse.json(
      { error: error.message || 'Unhandled Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST Handler: Handles sending user invites and creating profiles
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    // 1. Authenticate landlord / admin session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: Session token missing or expired.' },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body = await request.json();
    const { full_name, email, phone, role, property_id } = body;

    if (!email || !full_name || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: full_name, email, and role.' },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdmin();
    const siteUrl = getSiteUrl();

    // 3. Invite user via Supabase Auth directing to the PKCE callback route
    const { data: inviteData, error: inviteError } =
      await admin.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${siteUrl}/auth/callback?next=/auth/accept-invite`,
        data: {
          full_name,
          phone,
          role,
        },
      });

    if (inviteError) {
      console.error('[INVITE_USER_POST] Auth Invite Error:', inviteError.message);
      return NextResponse.json({ error: inviteError.message }, { status: 400 });
    }

    const createdUserId = inviteData.user.id;

    // 4. Assign role on properties table if property_manager or caretaker
    if (property_id) {
      if (role === 'property_manager') {
        await admin
          .from('properties')
          .update({ property_manager_id: createdUserId })
          .eq('id', property_id);
      } else if (role === 'caretaker') {
        await admin
          .from('properties')
          .update({ caretaker_id: createdUserId })
          .eq('id', property_id);
      }
    }

    // 5. Upsert into profiles table (only columns that belong to profiles)
    const { error: profileError } = await admin.from('profiles').upsert({
      id: createdUserId,
      full_name,
      email,
      phone,
      role,
    });

    if (profileError) {
      console.error('[INVITE_USER_POST] Profile Upsert Error:', profileError.message);
      return NextResponse.json(
        { error: `User created, but profile update failed: ${profileError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'User invited successfully', user: inviteData.user },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[INVITE_USER_POST] Server Crash:', error.message);
    return NextResponse.json(
      { error: error.message || 'Unhandled Internal Server Error' },
      { status: 500 }
    );
  }
}