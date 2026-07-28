"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabaseClient";

interface Unit {
  id: string;
  unit_number: string;
  property_name: string;
  tenant_name?: string;
  last_reading?: number;
}

interface UnassignedPayment {
  id: string;
  mpesa_code: string;
  phone_number: string;
  amount: number;
  account_reference: string;
  created_at: string;
}

interface OpenInvoice {
  id: string;
  unit_number: string;
  tenant_name: string;
  balance: number;
}

export default function CaretakerMobileDashboard() {
  const supabase = createClient();

  // Active Tab
  const [activeTab, setActiveTab] = useState<"meters" | "payments">("meters");

  // State: Meter Readings
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [utilityType, setUtilityType] = useState<"WATER" | "ELECTRICITY">("WATER");
  const [currentReading, setCurrentReading] = useState<string>("");
  const [submittingReading, setSubmittingReading] = useState(false);

  // State: Unassigned Payments
  const [unassignedPayments, setUnassignedPayments] = useState<UnassignedPayment[]>([]);
  const [openInvoices, setOpenInvoices] = useState<OpenInvoice[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<UnassignedPayment | null>(null);
  const [targetInvoiceId, setTargetInvoiceId] = useState("");
  const [reassignNotes, setReassignNotes] = useState("");
  const [resolvingPayment, setResolvingPayment] = useState(false);

  // Feedback State
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchCaretakerData();
  }, []);

  async function fetchCaretakerData() {
    setLoading(true);
    setFeedback(null);
    try {
      // 1. Fetch units with property context
      const { data: unitsData } = await supabase
        .from("units")
        .select(`
          id,
          unit_number,
          properties(name),
          tenants(profiles(full_name))
        `)
        .order("unit_number", { ascending: true });

      if (unitsData) {
        const formattedUnits: Unit[] = unitsData.map((u: any) => ({
          id: u.id,
          unit_number: u.unit_number,
          property_name: u.properties?.name || "Property",
          tenant_name: u.tenants?.[0]?.profiles?.full_name || "Vacant",
        }));
        setUnits(formattedUnits);
      }

      // 2. Fetch Unassigned Payments
      const { data: paymentsData } = await supabase
        .from("unassigned_payments")
        .select("*")
        .eq("is_resolved", false)
        .order("created_at", { ascending: false });

      if (paymentsData) {
        setUnassignedPayments(paymentsData as UnassignedPayment[]);
      }

      // 3. Fetch Open Invoices for re-assignment
      const { data: invoicesData } = await supabase
        .from("invoices")
        .select(`
          id,
          balance,
          units(unit_number),
          tenants(profiles(full_name))
        `)
        .gt("balance", 0);

      if (invoicesData) {
        const formattedInvoices: OpenInvoice[] = invoicesData.map((inv: any) => ({
          id: inv.id,
          balance: inv.balance,
          unit_number: inv.units?.unit_number || "N/A",
          tenant_name: inv.tenants?.profiles?.full_name || "Tenant",
        }));
        setOpenInvoices(formattedInvoices);
      }
    } catch (err: any) {
      console.error("Error loading caretaker data:", err);
    } finally {
      setLoading(false);
    }
  }

  // Selected Unit's Metadata
  const currentSelectedUnit = units.find((u) => u.id === selectedUnitId);

  // Submit Meter Reading
  async function handleMeterSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUnitId || !currentReading) return;

    setSubmittingReading(true);
    setFeedback(null);

    try {
      const { error } = await supabase.from("meter_readings").insert({
        unit_id: selectedUnitId,
        utility_type: utilityType,
        reading_value: parseFloat(currentReading),
        reading_date: new Date().toISOString(),
        recorded_by: (await supabase.auth.getUser()).data.user?.id,
      });

      if (error) throw error;

      setFeedback({
        type: "success",
        text: `Logged ${utilityType} reading of ${currentReading} for Unit ${currentSelectedUnit?.unit_number}`,
      });
      setCurrentReading("");
      setSelectedUnitId("");
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed to log meter reading." });
    } finally {
      setSubmittingReading(false);
    }
  }

  // Submit Payment Reassignment (Calls updated RPC)
  async function handleReassignSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPayment || !targetInvoiceId) return;

    setResolvingPayment(true);
    setFeedback(null);

    try {
      const { error } = await supabase.rpc("reassign_unassigned_payment", {
        p_unassigned_id: selectedPayment.id,
        p_target_invoice_id: targetInvoiceId,
        p_notes: reassignNotes || "Reassigned by Caretaker via Mobile Dashboard",
      });

      if (error) throw error;

      setFeedback({
        type: "success",
        text: `Payment ${selectedPayment.mpesa_code} assigned to Unit ${
          openInvoices.find((i) => i.id === targetInvoiceId)?.unit_number
        }`,
      });

      setSelectedPayment(null);
      setTargetInvoiceId("");
      setReassignNotes("");
      fetchCaretakerData();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed to reassign payment." });
    } finally {
      setResolvingPayment(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-12">
      {/* Mobile Sticky Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-amber-400">Caretaker Portal</h1>
          <p className="text-[10px] text-slate-400">Field Operations & Auditing</p>
        </div>
        <button
          onClick={fetchCaretakerData}
          className="px-2.5 py-1 bg-slate-800 text-slate-300 text-xs rounded-md border border-slate-700 active:scale-95 transition"
        >
          Sync
        </button>
      </header>

      {/* Navigation Tabs */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab("meters")}
            className={`py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === "meters"
                ? "bg-amber-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Meter Readings
          </button>
          <button
            onClick={() => setActiveTab("payments")}
            className={`py-2 text-xs font-semibold rounded-lg transition relative ${
              activeTab === "payments"
                ? "bg-amber-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Unassigned
            {unassignedPayments.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-red-500 text-white rounded-full font-bold">
                {unassignedPayments.length}
              </span>
            )}
          </button>
        </div>

        {/* Global Feedback Banner */}
        {feedback && (
          <div
            className={`mt-4 p-3 rounded-lg text-xs border font-medium ${
              feedback.type === "success"
                ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-200"
                : "bg-red-950/80 border-red-500/50 text-red-200"
            }`}
          >
            {feedback.text}
          </div>
        )}

        {/* TAB 1: METER READINGS */}
        {activeTab === "meters" && (
          <div className="mt-4 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
              <h2 className="text-sm font-bold text-slate-200 mb-3">Log Utility Meter Reading</h2>

              {loading ? (
                <div className="py-8 text-center text-xs text-slate-500">Loading units...</div>
              ) : (
                <form onSubmit={handleMeterSubmit} className="space-y-4 text-xs">
                  {/* Select Unit */}
                  <div>
                    <label className="block text-slate-400 mb-1">Select Unit</label>
                    <select
                      required
                      value={selectedUnitId}
                      onChange={(e) => setSelectedUnitId(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                    >
                      <option value="">-- Choose Unit --</option>
                      {units.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.property_name} - Unit {u.unit_number} ({u.tenant_name})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Utility Type Selector */}
                  <div>
                    <label className="block text-slate-400 mb-1">Utility Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setUtilityType("WATER")}
                        className={`py-2 rounded-lg border font-semibold text-xs transition ${
                          utilityType === "WATER"
                            ? "bg-blue-600/30 border-blue-500 text-blue-300"
                            : "bg-slate-800 border-slate-700 text-slate-400"
                        }`}
                      >
                        Water Meter
                      </button>
                      <button
                        type="button"
                        onClick={() => setUtilityType("ELECTRICITY")}
                        className={`py-2 rounded-lg border font-semibold text-xs transition ${
                          utilityType === "ELECTRICITY"
                            ? "bg-amber-600/30 border-amber-500 text-amber-300"
                            : "bg-slate-800 border-slate-700 text-slate-400"
                        }`}
                      >
                        Electricity Meter
                      </button>
                    </div>
                  </div>

                  {/* Reading Value Input */}
                  <div>
                    <label className="block text-slate-400 mb-1">Current Reading Value</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="e.g. 1042.50"
                      value={currentReading}
                      onChange={(e) => setCurrentReading(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingReading || !selectedUnitId || !currentReading}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition disabled:opacity-50 active:scale-98"
                  >
                    {submittingReading ? "Saving Reading..." : "Submit Reading"}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: UNASSIGNED PAYMENTS */}
        {activeTab === "payments" && (
          <div className="mt-4 space-y-3">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Pending Unassigned M-Pesa ({unassignedPayments.length})
            </h2>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-500">Loading payments...</div>
            ) : unassignedPayments.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center text-xs text-slate-400">
                No unassigned payments to review.
              </div>
            ) : (
              unassignedPayments.map((p) => (
                <div
                  key={p.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2 shadow-md"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono text-amber-300 font-bold text-sm">
                        {p.mpesa_code}
                      </span>
                      <p className="text-[11px] text-slate-400">From: {p.phone_number}</p>
                    </div>
                    <span className="text-emerald-400 font-bold text-sm">
                      KSh {p.amount.toLocaleString()}.00
                    </span>
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                    <span>Ref: {p.account_reference || "None"}</span>
                    <span>{new Date(p.created_at).toLocaleDateString()}</span>
                  </div>

                  <button
                    onClick={() => setSelectedPayment(p)}
                    className="w-full mt-2 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold text-xs rounded-lg border border-slate-700 transition"
                  >
                    Reassign Payment
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Mobile Reassignment Modal */}
        {selectedPayment && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
            <div className="bg-slate-900 border-t sm:border border-slate-800 rounded-t-2xl sm:rounded-xl p-5 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-slate-100">
                  Assign Payment: <span className="text-amber-400">{selectedPayment.mpesa_code}</span>
                </h3>
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="text-slate-400 hover:text-white text-base font-bold p-1"
                >
                  ✕
                </button>
              </div>

              <div className="bg-slate-800/50 p-3 rounded-lg text-xs space-y-1 text-slate-300">
                <div>
                  Amount: <strong className="text-emerald-400">KSh {selectedPayment.amount.toLocaleString()}.00</strong>
                </div>
                <div>Phone: {selectedPayment.phone_number}</div>
                <div>Reference: {selectedPayment.account_reference || "N/A"}</div>
              </div>

              <form onSubmit={handleReassignSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Target Tenant Invoice</label>
                  <select
                    required
                    value={targetInvoiceId}
                    onChange={(e) => setTargetInvoiceId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- Choose Target Invoice --</option>
                    {openInvoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        Unit {inv.unit_number} ({inv.tenant_name}) | Due: KSh {inv.balance.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Caretaker Note</label>
                  <input
                    type="text"
                    placeholder="e.g. Verified with tenant via call"
                    value={reassignNotes}
                    onChange={(e) => setReassignNotes(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPayment(null)}
                    className="w-1/2 py-2.5 bg-slate-800 text-slate-300 rounded-lg text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resolvingPayment || !targetInvoiceId}
                    className="w-1/2 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition disabled:opacity-50"
                  >
                    {resolvingPayment ? "Applying..." : "Confirm"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}