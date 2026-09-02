import { NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/supabaseServer';

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone?: string | null;
  phone_number?: string | null;
  role: string | null;
  created_at: string;
}

interface Property {
  id: string;
  name: string;
  property_manager_id?: string | null;
  caretaker_id?: string | null;
}

interface Tenant {
  id: string;
  profile_id: string;
  property_id: string | null;
  unit_id: string | null;
  created_at: string;
}

interface Unit {
  id: string;
  unit_number: string;
}

export interface DirectoryUser {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: string;
  property_name: string;
  unit_number: string;
  created_at: string;
}

// ==========================================
// 1. GET HANDLER: Fetch Directory
// ==========================================
export async function GET() {
  try {
    // Authenticate landlord session via server cookies
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      console.error('[GET_USERS_DIRECTORY] Failed to create server Supabase client.');
      return NextResponse.json(
        { error: 'Failed to initialize session client.' },
        { status: 500 }
      );
    }

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

    // Initialize Admin Client (uses SUPABASE_SERVICE_ROLE_KEY)
    const admin = getSupabaseAdmin();
    if (!admin) {
      console.error('[GET_USERS_DIRECTORY_ERROR] Service Role Admin Client is missing or unconfigured. Verify SUPABASE_SERVICE_ROLE_KEY env variable.');
      return NextResponse.json(
        { error: 'Server configuration error: Service role key missing.' },
        { status: 500 }
      );
    }

    const ownerId = user.id;

    // Fetch properties owned by landlord
    const { data: ownerProperties, error: propsError } = await admin
      .from('properties')
      .select('id, name, property_manager_id, caretaker_id')
      .eq('owner_id', ownerId);

    if (propsError) {
      console.error('[GET_USERS_PROPS_ERROR]', propsError.message);
      return NextResponse.json({ error: propsError.message }, { status: 400 });
    }

    const typedProperties: Property[] = ownerProperties || [];

    if (typedProperties.length === 0) {
      return NextResponse.json({ users: [] }, { status: 200 });
    }

    const propertyIds = typedProperties.map((p) => p.id);
    const propertyMap = new Map<string, string>(
      typedProperties.map((p) => [p.id, p.name])
    );

    // Fetch Tenant Records for owned properties
    const { data: tenantRecords, error: tenantsError } = await admin
      .from('tenants')
      .select('id, profile_id, property_id, unit_id, created_at')
      .in('property_id', propertyIds);

    if (tenantsError) {
      console.error('[GET_TENANTS_ERROR]', tenantsError.message);
    }

    const typedTenants: Tenant[] = tenantRecords || [];

    // Collect all unique profile IDs (Tenants + Property Managers + Caretakers)
    const tenantProfileIds = typedTenants
      .map((t) => t.profile_id)
      .filter((id): id is string => Boolean(id));

    const staffUserIds = typedProperties
      .flatMap((p) => [p.property_manager_id, p.caretaker_id])
      .filter((id): id is string => Boolean(id));

    const allProfileIds = Array.from(new Set([...tenantProfileIds, ...staffUserIds]));

    if (allProfileIds.length === 0) {
      return NextResponse.json({ users: [] }, { status: 200 });
    }

    // Fetch Profiles directly for all resolved IDs
    const { data: profiles, error: profilesError } = await admin
      .from('profiles')
      .select('id, full_name, email, phone, role, created_at')
      .in('id', allProfileIds);

    if (profilesError) {
      console.error('[GET_PROFILES_ERROR]', profilesError.message);
      return NextResponse.json({ error: profilesError.message }, { status: 400 });
    }

    const typedProfiles: Profile[] = profiles || [];
    const profileMap = new Map<string, Profile>(
      typedProfiles.map((p) => [p.id, p])
    );

    // Fetch Units directly for tenant unit mappings
    const unitIds = typedTenants
      .map((t) => t.unit_id)
      .filter((id): id is string => Boolean(id));

    let unitMap = new Map<string, string>();
    if (unitIds.length > 0) {
      const { data: units, error: unitsError } = await admin
        .from('units')
        .select('id, unit_number')
        .in('id', unitIds);

      if (unitsError) {
        console.error('[GET_UNITS_ERROR]', unitsError.message);
      } else if (units) {
        const typedUnits: Unit[] = units;
        unitMap = new Map<string, string>(
          typedUnits.map((u) => [u.id, u.unit_number])
        );
      }
    }

    // Assemble Directory List safely
    const usersList: DirectoryUser[] = [];

    // Assemble Tenants
    typedTenants.forEach((tenant) => {
      const prof = profileMap.get(tenant.profile_id);
      if (prof) {
        usersList.push({
          id: prof.id,
          full_name: prof.full_name || 'N/A',
          email: prof.email || 'N/A',
          phone: prof.phone || prof.phone_number || 'N/A',
          role: prof.role || 'Tenant',
          property_name: tenant.property_id ? propertyMap.get(tenant.property_id) || 'N/A' : 'N/A',
          unit_number: tenant.unit_id ? unitMap.get(tenant.unit_id) || 'N/A' : 'N/A',
          created_at: tenant.created_at || new Date().toISOString(),
        });
      }
    });

    // Assemble Staff (Managers & Caretakers)
    staffUserIds.forEach((staffId) => {
      const prof = profileMap.get(staffId);
      if (prof && !usersList.some((u) => u.id === staffId)) {
        const assignedProp = typedProperties.find(
          (p) => p.property_manager_id === staffId || p.caretaker_id === staffId
        );
        usersList.push({
          id: prof.id,
          full_name: prof.full_name || 'N/A',
          email: prof.email || 'N/A',
          phone: prof.phone || prof.phone_number || 'N/A',
          role: prof.role || 'Staff',
          property_name: assignedProp ? assignedProp.name : 'N/A',
          unit_number: 'N/A (Building Level)',
          created_at: prof.created_at || new Date().toISOString(),
        });
      }
    });

    return NextResponse.json({ users: usersList }, { status: 200 });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('[GET_USERS_DIRECTORY_CRASH]', err.stack || err.message);
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// ==========================================
// 2. POST HANDLER: Invite & Add User
// ==========================================
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Session initialization failed.' }, { status: 500 });
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized session.' }, { status: 401 });
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: 'Missing SUPABASE_SERVICE_ROLE_KEY configuration.' },
        { status: 500 }
      );
    }

    const body = await request.json();

    // Extract payload with fallbacks for camelCase and snake_case inputs
    const fullName = body.fullName || body.full_name;
    const email = body.email;
    const phone = body.phone || body.phone_number || null;
    const rawRole = body.role;
    const propertyId = body.propertyId || body.property_id;
    const rawUnitId = body.unitId || body.unit_id || body.unit_number;

    if (!email || !fullName || !rawRole || !propertyId) {
      return NextResponse.json(
        { error: 'Full name, email, role, and property assignment are required.' },
        { status: 400 }
      );
    }

    // Normalize role string formatting
    const roleLower = rawRole.toString().trim().toLowerCase();
    let role = rawRole;
    if (roleLower === 'tenant') role = 'Tenant';
    else if (roleLower === 'caretaker') role = 'Caretaker';
    else if (roleLower === 'property manager' || roleLower === 'property_manager') role = 'Property Manager';

    const unitId = rawUnitId && rawUnitId !== 'N/A' ? rawUnitId : null;

    // 1. Send Supabase Auth Invite Email via Custom Resend SMTP
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`;
    
    const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
      email,
      {
        data: { full_name: fullName, role: role },
        redirectTo: redirectUrl,
      }
    );

    if (inviteError) {
      console.error('[INVITE_USER_ERROR]', inviteError.message);
      return NextResponse.json({ error: inviteError.message }, { status: 400 });
    }

    const newUserId = inviteData.user.id;

    // 2. Insert or update record in public.profiles
    const { error: profileError } = await admin.from('profiles').upsert({
      id: newUserId,
      full_name: fullName,
      email: email,
      phone: phone,
      role: role,
      created_at: new Date().toISOString(),
    });

    if (profileError) {
      console.error('[CREATE_PROFILE_ERROR]', profileError.message);
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    // 3. Link user to Tenant table or Property Staff fields (case-insensitive role check)
    if (roleLower === 'tenant') {
      const { error: tenantError } = await admin.from('tenants').insert({
        profile_id: newUserId,
        property_id: propertyId,
        unit_id: unitId,
      });

      if (tenantError) {
        console.error('[CREATE_TENANT_ERROR]', tenantError.message);
        return NextResponse.json({ error: tenantError.message }, { status: 400 });
      }
    } else if (roleLower === 'property manager' || roleLower === 'property_manager') {
      await admin.from('properties').update({ property_manager_id: newUserId }).eq('id', propertyId);
    } else if (roleLower === 'caretaker') {
      await admin.from('properties').update({ caretaker_id: newUserId }).eq('id', propertyId);
    }

    return NextResponse.json(
      { message: 'User invited and assigned successfully!', user: inviteData.user },
      { status: 201 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error('[POST_USERS_DIRECTORY_ERROR]', err.message);
    return NextResponse.json(
      { error: err.message || 'Failed to add and invite user.' },
      { status: 500 }
    );
  }
}