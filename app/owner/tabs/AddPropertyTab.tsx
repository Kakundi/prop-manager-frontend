'use client';

import React, { useState, useEffect } from 'react';
import { 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Building, 
  Edit3, 
  Save, 
  X, 
  DollarSign, 
  Layers 
} from 'lucide-react';

export interface PropertyRecord {
  id: string;
  name: string;
  unit_name_or_number: string;
  rent_per_unit: number;
  garbage_fee: number;
  parking_fee: number;
  water_fee_per_meter: number;
  created_at?: string;
}

export const AddPropertyTab: React.FC = () => {
  // Form State
  const [propertyName, setPropertyName] = useState('');
  const [unitIdentifier, setUnitIdentifier] = useState('');
  const [rentPerUnit, setRentPerUnit] = useState<number | ''>('');
  const [garbageFee, setGarbageFee] = useState<number | ''>('');
  const [parkingFee, setParkingFee] = useState<number | ''>('');
  const [waterFeePerMeter, setWaterFeePerMeter] = useState<number | ''>('');

  // UI & Data State
  const [loading, setLoading] = useState(false);
  const [fetchingList, setFetchingList] = useState(true);
  const [propertiesList, setPropertiesList] = useState<PropertyRecord[]>([]);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Modal / Editing State
  const [editingProperty, setEditingProperty] = useState<PropertyRecord | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  // Fetch Existing Properties for Owner on Component Mount
  const fetchProperties = async () => {
    try {
      setFetchingList(true);
      let res = await fetch('/owner/api/properties', { cache: 'no-store' });
      if (!res.ok) {
        res = await fetch('/property-manager/api/properties', { cache: 'no-store' });
      }
      
      if (res.ok) {
        const data = await res.json();
        setPropertiesList(data.properties || data || []);
      }
    } catch (err) {
      console.error('Failed to load existing owner properties list:', err);
    } finally {
      setFetchingList(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  // Handle New Property Submission by Owner
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      const payload = {
        name: propertyName,
        unit_name_or_number: unitIdentifier,
        rent_per_unit: Number(rentPerUnit),
        garbage_fee: garbageFee !== '' ? Number(garbageFee) : 0,
        parking_fee: parkingFee !== '' ? Number(parkingFee) : 0,
        water_fee_per_meter: waterFeePerMeter !== '' ? Number(waterFeePerMeter) : 0,
      };

      let res = await fetch('/owner/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        res = await fetch('/property-manager/api/properties', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to add property record to database.');

      setFeedback({
        type: 'success',
        msg: `Property "${propertyName}" successfully added!`,
      });

      // Reset Form Fields
      setPropertyName('');
      setUnitIdentifier('');
      setRentPerUnit('');
      setGarbageFee('');
      setParkingFee('');
      setWaterFeePerMeter('');

      // Refresh Listed Records
      await fetchProperties();
    } catch (err: any) {
      setFeedback({ type: 'error', msg: err.message || 'Error creating property.' });
    } finally {
      setLoading(false);
    }
  };

  // Handle Editing & Updating Property Pricing
  const handleUpdateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProperty) return;

    setEditLoading(true);
    try {
      let res = await fetch(`/owner/api/properties/${editingProperty.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingProperty),
      });

      if (!res.ok) {
        res = await fetch(`/property-manager/api/properties/${editingProperty.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingProperty),
        });
      }

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update property details.');
      }

      setEditingProperty(null);
      await fetchProperties();
    } catch (err: any) {
      alert(err.message || 'Error updating property.');
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* 1. ADD PROPERTY FORM SECTION */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
            <Building size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Add New Property & Units</h2>
            <p className="text-xs text-gray-500">Configure property names, unit codes/numbers, and billing fees for your portfolio.</p>
          </div>
        </div>

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Property Name
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
                Unit Name / Number (Text)
              </label>
              <input
                type="text"
                required
                value={unitIdentifier}
                onChange={(e) => setUnitIdentifier(e.target.value)}
                placeholder="e.g. Block A1, Suite 4B, or A1-A10"
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Rent Per Unit
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
                Garbage Fee
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
                Parking Fee
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
                Water Fee / Meter
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
                Saving Property...
              </>
            ) : (
              'Save Property'
            )}
          </button>
        </form>
      </div>

      {/* 2. PROPERTIES & UNITS OVERVIEW TABLE */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <Layers size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Owned Properties & Units</h3>
              <p className="text-xs text-gray-500">Overview of configured properties, assigned unit codes, and fee schedules.</p>
            </div>
          </div>
          <button
            onClick={fetchProperties}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline"
          >
            Refresh List
          </button>
        </div>

        {fetchingList ? (
          <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
            <Loader2 className="animate-spin" size={20} />
            <span className="text-sm">Loading properties database...</span>
          </div>
        ) : propertiesList.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <p className="text-sm font-medium text-gray-500">No properties recorded yet.</p>
            <p className="text-xs text-gray-400 mt-1">Fill in the form above to add your first property and unit configuration.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Property Name</th>
                  <th className="py-3 px-4">Unit Name / Number</th>
                  <th className="py-3 px-4">Rent</th>
                  <th className="py-3 px-4">Garbage Fee</th>
                  <th className="py-3 px-4">Parking Fee</th>
                  <th className="py-3 px-4">Water / Unit</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {propertiesList.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-gray-900">{item.name}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        {item.unit_name_or_number || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium">${item.rent_per_unit?.toLocaleString()}</td>
                    <td className="py-3.5 px-4">${item.garbage_fee || 0}</td>
                    <td className="py-3.5 px-4">${item.parking_fee || 0}</td>
                    <td className="py-3.5 px-4">${item.water_fee_per_meter || 0}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setEditingProperty(item)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition"
                      >
                        <Edit3 size={14} /> Adjust Pricing
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. EDIT PRICE ADJUSTMENT MODAL */}
      {editingProperty && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 max-w-md w-full p-6 space-y-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2">
                <DollarSign size={20} className="text-blue-600" />
                <h3 className="text-base font-bold text-gray-800">Adjust Property Pricing</h3>
              </div>
              <button
                onClick={() => setEditingProperty(null)}
                className="text-gray-400 hover:text-gray-600 rounded-lg p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateProperty} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Property Name
                </label>
                <input
                  type="text"
                  value={editingProperty.name}
                  onChange={(e) => setEditingProperty({ ...editingProperty, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Unit Name / Number
                </label>
                <input
                  type="text"
                  value={editingProperty.unit_name_or_number || ''}
                  onChange={(e) => setEditingProperty({ ...editingProperty, unit_name_or_number: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Rent Per Unit
                  </label>
                  <input
                    type="number"
                    value={editingProperty.rent_per_unit}
                    onChange={(e) => setEditingProperty({ ...editingProperty, rent_per_unit: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Garbage Fee
                  </label>
                  <input
                    type="number"
                    value={editingProperty.garbage_fee}
                    onChange={(e) => setEditingProperty({ ...editingProperty, garbage_fee: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Parking Fee
                  </label>
                  <input
                    type="number"
                    value={editingProperty.parking_fee}
                    onChange={(e) => setEditingProperty({ ...editingProperty, parking_fee: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Water Fee / Meter
                  </label>
                  <input
                    type="number"
                    value={editingProperty.water_fee_per_meter}
                    onChange={(e) => setEditingProperty({ ...editingProperty, water_fee_per_meter: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingProperty(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                >
                  {editLoading ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};