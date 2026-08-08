// app/owner/api/invite-user/route.ts
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

// GET: Fetch list of managed users for the directory
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    // Fetch users from your 'users' or 'profiles' table
    const { data: users, error } = await supabase
      .from('profiles') // Replace 'profiles' with your actual user details table
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ users: users || [] }, { status: 200 });
  } catch (error: any) {
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
    const body = await request.json();
    const { full_name, email, phone, role, property_id, unit_number } = body;

    if (!full_name || !email || !role || !property_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 1. Send invitation link via Supabase Auth Admin
    const { data: authData, error: authError } = await supabase.auth.admin.inviteUserByEmail(
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

    if (authError) {
      throw new Error(`Auth invitation failed: ${authError.message}`);
    }

    // 2. Insert record into your database table
    const { error: dbError } = await supabase.from('profiles').insert([
      {
        id: authData.user.id,
        full_name,
        email,
        phone,
        role,
        property_id,
        unit_number,
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