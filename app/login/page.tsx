"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginWithRole } from "@/app/actions/auth";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleDemoLogin(email: string) {
    setLoading(true);
    setErrorMessage(null);

    const result = await loginWithRole(email);

    if (result.success) {
      router.push("/");
      router.refresh();
    } else {
      setErrorMessage(result.error || "Login failed");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl text-center">
        <h1 className="text-2xl font-bold text-blue-400 mb-2">PropManager HQ</h1>
        <p className="text-xs text-slate-400 mb-6">Select a demo role to log in instantly</p>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded text-red-200 text-xs">
            {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <button
            onClick={() => handleDemoLogin("admin@demo.com")}
            disabled={loading}
            className="px-3 py-3 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded border border-slate-700 transition"
          >
            Super Admin
          </button>
          <button
            onClick={() => handleDemoLogin("landlord1@demo.com")}
            disabled={loading}
            className="px-3 py-3 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded border border-slate-700 transition"
          >
            Landlord
          </button>
          <button
            onClick={() => handleDemoLogin("manager1@demo.com")}
            disabled={loading}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded border border-slate-700 transition"
          >
            Property Mgr
          </button>
          <button
            onClick={() => handleDemoLogin("caretaker1@demo.com")}
            disabled={loading}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded border border-slate-700 transition"
          >
            Caretaker
          </button>
          <button
            onClick={() => handleDemoLogin("tenant1@demo.com")}
            disabled={loading}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded border border-slate-700 transition"
          >
            Tenant (A101)
          </button>
        </div>
      </div>
    </div>
  );
}