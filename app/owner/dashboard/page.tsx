"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabaseClient";

interface OwnerProperty {
  id: string;
  name: string;
  address: string;
  totalUnits: number;
  occupiedUnits: number;
  monthlyGross: number;
  managementFeePercent: number;
  netPayout: number;
}

export default function OwnerDashboard() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [ownerName, setOwnerName] = useState("");
  const [properties, setProperties] = useState<OwnerProperty[]>([]);
  const [financials, setFinancials] = useState({
    grossRevenue: 0,
    managementFees: 0,
    netPayout: 0,
    totalUnits: 0,
    occupiedUnits: 0,
  });

  useEffect(() => {
    fetchOwnerPortfolio();
  }, []);

  async function fetchOwnerPortfolio() {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // 1. Fetch Profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      if (profile) setOwnerName(profile.full_name || "Property Owner");

      // 2. Fetch Owner's Properties with Units and Invoices
      const { data: propsData } = await supabase
        .from("properties")
        .select(`
          id,
          name,
          address,
          management_fee_percentage,
          units (
            id,
            is_occupied,
            invoices (
              amount_paid,
              balance
            )
          )
        `)
        .eq("owner_id", user.id);

      if (propsData) {
        let totalGross = 0;
        let totalFees = 0;
        let totalNet = 0;
        let grandTotalUnits = 0;
        let grandOccupiedUnits = 0;

        const formattedProps: OwnerProperty[] = propsData.map((p: any) => {
          const propertyUnits = p.units || [];
          const totalUnits = propertyUnits.length;
          const occupiedUnits = propertyUnits.filter((u: any) => u.is_occupied).length;

          // Calculate collected revenue for this property
          let propGross = 0;
          propertyUnits.forEach((u: any) => {
            (u.invoices || []).forEach((inv: any) => {
              propGross += Number(inv.amount_paid || 0);
            });
          });

          const feePercent = p.management_fee_percentage || 10; // Default 10% management fee
          const feeAmount = propGross * (feePercent / 100);
          const net = propGross - feeAmount;

          totalGross += propGross;
          totalFees += feeAmount;
          totalNet += net;
          grandTotalUnits += totalUnits;
          grandOccupiedUnits += occupiedUnits;

          return {
            id: p.id,
            name: p.name,
            address: p.address || "N/A",
            totalUnits,
            occupiedUnits,
            monthlyGross: propGross,
            managementFeePercent: feePercent,
            netPayout: net,
          };
        });

        setProperties(formattedProps);
        setFinancials({
          grossRevenue: totalGross,
          managementFees: totalFees,
          netPayout: totalNet,
          totalUnits: grandTotalUnits,
          occupiedUnits: grandOccupiedUnits,
        });
      }
    } catch (err) {
      console.error("Error loading owner portfolio:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center text-sm font-medium">
        Loading owner portal...
      </div>
    );
  }

  const occupancyRate =
    financials.totalUnits > 0
      ? Math.round((financials.occupiedUnits / financials.totalUnits) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
            Owner Investor Portal
          </span>
          <h1 className="text-2xl font-bold text-slate-100 mt-1">Portfolio Statements: {ownerName}</h1>
        </div>

        <button
          onClick={() => alert("Generating monthly PDF financial statement...")}
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg shadow-amber-500/10 active:scale-95"
        >
          Download Monthly Statement (PDF)
        </button>
      </div>

      {/* Financial KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Rental Collected */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-2">
          <span className="text-xs font-semibold text-slate-400">Gross Rental Collected</span>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            KSh {financials.grossRevenue.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500">Total rent paid by tenants</p>
        </div>

        {/* Management Fees Deducted */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-2">
          <span className="text-xs font-semibold text-slate-400">Management Fees</span>
          <div className="text-2xl font-bold text-amber-400 font-mono">
            -KSh {financials.managementFees.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500">Property management commission</p>
        </div>

        {/* Net Payout Amount */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-2">
          <span className="text-xs font-semibold text-slate-400">Net Owner Payout</span>
          <div className="text-2xl font-bold text-blue-400 font-mono">
            KSh {financials.netPayout.toLocaleString()}
          </div>
          <p className="text-[11px] text-blue-500/90 font-medium">Ready for disbursement</p>
        </div>

        {/* Portfolio Occupancy */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-2">
          <span className="text-xs font-semibold text-slate-400">Portfolio Occupancy</span>
          <div className="text-2xl font-bold text-slate-100 font-mono">{occupancyRate}%</div>
          <p className="text-[11px] text-slate-500">
            {financials.occupiedUnits} of {financials.totalUnits} Units Occupied
          </p>
        </div>
      </div>

      {/* Property Breakdown Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-bold text-slate-200">Property Financial Performance</h2>

        {properties.length === 0 ? (
          <p className="text-xs text-slate-500 py-8 text-center">No properties registered under your account.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">Property Name</th>
                  <th className="p-3">Occupancy</th>
                  <th className="p-3">Gross Collected</th>
                  <th className="p-3">Mgmt Fee %</th>
                  <th className="p-3 text-right">Net Payout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {properties.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-semibold text-slate-100">{p.name}</td>
                    <td className="p-3">
                      {p.occupiedUnits} / {p.totalUnits} Units
                    </td>
                    <td className="p-3 font-mono text-emerald-400">
                      KSh {p.monthlyGross.toLocaleString()}
                    </td>
                    <td className="p-3 font-mono text-amber-400">{p.managementFeePercent}%</td>
                    <td className="p-3 font-mono font-bold text-blue-400 text-right">
                      KSh {p.netPayout.toLocaleString()}
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
}