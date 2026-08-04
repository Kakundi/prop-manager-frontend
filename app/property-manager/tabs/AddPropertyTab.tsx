'use client';

import React, { useState } from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export const AddPropertyTab: React.FC = () => {
  const [propertyName, setPropertyName] = useState('');
  const [unitsCount, setUnitsCount] = useState<number | ''>('');
  const [rentPerUnit, setRentPerUnit] = useState<number | ''>('');
  const [garbageFee, setGarbageFee] = useState<number | ''>('');
  const [parkingFee, setParkingFee] = useState<number | ''>('');
  const [waterFeePerMeter, setWaterFeePerMeter] = useState<number | ''>('');

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      const res = await fetch('/property-manager/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: propertyName,
          units_count: unitsCount,
          rent_per_unit: rentPerUnit,
          garbage_fee: garbageFee || 0,
          parking_fee: parkingFee || 0,
          water_fee_per_meter: waterFeePerMeter || 0,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to add property record to database.');

      setFeedback({
        type: 'success',
        msg: `Property "${propertyName}" successfully created in database!`,
      });

      // Reset Form
      setPropertyName('');
      setUnitsCount('');
      setRentPerUnit('');
      setGarbageFee('');
      setParkingFee('');
      setWaterFeePerMeter('');
    } catch (err: any) {
      setFeedback({ type: 'error', msg: err.message || 'Error creating property.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl bg-white p-8 rounded-xl shadow-sm border border-gray-200">
      <h2 className="text-xl font-bold text-gray-800 mb-6">ADD Properties</h2>

      {feedback && (
        <div
          className={`p-4 rounded-lg text-sm mb-6 flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {feedback.msg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Properties Name
          </label>
          <input
            type="text"
            required
            value={propertyName}
            onChange={(e) => setPropertyName(e.target.value)}
            placeholder="e.g. Sunset Heights Apartments"
            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Units
          </label>
          <input
            type="number"
            required
            min="1"
            value={unitsCount}
            onChange={(e) => setUnitsCount(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="Total number of units"
            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Rent Per Unit (rent_per_unit)
            </label>
            <input
              type="number"
              required
              min="0"
              value={rentPerUnit}
              onChange={(e) => setRentPerUnit(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="e.g. 800"
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Garbage Fee (garbage_fee)
            </label>
            <input
              type="number"
              min="0"
              value={garbageFee}
              onChange={(e) => setGarbageFee(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="e.g. 30"
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Parking Fee (parking_fee)
            </label>
            <input
              type="number"
              min="0"
              value={parkingFee}
              onChange={(e) => setParkingFee(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="e.g. 50"
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Water Fee Per Meter (water_fee_per_meter)
            </label>
            <input
              type="number"
              min="0"
              value={waterFeePerMeter}
              onChange={(e) => setWaterFeePerMeter(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="e.g. 5"
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Saving to Database...
            </>
          ) : (
            'Save Property'
          )}
        </button>
      </form>
    </div>
  );
};