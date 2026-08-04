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

    // 1. Get current authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('❌ AUTH ERROR OR NO USER SESSION:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔍 QUERYING PROFILES FOR USER ID:', user.id);

    // 2. Fetch full_name from 'profiles' table
    const { data: profileRow, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('❌ PROFILES TABLE QUERY ERROR:', profileError.message);
    } else {
      console.log('✅ PROFILES ROW FOUND:', profileRow);
    }

    // 3. Query unit/property details from 'tenants' table if available
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

    // Resolve name: prioritize profileRow.full_name -> auth metadata -> email prefix
    const resolvedName =
      profileRow?.full_name ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'Tenant';

    return NextResponse.json({
      profile: {
        full_name: resolvedName,
        property_name: propertyData?.name || '',
        unit_number: tenantRow?.unit_number || '',
        caretaker_name: propertyData?.caretaker_name || '',
        caretaker_phone: propertyData?.caretaker_phone || ''
      }
    });
  } catch (err) {
    console.error('❌ CRASH IN PROFILE API:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}