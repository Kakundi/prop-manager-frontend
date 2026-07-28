"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabaseClient";

interface Unit {
  id: string;
  unit_number: string;
  property_id: string;
  properties?: {
    name: string;
    water_rate_per_unit: number;
  };
}

export default function MeterReadingPage() {
  const supabase = createClient();

  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [prevReading, setPrevReading] = useState<number>(0);
  const [currReading, setCurrReading] = useState<number>(0);
  const [garbageFee, setGarbageFee] = useState<number>(200);
  const [parkingFee, setParkingFee] = useState<number>(500);

  const [loading, setLoading] = useState(false);
  const [fetchingUnits, setFetchingUnits] = useState(true);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch all property units on mount
  useEffect(() => {
    async function fetchUnits() {
      const { data, error } = await supabase
        .from("units")
        .select("id, unit_number, property_id, properties(name, water_rate_per_unit)");

      if (!error && data) {
        setUnits(data as any);
      }
      setFetchingUnits(false);
    }
    fetchUnits();
  }, []);

  const selectedUnit = units.find((u) => u.id === selectedUnitId);
  const waterRate = selectedUnit?.properties?.water_rate_per_unit || 150;
  const unitsConsumed = Math.max(0, currReading - prevReading);
  const waterTotal = unitsConsumed * waterRate;
  const grandTotal = 15000 + waterTotal + garbageFee + parkingFee; // Rent + Utilities

  async function handleRaiseInvoice(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUnitId) return;

    setLoading(true);
    setMsg(null);

    try {
      const { data, error } = await supabase.rpc("generate_tenant_invoice", {
        p_unit_id: selectedUnitId,
        p_billing_month: new Date().toISOString().slice(0, 7) + "-01",
        p_due_date: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
        p_current_water_reading: currReading,
        p_previous_water_reading: prevReading,
        p_garbage_fee: garbageFee,
        p_parking_fee: parkingFee,
      });

      if (error) throw error;

      setMsg({
        type: "success",
        text: `Invoice generated successfully! (Invoice ID: ${data})`,
      });
      setCurrReading(0);
      setPrevReading(0);
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Failed to generate invoice." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex justify-center">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl h-fit">
        <h1 className="text-xl font-bold text-blue-400 mb-1">Caretaker Utility Portal</h1>
        <p className="text-xs text-slate-400 mb-6">
          Record water meter units and generate automated line-item invoices
        </p>

        {msg && (
          <div
            className={`mb-6 p-4 rounded-lg text-xs font-medium border ${
              msg.type === "success"
                ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-200"
                : "bg-red-950/80 border-red-500/50 text-red-200"
            }`}
          >
            {msg.text}
          </div>
        )}

        <form onSubmit={handleRaiseInvoice} className="space-y-5 text-xs">
          {/* Unit Selection */}
          <div>
            <label className="block mb-1 text-slate-300 font-medium">Select House / Unit</label>
            <select
              required
              value={selectedUnitId}
              onChange={(e) => setSelectedUnitId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md focus:outline-none focus:border-blue-500 text-slate-100"
            >
              <option value="">-- Choose Unit --</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.properties?.name || "Property"} - Unit {u.unit_number}
                </option>
              ))}
            </select>
          </div>

          {/* Water Meter Readings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-slate-300 font-medium">Previous Water Meter (Units)</label>
              <input
                type="number"
                required
                min="0"
                value={prevReading}
                onChange={(e) => setPrevReading(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md focus:outline-none focus:border-blue-500 text-slate-100"
              />
            </div>
            <div>
              <label className="block mb-1 text-slate-300 font-medium">Current Water Meter (Units)</label>
              <input
                type="number"
                required
                min="0"
                value={currReading}
                onChange={(e) => setCurrReading(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md focus:outline-none focus:border-blue-500 text-slate-100"
              />
            </div>
          </div>

          {/* Line Item Charges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-slate-300 font-medium">Garbage Fee (KSh)</label>
              <input
                type="number"
                value={garbageFee}
                onChange={(e) => setGarbageFee(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md focus:outline-none focus:border-blue-500 text-slate-100"
              />
            </div>
            <div>
              <label className="block mb-1 text-slate-300 font-medium">Parking Fee (KSh)</label>
              <input
                type="number"
                value={parkingFee}
                onChange={(e) => setParkingFee(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md focus:outline-none focus:border-blue-500 text-slate-100"
              />
            </div>
          </div>

          {/* Live Breakdown Box */}
          <div className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-lg space-y-2 mt-4 text-slate-300">
            <div className="flex justify-between font-medium text-slate-200">
              <span>Bill Breakdown</span>
              <span className="text-blue-400">Rate: KSh {waterRate}/unit</span>
            </div>
            <hr className="border-slate-700" />
            <div className="flex justify-between">
              <span>Base Rent</span>
              <span>KSh 15,000.00</span>
            </div>
            <div className="flex justify-between">
              <span>Water Consumption ({unitsConsumed} units)</span>
              <span>KSh {waterTotal.toLocaleString()}.00</span>
            </div>
            <div className="flex justify-between">
              <span>Garbage & Sanitation</span>
              <span>KSh {garbageFee.toLocaleString()}.00</span>
            </div>
            <div className="flex justify-between">
              <span>Parking Allocation</span>
              <span>KSh {parkingFee.toLocaleString()}.00</span>
            </div>
            <hr className="border-slate-700" />
            <div className="flex justify-between font-bold text-slate-100 text-sm">
              <span>Total Invoice Balance</span>
              <span className="text-emerald-400">KSh {grandTotal.toLocaleString()}.00</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || fetchingUnits}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-md transition disabled:opacity-50 text-xs mt-4"
          >
            {loading ? "Generating Invoice..." : "Generate & Issue Invoice"}
          </button>
        </form>
      </div>
    </div>
  );
}