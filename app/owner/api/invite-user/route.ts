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

export async function GET() {
  try {
    // 1. Authenticate landlord session via server cookies
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

    // 2. Initialize Admin Client (uses SUPABASE_SERVICE_ROLE_KEY)
    const admin = getSupabaseAdmin();
    if (!admin) {
      console.error('[GET_USERS_DIRECTORY_ERROR] Service Role Admin Client is missing or unconfigured. Verify SUPABASE_SERVICE_ROLE_KEY env variable.');
      return NextResponse.json(
        { error: 'Server configuration error: Service role key missing.' },
        { status: 500 }
      );
    }

    const ownerId = user.id;

    // 3. Fetch properties owned by landlord
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

    // 4. Fetch Tenant Records for owned properties
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

    // 5. Fetch Profiles directly for all resolved IDs
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

    // 6. Fetch Units directly for tenant unit mappings
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

    // 7. Assemble Directory List safely
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
      // Avoid duplicate entries if staff member is also in tenants
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