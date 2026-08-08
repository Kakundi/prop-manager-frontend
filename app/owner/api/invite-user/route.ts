// app/owner/api/invite-user/route.ts
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

// Helper function to lazy-load admin client without crashing top-level import
function getAdminClient() {
  const { createClient } = require('@supabase/supabase-js');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing from environment variables');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// GET: Fetch list of managed users linked ONLY to the logged-in owner's properties
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    // 1. Authenticate session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: No session found' }, { status: 401 });
    }

    // Initialize admin client to bypass RLS issues during read operations
    let admin;
    try {
      admin = getAdminClient();
    } catch (envErr: any) {
      console.error('Environment Error:', envErr.message);
      return NextResponse.json({ error: envErr.message }, { status: 500 });
    }

    // 2. Fetch properties matching the owner ID
    // Check both 'owner_id' and 'landlord_id' column possibilities
    const { data: ownerProps, error: propsError } = await admin
      .from('properties')
      .select('*')
      .or(`owner_id.eq.${user.id},landlord_id.eq.${user.id},user_id.eq.${user.id}`);

    if (propsError) {
      console.error('Properties fetch error:', propsError);
      return NextResponse.json({ error: `Properties query error: ${propsError.message}` }, { status: 500 });
    }

    const propMap = new Map<string, string>();
    const propertyIds: string[] = [];

    (ownerProps || []).forEach((p: any) => {
      propertyIds.push(p.id);
      propMap.set(p.id, p.property_name || p.name || p.title || 'N/A');
    });

    if (propertyIds.length === 0) {
      return NextResponse.json({ users: [] }, { status: 200 });
    }

    // 3. Fetch profiles linked to these property IDs
    const { data: users, error: usersError } = await admin
      .from('profiles')
      .select('*')
      .in('property_id', propertyIds)
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('Profiles fetch error:', usersError);
      return NextResponse.json({ error: `Profiles query error: ${usersError.message}` }, { status: 500 });
    }

    // Map profiles into the UI payload structure
    const formattedUsers = (users || []).map((usr: any) => ({
      id: usr.id,
      full_name: usr.full_name || usr.name || 'N/A',
      email: usr.email || 'N/A',
      phone: usr.phone || usr.phone_number || 'N/A',
      role: usr.role || 'tenant',
      property_name: propMap.get(usr.property_id) || 'N/A',
      unit_number: usr.unit_number || usr.unit || 'N/A',
      status: usr.status || 'pending',
      invited_at: usr.created_at ? new Date(usr.created_at).toLocaleDateString() : 'N/A',
    }));

    return NextResponse.json({ users: formattedUsers }, { status: 200 });
  } catch (error: any) {
    console.error('Unhandled GET Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error while fetching users' },
      { status: 500 }
    );
  }
}

// POST: Process user invitation and trigger email verification
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Verify caller authentication
    const { data: { user }, error: sessionError } = await supabase.auth.getUser();
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

    // 1. Send invitation email using the Service Role Admin Client
    const { data: authData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          full_name,
          phone,
          role,
          property_id,
          unit_number,
        },
      }
    );

    if (inviteError) {
      throw new Error(`Auth invitation failed: ${inviteError.message}`);
    }

    // 2. Insert user record into database
    const { error: dbError } = await admin.from('profiles').insert([
      {
        id: authData.user.id,
        full_name,
        email,
        phone,
        role,
        property_id,
        unit_number: unit_number === 'N/A' || !unit_number ? null : unit_number,
        status: 'pending',
      },
    ]);

    if (dbError) {
      throw new Error(`Database record creation failed: ${dbError.message}`);
    }

    return NextResponse.json(
      { message: 'User invited successfully and verification link sent' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('POST Invite Error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to send invitation' },
      { status: 500 }
    );
  }
}