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

    // 1. Get logged-in user from Supabase Auth session
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Query 'tenants' table linked to user.id
    const { data: tenant, error: dbError } = await supabase
      .from('tenants')
      .select(`
        id,
        full_name,
        name,
        unit_number,
        properties (
          name,
          caretaker_name,
          caretaker_phone
        )
      `)
      .eq('user_id', user.id)
      .maybeSingle();

    if (dbError) {
      console.error('Supabase Query Error:', dbError.message);
    }

    // Handle properties relation array or object
    const propertyData = Array.isArray(tenant?.properties)
      ? tenant.properties[0]
      : tenant?.properties;

    // 3. Resolve Full Name priority: 
    // DB full_name -> DB name -> Auth User Metadata -> Auth Email -> Fallback
    const resolvedName =
      tenant?.full_name ||
      tenant?.name ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'Tenant User';

    return NextResponse.json({
      profile: {
        full_name: resolvedName,
        property_name: propertyData?.name || '',
        unit_number: tenant?.unit_number || '',
        caretaker_name: propertyData?.caretaker_name || '',
        caretaker_phone: propertyData?.caretaker_phone || ''
      }
    });
  } catch (err) {
    console.error('Profile Route API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}