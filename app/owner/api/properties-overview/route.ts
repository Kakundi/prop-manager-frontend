import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// Admin Client with Service Role Key for elevated auth actions
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getAuthenticatedOwner() {
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

  const { data: { user } } = await supabase.auth.getUser();
  return { user, supabase };
}

// GET: Retrieve all users assigned to the logged-in owner's properties
export async function GET() {
  try {
    const { user, supabase } = await getAuthenticatedOwner();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    // Get properties owned by this owner
    const { data: ownerProps } = await supabase
      .from("properties")
      .select("id, name")
      .eq("owner_id", user.id);

    if (!ownerProps || ownerProps.length === 0) {
      return NextResponse.json({ users: [] });
    }

    const propIds = ownerProps.map((p) => p.id);

    // Fetch user profiles assigned to those properties
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, phone, role, property_id, unit_number, email_confirmed_at, created_at")
      .in("property_id", propIds);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const propMap = new Map(ownerProps.map((p) => [p.id, p.name]));

    const users = (profiles || []).map((usr) => ({
      id: usr.id,
      full_name: usr.full_name,
      email: usr.email,
      phone: usr.phone,
      role: usr.role,
      property_id: usr.property_id,
      property_name: propMap.get(usr.property_id) || "N/A",
      unit_number: usr.unit_number || "N/A (All Building)",
      status: usr.email_confirmed_at ? "active" : "pending",
      invited_at: new Date(usr.created_at).toLocaleDateString(),
    }));

    return NextResponse.json({ users });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

// POST: Trigger invitation link & insert profile record
export async function POST(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedOwner();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await request.json();
    const { full_name, email, phone, role, property_id, unit_number } = body;

    if (!full_name || !email || !role || !property_id) {
      return NextResponse.json(
        { error: "Full name, email, role, and property selection are required." },
        { status: 400 }
      );
    }

    // Send invitation email via Supabase Auth Admin
    const { data: authData, error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo: "http://localhost:3000/auth/confirm-password",
        data: {
          full_name,
          phone,
          role,
          property_id,
          unit_number: unit_number || null,
        },
      }
    );

    if (inviteErr) {
      return NextResponse.json({ error: inviteErr.message }, { status: 500 });
    }

    // Insert user record into public profiles table linked to the property
    const { error: profileErr } = await supabaseAdmin.from("profiles").upsert({
      id: authData.user.id,
      full_name,
      email,
      phone,
      role,
      property_id,
      unit_number: unit_number || null,
      created_at: new Date().toISOString(),
    });

    if (profileErr) {
      console.warn("Profile table insert warning:", profileErr.message);
    }

    return NextResponse.json({ success: true, user: authData.user });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}