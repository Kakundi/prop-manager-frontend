'use client';

import React, { useState } from 'react';

export const AddPropertyTab: React.FC = () => {
  const [propertyName, setPropertyName] = useState('');
  const [unitsCount, setUnitsCount] = useState<number | ''>('');
  const [rentPerUnit, setRentPerUnit] = useState<number | ''>('');
  const [garbageFee, setGarbageFee] = useState<number | ''>('');
  const [parkingFee, setParkingFee] = useState<number | ''>('');
  const [waterFeePerMeter, setWaterFeePerMeter] = useState<number | ''>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('New Property Data:', {
      propertyName,
      unitsCount,
      rentPerUnit,
      garbageFee,
      parkingFee,
      waterFeePerMeter,
    });
    alert('Property added successfully!');
    // Reset Form
    setPropertyName('');
    setUnitsCount('');
    setRentPerUnit('');
    setGarbageFee('');
    setParkingFee('');
    setWaterFeePerMeter('');
  };

  return (
    <div className="max-w-3xl bg-white p-8 rounded-xl shadow-sm border border-gray-200">
      <h2 className="text-xl font-bold text-gray-800 mb-6">ADD Properties</h2>
      
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
            value={unitsCount}
            onChange={(e) => setUnitsCount(Number(e.target.value))}
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
              value={rentPerUnit}
              onChange={(e) => setRentPerUnit(Number(e.target.value))}
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
              value={garbageFee}
              onChange={(e) => setGarbageFee(Number(e.target.value))}
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
              value={parkingFee}
              onChange={(e) => setParkingFee(Number(e.target.value))}
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
              value={waterFeePerMeter}
              onChange={(e) => setWaterFeePerMeter(Number(e.target.value))}
              placeholder="e.g. 5"
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition"
        >
          Save Property
        </button>
      </form>
    </div>
  );
};