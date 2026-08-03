'use client';

import React, { useState } from 'react';
import { Gauge, Send, FileText, CheckCircle2 } from 'lucide-react';
import { UnitMeterData, WaterInvoice } from '../types';

export const MeterReadingTab: React.FC = () => {
  // Mock unit meter data for the building
  const [unitsData] = useState<UnitMeterData[]>([
    { unit_id: 'u1', unit_number: 'Apt 1A', tenant_name: 'Alice Smith', previous_meter_reading: 1420, water_rate_per_unit: 5 },
    { unit_id: 'u2', unit_number: 'Apt 1B', tenant_name: 'John Doe', previous_meter_reading: 980, water_rate_per_unit: 5 },
    { unit_id: 'u3', unit_number: 'Apt 2A', tenant_name: 'Mary Connor', previous_meter_reading: 2150, water_rate_per_unit: 5 },
  ]);

  const [selectedUnitId, setSelectedUnitId] = useState<string>(unitsData[0]?.unit_id || '');
  const [currentReading, setCurrentReading] = useState<number | ''>('');
  const [generatedInvoices, setGeneratedInvoices] = useState<WaterInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedUnit = unitsData.find((u) => u.unit_id === selectedUnitId);

  const handleGenerateAndSendInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedUnit || currentReading === '') return;

    if (Number(currentReading) < selectedUnit.previous_meter_reading) {
      setErrorMsg('Current reading must be greater than or equal to previous reading.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/caretaker/api/generate-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unit_id: selectedUnit.unit_id,
          unit_number: selectedUnit.unit_number,
          tenant_name: selectedUnit.tenant_name,
          previous_reading: selectedUnit.previous_meter_reading,
          current_reading: Number(currentReading),
          rate_per_unit: selectedUnit.water_rate_per_unit,
        }),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || 'Failed to generate invoice');
      }

      setGeneratedInvoices([resData.invoice, ...generatedInvoices]);
      setCurrentReading('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* FORM: Record & Generate Invoice */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <Gauge size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Record Water Meter Reading</h2>
            <p className="text-sm text-gray-500">
              Input current readings to generate water bills automatically using property pricing per unit.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm mb-6">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleGenerateAndSendInvoice} className="space-y-6 max-w-2xl">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Select Unit / Tenant
            </label>
            <select
              value={selectedUnitId}
              onChange={(e) => setSelectedUnitId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
            >
              {unitsData.map((u) => (
                <option key={u.unit_id} value={u.unit_id}>
                  {u.unit_number} - {u.tenant_name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Previous Meter Reading
              </label>
              <input
                type="number"
                disabled
                value={selectedUnit?.previous_meter_reading || 0}
                className="w-full border border-gray-200 bg-gray-50 rounded-lg p-3 text-sm text-gray-600 font-semibold cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Current Meter Reading
              </label>
              <input
                type="number"
                required
                value={currentReading}
                onChange={(e) => setCurrentReading(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 1460"
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex justify-between items-center text-sm">
            <span className="text-gray-600">Property Water Rate:</span>
            <span className="font-bold text-gray-800">${selectedUnit?.water_rate_per_unit} / unit</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Send size={18} />
            {loading ? 'Processing & Sending...' : 'Generate Invoice & Send to Tenant'}
          </button>
        </form>
      </div>

      {/* RECENTLY GENERATED INVOICES SECTION */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center gap-2">
          <FileText size={20} className="text-emerald-600" />
          <h3 className="text-lg font-bold text-gray-800">Generated Water Invoices</h3>
        </div>

        {generatedInvoices.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            No water invoices generated in this session yet.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
                <th className="p-4">Invoice ID</th>
                <th className="p-4">Unit & Tenant</th>
                <th className="p-4">Consumption</th>
                <th className="p-4">Total Amount</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {generatedInvoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="p-4 font-mono text-xs font-semibold text-gray-700">{inv.id}</td>
                  <td className="p-4">
                    <div className="font-medium text-gray-900">{inv.unit_number}</div>
                    <div className="text-xs text-gray-500">{inv.tenant_name}</div>
                  </td>
                  <td className="p-4 text-gray-600">
                    {inv.units_consumed} units ({inv.previous_reading} &rarr; {inv.current_reading})
                  </td>
                  <td className="p-4 font-bold text-emerald-600">${inv.total_amount.toFixed(2)}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs px-2.5 py-1 rounded-full font-medium">
                      <CheckCircle2 size={12} /> Sent to Tenant
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};