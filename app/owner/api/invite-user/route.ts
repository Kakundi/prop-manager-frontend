// app/owner/api/invite-user/route.ts
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { createClient } from '@supabase/supabase-js';

// Force dynamic server route execution on Vercel (bypasses static caching)
export const dynamic = 'force-dynamic';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      `Vercel Environment Missing: NEXT_PUBLIC_SUPABASE_URL=${!!url}, SUPABASE_SERVICE_ROLE_KEY=${!!serviceKey}`
    );
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// GET: Fetch list of managed users linked ONLY to the logged-in owner's properties
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    // 1. Get authenticated user session from request cookies
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: Session missing or invalid' },
        { status: 401 }
      );
    }

    let admin;
    try {
      admin = getAdminClient();
    } catch (envErr: any) {
      return NextResponse.json({ error: envErr.message }, { status: 500 });
    }

    // 2. Query properties owned by this user
    let ownerProps: any[] = [];
    
    // Query 1: standard owner_id match
    const res1 = await admin
      .from('properties')
      .select('id, property_name')
      .eq('owner_id', user.id);

    if (!res1.error && res1.data) {
      ownerProps = res1.data;
    } else {
      // Fallback Query 2: user_id match
      const res2 = await admin
        .from('properties')
        .select('id, property_name')
        .eq('user_id', user.id);

      ownerProps = res2.data || [];
    }

    const propertyIds = ownerProps.map((p) => p.id);
    const propMap = new Map(ownerProps.map((p) => [p.id, p.property_name || p.name || 'N/A']));

    // Return empty list if owner has no registered properties
    if (propertyIds.length === 0) {
      return NextResponse.json({ users: [] }, { status: 200 });
    }

    // 3. Fetch user profiles assigned to these property IDs
    const { data: users, error: usersError } = await admin
      .from('profiles')
      .select('*')
      .in('property_id', propertyIds)
      .order('created_at', { ascending: false });

    if (usersError) {
      return NextResponse.json(
        { error: `Database Error (profiles): ${usersError.message}` },
        { status: 500 }
      );
    }

    // 4. Format profiles for UI display
    const formattedUsers = (users || []).map((usr: any) => ({
      id: usr.id,
      full_name: usr.full_name || usr.name || 'N/A',
      email: usr.email || 'N/A',
      phone: usr.phone || usr.phone_number || 'N/A',
      role: usr.role || 'tenant',
      property_name: propMap.get(usr.property_id) || 'N/A',
      unit_number: usr.unit_number || 'N/A',
      status: usr.status || 'pending',
      invited_at: usr.created_at
        ? new Date(usr.created_at).toLocaleDateString()
        : 'N/A',
    }));

    return NextResponse.json({ users: formattedUsers }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST: Process user invitation and trigger email verification
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: sessionError,
    } = await supabase.auth.getUser();

    if (sessionError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { full_name, email, phone, role, property_id, unit_number } = body;

    if (!full_name || !email || !role || !property_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const admin = getAdminClient();

    // 1. Send invite email via Supabase Auth Admin
    const { data: authData, error: inviteError } =
      await admin.auth.admin.inviteUserByEmail(email, {
        data: {
          full_name,
          phone,
          role,
          property_id,
          unit_number,
        },
      });

    if (inviteError) {
      throw new Error(`Auth invitation failed: ${inviteError.message}`);
    }

    // 2. Insert user record into profiles table
    const { error: dbError } = await admin.from('profiles').insert([
      {
        id: authData.user.id,
        full_name,
        email,
        phone,
        role,
        property_id,
        unit_number:
          unit_number === 'N/A' || !unit_number ? null : unit_number,
        status: 'pending',
      },
    ]);

    if (dbError) {
      throw new Error(`Database record creation failed: ${dbError.message}`);
    }

    return NextResponse.json(
      { message: 'User invited successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to send invitation' },
      { status: 500 }
    );
  }
}