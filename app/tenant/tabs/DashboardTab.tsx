'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  AlertTriangle, 
  Clock, 
  Gauge, 
  CreditCard, 
  CheckCircle2, 
  FileX, 
  LogOut, 
  User, 
  Home, 
  UserCheck 
} from 'lucide-react';
import { TenantInvoice, MeterReadingInfo } from '../types';

interface TenantProfile {
  name: string;
  property_name: string;
  unit_number: string;
  caretaker_name: string;
  caretaker_phone?: string;
}

export const DashboardTab: React.FC = () => {
  const router = useRouter();
  const [profile, setProfile] = useState<TenantProfile | null>(null);
  const [meterInfo, setMeterInfo] = useState<MeterReadingInfo | null>(null);
  const [invoices, setInvoices] = useState<TenantInvoice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [profileRes, invoiceRes, meterRes] = await Promise.all([
          fetch('/api/tenant/profile'),
          fetch('/api/tenant/invoices'),
          fetch('/api/tenant/meter-reading')
        ]);

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData.profile || null);
        }

        if (invoiceRes.ok) {
          const invData = await invoiceRes.json();
          setInvoices(invData.invoices || []);
        }

        if (meterRes.ok) {
          const meterData = await meterRes.json();
          setMeterInfo(meterData.meterInfo || null);
        }
      } catch (err) {
        console.error('Failed to load tenant dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handlePayNow = async (invoiceId: string, amount: number) => {
    setPayingId(invoiceId);
    try {
      const res = await fetch('/api/tenant/pay-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice_id: invoiceId, amount }),
      });

      if (!res.ok) throw new Error('Payment processing failed');

      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === invoiceId ? { ...inv, status: 'under_review' } : inv
        )
      );
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert('Payment failed');
      }
    } finally {
      setPayingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500 font-medium animate-pulse">
        Loading tenant dashboard...
      </div>
    );
  }

  const overdueInvoices = invoices.filter((i) => i.status === 'overdue');
  const reviewInvoices = invoices.filter((i) => i.status === 'under_review');

  return (
    <div className="space-y-8">
      {/* HERO SECTION WITH REAL DATABASE DATA ONLY */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Tenant Portal</span>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mt-0.5">
              <User className="text-gray-600" size={22} />
              {profile?.name || 'Tenant Dashboard'}
            </h2>
          </div>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="self-start md:self-auto flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition disabled:opacity-50"
          >
            <LogOut size={16} />
            {isLoggingOut ? 'Logging out...' : 'Log Out'}
          </button>
        </div>

        {/* PROPERTY, UNIT, AND CARETAKER REAL DATA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-1 text-sm">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
            <Home className="text-blue-600 shrink-0" size={20} />
            <div>
              <div className="text-xs text-gray-500 font-medium">Property &amp; Unit</div>
              <div className="font-semibold text-gray-800">
                {profile?.property_name && profile?.unit_number
                  ? `${profile.property_name} — Unit ${profile.unit_number}`
                  : profile?.property_name || (profile?.unit_number ? `Unit ${profile.unit_number}` : 'No unit assigned')}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
            <UserCheck className="text-emerald-600 shrink-0" size={20} />
            <div>
              <div className="text-xs text-gray-500 font-medium">Assigned Caretaker</div>
              <div className="font-semibold text-gray-800">
                {profile?.caretaker_name ? (
                  <>
                    {profile.caretaker_name}
                    {profile.caretaker_phone ? ` (${profile.caretaker_phone})` : ''}
                  </>
                ) : (
                  'Not assigned'
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-blue-50/60 rounded-lg border border-blue-100">
            <CreditCard className="text-blue-600 shrink-0" size={20} />
            <div>
              <div className="text-xs text-blue-600 font-medium">Active Invoices</div>
              <div className="font-semibold text-blue-900">{invoices.length} Raised</div>
            </div>
          </div>
        </div>
      </div>

      {/* 1. NOTIFICATION ALERTS SECTION */}
      <div className="space-y-3">
        {overdueInvoices.length > 0 && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3">
            <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className="font-bold text-red-900 text-sm">Overdue Payment Notice</h4>
              <p className="text-sm text-red-700 mt-0.5">
                You have {overdueInvoices.length} overdue invoice(s). Please make payment promptly to avoid penalties.
              </p>
            </div>
          </div>
        )}

        {reviewInvoices.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
            <Clock className="text-amber-600 shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className="font-bold text-amber-900 text-sm">Payment Received &amp; Pending Review</h4>
              <p className="text-sm text-amber-700 mt-0.5">
                Your recent payment was received and captured in the system. It is currently awaiting verification and review from management.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 2. METER READING OVERVIEW */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 mb-4 text-gray-800 font-bold text-lg">
          <Gauge className="text-blue-600" size={22} />
          <h3>Water Meter Reading Overview {meterInfo?.billing_month ? `(${meterInfo.billing_month})` : ''}</h3>
        </div>

        {meterInfo ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="text-xs text-gray-500 font-medium">Previous Meter Reading</div>
              <div className="text-2xl font-bold text-gray-800 mt-1">{meterInfo.previous_meter_reading}</div>
            </div>

            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="text-xs text-gray-500 font-medium">Current Meter Reading</div>
              <div className="text-2xl font-bold text-blue-600 mt-1">{meterInfo.current_meter_reading}</div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-xs text-blue-600 font-medium">Total Units Consumed</div>
              <div className="text-2xl font-bold text-blue-900 mt-1">{meterInfo.units_consumed} units</div>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-lg text-sm">
            No current meter reading record found for your unit.
          </div>
        )}
      </div>

      {/* 3. RAISED INVOICES & DIRECT PAY BUTTON */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-800">Raised Invoices</h3>
          <p className="text-sm text-gray-500">Pay your active bills directly from this portal.</p>
        </div>

        {invoices.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-2 text-gray-500">
            <FileX size={36} className="text-gray-400" />
            <p className="font-semibold text-gray-700">No raised invoices found</p>
            <p className="text-xs text-gray-400">You currently have no active or historical invoices on record.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {invoices.map((inv) => (
              <div key={inv.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">{inv.title}</span>
                    {inv.status === 'overdue' && (
                      <span className="bg-red-100 text-red-800 text-xs px-2.5 py-0.5 rounded-full font-medium">Overdue</span>
                    )}
                    {inv.status === 'under_review' && (
                      <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-medium">Awaiting Review</span>
                    )}
                    {inv.status === 'unpaid' && (
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2.5 py-0.5 rounded-full font-medium">Unpaid</span>
                    )}
                  </div>

                  {inv.meter_info && (
                    <p className="text-xs text-gray-500">
                      Readings: {inv.meter_info.previous_meter_reading} to {inv.meter_info.current_meter_reading} ({inv.meter_info.units_consumed} units)
                    </p>
                  )}

                  <div className="text-xs text-gray-500">
                    Due Date: <span className="font-medium text-gray-700">{inv.due_date}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 justify-between md:justify-end">
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Amount Due</div>
                    <div className="text-xl font-bold text-gray-900">KES {inv.amount.toFixed(2)}</div>
                  </div>

                  {inv.status === 'under_review' ? (
                    <button
                      disabled
                      className="bg-amber-100 text-amber-800 text-sm font-medium px-5 py-2.5 rounded-lg cursor-not-allowed flex items-center gap-2"
                    >
                      <Clock size={16} /> Payment Pending Review
                    </button>
                  ) : inv.status === 'paid' ? (
                    <button
                      disabled
                      className="bg-green-100 text-green-800 text-sm font-medium px-5 py-2.5 rounded-lg cursor-not-allowed flex items-center gap-2"
                    >
                      <CheckCircle2 size={16} /> Paid
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePayNow(inv.id, inv.amount)}
                      disabled={payingId === inv.id}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition disabled:opacity-50 flex items-center gap-2"
                    >
                      <CreditCard size={16} />
                      {payingId === inv.id ? 'Processing...' : 'Pay Now'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};