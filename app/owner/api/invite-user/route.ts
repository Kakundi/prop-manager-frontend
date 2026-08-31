import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getSiteUrl } from '@/lib/utils/url';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const dynamic = 'force-dynamic';

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

    // 2. Parse request payload
    const body = await request.json();
    const { full_name, email, phone, role, property_id, unit_id } = body;

    if (!email || !full_name || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: full_name, email, and role.' },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdmin();
    const siteUrl = getSiteUrl();
    const normalizedRole = role.toUpperCase();

    // 3. Generate Invite Link & Extract hashed_token
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'invite',
      email,
      options: {
        redirectTo: `${siteUrl}/auth/accept-invite`,
        data: {
          full_name,
          phone,
          role: normalizedRole,
        },
      },
    });

    if (linkError) {
      console.error('[INVITE_USER_POST] Link Generation Error:', linkError.message);
      return NextResponse.json({ error: linkError.message }, { status: 400 });
    }

    const createdUserId = linkData.user.id;
    const hashedToken = linkData.properties.hashed_token;

    // Construct server-callback URL with token_hash query parameter
    const actionLink = `${siteUrl}/auth/callback?token_hash=${hashedToken}&type=invite&next=/auth/accept-invite`;

    // 4. Save/Upsert User Profile into `profiles` table
    const { error: profileError } = await admin.from('profiles').upsert({
      id: createdUserId,
      full_name,
      email,
      phone: phone || null,
      role: normalizedRole,
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      console.error('[INVITE_USER_POST] Profile Upsert Error:', profileError.message);
      return NextResponse.json(
        { error: `User created, but profile update failed: ${profileError.message}` },
        { status: 500 }
      );
    }

    // 5. Handle Role-Specific Database Linking
    const targetPropertyId = property_id && property_id !== 'na' && property_id !== '' ? property_id : null;
    const targetUnitId = unit_id && unit_id !== 'na' && unit_id !== '' ? unit_id : null;

    if (normalizedRole === 'TENANT') {
      const { error: tenantError } = await admin.from('tenants').insert({
        profile_id: createdUserId,
        property_id: targetPropertyId,
        unit_id: targetUnitId,
        lease_start: new Date().toISOString().split('T')[0],
      });

      if (tenantError) {
        console.error('[INVITE_USER_POST] Tenant Record Creation Error:', tenantError.message);
      }

      if (targetUnitId) {
        await admin
          .from('units')
          .update({ is_occupied: true })
          .eq('id', targetUnitId);
      }
    } else if (normalizedRole === 'PROPERTY_MANAGER' && targetPropertyId) {
      await admin
        .from('properties')
        .update({ property_manager_id: createdUserId })
        .eq('id', targetPropertyId);
    } else if (normalizedRole === 'CARETAKER' && targetPropertyId) {
      await admin
        .from('properties')
        .update({ caretaker_id: createdUserId })
        .eq('id', targetPropertyId);
    }

    // 6. Send Invitation Email via Resend
    const { error: emailError } = await resend.emails.send({
      from: 'PropManager <onboarding@resend.dev>',
      to: [email],
      subject: 'You have been invited to PropManager HQ',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="color: #111827; margin-bottom: 8px;">Welcome to PropManager HQ</h2>
          <p style="color: #4b5563; font-size: 14px;">Hello <strong>${full_name}</strong>,</p>
          <p style="color: #4b5563; font-size: 14px;">You have been invited as a <strong>${normalizedRole}</strong>.</p>
          <div style="margin: 24px 0;">
            <a href="${actionLink}" style="background-color: #2563eb; color: #ffffff; padding: 12px 20px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">Set Up Account & Password</a>
          </div>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">If the button above does not work, paste this link into your browser:<br/><a href="${actionLink}" style="color: #2563eb;">${actionLink}</a></p>
        </div>
      `,
    });

    if (emailError) {
      console.error('[RESEND_EMAIL_ERROR]', emailError);
    }

    return NextResponse.json(
      {
        message: 'User created and invite email sent successfully.',
        actionLink,
        user: linkData.user,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[INVITE_USER_POST] Server Error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}