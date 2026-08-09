import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
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

    // 2. Initialize admin client
    const admin = getSupabaseAdmin();

    // 3. Query Landlord Properties with assigned manager and caretaker IDs
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

    // 4. Map user IDs to property names
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

    // 5. Query Profiles using 'id'
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

    // 6. Safely map database fields to API output
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