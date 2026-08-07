import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

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
          } catch {}
        },
      },
    }
  );
}

async function getAuthenticatedUserAndClient(request: NextRequest) {
  // 1. Check for Bearer token in request headers
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];

    const bearerClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    const { data: { user } } = await bearerClient.auth.getUser(token);
    if (user) {
      return { user, supabase: bearerClient };
    }
  }

  // 2. Fallback: Cookie-based auth
  const serverClient = await getSupabaseServerClient();
  const { data: { user } } = await serverClient.auth.getUser();
  if (user) {
    return { user, supabase: serverClient };
  }

  return { user: null, supabase: null };
}

export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await getAuthenticatedUserAndClient(request);

    if (!user || !supabase) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    // Query properties for the logged-in owner
    const { data: properties, error } = await supabase
      .from("properties")
      .select(`
        id,
        name,
        location,
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
    const { user, supabase } = await getAuthenticatedUserAndClient(request);

    if (!user || !supabase) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await request.json();
    const {
      propertyName,
      location,
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
      rent_amount: Number(rentAmount),
      garbage_fee: garbageFee === null || garbageFee === undefined ? null : Number(garbageFee),
      parking_fee: parkingFee === null || parkingFee === undefined ? null : Number(parkingFee),
      water_fee: waterFee === null || waterFee === undefined ? null : Number(waterFee),
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

export async function PUT(request: NextRequest) {
  try {
    const { user, supabase } = await getAuthenticatedUserAndClient(request);

    if (!user || !supabase) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await request.json();
    const {
      unitId,
      unitNumber,
      rentAmount,
      garbageFee,
      parkingFee,
      waterFee,
    } = body;

    if (!unitId) {
      return NextResponse.json({ error: "Unit ID is required for updates." }, { status: 400 });
    }

    // Verify ownership
    const { data: unit, error: fetchErr } = await supabase
      .from("units")
      .select("id, properties!inner(owner_id)")
      .eq("id", unitId)
      .single();

    if (fetchErr || !unit) {
      return NextResponse.json({ error: "Unit not found or access denied." }, { status: 404 });
    }

    // Update the unit fields
    const { error: updateErr } = await supabase
      .from("units")
      .update({
        unit_number: unitNumber,
        rent_amount: Number(rentAmount),
        garbage_fee: garbageFee === null || garbageFee === undefined ? null : Number(garbageFee),
        parking_fee: parkingFee === null || parkingFee === undefined ? null : Number(parkingFee),
        water_fee: waterFee === null || waterFee === undefined ? null : Number(waterFee),
      })
      .eq("id", unitId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}