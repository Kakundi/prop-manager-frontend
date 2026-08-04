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

    // 1. Fetch current auth user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Query tenant row linked to authenticated user
    const { data: tenant, error: dbError } = await supabase
      .from('tenants')
      .select(`
        id,
        full_name,
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
      console.error('Database query error:', dbError);
    }

    // Handle properties array vs single object safely
    const propertyData = Array.isArray(tenant?.properties) 
      ? tenant.properties[0] 
      : tenant?.properties;

    // 3. Construct response using real database values
    return NextResponse.json({
      profile: {
        full_name: tenant?.full_name || user.user_metadata?.full_name || user.email || '',
        property_name: propertyData?.name || '',
        unit_number: tenant?.unit_number || '',
        caretaker_name: propertyData?.caretaker_name || '',
        caretaker_phone: propertyData?.caretaker_phone || ''
      }
    });
  } catch (err) {
    console.error('Profile API error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}