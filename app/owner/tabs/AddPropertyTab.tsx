'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { Building, MapPin, Layers, Loader2, CheckCircle2 } from 'lucide-react';

export const AddPropertyTab: React.FC = () => {
  const supabase = createClient();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [totalUnits, setTotalUnits] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase.from('properties').insert([
        {
          name,
          location,
          total_units: parseInt(totalUnits, 10),
          occupied_units: 0,
          owner_id: user.id,
        },
      ]);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Property added successfully!' });
      setName('');
      setLocation('');
      setTotalUnits('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to add property.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Add New Property</h2>
        <p className="text-xs text-gray-500 mt-1">Register a new real estate asset under your ownership.</p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg text-sm flex items-center gap-2 ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {message.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Property Name</label>
          <div className="relative">
            <Building className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sunrise Apartments"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <div className="relative">
            <MapPin className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Westlands, Nairobi"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Total Units</label>
          <div className="relative">
            <Layers className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
            <input
              type="number"
              required
              min="1"
              value={totalUnits}
              onChange={(e) => setTotalUnits(e.target.value)}
              placeholder="e.g. 24"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Register Property'}
        </button>
      </form>
    </div>
  );
};