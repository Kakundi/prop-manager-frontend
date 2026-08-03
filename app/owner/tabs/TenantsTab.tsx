'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { OwnerTenantRecord } from '../types';
import { Loader2, Search } from 'lucide-react';

export const TenantsTab: React.FC = () => {
  const supabase = createClient();
  const [tenants, setTenants] = useState<OwnerTenantRecord[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTenants() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fetch properties owned by this user first
        const { data: userProps } = await supabase
          .from('properties')
          .select('id, name')
          .eq('owner_id', user.id);

        const propertyIds = userProps?.map((p) => p.id) || [];

        if (propertyIds.length > 0) {
          const { data } = await supabase
            .from('tenants')
            .select('id, full_name, unit_number, phone, rent_status, properties(name)')
            .in('property_id', propertyIds);

          const formatted = (data || []).map((t: any) => ({
            id: t.id,
            full_name: t.full_name,
            unit_number: t.unit_number,
            property_name: t.properties?.name || 'Unassigned',
            phone: t.phone,
            rent_status: t.rent_status || 'pending',
          }));
          setTenants(formatted);
        }
      }
      setLoading(false);
    }
    fetchTenants();
  }, []);

  const filteredTenants = tenants.filter(
    (t) =>
      t.full_name.toLowerCase().includes(search.toLowerCase()) ||
      t.property_name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Tenants Directory</h2>
        <div className="relative w-64">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search tenant or property..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase font-medium border-b border-gray-200">
              <th className="px-6 py-3">Tenant Name</th>
              <th className="px-6 py-3">Property & Unit</th>
              <th className="px-6 py-3">Phone</th>
              <th className="px-6 py-3">Payment Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-sm">
            {filteredTenants.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No tenants found.
                </td>
              </tr>
            ) : (
              filteredTenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{tenant.full_name}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {tenant.property_name} - Door {tenant.unit_number}
                  </td>
                  <td className="px-6 py-4 text-gray-500">{tenant.phone}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full ${
                        tenant.rent_status === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {tenant.rent_status}
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