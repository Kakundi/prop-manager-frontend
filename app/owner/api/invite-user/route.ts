// app/owner/api/invite-user/route.ts
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

    // 3. Query Landlord Properties using column 'name' (matches public.properties table)
    const { data: ownerProps, error: propsError } = await admin
      .from('properties')
      .select('id, name')
      .eq('owner_id', user.id);

    if (propsError) {
      console.error('[INVITE_USER_API] Properties DB Error:', propsError.message);
      return NextResponse.json(
        { error: `Properties query error: ${propsError.message}` },
        { status: 500 }
      );
    }

    const propertyIds = (ownerProps || []).map((p: any) => p.id);
    const propMap = new Map((ownerProps || []).map((p: any) => [p.id, p.name || 'N/A']));

    if (propertyIds.length === 0) {
      return NextResponse.json({ users: [] }, { status: 200 });
    }

    // 4. Query Profiles linked to these properties
    const { data: users, error: usersError } = await admin
      .from('profiles')
      .select('*')
      .in('property_id', propertyIds);

    if (usersError) {
      console.error('[INVITE_USER_API] Profiles DB Error:', usersError.message);
      return NextResponse.json(
        { error: `Profiles query error: ${usersError.message}` },
        { status: 500 }
      );
    }

    // 5. Safely map database fields to API output
    const formattedUsers = (users || []).map((usr: any) => ({
      id: usr.id,
      full_name: usr.full_name || usr.name || 'N/A',
      email: usr.email || 'N/A',
      phone: usr.phone || 'N/A',
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
    console.error('[INVITE_USER_API] Server Crash:', error.message);
    return NextResponse.json(
      { error: error.message || 'Unhandled Internal Server Error' },
      { status: 500 }
    );
  }
}