'use client';

import React, { useState } from 'react';
import { UserPlus, UserCheck, Shield, Home, Mail, CheckCircle, Clock } from 'lucide-react';
import { UserRole, PropertyOption, ManagedUser } from '../types';

export const UserManagementTab: React.FC = () => {
  // Mock properties list assigned to this Property Manager
  const availableProperties: PropertyOption[] = [
    {
      id: 'prop_1',
      name: 'Sunset Heights Apartments',
      units: ['Apt 1A', 'Apt 1B', 'Apt 2A', 'Apt 2B', 'Apt 3A', 'Apt 3B'],
    },
    {
      id: 'prop_2',
      name: 'Oceanview Villas',
      units: ['Villa 1', 'Villa 2', 'Villa 3', 'Villa 4'],
    },
  ];

  // Initial user list state
  const [users, setUsers] = useState<ManagedUser[]>([
    {
      id: 'usr_1',
      full_name: 'David Miller',
      email: 'david@example.com',
      phone: '+254 700 111222',
      role: 'caretaker',
      property_id: 'prop_1',
      property_name: 'Sunset Heights Apartments',
      status: 'active',
      invited_at: '2026-07-28',
    },
    {
      id: 'usr_2',
      full_name: 'Sarah Connor',
      email: 'sarah@example.com',
      phone: '+254 722 333444',
      role: 'tenant',
      property_id: 'prop_1',
      property_name: 'Sunset Heights Apartments',
      unit_number: 'Apt 2B',
      status: 'pending_verification',
      invited_at: '2026-08-01',
    },
  ]);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('tenant');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(availableProperties[0]?.id || '');
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const currentProperty = availableProperties.find((p) => p.id === selectedPropertyId);

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      // Call backend route to handle invitation email & auth setup
      const res = await fetch('/property-manager/api/invite-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          email,
          phone,
          role,
          property_id: selectedPropertyId,
          unit_number: role === 'tenant' ? selectedUnit : undefined,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to send invite.');
      }

      // Add to local state
      const newUser: ManagedUser = {
        id: result.user?.id || `usr_${Date.now()}`,
        full_name: fullName,
        email,
        phone,
        role,
        property_id: selectedPropertyId,
        property_name: currentProperty?.name || '',
        unit_number: role === 'tenant' ? selectedUnit : undefined,
        status: 'pending_verification',
        invited_at: new Date().toISOString().split('T')[0],
      };

      setUsers([newUser, ...users]);
      setFeedback({
        type: 'success',
        msg: `Verification link sent successfully to ${email}.`,
      });

      // Reset form
      setFullName('');
      setEmail('');
      setPhone('');
      setSelectedUnit('');
    } catch (err: any) {
      setFeedback({ type: 'error', msg: err.message || 'Something went wrong.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. ADD NEW USER FORM */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <UserPlus size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Add & Assign New User</h2>
            <p className="text-sm text-gray-500">
              Invite a Caretaker or Tenant to your properties. An automated verification link will be emailed to set up their password.
            </p>
          </div>
        </div>

        {feedback && (
          <div
            className={`p-4 rounded-lg text-sm mb-6 ${
              feedback.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {feedback.msg}
          </div>
        )}

        <form onSubmit={handleInviteUser} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Email Address (For Verification)
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
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
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Role Assignment
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="tenant">Tenant</option>
                <option value="caretaker">Caretaker</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Select Building / Property
              </label>
              <select
                value={selectedPropertyId}
                onChange={(e) => {
                  setSelectedPropertyId(e.target.value);
                  setSelectedUnit('');
                }}
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                {availableProperties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {role === 'tenant' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Assign Unit
                </label>
                <select
                  required={role === 'tenant'}
                  value={selectedUnit}
                  onChange={(e) => setSelectedUnit(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="">-- Select Unit --</option>
                  {currentProperty?.units.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Mail size={18} />
            {loading ? 'Sending Verification Link...' : 'Send Verification Link & Add User'}
          </button>
        </form>
      </div>

      {/* 2. ASSIGNED USERS DIRECTORY */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-800">Managed Users & Roles</h3>
          <p className="text-sm text-gray-500">
            Caretakers and Tenants currently assigned to your properties.
          </p>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
              <th className="p-4">User</th>
              <th className="p-4">Role</th>
              <th className="p-4">Assigned Building</th>
              <th className="p-4">Unit</th>
              <th className="p-4">Status</th>
              <th className="p-4">Invited Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-sm">
            {users.map((usr) => (
              <tr key={usr.id}>
                <td className="p-4">
                  <div className="font-semibold text-gray-900">{usr.full_name}</div>
                  <div className="text-xs text-gray-500">{usr.email} | {usr.phone}</div>
                </td>
                <td className="p-4">
                  {usr.role === 'caretaker' ? (
                    <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-xs px-2.5 py-1 rounded-full font-medium">
                      <Shield size={12} /> Caretaker
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-full font-medium">
                      <Home size={12} /> Tenant
                    </span>
                  )}
                </td>
                <td className="p-4 text-gray-700 font-medium">{usr.property_name}</td>
                <td className="p-4 text-gray-600">{usr.unit_number || 'N/A (All Building)'}</td>
                <td className="p-4">
                  {usr.status === 'active' ? (
                    <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs px-2.5 py-1 rounded-full font-medium">
                      <CheckCircle size={12} /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full font-medium">
                      <Clock size={12} /> Pending Password
                    </span>
                  )}
                </td>
                <td className="p-4 text-gray-500">{usr.invited_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};