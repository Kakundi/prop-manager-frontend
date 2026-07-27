"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleDemoLogin(email: string) {
    setLoading(true);
    setErrorMessage(null);

    try {
      // Calls Postgres directly over REST — NO GoTrue, NO /auth/v1/token!
      const { data, error } = await supabase.rpc("demo_login", {
        login_email: email,
      });

      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }

      // Store profile in localStorage or state for your dashboard session
      localStorage.setItem("user_session", JSON.stringify(data));

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to authenticate.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-xl p-6 text-center shadow-2xl">
        <h1 className="text-2xl font-bold text-blue-400 mb-1">PropManager HQ</h1>
        <p className="text-xs text-slate-400 mb-6">Supabase RPC Direct Auth</p>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded text-red-200 text-xs">
            {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <button
            onClick={() => handleDemoLogin("admin@demo.com")}
            disabled={loading}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs rounded border border-slate-700 transition"
          >
            Super Admin
          </button>
          <button
            onClick={() => handleDemoLogin("landlord1@demo.com")}
            disabled={loading}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs rounded border border-slate-700 transition"
          >
            Landlord
          </button>
          <button
            onClick={() => handleDemoLogin("manager1@demo.com")}
            disabled={loading}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs rounded border border-slate-700 transition"
          >
            Property Mgr
          </button>
          <button
            onClick={() => handleDemoLogin("caretaker1@demo.com")}
            disabled={loading}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs rounded border border-slate-700 transition"
          >
            Caretaker
          </button>
          <button
            onClick={() => handleDemoLogin("tenant1@demo.com")}
            disabled={loading}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs rounded border border-slate-700 transition"
          >
            Tenant (A101)
          </button>
        </div>
      </div>
    </div>
  );
}