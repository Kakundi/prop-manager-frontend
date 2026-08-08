import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const cookieStore = await cookies();

    // Create server-side Supabase client using stored cookies
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
              // Ignore in Server Component/API Route context if headers are sent
            }
          },
        },
      }
    );

    // Verify user session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized access. Please log in again." },
        { status: 401 }
      );
    }

    // 1. Fetch properties owned by this specific owner
    const { data: properties, error: propsError } = await supabase
      .from("properties")
      .select("id, name, location, created_at")
      .eq("owner_id", user.id);

    if (propsError) {
      return NextResponse.json({ error: propsError.message }, { status: 500 });
    }

    if (!properties || properties.length === 0) {
      return NextResponse.json({ properties: [] });
    }

    const propertyIds = properties.map((p) => p.id);

    // 2. Fetch all units associated with these properties
    const { data: units, error: unitsError } = await supabase
      .from("units")
      .select("id, property_id, unit_number, status, rent_amount")
      .in("property_id", propertyIds);

    if (unitsError) {
      console.warn("Notice: Could not fetch units directly:", unitsError.message);
    }

    // 3. Fetch financial invoices for metrics calculations
    const { data: invoices, error: invError } = await supabase
      .from("invoices")
      .select("id, property_id, amount, status")
      .in("property_id", propertyIds);

    if (invError) {
      console.warn("Notice: Could not fetch invoices:", invError.message);
    }

    // Map units and invoices back to their respective properties
    const propertyOverview = properties.map((prop) => {
      const propUnits = (units || []).filter((u) => u.property_id === prop.id);
      const propInvoices = (invoices || []).filter((i) => i.property_id === prop.id);

      const totalUnits = propUnits.length;
      const occupiedUnits = propUnits.filter((u) => u.status === "occupied").length;
      const vacantUnits = totalUnits - occupiedUnits;
      const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

      const totalExpectedIncome = propUnits.reduce(
        (sum, u) => sum + Number(u.rent_amount || 0),
        0
      );

      const paidInvoicesAmount = propInvoices
        .filter((i) => i.status === "paid")
        .reduce((sum, i) => sum + Number(i.amount || 0), 0);

      const pendingInvoicesAmount = propInvoices
        .filter((i) => i.status === "unpaid" || i.status === "pending")
        .reduce((sum, i) => sum + Number(i.amount || 0), 0);

      return {
        propertyId: prop.id,
        propertyName: prop.name,
        location: prop.location || "N/A",
        units: propUnits,
        totalUnits,
        occupiedUnits,
        vacantUnits,
        occupancyRate,
        totalExpectedIncome,
        paidInvoicesAmount,
        pendingInvoicesAmount,
      };
    });

    return NextResponse.json({ properties: propertyOverview });
  } catch (err: any) {
    console.error("Dashboard Overview Endpoint Error:", err);
    return NextResponse.json(
      { error: err.message || "An unexpected error occurred." },
      { status: 500 }
    );
  }
}