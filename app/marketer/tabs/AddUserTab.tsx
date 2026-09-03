// app/marketer/tabs/AddUserTab.tsx
'use client';

import React, { useState } from 'react';
import { UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';

export const AddUserTab: React.FC = () => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'agent' | 'property_manager' | 'accountant'>('agent');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Add your user invite logic / Supabase function here
      setMessage({ type: 'success', text: `User ${fullName} invited successfully.` });
      setEmail('');
      setFullName('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to invite user.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <UserPlus size={20} className="text-amber-500" />
          Add / Invite User
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Invite new team members or agents to manage property workflows.
        </p>
      </div>

      {message && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-medium text-gray-700 mb-1">Full Name</label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="John Doe"
            className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div>
          <label className="block font-medium text-gray-700 mb-1">Email Address</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div>
          <label className="block font-medium text-gray-700 mb-1">Assign Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="agent">Agent</option>
            <option value="property_manager">Property Manager</option>
            <option value="accountant">Accountant</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition disabled:opacity-50"
        >
          {loading ? 'Sending Invitation...' : 'Invite User'}
        </button>
      </form>
    </div>
  );
};