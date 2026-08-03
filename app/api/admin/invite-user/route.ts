import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Requires SUPABASE_SERVICE_ROLE_KEY to perform administrative auth functions
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, full_name, phone, role, property_id, unit_number } = body;

    if (!email || !full_name || !role || !property_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 1. Send invite email via Supabase Auth Admin (generates token and verification link)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/set-password`,
        data: {
          full_name,
          phone,
          role,
        },
      }
    );

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const userId = authData.user.id;

    // 2. Insert record into profile / role assignment table in Supabase DB
    const { error: dbError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        email,
        full_name,
        phone,
        role,
        property_id,
        unit_number: role === 'tenant' ? unit_number : null,
        status: 'pending_verification',
        created_at: new Date().toISOString(),
      });

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Invitation sent successfully',
      user: authData.user,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}