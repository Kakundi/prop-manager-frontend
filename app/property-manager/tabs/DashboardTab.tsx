'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building, 
  Users, 
  DollarSign, 
  AlertCircle, 
  Loader2, 
  TrendingUp, 
  CheckCircle2, 
  FolderOpen 
} from 'lucide-react';

interface DashboardMetrics {
  totalProperties: number;
  totalTenants: number;
  totalRevenue: number;
  pendingPayments: number;
}

interface RecentActivity {
  id: string;
  description: string;
  amount?: number;
  date: string;
  status?: string;
}

export const DashboardTab: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalProperties: 0,
    totalTenants: 0,
    totalRevenue: 0,
    pendingPayments: 0,
  });
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setFetchError(null);

      // Fetch metrics from backend API
      const res = await fetch('/property-manager/api/dashboard', { cache: 'no-store' });
      
      if (!res.ok) {
        // Fallback: fetch from general portal endpoint if specialized route fails
        const fallbackRes = await fetch('/api/property-manager/metrics', { cache: 'no-store' });
        if (!fallbackRes.ok) {
          throw new Error('Unable to retrieve dashboard metrics from database.');
        }
        const fallbackData = await fallbackRes.json();
        setMetrics(fallbackData.metrics || { totalProperties: 0, totalTenants: 0, totalRevenue: 0, pendingPayments: 0 });
        setActivities(fallbackData.activities || []);
        return;
      }

      const data = await res.json();
      setMetrics(data.metrics || {
        totalProperties: data.properties_count || 0,
        totalTenants: data.tenants_count || 0,
        totalRevenue: data.total_revenue || 0,
        pendingPayments: data.pending_payments_count || 0,
      });
      setActivities(data.recent_activity || []);
    } catch (err: any) {
      console.error('Dashboard data fetch error:', err);
      setFetchError(err.message || 'Error connecting to database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-gray-200 flex flex-col items-center justify-center text-gray-500 shadow-sm gap-3">
        <Loader2 className="animate-spin text-blue-600" size={32} />
        <span className="text-sm font-medium">Fetching real-time metrics from database...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* DATABASE CONNECTIVITY ERROR / NOTICE BANNER */}
      {fetchError && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-amber-600 shrink-0" />
            <span>Database Connection Note: {fetchError} Displaying recorded profile states below.</span>
          </div>
          <button 
            onClick={fetchDashboardData}
            className="text-xs font-bold bg-amber-200/60 hover:bg-amber-200 px-3 py-1 rounded-lg text-amber-900 transition"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Properties */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Properties</span>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Building size={20} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-extrabold text-gray-900">{metrics.totalProperties}</p>
            <p className="text-xs text-gray-500 mt-1">
              {metrics.totalProperties === 0 ? 'No property records found' : 'Active units in database'}
            </p>
          </div>
        </div>

        {/* Total Tenants */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tenants</span>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users size={20} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-extrabold text-gray-900">{metrics.totalTenants}</p>
            <p className="text-xs text-gray-500 mt-1">
              {metrics.totalTenants === 0 ? 'No tenant profiles registered' : 'Registered tenant accounts'}
            </p>
          </div>
        </div>

        {/* Total Revenue Collected */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Revenue</span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-extrabold text-gray-900">${metrics.totalRevenue.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">
              {metrics.totalRevenue === 0 ? 'No settled payment records' : 'Total cleared collections'}
            </p>
          </div>
        </div>

        {/* Pending / Unassigned Payments */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pending Audit</span>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-extrabold text-gray-900">{metrics.pendingPayments}</p>
            <p className="text-xs text-gray-500 mt-1">
              {metrics.pendingPayments === 0 ? 'No pending unassigned payments' : 'Transactions needing review'}
            </p>
          </div>
        </div>

      </div>

      {/* RECENT ACTIVITY / RECORDS TABLE WITH EXPLICIT NO-RECORDS DISPLAY */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">Recent Portfolio Activity</h3>
            <p className="text-xs text-gray-500">Audit logs and payment transactions recorded in the system.</p>
          </div>
        </div>

        {activities.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center text-gray-500">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-3">
              <FolderOpen size={24} />
            </div>
            <p className="text-sm font-semibold text-gray-800">No recent activity records found</p>
            <p className="text-xs text-gray-500 max-w-sm mt-1">
              There are currently no transaction or action logs stored in the database for this profile.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
                  <th className="p-4">Description</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {activities.map((act) => (
                  <tr key={act.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4 font-medium text-gray-900">{act.description}</td>
                    <td className="p-4 font-bold text-gray-900">
                      {act.amount !== undefined ? `$${act.amount.toFixed(2)}` : '—'}
                    </td>
                    <td className="p-4 text-gray-500 text-xs">{act.date}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs px-2.5 py-1 rounded-full font-semibold">
                        <CheckCircle2 size={12} /> {act.status || 'Recorded'}
                      </span>
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