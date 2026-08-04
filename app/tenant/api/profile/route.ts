import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Handled in middleware
            }
          },
        },
      }
    );

    // 1. Get current authenticated auth user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch full_name from 'profiles' table using user.id
    const { data: profileRow, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, email, phone')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching from profiles table:', profileError);
    }

    // 3. Fetch unit/property details from 'tenants' table if linked
    const { data: tenantRow } = await supabase
      .from('tenants')
      .select(`
        unit_number,
        properties (
          name,
          caretaker_name,
          caretaker_phone
        )
      `)
      .eq('user_id', user.id)
      .maybeSingle();

    const propertyData = Array.isArray(tenantRow?.properties)
      ? tenantRow.properties[0]
      : tenantRow?.properties;

    // 4. Extract real full name from public.profiles
    const realFullName = profileRow?.full_name || user.email || 'Tenant';

    return NextResponse.json({
      profile: {
        full_name: realFullName,
        property_name: propertyData?.name || '',
        unit_number: tenantRow?.unit_number || '',
        caretaker_name: propertyData?.caretaker_name || '',
        caretaker_phone: propertyData?.caretaker_phone || ''
      }
    });
  } catch (err) {
    console.error('Profile API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}