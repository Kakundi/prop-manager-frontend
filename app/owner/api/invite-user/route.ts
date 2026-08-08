// app/owner/api/invite-user/route.ts
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// GET: Fetch list of managed users linked ONLY to the logged-in owner's properties
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    // 1. Get authenticated user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch property IDs owned by this landlord
    const { data: ownerProps, error: propsError } = await supabase
      .from('properties')
      .select('id, property_name')
      .eq('owner_id', user.id);

    if (propsError) {
      console.error('Properties query error:', propsError.message);
      return NextResponse.json({ error: `Properties query error: ${propsError.message}` }, { status: 500 });
    }

    // Create a lookup map: property_id -> property_name
    const propMap = new Map<string, string>();
    const propertyIds: string[] = [];
    (ownerProps || []).forEach((p: any) => {
      propertyIds.push(p.id);
      propMap.set(p.id, p.property_name || p.name || 'N/A');
    });

    if (propertyIds.length === 0) {
      return NextResponse.json({ users: [] }, { status: 200 });
    }

    // 3. Query profiles matching the owner's property IDs (Simple query without direct join)
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('*')
      .in('property_id', propertyIds)
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('Profiles query error:', usersError.message);
      return NextResponse.json({ error: `Profiles query error: ${usersError.message}` }, { status: 500 });
    }

    // Map properties from local lookup map
    const formattedUsers = (users || []).map((usr: any) => ({
      id: usr.id,
      full_name: usr.full_name || usr.name || 'N/A',
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
    console.error('API Error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch users' },
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

    // 1. Send invitation email using the Service Role Admin Client
    const { data: authData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
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

    // 2. Insert user record into database using server client
    const { error: dbError } = await supabase.from('profiles').insert([
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
    return NextResponse.json(
      { error: error.message || 'Failed to send invitation' },
      { status: 500 }
    );
  }
}