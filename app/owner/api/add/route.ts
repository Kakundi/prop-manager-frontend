import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// GET Handler: Fetches all units & linked properties for the logged-in owner
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
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized session' }, { status: 401 });
    }

    // Query units and join the parent property details
    const { data: units, error } = await supabase
      .from('units')
      .select(`
        id,
        unit_number,
        rent_amount,
        garbage_fee,
        parking_fee,
        water_fee,
        properties!inner (
          id,
          name,
          location,
          water_rate_per_unit,
          owner_id
        )
      `)
      .eq('properties.owner_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ units }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST Handler: Inserts/Reuses property and creates the unit
export async function POST(req: Request) {
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
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized user session.' }, { status: 401 });
    }

    const { property, unit } = await req.json();

    let propertyId: string;

    // Check if property with this name already exists for this owner
    const { data: existingProp } = await supabase
      .from('properties')
      .select('id')
      .eq('name', property.name)
      .eq('owner_id', user.id)
      .maybeSingle();

    if (existingProp) {
      propertyId = existingProp.id;
    } else {
      // Create new property record
      const { data: newProp, error: propErr } = await supabase
        .from('properties')
        .insert({
          name: property.name,
          location: property.location,
          owner_id: user.id,
          water_rate_per_unit: property.water_rate_per_unit,
        })
        .select('id')
        .single();

      if (propErr) {
        return NextResponse.json({ error: `Property Error: ${propErr.message}` }, { status: 400 });
      }
      propertyId = newProp.id;
    }

    // Insert unit record linked via property_id
    const { data: newUnit, error: unitErr } = await supabase
      .from('units')
      .insert({
        property_id: propertyId,
        unit_number: unit.unit_number,
        rent_amount: unit.rent_amount,
        garbage_fee: unit.garbage_fee,
        parking_fee: unit.parking_fee,
        water_fee: unit.water_fee,
      })
      .select()
      .single();

    if (unitErr) {
      return NextResponse.json({ error: `Unit Error: ${unitErr.message}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, unit: newUnit }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}