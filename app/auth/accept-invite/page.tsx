'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabaseClient';

export default function AcceptInvitePage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // 1. Verify and capture session established from URL hash fragment
    const checkSession = async () => {
      const {
        data: { session },
        error: getSessionError,
      } = await supabase.auth.getSession();

      if (getSessionError || !session) {
        // Listen for auth state change during asynchronous token exchange
        const { data: authListener } = supabase.auth.onAuthStateChange(
          (event, newSession) => {
            if (event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY' || newSession) {
              setSessionError(null);
              setInitializing(false);
            }
          }
        );

        // Buffer check for hash parsing completion
        const timeout = setTimeout(async () => {
          const {
            data: { session: recheckedSession },
          } = await supabase.auth.getSession();
          if (!recheckedSession) {
            setSessionError(
              'Invite link session is missing or expired. Please request a new invitation.'
            );
          }
          setInitializing(false);
        }, 1000);

        return () => {
          clearTimeout(timeout);
          authListener.subscription.unsubscribe();
        };
      } else {
        setInitializing(false);
      }
    };

    checkSession();
  }, [supabase]);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setError(null);

    // 2. Update user password (this updates session cookies automatically via @supabase/ssr)
    const {
      data: { user },
      error: updateError,
    } = await supabase.auth.updateUser({
      password,
    });

    if (updateError || !user) {
      setError(updateError?.message || 'Failed to set password.');
      setLoading(false);
      return;
    }

    // 3. Mark user status active in profiles database table
    await supabase
      .from('profiles')
      .update({ status: 'active' })
      .eq('id', user.id);

    // 4. Force router refresh so SSR middleware reads updated session cookies instantly
    router.refresh();

    // 5. Route user based on their assigned metadata role
    const userRole = user.user_metadata?.role || 'tenant';

    switch (userRole) {
      case 'owner':
        router.push('/owner/dashboard');
        break;
      case 'property_manager':
        router.push('/manager/dashboard');
        break;
      case 'caretaker':
        router.push('/caretaker/dashboard');
        break;
      default:
        router.push('/tenant/dashboard');
        break;
    }
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md text-center border border-gray-100">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
          <p className="text-gray-500 text-sm mt-4 font-medium">
            Verifying invitation token...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md border border-gray-100">
        {/* Branding & Heading Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            PropManager HQ
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Complete account setup & set your password
          </p>
        </div>

        {sessionError ? (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg text-sm text-center">
            <p className="font-medium">{sessionError}</p>
            <button
              onClick={() => router.push('/login')}
              className="mt-3 text-xs text-blue-600 hover:underline font-semibold"
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSetPassword} className="space-y-4">
            {/* New Password Input with Show/Hide Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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

            {/* Confirm Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Global Error Banner */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-xs font-medium">
                {error}
              </div>
            )}

            {/* Submit Action */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {loading ? 'Activating Account...' : 'Set Password & Access Portal'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}