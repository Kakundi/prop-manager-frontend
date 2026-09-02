'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function AcceptInviteForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  
  const [pageError, setPageError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const queryError = searchParams.get('error');

  useEffect(() => {
    if (queryError) {
      setPageError('Invalid or expired invitation link. Please request a new invite.');
      setInitLoading(false);
      return;
    }

    async function checkSession() {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (user && !userError) {
        setUserEmail(user.email ?? null);
      } else {
        setPageError('Invalid or expired invitation link. Please request a new invite.');
      }
      setInitLoading(false);
    }

    checkSession();
  }, [queryError]);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    // 1. Update the password in Supabase Auth
    const {
      data: { user },
      error: updateError,
    } = await supabase.auth.updateUser({
      password,
    });

    if (updateError || !user) {
      setFormError(updateError?.message || 'Failed to set password.');
      setLoading(false);
      return;
    }

    // 2. Mark profile status as active
    await supabase
      .from('profiles')
      .update({ status: 'active' })
      .eq('id', user.id);

    // 3. Sign out session so user must log in manually
    await supabase.auth.signOut();

    // 4. Redirect to Sign-In page with a success message
    router.push('/login?message=Account activated! Please sign in with your new password.');
  };

  if (initLoading) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md border border-gray-100 text-center text-sm text-gray-500">
        Verifying invitation link...
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md border border-gray-100">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">PropManager HQ</h1>
        <p className="text-sm text-gray-600 mt-1">Complete account setup & set your password</p>
        {userEmail && (
          <p className="text-xs text-blue-600 font-medium mt-1.5">{userEmail}</p>
        )}
      </div>

      {pageError ? (
        <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-xs font-medium text-center">
          {pageError}
        </div>
      ) : (
        <form onSubmit={handleSetPassword} className="space-y-4">
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-xs font-medium text-center mb-3">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-semibold text-gray-500 hover:text-gray-700"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !userEmail}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm disabled:opacity-50 transition"
          >
            {loading ? 'Activating Account...' : 'Set Password & Go to Sign In'}
          </button>
        </form>
      )}
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <Suspense fallback={<div className="text-sm text-gray-500">Loading form...</div>}>
        <AcceptInviteForm />
      </Suspense>
    </div>
  );
}