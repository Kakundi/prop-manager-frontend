"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client"; // Adjust import path if needed

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleDemoLogin(
    demoEmail: string,
    roleName: string,
    fullName: string
  ) {
    setEmail(demoEmail);
    setPassword("Password123!");
    await executeAuth(demoEmail, "Password123!", roleName, fullName);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await executeAuth(email, password, "TENANT", "Demo User");
  }

  async function executeAuth(
    loginEmail: string,
    loginPass: string,
    roleName: string = "TENANT",
    fullName: string = "Demo User"
  ) {
    setLoading(true);
    setErrorMessage(null);

    try {
      // 1. Primary Attempt: Standard Sign In
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: loginEmail,
          password: loginPass,
        });

      if (!signInError && signInData?.session) {
        router.push("/");
        return;
      }

      // 2. Fallback Attempt: Sign Up if account isn't registered yet
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email: loginEmail,
          password: loginPass,
          options: {
            data: {
              full_name: fullName,
              role: roleName,
            },
          },
        });

      if (signUpError) {
        const msg = signUpError.message || JSON.stringify(signUpError);
        setErrorMessage(
          msg !== "{}"
            ? msg
            : "Authentication failed. Please check network or Supabase config."
        );
        setLoading(false);
        return;
      }

      // 3. Ensure User Profile exists in public.profiles
      if (signUpData?.user) {
        await supabase.from("profiles").upsert({
          id: signUpData.user.id,
          email: loginEmail,
          full_name: fullName,
          role: roleName,
        });
      }

      if (signUpData?.session) {
        router.push("/");
      } else {
        // If email confirmation is required, attempt one final sign-in
        const { data: retryData, error: retryError } =
          await supabase.auth.signInWithPassword({
            email: loginEmail,
            password: loginPass,
          });

        if (retryData?.session) {
          router.push("/");
        } else {
          setErrorMessage(
            retryError?.message ||
              "Check email verification settings in Supabase."
          );
          setLoading(false);
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Unexpected network error occurred.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-4">
      {/* 1-CLICK QUICK DEMO SWITCHER BAR */}
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6 shadow-xl">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
            🎬 Quick Demo Mode Switcher
          </span>
          <span className="text-xs text-slate-400 font-mono">
            Pass: Password123!
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <button
            onClick={() =>
              handleDemoLogin("admin@demo.com", "SUPER_ADMIN", "Chief Admin")
            }
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs rounded border border-slate-700 text-slate-200 transition text-center"
          >
            Super Admin
          </button>
          <button
            onClick={() =>
              handleDemoLogin(
                "landlord1@demo.com",
                "LANDLORD",
                "Dr. Peter Ndegwa"
              )
            }
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs rounded border border-slate-700 text-slate-200 transition text-center"
          >
            Landlord
          </button>
          <button
            onClick={() =>
              handleDemoLogin(
                "manager1@demo.com",
                "PROPERTY_MANAGER",
                "David Ochieng"
              )
            }
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs rounded border border-slate-700 text-slate-200 transition text-center"
          >
            Property Mgr
          </button>
          <button
            onClick={() =>
              handleDemoLogin(
                "caretaker1@demo.com",
                "CARETAKER",
                "Samuel Otieno"
              )
            }
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs rounded border border-slate-700 text-slate-200 transition text-center"
          >
            Caretaker
          </button>
          <button
            onClick={() =>
              handleDemoLogin("tenant1@demo.com", "TENANT", "Brian Kakundi")
            }
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs rounded border border-slate-700 text-slate-200 transition text-center"
          >
            Tenant (A101)
          </button>
        </div>
      </div>

      {/* LOGIN FORM */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-blue-400">PropManager HQ</h1>
          <p className="text-xs text-slate-400 mt-1">
            Authenticating against Supabase Auth & RLS Policies
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded text-red-200 text-xs text-center">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-sm text-white focus:outline-none focus:border-blue-500"
              placeholder="user@demo.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-sm text-white focus:outline-none focus:border-blue-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 font-bold rounded text-white transition disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Sign In to Dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
}