"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface MetricStats {
  totalCollected: number;
  totalArrears: number;
  unassignedCount: number;
  unassignedAmount: number;
  totalUnits: number;
  occupiedUnits: number;
  occupancyRate: number;
}

interface MonthlyRevenue {
  month: string;
  collected: number;
  pending: number;
}

interface OccupancyData {
  name: string;
  value: number;
  color: string;
}

export default function PropertyManagerDashboard() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<MetricStats>({
    totalCollected: 0,
    totalArrears: 0,
    unassignedCount: 0,
    unassignedAmount: 0,
    totalUnits: 0,
    occupiedUnits: 0,
    occupancyRate: 0,
  });

  const [revenueTrend, setRevenueTrend] = useState<MonthlyRevenue[]>([]);
  const [occupancyChartData, setOccupancyChartData] = useState<OccupancyData[]>([]);

  useEffect(() => {
    fetchDashboardOverview();
  }, []);

  async function fetchDashboardOverview() {
    setLoading(true);
    try {
      // 1. Fetch Invoices Summary
      const { data: invoices } = await supabase
        .from("invoices")
        .select("amount_paid, balance, status, created_at");

      let collected = 0;
      let arrears = 0;

      if (invoices) {
        invoices.forEach((inv) => {
          collected += Number(inv.amount_paid || 0);
          arrears += Number(inv.balance || 0);
        });
      }

      // 2. Fetch Unassigned Payments
      const { data: unassigned } = await supabase
        .from("unassigned_payments")
        .select("amount")
        .eq("is_resolved", false);

      const unassignedCnt = unassigned?.length || 0;
      const unassignedSum = unassigned?.reduce((acc, curr) => acc + Number(curr.amount || 0), 0) || 0;

      // 3. Fetch Units for Occupancy Calculation
      const { data: units } = await supabase
        .from("units")
        .select("id, is_occupied");

      const totalU = units?.length || 0;
      const occupiedU = units?.filter((u) => u.is_occupied).length || 0;
      const vacantU = totalU - occupiedU;
      const occRate = totalU > 0 ? Math.round((occupiedU / totalU) * 100) : 0;

      setMetrics({
        totalCollected: collected,
        totalArrears: arrears,
        unassignedCount: unassignedCnt,
        unassignedAmount: unassignedSum,
        totalUnits: totalU,
        occupiedUnits: occupiedU,
        occupancyRate: occRate,
      });

      setOccupancyChartData([
        { name: "Occupied", value: occupiedU, color: "#10b981" },
        { name: "Vacant", value: vacantU, color: "#ef4444" },
      ]);

      // Mocked 6-month financial trajectory (or calculate dynamically from invoices.created_at)
      setRevenueTrend([
        { month: "Feb", collected: collected * 0.7, pending: arrears * 0.4 },
        { month: "Mar", collected: collected * 0.8, pending: arrears * 0.3 },
        { month: "Apr", collected: collected * 0.85, pending: arrears * 0.3 },
        { month: "May", collected: collected * 0.9, pending: arrears * 0.25 },
        { month: "Jun", collected: collected * 0.95, pending: arrears * 0.2 },
        { month: "Jul", collected: collected, pending: arrears },
      ]);

    } catch (err) {
      console.error("Failed to load property manager dashboard:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center text-sm font-medium">
        Loading financial analytics...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Property Operations Overview</h1>
          <p className="text-xs text-slate-400">Financial health, collections, and occupancy analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/unassigned-payments"
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition"
          >
            Reconcile Payments ({metrics.unassignedCount})
          </Link>
          <button
            onClick={fetchDashboardOverview}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 transition"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Collections */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-2">
          <span className="text-xs font-semibold text-slate-400">Total Collections</span>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            KSh {metrics.totalCollected.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500">Collected from active invoices</p>
        </div>

        {/* Pending Arrears */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-2">
          <span className="text-xs font-semibold text-slate-400">Pending Arrears</span>
          <div className="text-2xl font-bold text-rose-400 font-mono">
            KSh {metrics.totalArrears.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500">Outstanding balance across units</p>
        </div>

        {/* Unassigned M-Pesa */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-2">
          <span className="text-xs font-semibold text-slate-400">Unassigned M-Pesa</span>
          <div className="text-2xl font-bold text-amber-400 font-mono">
            KSh {metrics.unassignedAmount.toLocaleString()}
          </div>
          <p className="text-[11px] text-amber-500/90 font-medium">
            {metrics.unassignedCount} transactions pending manual resolution
          </p>
        </div>

        {/* Occupancy Rate */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-2">
          <span className="text-xs font-semibold text-slate-400">Portfolio Occupancy</span>
          <div className="text-2xl font-bold text-blue-400 font-mono">
            {metrics.occupancyRate}%
          </div>
          <p className="text-[11px] text-slate-500">
            {metrics.occupiedUnits} of {metrics.totalUnits} Units Occupied
          </p>
        </div>
      </div>

      {/* Analytics Section: Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Collection vs Arrears Bar Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-slate-200">Revenue Collections & Arrears Trend</h2>
            <span className="text-xs text-slate-500">6-Month View</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "12px" }}
                  formatter={(value: any) => [`KSh ${Number(value).toLocaleString()}`, "Amount"]}
                />
                <Bar dataKey="collected" fill="#10b981" radius={[4, 4, 0, 0]} name="Collected" />
                <Bar dataKey="pending" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Arrears" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Occupancy Pie Chart */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4 flex flex-col justify-between">
          <h2 className="text-sm font-bold text-slate-200">Unit Occupancy Ratio</h2>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={occupancyChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {occupancyChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "12px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-center gap-6 text-xs pt-2 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="text-slate-300">Occupied ({metrics.occupiedUnits})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500"></span>
              <span className="text-slate-300">Vacant ({metrics.totalUnits - metrics.occupiedUnits})</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}