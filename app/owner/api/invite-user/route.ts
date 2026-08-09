import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

// --- GET HANDLER (For listing managed users) ---
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

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

    const { data: ownerProps, error: propsError } = await admin
      .from('properties')
      .select('id, name, property_manager_id, caretaker_id')
      .eq('owner_id', user.id);

    if (propsError) {
      console.error('[INVITE_USER_API] Properties DB Error:', propsError.message);
      return NextResponse.json(
        { error: `Properties query error: ${propsError.message}` },
        { status: 500 }
      );
    }

    const assignedProfileIds = new Set<string>();
    const profilePropertyMap = new Map<string, string>();

    (ownerProps || []).forEach((p: any) => {
      if (p.property_manager_id) {
        assignedProfileIds.add(p.property_manager_id);
        profilePropertyMap.set(p.property_manager_id, p.name);
      }
      if (p.caretaker_id) {
        assignedProfileIds.add(p.caretaker_id);
        profilePropertyMap.set(p.caretaker_id, p.name);
      }
    });

    const userIdsToFetch = Array.from(assignedProfileIds);

    if (userIdsToFetch.length === 0) {
      return NextResponse.json({ users: [] }, { status: 200 });
    }

    const { data: users, error: usersError } = await admin
      .from('profiles')
      .select('*')
      .in('id', userIdsToFetch);

    if (usersError) {
      console.error('[INVITE_USER_API] Profiles DB Error:', usersError.message);
      return NextResponse.json(
        { error: `Profiles query error: ${usersError.message}` },
        { status: 500 }
      );
    }

    const formattedUsers = (users || []).map((usr: any) => ({
      id: usr.id,
      full_name: usr.full_name || usr.name || 'N/A',
      email: usr.email || 'N/A',
      phone: usr.phone || 'N/A',
      role: usr.role || 'tenant',
      property_name: profilePropertyMap.get(usr.id) || 'N/A',
      unit_number: usr.unit_number || 'N/A',
      status: usr.status || 'pending',
      invited_at: usr.created_at
        ? new Date(usr.created_at).toLocaleDateString()
        : 'N/A',
    }));

    return NextResponse.json({ users: formattedUsers }, { status: 200 });
  } catch (error: any) {
    console.error('[INVITE_USER_API] Server Crash:', error.message);
    return NextResponse.json(
      { error: error.message || 'Unhandled Internal Server Error' },
      { status: 500 }
    );
  }
}

// --- POST HANDLER (For inviting / adding a new user) ---
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    // 1. Authenticate landlord session
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

    // 2. Parse body payloads
    const body = await request.json();
    const { full_name, email, phone, role, property_id, unit_number } = body;

    if (!email || !full_name || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: full_name, email, and role.' },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdmin();

    // 3. Invite user via Supabase Auth (Sends setup link, avoids createUser trigger collision)
    const { data: inviteData, error: inviteError } =
      await admin.auth.admin.inviteUserByEmail(email, {
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

    // 5. Update or insert into profiles table
    await admin.from('profiles').upsert({
      id: createdUserId,
      full_name,
      email,
      phone,
      role,
      unit_number: unit_number && unit_number !== 'N/A' ? unit_number : null,
    });

    return NextResponse.json(
      { message: 'User invited and created successfully', user: inviteData.user },
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