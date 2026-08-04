import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
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

    // 1. Get authenticated user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('🔴 AUTH SESSION ERROR:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🟢 LOGGED IN USER ID:', user.id);
    console.log('🟢 LOGGED IN EMAIL:', user.email);

    // 2. Fetch directly from 'profiles' table using Service Role or Anon Client
    // We query by user.id or user.email to ensure a match
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, email, role')
      .eq('id', user.id)
      .maybeSingle();

    // Fallback search by email if id mapping differs in your dev environment
    if (!profile && user.email) {
      const { data: profileByEmail } = await supabase
        .from('profiles')
        .select('full_name, email, role')
        .eq('email', user.email)
        .maybeSingle();
      
      if (profileByEmail) {
        profile = profileByEmail;
      }
    }

    if (profileError) {
      console.error('🔴 DB PROFILES ERROR:', profileError.message);
    }

    console.log('🟢 MATCHED PROFILE FROM DB:', profile);

    // 3. Fetch tenant unit and property details
    const { data: tenant } = await supabase
      .from('tenants')
      .select(`
        unit_number,
        properties (
          name,
          caretaker_name,
          caretaker_phone
        )
      `)
      .or(`user_id.eq.${user.id},email.eq.${user.email || ''}`)
      .maybeSingle();

    const propertyData = Array.isArray(tenant?.properties)
      ? tenant.properties[0]
      : tenant?.properties;

    // 4. Guaranteed Name Resolution: DB full_name > user_metadata > Email
    const actualFullName = profile?.full_name || user.user_metadata?.full_name || user.email || 'Tenant';

    return NextResponse.json({
      profile: {
        full_name: actualFullName,
        property_name: propertyData?.name || '',
        unit_number: tenant?.unit_number || '',
        caretaker_name: propertyData?.caretaker_name || '',
        caretaker_phone: propertyData?.caretaker_phone || ''
      }
    });
  } catch (err) {
    console.error('🔴 SERVER ERROR IN PROFILE ROUTE:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}