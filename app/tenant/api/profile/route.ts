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

    // 1. Get logged-in user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('🔴 AUTH ERROR OR NO USER:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🟢 LOGGED-IN AUTH USER ID:', user.id);
    console.log('🟢 USER METADATA:', user.user_metadata);
    console.log('🟢 USER EMAIL:', user.email);

    // 2. Query tenants table linked to user ID
    const { data: tenant, error: dbError } = await supabase
      .from('tenants')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (dbError) {
      console.error('🔴 DB QUERY ERROR:', dbError);
    } else {
      console.log('🟢 DB TENANT ROW RETURNED:', tenant);
    }

    // Safely combine first_name and last_name if present
    const combinedName = [tenant?.first_name, tenant?.last_name]
      .filter(Boolean)
      .join(' ');

    // Resolve Name Priority
    const resolvedName =
      tenant?.full_name ||
      tenant?.name ||
      (combinedName.length > 0 ? combinedName : null) ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email ||
      'Tenant';

    return NextResponse.json({
      profile: {
        full_name: resolvedName,
        property_name: '',
        unit_number: tenant?.unit_number || '',
        caretaker_name: '',
        caretaker_phone: ''
      }
    });
  } catch (err) {
    console.error('🔴 PROFILE ROUTE CRASH:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}