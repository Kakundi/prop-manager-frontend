'use client';

import React, { useState } from 'react';
import { UserPlus, Mail, CheckCircle } from 'lucide-react';

export const AddTenantTab: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [unitNumber, setUnitNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const availableUnits = ['Apt 1A', 'Apt 1B', 'Apt 2A', 'Apt 2B', 'Apt 3A'];

  const handleInviteTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg(null);

    try {
      const res = await fetch('/property-manager/api/invite-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          email,
          phone,
          role: 'tenant',
          unit_number: unitNumber,
        }),
      });

      if (!res.ok) throw new Error('Failed to send verification link.');

      setSuccessMsg(`Verification link successfully emailed to ${email}`);
      setFullName('');
      setEmail('');
      setPhone('');
      setUnitNumber('');
    } catch (err: any) {
      alert(err.message || 'Error triggering invite email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl bg-white p-8 rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
          <UserPlus size={22} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Add New Tenant</h2>
          <p className="text-sm text-gray-500">
            Assign tenants to units and send verification links for password creation.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm mb-6 flex items-center gap-2">
          <CheckCircle size={18} /> {successMsg}
        </div>
      )}

      <form onSubmit={handleInviteTenant} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Tenant Full Name
          </label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Jane Doe"
            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+254 712 345678"
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Assign Unit
          </label>
          <select
            required
            value={unitNumber}
            onChange={(e) => setUnitNumber(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
          >
            <option value="">-- Select Unit --</option>
            {availableUnits.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Mail size={18} />
          {loading ? 'Sending Verification Link...' : 'Send Verification Link & Register Tenant'}
        </button>
      </form>
    </div>
  );
};