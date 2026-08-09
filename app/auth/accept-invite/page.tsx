'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export default function AcceptInvitePage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const queryError = searchParams.get('error');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    if (queryError) {
      setError('Invalid or expired invitation link. Please request a new invite.');
      return;
    }

    // Verify session established by callback route
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setUserEmail(session.user.email ?? null);
      } else {
        setError('Invalid or expired invitation link. Please request a new invite.');
      }
    }

    checkSession();
  }, [supabase, queryError]);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      setLoading(false);
      return;
    }

    // Set the password for the currently authenticated invited user
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    // Password updated successfully -> redirect to dashboard
    router.push('/dashboard');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-md border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Complete Account Setup</h1>
        {userEmail && (
          <p className="text-sm text-gray-600 mb-6">
            Setting up account for <span className="font-semibold">{userEmail}</span>
          </p>
        )}

        {error ? (
          <div className="p-4 mb-4 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
            {error}
          </div>
        ) : (
          <form onSubmit={handleSetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !userEmail}
              className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Saving Password...' : 'Save Password & Enter App'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}