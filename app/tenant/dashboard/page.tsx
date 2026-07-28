"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabaseClient";

interface Invoice {
  id: string;
  billing_month: string;
  due_date: string;
  amount_paid: number;
  balance: number;
  status: string;
  created_at: string;
  units?: {
    unit_number: string;
    properties?: {
      name: string;
    };
  };
}

export default function TenantDashboardPage() {
  const supabase = createClient();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);

  const [phoneNumber, setPhoneNumber] = useState("");
  const [customAmount, setCustomAmount] = useState<number>(0);
  const [stkLoading, setStkLoading] = useState(false);
  const [stkMsg, setStkMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchTenantInvoices();
  }, []);

  async function fetchTenantInvoices() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Fetch current profile phone to auto-fill payment field
        const { data: profile } = await supabase
          .from("profiles")
          .select("phone")
          .eq("id", user.id)
          .single();

        if (profile?.phone) {
          setPhoneNumber(profile.phone);
        }

        // Fetch invoices assigned to tenant's profile
        const { data: tenantData } = await supabase
          .from("tenants")
          .select("id")
          .eq("profile_id", user.id)
          .single();

        if (tenantData) {
          const { data: invoiceData } = await supabase
            .from("invoices")
            .select("*, units(unit_number, properties(name))")
            .eq("tenant_id", tenantData.id)
            .order("created_at", { ascending: false });

          if (invoiceData) {
            setInvoices(invoiceData as any);
          }
        }
      }
    } catch (err) {
      console.error("Error loading tenant dashboard:", err);
    } finally {
      setLoading(false);
    }
  }

  function openPaymentModal(inv: Invoice) {
    setPayingInvoice(inv);
    setCustomAmount(inv.balance);
    setStkMsg(null);
  }

  async function handleSTKPush(e: React.FormEvent) {
    e.preventDefault();
    if (!payingInvoice) return;

    setStkLoading(true);
    setStkMsg(null);

    try {
      const res = await fetch("/api/mpesa/stkpush", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber,
          amount: customAmount,
          accountReference: payingInvoice.units?.unit_number || "RENT",
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to trigger M-Pesa prompt.");
      }

      setStkMsg({
        type: "success",
        text: data.CustomerMessage || "STK Push sent! Please enter your M-Pesa PIN on your phone to complete the payment.",
      });
    } catch (err: any) {
      setStkMsg({ type: "error", text: err.message || "Payment initiation failed." });
    } finally {
      setStkLoading(false);
    }
  }

  const activeInvoice = invoices.find((i) => i.balance > 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex justify-center">
      <div className="w-full max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
          <div>
            <h1 className="text-xl font-bold text-blue-400">Tenant Portal</h1>
            <p className="text-xs text-slate-400 mt-1">
              View outstanding balances and settle monthly invoices via M-Pesa
            </p>
          </div>
          <button
            onClick={fetchTenantInvoices}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-md border border-slate-700 transition"
          >
            Refresh
          </button>
        </div>

        {/* Active Balance Banner */}
        {activeInvoice && (
          <div className="bg-gradient-to-r from-blue-950 to-slate-900 border border-blue-800/50 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                Outstanding Balance
              </span>
              <div className="text-3xl font-extrabold text-white mt-1">
                KSh {activeInvoice.balance.toLocaleString()}.00
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Due Date: {activeInvoice.due_date} | House: {activeInvoice.units?.properties?.name} ({activeInvoice.units?.unit_number})
              </p>
            </div>
            <button
              onClick={() => openPaymentModal(activeInvoice)}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-lg shadow-lg transition transform hover:-translate-y-0.5"
            >
              Pay via M-Pesa STK Push
            </button>
          </div>
        )}

        {/* Invoices List */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
          <h2 className="text-sm font-bold text-slate-200 mb-4">Invoice & Payment History</h2>

          {loading ? (
            <div className="text-xs text-slate-400 py-8 text-center">Loading invoices...</div>
          ) : invoices.length === 0 ? (
            <div className="text-xs text-slate-400 py-8 text-center">No invoice records found for your account.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-3 font-medium">Billing Month</th>
                    <th className="pb-3 font-medium">House Unit</th>
                    <th className="pb-3 font-medium">Amount Paid</th>
                    <th className="pb-3 font-medium">Balance</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 text-slate-200">{inv.billing_month}</td>
                      <td className="py-3 text-slate-300">
                        {inv.units?.properties?.name} - {inv.units?.unit_number}
                      </td>
                      <td className="py-3 text-slate-300">KSh {inv.amount_paid.toLocaleString()}</td>
                      <td className="py-3 text-slate-200 font-semibold">KSh {inv.balance.toLocaleString()}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            inv.status === "PAID"
                              ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                              : "bg-amber-950 text-amber-400 border border-amber-800"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {inv.balance > 0 ? (
                          <button
                            onClick={() => openPaymentModal(inv)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs transition"
                          >
                            Pay
                          </button>
                        ) : (
                          <span className="text-slate-500 text-xs">Cleared</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* STK Push Payment Modal */}
        {payingInvoice && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-100">Pay Invoice via M-Pesa</h3>
                <button
                  onClick={() => setPayingInvoice(null)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              </div>

              {stkMsg && (
                <div
                  className={`p-3 rounded-lg text-xs leading-relaxed border ${
                    stkMsg.type === "success"
                      ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-200"
                      : "bg-red-950/80 border-red-500/50 text-red-200"
                  }`}
                >
                  {stkMsg.text}
                </div>
              )}

              <form onSubmit={handleSTKPush} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">M-Pesa Phone Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 0712345678 or 254712345678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Amount to Pay (KSh)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={payingInvoice.balance}
                    value={customAmount}
                    onChange={(e) => setCustomAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Full Balance: KSh {payingInvoice.balance.toLocaleString()}
                  </span>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setPayingInvoice(null)}
                    className="w-1/2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={stkLoading}
                    className="w-1/2 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-md transition disabled:opacity-50"
                  >
                    {stkLoading ? "Sending Prompt..." : "Send STK Prompt"}
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