// app/owner/api/invite-user/route.ts
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // 1. Verify Environment Variables
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url) {
      return NextResponse.json({ error: 'ENV ERROR: NEXT_PUBLIC_SUPABASE_URL is missing' }, { status: 500 });
    }
    if (!serviceKey) {
      return NextResponse.json({ error: 'ENV ERROR: SUPABASE_SERVICE_ROLE_KEY is missing in .env.local' }, { status: 500 });
    }

    // 2. Initialize Clients
    const supabase = await createServerSupabaseClient();
    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 3. Verify Auth User
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: `AUTH ERROR: ${authError?.message || 'No active session'}` }, { status: 401 });
    }

    // 4. Query Properties (Clean query without non-existent column syntax)
    const { data: ownerProps, error: propsError } = await admin
      .from('properties')
      .select('id, property_name')
      .eq('owner_id', user.id);

    if (propsError) {
      return NextResponse.json({ error: `PROPERTIES DB ERROR: ${propsError.message} (Code: ${propsError.code})` }, { status: 500 });
    }

    const propertyIds = (ownerProps || []).map((p: any) => p.id);
    const propMap = new Map((ownerProps || []).map((p: any) => [p.id, p.property_name]));

    if (propertyIds.length === 0) {
      return NextResponse.json({ users: [] }, { status: 200 });
    }

    // 5. Query Profiles
    const { data: users, error: usersError } = await admin
      .from('profiles')
      .select('*')
      .in('property_id', propertyIds)
      .order('created_at', { ascending: false });

    if (usersError) {
      return NextResponse.json({ error: `PROFILES DB ERROR: ${usersError.message} (Code: ${usersError.code})` }, { status: 500 });
    }

    const formattedUsers = (users || []).map((usr: any) => ({
      id: usr.id,
      full_name: usr.full_name || 'N/A',
      email: usr.email || 'N/A',
      phone: usr.phone || 'N/A',
      role: usr.role || 'tenant',
      property_name: propMap.get(usr.property_id) || 'N/A',
      unit_number: usr.unit_number || 'N/A',
      status: usr.status || 'pending',
      invited_at: usr.created_at ? new Date(usr.created_at).toLocaleDateString() : 'N/A',
    }));

    return NextResponse.json({ users: formattedUsers }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: `UNHANDLED EXCEPTION: ${error.message}` }, { status: 500 });
  }
}