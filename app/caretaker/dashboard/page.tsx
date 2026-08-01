'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Property {
  id: string;
  name: string;
  location: string | null;
}

interface Unit {
  id: string;
  property_id: string;
  unit_number: string;
  rent_amount: number;
  tenants?: {
    id: string;
    is_active: boolean;
  }[];
}

interface WaterReadingLog {
  id: string;
  unit_id: string;
  reading_value: number;
  reading_date: string;
}

export default function CaretakerDashboard({ currentUserId }: { currentUserId?: string }) {
  const [assignedProperties, setAssignedProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Meter Reading Input Form State
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [meterReading, setMeterReading] = useState<number | ''>('');
  const [readingDate, setReadingDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    fetchCaretakerProperties();
  }, [currentUserId]);

  async function fetchCaretakerProperties() {
    setLoading(true);

    // Fetch properties where caretaker_id matches current logged-in user
    let query = supabase.from('properties').select('*');
    if (currentUserId) {
      query = query.eq('caretaker_id', currentUserId);
    }

    const { data, error } = await query;
    if (!error && data) {
      setAssignedProperties(data);
      if (data.length > 0) {
        setSelectedPropertyId(data[0].id);
        loadUnitsForProperty(data[0].id);
      }
    }
    setLoading(false);
  }

  async function loadUnitsForProperty(propertyId: string) {
    if (!propertyId) return;
    
    // Fetch units along with active tenant status
    const { data, error } = await supabase
      .from('units')
      .select('*, tenants(id, is_active)')
      .eq('property_id', propertyId);

    if (!error && data) {
      setUnits(data);
    }
  }

  function handlePropertySelect(propertyId: string) {
    setSelectedPropertyId(propertyId);
    setSelectedUnitId('');
    loadUnitsForProperty(propertyId);
  }

  async function handleRecordMeterReading(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedUnitId || meterReading === '') {
      alert('Please select a unit and enter a valid meter reading.');
      return;
    }

    setSubmitting(true);

    try {
      // Insert or update water reading record for the unit
      const { error } = await supabase.from('water_readings').insert({
        property_id: selectedPropertyId,
        unit_id: selectedUnitId,
        reading_value: Number(meterReading),
        reading_date: readingDate,
        recorded_by: currentUserId || null,
      });

      if (error) throw error;

      alert('Water meter reading recorded successfully!');
      setMeterReading('');
      setSelectedUnitId('');
    } catch (err: any) {
      alert(`Error submitting reading: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium">
        Loading caretaker workspace...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900">Caretaker Field Dashboard</h1>
        <p className="text-sm text-slate-500">
          Record monthly water meter units and view assigned building status
        </p>
      </div>

      {/* Property Selector Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase block mb-1">
            Active Property
          </label>
          {assignedProperties.length > 0 ? (
            <select
              value={selectedPropertyId}
              onChange={(e) => handlePropertySelect(e.target.value)}
              className="border border-slate-300 rounded-lg p-2 text-sm font-semibold bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {assignedProperties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.location ? `(${p.location})` : ''}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-sm text-rose-600 font-medium">No assigned properties found.</p>
          )}
        </div>

        <div className="flex gap-4">
          <div className="bg-slate-100 px-4 py-2 rounded-lg text-center">
            <span className="text-xs font-semibold text-slate-500 uppercase block">Total Units</span>
            <span className="text-xl font-bold text-slate-900">{units.length}</span>
          </div>
          <div className="bg-emerald-50 px-4 py-2 rounded-lg text-center border border-emerald-100">
            <span className="text-xs font-semibold text-emerald-700 uppercase block">Occupied</span>
            <span className="text-xl font-bold text-emerald-800">
              {units.filter((u) => u.tenants && u.tenants.some((t) => t.is_active)).length}
            </span>
          </div>
        </div>
      </div>

      {/* Log Meter Readings Section */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <div className="border-b pb-3">
          <h2 className="text-lg font-bold text-slate-800">Record Water Meter Reading</h2>
          <p className="text-xs text-slate-500">
            Enter current water meter units for billing generation by Property Manager
          </p>
        </div>

        <form onSubmit={handleRecordMeterReading} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase">Select Unit</label>
            <select
              value={selectedUnitId}
              onChange={(e) => setSelectedUnitId(e.target.value)}
              required
              className="w-full border border-slate-300 rounded-lg p-2.5 mt-1 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select Unit --</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  Unit {u.unit_number}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase">Meter Reading (Units)</label>
            <input
              type="number"
              step="0.01"
              placeholder="e.g. 104.5"
              value={meterReading}
              onChange={(e) => setMeterReading(e.target.value === '' ? '' : Number(e.target.value))}
              required
              className="w-full border border-slate-300 rounded-lg p-2.5 mt-1 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase">Reading Date</label>
            <input
              type="date"
              value={readingDate}
              onChange={(e) => setReadingDate(e.target.value)}
              required
              className="w-full border border-slate-300 rounded-lg p-2.5 mt-1 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={submitting || !selectedUnitId}
              className="bg-emerald-600 text-white font-semibold py-2.5 px-6 rounded-lg text-sm hover:bg-emerald-700 transition shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Save Meter Reading'}
            </button>
          </div>
        </form>
      </div>

      {/* Building Unit Roster */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-800">Building Roster & Occupancy</h2>

        {units.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">No units added to this property yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {units.map((unit) => {
              const isOccupied = unit.tenants && unit.tenants.some((t) => t.is_active);
              return (
                <div
                  key={unit.id}
                  className={`p-4 rounded-xl border ${
                    isOccupied
                      ? 'border-emerald-200 bg-emerald-50/50'
                      : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <p className="text-xs font-semibold text-slate-500 uppercase">Unit</p>
                  <p className="text-xl font-bold text-slate-900">{unit.unit_number}</p>
                  <div className="mt-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        isOccupied
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {isOccupied ? 'Occupied' : 'Vacant'}
                    </span>
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