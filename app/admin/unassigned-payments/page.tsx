"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabaseClient";

interface UnassignedPayment {
  id: string;
  mpesa_code: string;
  phone_number: string;
  amount: number;
  account_reference: string;
  created_at: string;
  is_resolved: boolean;
}

interface OpenInvoice {
  id: string;
  billing_month: string;
  balance: number;
  tenants?: {
    profiles?: {
      full_name: string;
      phone: string;
    };
  };
  units?: {
    unit_number: string;
    properties?: {
      name: string;
    };
  };
}

export default function UnassignedPaymentsPage() {
  const supabase = createClient();

  const [unassigned, setUnassigned] = useState<UnassignedPayment[]>([]);
  const [openInvoices, setOpenInvoices] = useState<OpenInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedPayment, setSelectedPayment] = useState<UnassignedPayment | null>(null);
  const [targetInvoiceId, setTargetInvoiceId] = useState("");
  const [notes, setNotes] = useState("");
  const [resolving, setResolving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      // 1. Fetch pending unassigned payments
      const { data: unassignedData } = await supabase
        .from("unassigned_payments")
        .select("*")
        .eq("is_resolved", false)
        .order("created_at", { ascending: false });

      if (unassignedData) {
        setUnassigned(unassignedData as UnassignedPayment[]);
      }

      // 2. Fetch all invoices with an active balance > 0
      const { data: invoiceData } = await supabase
        .from("invoices")
        .select("id, billing_month, balance, tenants(profiles(full_name, phone)), units(unit_number, properties(name))")
        .gt("balance", 0)
        .order("created_at", { ascending: false });

      if (invoiceData) {
        setOpenInvoices(invoiceData as any);
      }
    } catch (err) {
      console.error("Error fetching reconciliation data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleReassign(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPayment || !targetInvoiceId) return;

    setResolving(true);
    setMsg(null);

    try {
      const { data, error } = await supabase.rpc("reassign_unassigned_payment", {
        p_unassigned_id: selectedPayment.id,
        p_target_invoice_id: targetInvoiceId,
        p_notes: notes || "Manually assigned via management dashboard",
      });

      if (error) throw error;

      setMsg({
        type: "success",
        text: `Payment ${selectedPayment.mpesa_code} successfully assigned!`,
      });

      setSelectedPayment(null);
      setTargetInvoiceId("");
      setNotes("");
      fetchData(); // Refresh list
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Failed to reassign payment." });
    } finally {
      setResolving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex justify-center">
      <div className="w-full max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
          <div>
            <h1 className="text-xl font-bold text-amber-400">
              Unassigned M-Pesa Reconciliation Engine
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Audit unmatched payments and manually map funds to active tenant balances
            </p>
          </div>
          <button
            onClick={fetchData}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-md border border-slate-700 transition"
          >
            Refresh List
          </button>
        </div>

        {msg && (
          <div
            className={`p-4 rounded-lg text-xs font-medium border ${
              msg.type === "success"
                ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-200"
                : "bg-red-950/80 border-red-500/50 text-red-200"
            }`}
          >
            {msg.text}
          </div>
        )}

        {/* Unassigned Payments Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
          <h2 className="text-sm font-bold text-slate-200 mb-4">
            Unmatched Transactions ({unassigned.length})
          </h2>

          {loading ? (
            <div className="text-xs text-slate-400 py-8 text-center">Loading unassigned records...</div>
          ) : unassigned.length === 0 ? (
            <div className="text-xs text-slate-400 py-8 text-center">
              All M-Pesa payments are reconciled! No unassigned funds pending.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-3 font-medium">Date/Time</th>
                    <th className="pb-3 font-medium">M-Pesa Code</th>
                    <th className="pb-3 font-medium">Sender Phone</th>
                    <th className="pb-3 font-medium">Ref Entered</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {unassigned.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 text-slate-400">
                        {new Date(p.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 font-mono text-amber-300 font-semibold">
                        {p.mpesa_code}
                      </td>
                      <td className="py-3 text-slate-300">{p.phone_number}</td>
                      <td className="py-3 text-slate-300">{p.account_reference || "N/A"}</td>
                      <td className="py-3 font-bold text-emerald-400">
                        KSh {p.amount.toLocaleString()}.00
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => setSelectedPayment(p)}
                          className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded text-xs transition"
                        >
                          Resolve & Assign
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Resolution Modal */}
        {selectedPayment && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-lg shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-100">
                  Assign Payment: <span className="text-amber-400">{selectedPayment.mpesa_code}</span>
                </h3>
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              </div>

              <div className="bg-slate-800/60 p-3 rounded-lg text-xs space-y-1 text-slate-300">
                <div>
                  <span className="text-slate-400">Amount Received:</span>{" "}
                  <strong className="text-emerald-400">KSh {selectedPayment.amount.toLocaleString()}.00</strong>
                </div>
                <div>
                  <span className="text-slate-400">Sender Phone:</span> {selectedPayment.phone_number}
                </div>
                <div>
                  <span className="text-slate-400">Entered Reference:</span> {selectedPayment.account_reference || "None"}
                </div>
              </div>

              <form onSubmit={handleReassign} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">
                    Select Target Invoice / Tenant Balance
                  </label>
                  <select
                    required
                    value={targetInvoiceId}
                    onChange={(e) => setTargetInvoiceId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- Choose Target Invoice --</option>
                    {openInvoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.units?.properties?.name} (Unit {inv.units?.unit_number}) -{" "}
                        {inv.tenants?.profiles?.full_name || "Tenant"} | Due Balance: KSh {inv.balance.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Audit Note / Resolution Reason</label>
                  <input
                    type="text"
                    placeholder="e.g. Verified transaction receipt via phone call"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedPayment(null)}
                    className="w-1/2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resolving || !targetInvoiceId}
                    className="w-1/2 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-md transition disabled:opacity-50"
                  >
                    {resolving ? "Processing..." : "Confirm & Apply Payment"}
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