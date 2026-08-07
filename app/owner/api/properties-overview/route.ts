import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
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
          } catch {}
        },
      },
    }
  );

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch properties belonging to logged in user
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

  // Debug fallback: If empty by owner_id, return all properties to verify RLS vs ID mismatch
  if (!properties || properties.length === 0) {
    const { data: allProps } = await supabase
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
      `);
      
    return NextResponse.json({
      properties: allProps || [],
      debugNote: "Falling back to all properties due to owner_id filter discrepancy",
      currentUserId: user.id
    });
  }

  return NextResponse.json({ properties });
}