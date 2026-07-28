"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";

type RoleType =
  | "SUPER_ADMIN"
  | "LANDLORD"
  | "PROPERTY_MANAGER"
  | "CARETAKER"
  | "TENANT";

export default function SignUpPage() {
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<RoleType>("TENANT");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // 1. Sign up user via Supabase Auth & attach profile metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/signin`,
          data: {
            full_name: fullName,
            role: role,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Ensure record exists in public.profiles table
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: authData.user.id,
          email: email,
          full_name: fullName,
          phone: phone,
          role: role,
        });

        if (profileError) throw profileError;

        setSuccessMsg(
          "Registration successful! Please check your temporary or permanent email inbox to verify your account before logging in."
        );
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-blue-400">PropManager HQ</h1>
          <p className="text-xs text-slate-400 mt-1">
            Create an account with designated system permissions
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-950/80 border border-red-500/50 rounded-lg text-red-200 text-xs">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-4 bg-emerald-950/80 border border-emerald-500/50 rounded-lg text-emerald-200 text-xs leading-relaxed">
            {successMsg}
          </div>
        )}

        {!successMsg && (
          <form onSubmit={handleSignUp} className="space-y-4 text-xs">
            <div>
              <label className="block mb-1 text-slate-300 font-medium">
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Jane Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md focus:outline-none focus:border-blue-500 text-slate-100"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-slate-300 font-medium">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. tenant@temp-mail.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md focus:outline-none focus:border-blue-500 text-slate-100"
                />
              </div>

              <div>
                <label className="block mb-1 text-slate-300 font-medium">
                  Phone Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. +254712345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md focus:outline-none focus:border-blue-500 text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-slate-300 font-medium">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md focus:outline-none focus:border-blue-500 text-slate-100"
                />
              </div>

              <div>
                <label className="block mb-1 text-slate-300 font-medium">
                  System Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as RoleType)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md focus:outline-none focus:border-blue-500 text-slate-100"
                >
                  <option value="TENANT">Tenant</option>
                  <option value="CARETAKER">Caretaker</option>
                  <option value="PROPERTY_MANAGER">Property Manager</option>
                  <option value="LANDLORD">Property Owner</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-md transition disabled:opacity-50 text-xs mt-4"
            >
              {loading ? "Registering..." : "Create Account"}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-xs text-slate-400">
          Already have an account?{" "}
          <Link href="/signin" className="text-blue-400 hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}