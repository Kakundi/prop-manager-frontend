'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface UnitInput {
  unit_number: string;
  rent_amount: number;
  garbage_fee: number;
  parking_fee: number;
  water_fee_per_unit: number;
}

export default function AddPropertyPage() {
  const [propertyName, setPropertyName] = useState('');
  const [units, setUnits] = useState<UnitInput[]>([
    { unit_number: 'A1', rent_amount: 15000, garbage_fee: 500, parking_fee: 1000, water_fee_per_unit: 300 },
  ]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  function handleUnitChange(index: number, field: keyof UnitInput, value: string | number) {
    const updated = [...units];
    updated[index] = { ...updated[index], [field]: value };
    setUnits(updated);
  }

  function addUnitRow() {
    setUnits([
      ...units,
      { unit_number: `A${units.length + 1}`, rent_amount: 15000, garbage_fee: 500, parking_fee: 1000, water_fee_per_unit: 300 },
    ]);
  }

  function removeUnitRow(index: number) {
    setUnits(units.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User authentication required.');

      // 1. Insert Property
      const { data: propData, error: propErr } = await supabase
        .from('properties')
        .insert({ name: propertyName, owner_id: user.id })
        .select()
        .single();

      if (propErr) throw propErr;

      // 2. Insert Units linked to Property
      const unitsToInsert = units.map((u) => ({
        property_id: propData.id,
        unit_number: u.unit_number,
        rent_amount: u.rent_amount,
        garbage_fee: u.garbage_fee,
        parking_fee: u.parking_fee,
        water_fee_per_unit: u.water_fee_per_unit,
        status: 'VACANT',
      }));

      const { error: unitsErr } = await supabase.from('units').insert(unitsToInsert);
      if (unitsErr) throw unitsErr;

      setMessage({ type: 'success', text: `Property "${propertyName}" and ${units.length} units saved successfully.` });
      setPropertyName('');
      setUnits([{ unit_number: 'A1', rent_amount: 15000, garbage_fee: 500, parking_fee: 1000, water_fee_per_unit: 300 }]);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-6 bg-slate-950 text-slate-100 min-h-screen">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Add Properties</h1>
        <p className="text-xs text-slate-400 mt-1">Configure property metadata, unit structures, and fee structures.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        {message && (
          <div className={`p-4 rounded-xl text-xs ${message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Property Name</label>
            <input
              type="text"
              required
              value={propertyName}
              onChange={(e) => setPropertyName(e.target.value)}
              placeholder="e.g. Sunset Heights Apartments"
              className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-white">Configure Units & Associated Fees</h3>
              <button type="button" onClick={addUnitRow} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg transition">
                + Add Unit
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Unit No/Name</th>
                    <th className="py-2.5 px-3">Rent (KES)</th>
                    <th className="py-2.5 px-3">Garbage Fee</th>
                    <th className="py-2.5 px-3">Parking Fee</th>
                    <th className="py-2.5 px-3">Water Fee/Unit</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {units.map((u, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          required
                          value={u.unit_number}
                          onChange={(e) => handleUnitChange(idx, 'unit_number', e.target.value)}
                          className="w-24 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white font-mono"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          required
                          value={u.rent_amount}
                          onChange={(e) => handleUnitChange(idx, 'rent_amount', Number(e.target.value))}
                          className="w-28 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white font-mono"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          value={u.garbage_fee}
                          onChange={(e) => handleUnitChange(idx, 'garbage_fee', Number(e.target.value))}
                          className="w-24 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white font-mono"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          value={u.parking_fee}
                          onChange={(e) => handleUnitChange(idx, 'parking_fee', Number(e.target.value))}
                          className="w-24 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white font-mono"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          value={u.water_fee_per_unit}
                          onChange={(e) => handleUnitChange(idx, 'water_fee_per_unit', Number(e.target.value))}
                          className="w-24 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white font-mono"
                        />
                      </td>
                      <td className="py-2 px-3 text-right">
                        {units.length > 1 && (
                          <button type="button" onClick={() => removeUnitRow(idx)} className="text-rose-400 hover:text-rose-300 font-bold">
                            ✕
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full max-w-md bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs py-3 rounded-xl transition shadow-lg shadow-emerald-600/20 disabled:opacity-50"
          >
            {loading ? 'Saving Property & Units...' : 'Save Property & Sync to System'}
          </button>
        </form>
      </div>
    </div>
  );
}