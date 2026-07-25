'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleDemoLogin(demoEmail: string, roleName: string, fullName: string) {
    setEmail(demoEmail);
    setPassword('Password123!');
    await executeAuth(demoEmail, 'Password123!', roleName, fullName);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await executeAuth(email, password, 'TENANT', 'Demo User');
  }

  async function executeAuth(
    loginEmail: string,
    loginPass: string,
    roleName: string = 'TENANT',
    fullName: string = 'Demo User'
  ) {
    setLoading(true);
    setErrorMessage(null);

    try {
      // 1. Attempt Sign In
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPass,
      });

      if (!signInError && signInData?.session) {
        router.push('/');
        return;
      }

      // 2. Fallback: Attempt Sign Up if user not found / hash mismatch
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
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
        setErrorMessage(msg !== '{}' ? msg : 'Authentication failed. Please check network or Supabase config.');
        setLoading(false);
        return;
      }

      // 3. Upsert Profile
      if (signUpData?.user) {
        await supabase.from('profiles').upsert({
          id: signUpData.user.id,
          email: loginEmail,
          full_name: fullName,
          role: roleName,
        });
      }

      if (signUpData?.session) {
        router.push('/');
      } else {
        // Retry one last sign-in
        const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password: loginPass,
        });

        if (retryData?.session) {
          router.push('/');
        } else {
          const retryMsg = retryError?.message || 'Check email verification settings in Supabase.';
          setErrorMessage(retryMsg);
          setLoading(false);
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unexpected network error occurred.');
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
          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
            Pass: Password123!
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
          <button
            type="button"
            onClick={() => handleDemoLogin('admin@demo.com', 'SUPER_ADMIN', 'Chief System Admin')}
            className="p-2 bg-purple-900/40 hover:bg-purple-800/60 border border-purple-700/50 rounded text-purple-200 font-semibold transition"
          >
            Super Admin
          </button>
          <button
            type="button"
            onClick={() => handleDemoLogin('landlord1@demo.com', 'LANDLORD', 'Dr. Peter Ndegwa')}
            className="p-2 bg-blue-900/40 hover:bg-blue-800/60 border border-blue-700/50 rounded text-blue-200 font-semibold transition"
          >
            Landlord
          </button>
          <button
            type="button"
            onClick={() => handleDemoLogin('manager1@demo.com', 'PROPERTY_MANAGER', 'David Ochieng')}
            className="p-2 bg-indigo-900/40 hover:bg-indigo-800/60 border border-indigo-700/50 rounded text-indigo-200 font-semibold transition"
          >
            Property Mgr
          </button>
          <button
            type="button"
            onClick={() => handleDemoLogin('caretaker1@demo.com', 'CARETAKER', 'Samuel Otieno')}
            className="p-2 bg-amber-900/40 hover:bg-amber-800/60 border border-amber-700/50 rounded text-amber-200 font-semibold transition"
          >
            Caretaker
          </button>
          <button
            type="button"
            onClick={() => handleDemoLogin('tenant1@demo.com', 'TENANT', 'Brian Kakundi')}
            className="p-2 bg-emerald-900/40 hover:bg-emerald-800/60 border border-emerald-700/50 rounded text-emerald-200 font-semibold transition col-span-2 md:col-span-1"
          >
            Tenant (A101)
          </button>
        </div>
      </div>

      {/* LOGIN FORM */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-blue-400">PropManager HQ</h1>
          <p className="text-xs text-gray-400 mt-1">
            Authenticating against Supabase Auth & RLS Policies
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-700 text-red-200 text-xs rounded font-medium">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. tenant1@demo.com"
              className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 font-bold rounded text-white transition disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}