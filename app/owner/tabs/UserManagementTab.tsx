'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { Loader2, ShieldCheck, UserPlus } from 'lucide-react';

interface StaffUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

export const UserManagementTab: React.FC = () => {
  const supabase = createClient();
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name, email, role')
          .eq('assigned_owner_id', user.id);

        setUsers(data || []);
      }
      setLoading(false);
    }
    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Caretakers & Staff Management</h2>
          <p className="text-xs text-gray-500">Manage delegates assigned to manage your properties.</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase font-medium border-b border-gray-200">
              <th className="px-6 py-3">Full Name</th>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">Assigned Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-sm">
            {users.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                  No caretakers or staff assigned under your owner profile.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{u.full_name}</td>
                  <td className="px-6 py-4 text-gray-500">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {u.role}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};