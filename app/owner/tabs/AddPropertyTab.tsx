import React, { useState } from 'react';

export default function AddPropertyForm({ currentUserId }: { currentUserId: string }) {
  // Property Level State
  const [propertyName, setPropertyName] = useState('');
  const [location, setLocation] = useState('');
  const [waterRatePerUnit, setWaterRatePerUnit] = useState<string>('');
  const [isWaterNA, setIsWaterNA] = useState<boolean>(false);

  // Unit Level State
  const [unitNumber, setUnitNumber] = useState('');
  const [rentAmount, setRentAmount] = useState('');

  // Garbage Fee State & N/A Toggle
  const [garbageFee, setGarbageFee] = useState('');
  const [isGarbageNA, setIsGarbageNA] = useState(false);

  // Parking Fee State & N/A Toggle
  const [parkingFee, setParkingFee] = useState('');
  const [isParkingNA, setIsParkingNA] = useState(false);

  // Loading & Feedback State
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    // Format optional values: If N/A is checked or empty, default to 0.00
    const payload = {
      // Properties Table Payload
      property: {
        name: propertyName.trim(),
        location: location.trim() || null,
        owner_id: currentUserId,
        water_rate_per_unit: isWaterNA || !waterRatePerUnit ? 0.00 : parseFloat(waterRatePerUnit),
      },
      // Units Table Payload
      unit: {
        unit_number: unitNumber.trim(),
        rent_amount: parseFloat(rentAmount) || 0.00,
        garbage_fee: isGarbageNA || !garbageFee ? 0.00 : parseFloat(garbageFee),
        parking_fee: isParkingNA || !parkingFee ? 0.00 : parseFloat(parkingFee),
        water_fee: isWaterNA || !waterRatePerUnit ? 0.00 : parseFloat(waterRatePerUnit),
      },
    };

    try {
      const response = await fetch('/api/properties/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create property and unit.');
      }

      setMessage({ type: 'success', text: 'Property and Unit added successfully!' });
      
      // Reset Form Fields
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

    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Add New Property & Units</h2>
      <p className="text-sm text-gray-600 mb-6">
        Configure property names, locations, unit codes/numbers, and fee schedules.
      </p>

      {message.text && (
        <div className={`p-3 mb-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* SECTION 1: PROPERTY DETAILS */}
        <div className="border-b pb-4">
          <h3 className="font-semibold text-gray-700 mb-3">1. Property Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Property Name *</label>
              <input
                type="text"
                required
                value={propertyName}
                onChange={(e) => setPropertyName(e.target.value)}
                placeholder="e.g. Sunrise Heights"
                className="w-full border px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Kilimani, Nairobi"
                className="w-full border px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: UNIT & FINANCIAL DETAILS */}
        <div>
          <h3 className="font-semibold text-gray-700 mb-3">2. Unit Details & Fees</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Unit Name / Number (Text) *</label>
              <input
                type="text"
                required
                value={unitNumber}
                onChange={(e) => setUnitNumber(e.target.value)}
                placeholder="e.g. A-101"
                className="w-full border px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Rent Per Unit (KES) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={rentAmount}
                onChange={(e) => setRentAmount(e.target.value)}
                placeholder="45000.00"
                className="w-full border px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* OPTIONAL FEES WITH N/A CHECKBOXES */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Garbage Fee */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium">Garbage Fee</label>
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
                placeholder={isGarbageNA ? 'N/A' : '300.00'}
                className="w-full border px-3 py-2 rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            {/* Parking Fee */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium">Parking Fee</label>
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
                placeholder={isParkingNA ? 'N/A' : '1500.00'}
                className="w-full border px-3 py-2 rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            {/* Water Fee / Meter Rate */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium">Water Rate / Unit</label>
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
                placeholder={isWaterNA ? 'N/A' : '150.00'}
                className="w-full border px-3 py-2 rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-md transition duration-200 disabled:opacity-50"
        >
          {loading ? 'Saving Property & Unit...' : 'Save Property'}
        </button>
      </form>
    </div>
  );
}