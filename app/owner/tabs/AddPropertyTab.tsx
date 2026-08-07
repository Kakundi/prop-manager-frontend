'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface PropertyUnit {
  id: string;
  unit_number: string;
  rent_amount: number;
  garbage_fee: number;
  parking_fee: number;
  water_fee: number;
  is_occupied?: boolean;
}

interface PropertyGroup {
  id: string;
  name: string;
  location: string | null;
  water_rate_per_unit: number;
  units: PropertyUnit[];
}

interface AddPropertyTabProps {
  currentUserId: string;
}

export default function AddPropertyTab({ currentUserId }: AddPropertyTabProps) {
  // Property Inputs
  const [propertyName, setPropertyName] = useState('');
  const [location, setLocation] = useState('');
  const [waterRatePerUnit, setWaterRatePerUnit] = useState('');
  const [isWaterNA, setIsWaterNA] = useState(false);

  // Unit Inputs
  const [unitNumber, setUnitNumber] = useState('');
  const [rentAmount, setRentAmount] = useState('');

  // Optional Fees
  const [garbageFee, setGarbageFee] = useState('');
  const [isGarbageNA, setIsGarbageNA] = useState(false);

  const [parkingFee, setParkingFee] = useState('');
  const [isParkingNA, setIsParkingNA] = useState(false);

  // UI State
  const [loading, setLoading] = useState(false);
  const [fetchingList, setFetchingList] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [propertiesList, setPropertiesList] = useState<PropertyGroup[]>([]);

  // Fetch properties and their associated units
  const fetchPropertiesAndUnits = useCallback(async () => {
    setFetchingList(true);
    try {
      const res = await fetch('/owner/api/add');
      const data = await res.json();
      if (res.ok && data.units) {
        // Transform backend response: group flat units under their unique properties
        const map = new Map<string, PropertyGroup>();

        data.units.forEach((item: any) => {
          const propId = item.properties?.id || 'unassigned';
          const propName = item.properties?.name || 'Unnamed Property';
          const propLoc = item.properties?.location || null;
          const propWaterRate = item.properties?.water_rate_per_unit || 0;

          if (!map.has(propId)) {
            map.set(propId, {
              id: propId,
              name: propName,
              location: propLoc,
              water_rate_per_unit: propWaterRate,
              units: [],
            });
          }

          map.get(propId)?.units.push({
            id: item.id,
            unit_number: item.unit_number,
            rent_amount: item.rent_amount,
            garbage_fee: item.garbage_fee,
            parking_fee: item.parking_fee,
            water_fee: item.water_fee,
            is_occupied: item.is_occupied ?? false, // expects boolean flag from db join if available
          });
        });

        setPropertiesList(Array.from(map.values()));
      }
    } catch (err) {
      console.error('Error fetching property registry:', err);
    } finally {
      setFetchingList(false);
    }
  }, []);

  useEffect(() => {
    fetchPropertiesAndUnits();
  }, [fetchPropertiesAndUnits]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    const payload = {
      property: {
        name: propertyName.trim(),
        location: location.trim() || null,
        water_rate_per_unit: isWaterNA || !waterRatePerUnit ? 0.0 : parseFloat(waterRatePerUnit),
      },
      unit: {
        unit_number: unitNumber.trim(),
        rent_amount: parseFloat(rentAmount) || 0.0,
        garbage_fee: isGarbageNA || !garbageFee ? 0.0 : parseFloat(garbageFee),
        parking_fee: isParkingNA || !parkingFee ? 0.0 : parseFloat(parkingFee),
        water_fee: isWaterNA || !waterRatePerUnit ? 0.0 : parseFloat(waterRatePerUnit),
      },
    };

    try {
      const response = await fetch('/owner/api/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to register unit.');
      }

      setMessage({ type: 'success', text: 'Property and Unit saved successfully!' });

      // Reset form input fields
      setPropertyName('');
      setLocation('');
      setWaterRatePerUnit('');
      setUnitNumber('');
      setRentAmount('');
      setGarbageFee('');
      setParkingFee('');
      setIsWaterNA(false);
      setIsGarbageNA(false);
      setIsParkingNA(false);

      // Re-fetch listing
      fetchPropertiesAndUnits();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* FORM CARD */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h2 className="text-xl font-semibold mb-1 text-gray-800">Add New Property & Units</h2>
        <p className="text-sm text-gray-500 mb-6">
          Configure property names, locations, unit codes/numbers, and fee schedules.
        </p>

        {message.text && (
          <div
            className={`p-3 text-sm rounded mb-4 ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1 */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
              1. Property Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Property Name *
                </label>
                <input
                  type="text"
                  required
                  value={propertyName}
                  onChange={(e) => setPropertyName(e.target.value)}
                  placeholder="e.g. Sunrise Heights"
                  className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Kilimani, Nairobi"
                  className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2 */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
              2. Unit Details & Fees
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Name / Number (Text) *
                </label>
                <input
                  type="text"
                  required
                  value={unitNumber}
                  onChange={(e) => setUnitNumber(e.target.value)}
                  placeholder="e.g. A-101"
                  className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rent Per Unit (KES) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={rentAmount}
                  onChange={(e) => setRentAmount(e.target.value)}
                  placeholder="45000"
                  className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Garbage Fee */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-medium text-gray-700">Garbage Fee</label>
                  <label className="text-xs text-gray-500 flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isGarbageNA}
                      onChange={(e) => {
                        setIsGarbageNA(e.target.checked);
                        if (e.target.checked) setGarbageFee('');
                      }}
                    />
                    N/A
                  </label>
                </div>
                <input
                  type="number"
                  step="0.01"
                  disabled={isGarbageNA}
                  value={isGarbageNA ? '' : garbageFee}
                  onChange={(e) => setGarbageFee(e.target.value)}
                  placeholder={isGarbageNA ? 'N/A' : '300'}
                  className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm disabled:bg-gray-100 disabled:text-gray-400 outline-none"
                />
              </div>

              {/* Parking Fee */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-medium text-gray-700">Parking Fee</label>
                  <label className="text-xs text-gray-500 flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isParkingNA}
                      onChange={(e) => {
                        setIsParkingNA(e.target.checked);
                        if (e.target.checked) setParkingFee('');
                      }}
                    />
                    N/A
                  </label>
                </div>
                <input
                  type="number"
                  step="0.01"
                  disabled={isParkingNA}
                  value={isParkingNA ? '' : parkingFee}
                  onChange={(e) => setParkingFee(e.target.value)}
                  placeholder={isParkingNA ? 'N/A' : '1500'}
                  className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm disabled:bg-gray-100 disabled:text-gray-400 outline-none"
                />
              </div>

              {/* Water Rate */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-medium text-gray-700">Water Rate / Unit</label>
                  <label className="text-xs text-gray-500 flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isWaterNA}
                      onChange={(e) => {
                        setIsWaterNA(e.target.checked);
                        if (e.target.checked) setWaterRatePerUnit('');
                      }}
                    />
                    N/A
                  </label>
                </div>
                <input
                  type="number"
                  step="0.01"
                  disabled={isWaterNA}
                  value={isWaterNA ? '' : waterRatePerUnit}
                  onChange={(e) => setWaterRatePerUnit(e.target.value)}
                  placeholder={isWaterNA ? 'N/A' : '500'}
                  className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm disabled:bg-gray-100 disabled:text-gray-400 outline-none"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md transition text-sm disabled:opacity-50"
          >
            {loading ? 'Saving Property & Unit...' : 'Save Property'}
          </button>
        </form>
      </div>

      {/* REGISTERED PROPERTIES OVERVIEW TABLE */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Registered Properties & Units</h2>
            <p className="text-sm text-gray-500">
              Complete inventory of your registered properties, unit codes, and occupancy status.
            </p>
          </div>
          <button
            onClick={fetchPropertiesAndUnits}
            disabled={fetchingList}
            className="px-3 py-1.5 text-xs font-medium border rounded-md text-gray-600 hover:bg-gray-50 transition"
          >
            {fetchingList ? 'Refreshing...' : 'Refresh List'}
          </button>
        </div>

        {propertiesList.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm border-t mt-4">
            No properties registered yet. Fill out the form above to add your first property and unit.
          </div>
        ) : (
          <div className="space-y-6 border-t pt-4">
            {propertiesList.map((prop) => {
              const totalUnits = prop.units.length;
              const occupiedCount = prop.units.filter((u) => u.is_occupied).length;
              const vacantCount = totalUnits - occupiedCount;

              return (
                <div key={prop.id} className="border rounded-md overflow-hidden bg-white">
                  {/* Property Sub-header */}
                  <div className="bg-gray-50 px-4 py-3 border-b flex flex-wrap justify-between items-center gap-2">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">{prop.name}</h3>
                      <p className="text-xs text-gray-500">{prop.location || 'Location Not Specified'}</p>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-medium">
                        Total Units: {totalUnits}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-green-50 text-green-700 font-medium">
                        Occupied: {occupiedCount}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-medium">
                        Vacant: {vacantCount}
                      </span>
                    </div>
                  </div>

                  {/* Units Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                      <thead className="bg-white text-gray-500 text-xs uppercase font-medium border-b">
                        <tr>
                          <th className="py-2.5 px-4">Unit Number</th>
                          <th className="py-2.5 px-4">Status</th>
                          <th className="py-2.5 px-4">Rent (KES)</th>
                          <th className="py-2.5 px-4">Garbage</th>
                          <th className="py-2.5 px-4">Parking</th>
                          <th className="py-2.5 px-4">Water</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-xs">
                        {prop.units.map((unit) => (
                          <tr key={unit.id} className="hover:bg-gray-50">
                            <td className="py-3 px-4 font-semibold text-gray-900">
                              {unit.unit_number}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                  unit.is_occupied
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {unit.is_occupied ? 'Occupied' : 'Vacant'}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-medium text-gray-800">
                              KES {unit.rent_amount?.toLocaleString()}
                            </td>
                            <td className="py-3 px-4">
                              {unit.garbage_fee > 0 ? `KES ${unit.garbage_fee}` : 'N/A'}
                            </td>
                            <td className="py-3 px-4">
                              {unit.parking_fee > 0 ? `KES ${unit.parking_fee}` : 'N/A'}
                            </td>
                            <td className="py-3 px-4">
                              {unit.water_fee > 0 ? `KES ${unit.water_fee}` : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}