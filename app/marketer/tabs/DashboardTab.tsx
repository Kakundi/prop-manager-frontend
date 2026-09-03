// app/marketer/tabs/DashboardTab.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { Sparkles, Users, Building, Home, RefreshCw, TrendingUp } from 'lucide-react';
import { MarketerClient, Property } from '../types';

interface DashboardTabProps {
  fullName: string;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({ fullName }) => {
  const [clients, setClients] = useState<MarketerClient[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const [clientsRes, propsRes] = await Promise.all([
        fetch('/marketer/api/clients', { cache: 'no-store', headers }),
        fetch('/marketer/api/properties-overview', { cache: 'no-store', headers }),
      ]);

      if (clientsRes.ok) {
        const clientsData = await clientsRes.json();
        setClients(clientsData.clients || []);
      }

      if (propsRes.ok) {
        const propsData = await propsRes.json();
        setProperties(propsData.properties || []);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch dashboard data.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const totalUnits = properties.reduce((acc, curr) => acc + (curr.units?.length || 0), 0);
  const occupiedUnits = properties.reduce(
    (acc, curr) => acc + (curr.units?.filter((u) => u.is_occupied)?.length || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* HERO BANNER */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white rounded-2xl p-6 md:p-8 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md text-blue-100 text-xs px-3 py-1 rounded-full font-medium mb-3 border border-white/10">
            <Sparkles size={14} className="text-amber-300" /> Growth Overview
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Welcome back, {fullName}
          </h1>
          <p className="text-blue-100 text-sm mt-1 max-w-xl">
            Track client onboarding performance, registered properties, and unit metrics in real time.
          </p>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Clients</p>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-1">{clients.length}</h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Users size={22} />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Properties</p>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-1">{properties.length}</h3>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Building size={22} />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Units</p>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-1">{totalUnits}</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Home size={22} />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Occupied Units</p>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-1">{occupiedUnits}</h3>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <TrendingUp size={22} />
          </div>
        </div>
      </div>

      {/* RECENT CLIENTS TABLE */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Recent Clients</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Overview of registered property owners and managers.
            </p>
          </div>
          <button
            onClick={fetchDashboardData}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-2 rounded-lg transition"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="text-gray-500 text-sm py-4">Loading stats...</p>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm">
            {error}
          </div>
        ) : clients.length === 0 ? (
          <p className="text-gray-500 text-sm py-8 text-center">No clients registered yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="p-3.5">Client Name</th>
                  <th className="p-3.5">Email</th>
                  <th className="p-3.5">Phone</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-xs">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50/50 transition">
                    <td className="p-3.5 font-bold text-gray-900">{client.full_name}</td>
                    <td className="p-3.5 text-gray-600">{client.email}</td>
                    <td className="p-3.5 text-gray-600">{client.phone || 'N/A'}</td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 rounded-full font-semibold capitalize bg-blue-50 text-blue-700 border border-blue-100">
                        {client.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3.5 text-gray-500">
                      {client.created_at ? new Date(client.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};