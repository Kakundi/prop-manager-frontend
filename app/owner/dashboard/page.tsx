'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface PropertyMetrics {
  id: string;
  name: string;
  occupiedUnits: number;
  vacantUnits: number;
  paidInvoices: number;
  unpaidInvoices: number;
  overdueInvoices: number;
  partialPayments: number;
}

export default function OwnerDashboard() {
  const [fullName, setFullName] = useState<string>('Owner');
  const [properties, setProperties] = useState<PropertyMetrics[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchOwnerDashboard();
  }, []);

  async function fetchOwnerDashboard() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      
      if (profile?.full_name) setFullName(profile.full_name);

      // Fetch properties owned by logged-in user
      const { data: props, error } = await supabase
        .from('properties')
        .select(`
          id,
          name,
          units ( id, status ),
          invoices ( amount, amount_paid, status )
        `)
        .eq('owner_id', user.id);

      if (!error && props) {
        const formatted = props.map((p: any) => {
          const occupied = p.units?.filter((u: any) => u.status === 'OCCUPIED').length || 0;
          const vacant = p.units?.filter((u: any) => u.status === 'VACANT').length || 0;

          let paid = 0, unpaid = 0, overdue = 0, partial = 0;

          p.invoices?.forEach((inv: any) => {
            if (inv.status === 'PAID') paid += inv.amount;
            else if (inv.status === 'UNPAID') unpaid += inv.amount;
            else if (inv.status === 'OVERDUE') overdue += inv.amount;
            else if (inv.status === 'PARTIAL') partial += (inv.amount - (inv.amount_paid || 0));
          });

          return {
            id: p.id,
            name: p.name,
            occupiedUnits: occupied,
            vacantUnits: vacant,
            paidInvoices: paid,
            unpaidInvoices: unpaid,
            overdueInvoices: overdue,
            partialPayments: partial,
          };
        });

        setProperties(formatted);
      }
    }
    setLoading(false);
  }

  return (
    <div className="p-6 space-y-8 bg-slate-950 text-slate-100 min-h-screen">
      {/* HERO SECTION */}
      <div className="bg-gradient-to-r from-indigo-900/40 via-slate-900 to-slate-900 border border-indigo-500/20 rounded-2xl p-8 shadow-2xl">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Welcome Back &quot;{fullName}&quot;
        </h1>
        <p className="text-xs text-slate-400 mt-2 max-w-xl leading-relaxed">
          Here is the live financial and occupancy status across all properties under your ownership.
        </p>
      </div>

      {/* PROPERTIES LIST */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">Your Listed Properties</h2>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            Loading your property portfolio...
          </div>
        ) : properties.length === 0 ? (
          <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center text-slate-500 text-xs">
            No properties listed yet. Go to &quot;Add Properties&quot; to list your first estate.
          </div>
        ) : (
          <div className="space-y-6">
            {properties.map((prop) => {
              const totalRev = prop.paidInvoices + prop.unpaidInvoices + prop.overdueInvoices + prop.partialPayments;

              return (
                <div key={prop.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
                  {/* PROPERTY TITLE & UNITS */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">{prop.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Property Summary</p>
                    </div>

                    <div className="flex items-center space-x-3 font-mono text-xs">
                      <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-xl font-bold">
                        Occupied: {prop.occupiedUnits}
                      </span>
                      <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1.5 rounded-xl font-bold">
                        Vacant: {prop.vacantUnits}
                      </span>
                    </div>
                  </div>

                  {/* NUMERICAL FORMAT FINANCIAL CARDS */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Paid Invoices</span>
                      <p className="text-lg font-bold font-mono text-emerald-400 mt-1">
                        KES {prop.paidInvoices.toLocaleString()}
                      </p>
                    </div>

                    <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Unpaid Invoices</span>
                      <p className="text-lg font-bold font-mono text-amber-400 mt-1">
                        KES {prop.unpaidInvoices.toLocaleString()}
                      </p>
                    </div>

                    <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Overdue</span>
                      <p className="text-lg font-bold font-mono text-rose-400 mt-1">
                        KES {prop.overdueInvoices.toLocaleString()}
                      </p>
                    </div>

                    <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Partial Payments</span>
                      <p className="text-lg font-bold font-mono text-indigo-400 mt-1">
                        KES {prop.partialPayments.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* GRAPHICAL REPRESENTATION OF FINANCIALS */}
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between items-center text-xs text-slate-400">
                      <span>Financial Distribution Breakdown</span>
                      <span className="font-mono text-white">Total: KES {totalRev.toLocaleString()}</span>
                    </div>

                    <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden flex">
                      <div
                        style={{ width: `${totalRev > 0 ? (prop.paidInvoices / totalRev) * 100 : 0}%` }}
                        className="bg-emerald-500 transition-all"
                        title="Paid"
                      ></div>
                      <div
                        style={{ width: `${totalRev > 0 ? (prop.unpaidInvoices / totalRev) * 100 : 0}%` }}
                        className="bg-amber-500 transition-all"
                        title="Unpaid"
                      ></div>
                      <div
                        style={{ width: `${totalRev > 0 ? (prop.overdueInvoices / totalRev) * 100 : 0}%` }}
                        className="bg-rose-500 transition-all"
                        title="Overdue"
                      ></div>
                      <div
                        style={{ width: `${totalRev > 0 ? (prop.partialPayments / totalRev) * 100 : 0}%` }}
                        className="bg-indigo-500 transition-all"
                        title="Partial"
                      ></div>
                    </div>

                    <div className="flex flex-wrap gap-4 text-[10px] text-slate-400 pt-1 font-mono">
                      <span className="flex items-center space-x-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                        <span>Paid</span>
                      </span>
                      <span className="flex items-center space-x-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                        <span>Unpaid</span>
                      </span>
                      <span className="flex items-center space-x-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                        <span>Overdue</span>
                      </span>
                      <span className="flex items-center space-x-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block"></span>
                        <span>Partial</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}