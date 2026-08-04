'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, AlertCircle, Link2 } from 'lucide-react';
import { UnassignedPayment } from '../types';

interface TenantOption {
  id: string;
  full_name: string;
  unit_number: string;
}

export const UnassignedPaymentsTab: React.FC = () => {
  const [unassignedPaymentsList, setUnassignedPaymentsList] = useState<UnassignedPayment[]>([]);
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Mapping state
  const [selectedPayment, setSelectedPayment] = useState<UnassignedPayment | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [mappingLoading, setMappingLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const fetchUnassignedPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/property-manager/api/unassigned-payments', { cache: 'no-store' });
      
      if (!res.ok) {
        throw new Error('Failed to fetch unassigned payments from database.');
      }

      const data = await res.json();
      setUnassignedPaymentsList(data.payments || []);
      setTenants(data.tenants || []);
    } catch (err: unknown) {
      console.error('Failed to fetch unassigned payments from database:', err);
      const message = err instanceof Error ? err.message : 'Unable to connect to database.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnassignedPayments();
  }, []);

  const handleMapPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment || !selectedTenantId) return;

    setMappingLoading(true);
    setFeedback(null);

    try {
      const res = await fetch('/property-manager/api/map-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_id: selectedPayment.id,
          tenant_id: selectedTenantId,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to map payment.');

      setFeedback({ type: 'success', msg: 'Payment mapped successfully in database!' });
      setSelectedPayment(null);
      setSelectedTenantId('');
      fetchUnassignedPayments();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error mapping payment.';
      setFeedback({ type: 'error', msg: message });
    } finally {
      setMappingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 bg-white rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 gap-2 shadow-sm">
        <Loader2 className="animate-spin text-blue-600" size={24} />
        <span>Fetching unassigned payments from database...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
        <AlertCircle size={18} />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {feedback && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {feedback.msg}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Unassigned Payments</h2>
          <p className="text-sm text-gray-500">Unassigned payments from tenants attached to assigned properties.</p>
        </div>

        {unassignedPaymentsList.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-sm flex flex-col items-center justify-center">
            <CheckCircle2 size={32} className="text-green-500 mb-2" />
            <span>No unassigned payments found in the database.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
                  <th className="p-4">Sender / Phone</th>
                  <th className="p-4">Reference No.</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Date Received</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {unassignedPaymentsList.map((pay) => (
                  <tr key={pay.id}>
                    <td className="p-4 font-medium text-gray-900">
                      {pay.sender_name || 'Unknown Sender'} 
                      <span className="block text-xs text-gray-500">{pay.phone || 'No Phone Recorded'}</span>
                    </td>
                    <td className="p-4 font-mono text-xs text-gray-600">{pay.reference}</td>
                    <td className="p-4 font-medium text-gray-900">${pay.amount.toFixed(2)}</td>
                    <td className="p-4 text-gray-500">{pay.date}</td>
                    <td className="p-4">
                      <button
                        onClick={() => {
                          setSelectedPayment(pay);
                          setSelectedTenantId('');
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded font-medium transition flex items-center gap-1 shadow-sm"
                      >
                        <Link2 size={14} /> Map Payment
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MAP PAYMENT MODAL */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Map Unassigned Payment</h3>
              <p className="text-xs text-gray-500 mt-1">
                Assign transaction <span className="font-mono text-blue-700 font-semibold">{selectedPayment.reference}</span> (${selectedPayment.amount.toFixed(2)}) to a tenant.
              </p>
            </div>

            <form onSubmit={handleMapPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">
                  Select Tenant & Unit
                </label>
                <select
                  required
                  value={selectedTenantId}
                  onChange={(e) => setSelectedTenantId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="">-- Choose Tenant --</option>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.full_name} (Unit {tenant.unit_number})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedPayment(null)}
                  disabled={mappingLoading}
                  className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={mappingLoading || !selectedTenantId}
                  className="px-4 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-2 disabled:opacity-50"
                >
                  {mappingLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={14} /> Mapping...
                    </>
                  ) : (
                    'Confirm Mapping'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};