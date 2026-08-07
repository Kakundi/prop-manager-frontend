import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

async function getSupabaseServerClient(request: NextRequest) {
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
          } catch {}
        },
      },
    }
  );
}

async function getAuthenticatedUser(request: NextRequest, supabase: any) {
  // 1. Try standard cookie session
  const { data: { user } } = await supabase.auth.getUser();
  if (user) return user;

  // 2. Fallback: Check for Bearer token in request headers
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    const { data: { user: tokenUser } } = await supabase.auth.getUser(token);
    if (tokenUser) return tokenUser;
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient(request);
    const user = await getAuthenticatedUser(request, supabase);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    // Query properties for the logged-in owner
    const { data: properties, error } = await supabase
      .from("properties")
      .select(`
        id,
        name,
        location,
        water_rate_per_unit,
        owner_id,
        units (
          id,
          property_id,
          unit_number,
          rent_amount,
          garbage_fee,
          parking_fee,
          water_fee,
          is_occupied
        )
      `)
      .eq("owner_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ properties: properties || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient(request);
    const user = await getAuthenticatedUser(request, supabase);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await request.json();
    const {
      propertyName,
      location,
      waterRate,
      unitNumber,
      rentAmount,
      garbageFee,
      parkingFee,
      waterFee,
    } = body;

    if (!propertyName || !unitNumber || !rentAmount) {
      return NextResponse.json(
        { error: "Property name, unit number, and rent amount are required." },
        { status: 400 }
      );
    }

    // 1. Find existing property by name & owner OR create new property
    let propertyId: string;

    const { data: existingProp } = await supabase
      .from("properties")
      .select("id")
      .eq("owner_id", user.id)
      .ilike("name", propertyName)
      .maybeSingle();

    if (existingProp) {
      propertyId = existingProp.id;
    } else {
      const { data: newProp, error: propErr } = await supabase
        .from("properties")
        .insert({
          owner_id: user.id,
          name: propertyName,
          location: location || "",
          water_rate_per_unit: waterRate || 0,
        })
        .select("id")
        .single();

      if (propErr || !newProp) {
        return NextResponse.json(
          { error: propErr?.message || "Failed to create property." },
          { status: 500 }
        );
      }
      propertyId = newProp.id;
    }

    // 2. Insert the unit associated with the property
    const { error: unitErr } = await supabase.from("units").insert({
      property_id: propertyId,
      unit_number: unitNumber,
      rent_amount: rentAmount,
      garbage_fee: garbageFee || 0,
      parking_fee: parkingFee || 0,
      water_fee: waterFee || 0,
      is_occupied: false,
    });

    if (unitErr) {
      return NextResponse.json({ error: unitErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, propertyId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}