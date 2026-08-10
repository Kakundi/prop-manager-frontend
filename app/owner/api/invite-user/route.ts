import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getSiteUrl } from '@/lib/utils/url';

export const dynamic = 'force-dynamic';

// GET: Retrieve all users (Tenants, Managers, Caretakers) linked to the owner's properties
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    // 1. Authenticate owner session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized session.' },
        { status: 401 }
      );
    }

    const admin = getSupabaseAdmin();
    const ownerId = user.id;

    // 2. Fetch properties owned by this landlord
    const { data: ownerProperties, error: propsError } = await admin
      .from('properties')
      .select('id, name, property_manager_id, caretaker_id')
      .eq('owner_id', ownerId);

    if (propsError) {
      return NextResponse.json({ error: propsError.message }, { status: 400 });
    }

    if (!ownerProperties || ownerProperties.length === 0) {
      return NextResponse.json({ users: [] }, { status: 200 });
    }

    const propertyIds = ownerProperties.map((p) => p.id);
    const propertyMap = new Map(ownerProperties.map((p) => [p.id, p.name]));

    const usersList: Array<{
      id: string;
      full_name: string;
      email: string;
      phone: string | null;
      role: string;
      property_name: string;
      unit_number?: string | null;
      created_at?: string;
    }> = [];

    // 3. Fetch Tenants associated with owner's properties
    const { data: tenantRecords, error: tenantsError } = await admin
      .from('tenants')
      .select(`
        id,
        created_at,
        property_id,
        unit_id,
        profiles ( id, full_name, email, phone, role ),
        units ( unit_number )
      `)
      .in('property_id', propertyIds);

    if (!tenantsError && tenantRecords) {
      tenantRecords.forEach((t: any) => {
        if (t.profiles) {
          usersList.push({
            id: t.profiles.id,
            full_name: t.profiles.full_name,
            email: t.profiles.email,
            phone: t.profiles.phone,
            role: t.profiles.role,
            property_name: t.property_id ? propertyMap.get(t.property_id) || 'N/A' : 'N/A',
            unit_number: t.units?.unit_number || 'N/A',
            created_at: t.created_at,
          });
        }
      });
    }

    // 4. Fetch Property Managers and Caretakers assigned to owner's properties
    const staffUserIds = Array.from(
      new Set(
        ownerProperties
          .flatMap((p) => [p.property_manager_id, p.caretaker_id])
          .filter((id): id is string => Boolean(id))
      )
    );

    if (staffUserIds.length > 0) {
      const { data: staffProfiles } = await admin
        .from('profiles')
        .select('id, full_name, email, phone, role, created_at')
        .in('id', staffUserIds);

      if (staffProfiles) {
        staffProfiles.forEach((staff) => {
          const assignedProp = ownerProperties.find(
            (p) => p.property_manager_id === staff.id || p.caretaker_id === staff.id
          );

          if (!usersList.some((u) => u.id === staff.id)) {
            usersList.push({
              id: staff.id,
              full_name: staff.full_name,
              email: staff.email,
              phone: staff.phone,
              role: staff.role,
              property_name: assignedProp ? assignedProp.name : 'N/A',
              unit_number: 'N/A',
              created_at: staff.created_at,
            });
          }
        });
      }
    }

    return NextResponse.json({ users: usersList }, { status: 200 });
  } catch (error: any) {
    console.error('[GET_USERS_DIRECTORY_ERROR]', error.message);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST: Add new user, generate link with hashed_token, create profile & relationships
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

    // 3. Generate Invite Link & Extract exact hashed_token from Supabase SDK
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
    
    // Exact property name on GenerateLinkProperties type
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

    // Sanitize property and unit inputs
    const targetPropertyId = property_id && property_id !== 'na' && property_id !== '' ? property_id : null;
    const targetUnitId = unit_id && unit_id !== 'na' && unit_id !== '' ? unit_id : null;

    // 5. Handle Role-Specific Database Linking
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

    return NextResponse.json(
      {
        message: 'User created and invite link generated successfully.',
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