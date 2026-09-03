// app/developer/tabs/SystemHealthTab.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Activity, CheckCircle2, AlertTriangle, RefreshCw, Cpu, Database, Server } from 'lucide-react';
import { ServiceHealth, SystemMetric } from '../types';

export const SystemHealthTab: React.FC = () => {
  const [services, setServices] = useState<ServiceHealth[]>([]);
  const [metrics, setMetrics] = useState<SystemMetric | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDiagnostics = async () => {
    try {
      setLoading(true);
      const res = await fetch('/developer/api/system-health');
      if (res.ok) {
        const data = await res.json();
        setServices(data.services || []);
        setMetrics(data.metrics || null);
      }
    } catch (err) {
      console.error('Failed to load system diagnostics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 md:p-8 border border-slate-800">
        <div className="inline-flex items-center gap-1.5 bg-indigo-500/20 text-indigo-300 text-xs px-3 py-1 rounded-full font-medium mb-3 border border-indigo-500/30">
          <Activity size={14} className="text-indigo-400" /> Infrastructure Diagnostics
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">System Health & API Gateways</h1>
        <p className="text-slate-400 text-sm mt-1 max-w-xl">
          Real-time status monitor for database connections, M-Pesa webhooks, SMS APIs, and core services.
        </p>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active Sessions</p>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-1">{metrics?.active_sessions || 0}</h3>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Server size={22} /></div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">DB Connection Pool</p>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-1">{metrics?.db_pool_usage_percent || 0}%</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><Database size={22} /></div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">24h API Volume</p>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-1">{metrics?.api_requests_24h || 0}</h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Cpu size={22} /></div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Error Rate</p>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-1">{metrics?.error_rate_percent || 0}%</h3>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><Activity size={22} /></div>
        </div>
      </div>

      {/* SERVICE HEALTH TABLE */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Integration Gateway Health</h2>
            <p className="text-xs text-gray-500 mt-0.5">Live heartbeat check of integrated third-party platforms.</p>
          </div>
          <button
            onClick={fetchDiagnostics}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3.5 py-2 rounded-lg transition"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Run Diagnostics
          </button>
        </div>

        <div className="divide-y divide-gray-100">
          {services.map((s) => (
            <div key={s.id} className="py-3.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                {s.status === 'operational' ? (
                  <CheckCircle2 size={18} className="text-green-600" />
                ) : (
                  <AlertTriangle size={18} className="text-amber-500" />
                )}
                <div>
                  <span className="font-bold text-gray-900 block">{s.name}</span>
                  <span className="text-gray-500 text-[11px]">Last checked: {new Date(s.last_checked).toLocaleTimeString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-mono text-gray-600">{s.latency_ms} ms</span>
                <span className={`px-2.5 py-1 rounded-full font-semibold uppercase text-[10px] ${
                  s.status === 'operational' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                }`}>
                  {s.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};