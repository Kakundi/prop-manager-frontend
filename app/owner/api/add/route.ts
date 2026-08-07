import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

async function getSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
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
            // The `setAll` method was called from a Server Component or API Route.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  );
}

export async function POST(req: Request) {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized user session.' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { property, unit } = body;

    let propertyId: string;

    const { data: existingProp } = await supabase
      .from('properties')
      .select('id')
      .eq('owner_id', user.id)
      .ilike('name', property.name.trim())
      .single();

    if (existingProp) {
      propertyId = existingProp.id;
    } else {
      const { data: newProp, error: propError } = await supabase
        .from('properties')
        .insert({
          owner_id: user.id,
          name: property.name.trim(),
          location: property.location,
          water_rate_per_unit: property.water_rate_per_unit,
        })
        .select()
        .single();

      if (propError) throw propError;
      propertyId = newProp.id;
    }

    const { data: newUnit, error: unitError } = await supabase
      .from('units')
      .insert({
        property_id: propertyId,
        unit_number: unit.unit_number.trim(),
        rent_amount: unit.rent_amount,
        garbage_fee: unit.garbage_fee,
        parking_fee: unit.parking_fee,
        water_fee: unit.water_fee,
        is_occupied: false,
      })
      .select()
      .single();

    if (unitError) throw unitError;

    return NextResponse.json({ success: true, unit: newUnit });
  } catch (error: any) {
    console.error('Error in /owner/api/add:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized user session.' },
      { status: 401 }
    );
  }

  const { data: units, error } = await supabase
    .from('units')
    .select(`
      id,
      unit_number,
      rent_amount,
      garbage_fee,
      parking_fee,
      water_fee,
      is_occupied,
      properties!inner (
        id,
        name,
        location,
        water_rate_per_unit,
        owner_id
      )
    `)
    .eq('properties.owner_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ units });
}