'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { SuperAdminTab } from '../types';

interface HubProps {
  setActiveTab: (tab: SuperAdminTab) => void;
}

export const UnassignedPaymentsHubTab: React.FC<HubProps> = ({ setActiveTab }) => {
  const [tenantCount, setTenantCount] = useState<number>(0);
  const [saasCount, setSaasCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchCounts() {
      setLoading(true);

      const [tenantRes, saasRes] = await Promise.all([
        supabase
          .from('unassigned_payments')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'UNASSIGNED'),
        supabase
          .from('saas_unassigned_payments')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'UNASSIGNED'),
      ]);

      setTenantCount(tenantRes.count || 0);
      setSaasCount(saasRes.count || 0);
      setLoading(false);
    }

    fetchCounts();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Unassigned Payments Hub
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Select a category below to reconcile orphaned transactions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tenant Payments Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-indigo-500/50 transition shadow-xl">
          <div>
            <div className="flex justify-between items-start">
              <span className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl font-bold text-xs uppercase tracking-wider">
                Tenant Portal
              </span>
              <span className="text-2xl font-extrabold text-white">
                {loading ? '...' : tenantCount}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mt-4">
              Tenant Unassigned Payments
            </h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              M-Pesa and bank transactions originating from property tenants where unit numbers or tenant details were mismatched. Includes Full Name, Unit, and Property context.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('unassigned-tenant-payments')}
            className="mt-6 w-full text-center bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2.5 rounded-xl transition shadow-lg shadow-indigo-600/20 block"
          >
            Review Tenant Payments &rarr;
          </button>
        </div>

        {/* SaaS Payments Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-emerald-500/50 transition shadow-xl">
          <div>
            <div className="flex justify-between items-start">
              <span className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl font-bold text-xs uppercase tracking-wider">
                SaaS Subscriptions
              </span>
              <span className="text-2xl font-extrabold text-white">
                {loading ? '...' : saasCount}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mt-4">
              SaaS Subscriber Unassigned
            </h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Direct payments from Property Managers and Owners for platform subscriptions whose transaction codes or sender numbers did not automatically align with their profiles.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('unassigned-saas-payments')}
            className="mt-6 w-full text-center bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs py-2.5 rounded-xl transition shadow-lg shadow-emerald-600/20 block"
          >
            Review SaaS Payments &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};