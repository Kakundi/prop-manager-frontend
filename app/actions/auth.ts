"use server";

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// Admin client that bypasses client auth triggers & RLS limits
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function loginWithRole(email: string) {
  try {
    // 1. Fetch user directly from public.profiles
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !profile) {
      return { success: false, error: "Demo user profile not found." };
    }

    // 2. Set a secure demo HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set("demo_session", JSON.stringify(profile), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
    });

    return { success: true, profile };
  } catch (err: any) {
    return { success: false, error: err.message || "Authentication error" };
  }
}