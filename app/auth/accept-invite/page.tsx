// app/auth/accept-invite/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabaseClient';

export default function AcceptInvitePage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const supabase = createClient();

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);

    // 1. Update the password for the active invited user session
    const { data: { user }, error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError || !user) {
      setError(updateError?.message || 'Failed to set password.');
      setLoading(false);
      return;
    }

    // 2. Read the user's assigned role from metadata
    const userRole = user.user_metadata?.role || 'tenant';

    // 3. Dynamically route to their role-specific dashboard
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

  return (
    <div className="max-w-md mx-auto mt-16 p-6 border rounded-lg shadow-sm">
      <h2 className="text-xl font-bold mb-4">Complete Account Setup</h2>
      <p className="text-sm text-gray-600 mb-6">
        Please set a password to activate your account.
      </p>

      <form onSubmit={handleSetPassword} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">New Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-2 border rounded"
            minLength={6}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full p-2 border rounded"
            minLength={6}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Activating Account...' : 'Set Password & Continue'}
        </button>
      </form>
    </div>
  );
}