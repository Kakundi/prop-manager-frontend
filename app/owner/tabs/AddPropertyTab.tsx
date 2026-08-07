"use client";

import { useEffect, useState, FormEvent } from "react";
import { createClient } from "@/lib/supabaseClient";

interface Unit {
  id: string;
  property_id: string;
  unit_number: string;
  rent_amount: number;
  garbage_fee: number;
  parking_fee: number;
  water_fee: number;
  is_occupied: boolean;
}

interface Property {
  id: string;
  name: string;
  location: string;
  water_rate_per_unit: number;
  units: Unit[];
}

interface AddPropertyTabProps {
  currentUserId?: string;
}

export default function AddPropertyTab({ currentUserId }: AddPropertyTabProps) {
  // Form state
  const [propertyName, setPropertyName] = useState("");
  const [location, setLocation] = useState("");
  const [waterRate, setWaterRate] = useState<number | "">("");

  const [unitNumber, setUnitNumber] = useState("");
  const [rentAmount, setRentAmount] = useState<number | "">("");
  const [garbageFee, setGarbageFee] = useState<number | "">(0);
  const [parkingFee, setParkingFee] = useState<number | "">(0);
  const [waterFee, setWaterFee] = useState<number | "">(0);

  // Status states
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const [properties, setProperties] = useState<Property[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const fetchProperties = async () => {
    try {
      setListLoading(true);
      setListError(null);

      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch("/owner/api/properties-overview", {
        cache: "no-store",
        headers,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to fetch (Status ${res.status})`);
      }

      const data = await res.json();
      setProperties(data.properties || []);
    } catch (err: any) {
      console.error("Error fetching properties:", err);
      setListError(err.message || "Failed to load properties.");
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [currentUserId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      const payload = {
        propertyName: propertyName.trim(),
        location: location.trim(),
        waterRate: Number(waterRate) || 0,
        unitNumber: unitNumber.trim(),
        rentAmount: Number(rentAmount) || 0,
        garbageFee: Number(garbageFee) || 0,
        parkingFee: Number(parkingFee) || 0,
        waterFee: Number(waterFee) || 0,
      };

      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch("/owner/api/properties-overview", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to save property record.");
      }

      setFormSuccess(`Successfully saved ${payload.propertyName} - Unit ${payload.unitNumber}`);
      setUnitNumber("");
      setRentAmount("");
      setGarbageFee(0);
      setParkingFee(0);
      setWaterFee(0);

      fetchProperties();
    } catch (err: any) {
      setFormError(err.message || "Failed to save record.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add New Property & Units</h1>
        <p className="text-gray-600">
          Configure property names, locations, unit numbers, and fee structures.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="border p-6 rounded-lg bg-white shadow-sm space-y-6">
        {formError && <div className="p-3 bg-red-100 text-red-700 rounded text-sm">{formError}</div>}
        {formSuccess && <div className="p-3 bg-green-100 text-green-700 rounded text-sm">{formSuccess}</div>}

        <div className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">1. Property Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Property Name *</label>
              <input
                type="text"
                required
                className="w-full border rounded p-2 mt-1"
                placeholder="e.g. Sunrise Heights"
                value={propertyName}
                onChange={(e) => setPropertyName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <input
                type="text"
                className="w-full border rounded p-2 mt-1"
                placeholder="e.g. Kilimani, Nairobi"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Water Rate / Unit (KES)</label>
              <input
                type="number"
                className="w-full border rounded p-2 mt-1"
                placeholder="0"
                value={waterRate}
                onChange={(e) => setWaterRate(e.target.value ? Number(e.target.value) : "")}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">2. Unit Details & Fees</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Unit Name / Number *</label>
              <input
                type="text"
                required
                className="w-full border rounded p-2 mt-1"
                placeholder="e.g. A-101"
                value={unitNumber}
                onChange={(e) => setUnitNumber(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Rent Per Unit (KES) *</label>
              <input
                type="number"
                required
                className="w-full border rounded p-2 mt-1"
                value={rentAmount}
                onChange={(e) => setRentAmount(e.target.value ? Number(e.target.value) : "")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Garbage Fee</label>
              <input
                type="number"
                className="w-full border rounded p-2 mt-1"
                value={garbageFee}
                onChange={(e) => setGarbageFee(e.target.value ? Number(e.target.value) : 0)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Parking Fee</label>
              <input
                type="number"
                className="w-full border rounded p-2 mt-1"
                value={parkingFee}
                onChange={(e) => setParkingFee(e.target.value ? Number(e.target.value) : 0)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Water Fee</label>
              <input
                type="number"
                className="w-full border rounded p-2 mt-1"
                value={waterFee}
                onChange={(e) => setWaterFee(e.target.value ? Number(e.target.value) : 0)}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 font-medium"
        >
          {submitting ? "Saving..." : "Save Property"}
        </button>
      </form>

      <div className="border rounded-lg bg-white shadow-sm space-y-4 p-6">
        <div className="flex justify-between items-center border-b pb-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Registered Properties & Units</h2>
            <p className="text-sm text-gray-500">
              Complete inventory of your registered properties and units.
            </p>
          </div>
          <button
            onClick={fetchProperties}
            className="border px-4 py-2 rounded text-sm hover:bg-gray-50"
          >
            Refresh List
          </button>
        </div>

        {listLoading ? (
          <p className="text-gray-500">Loading records...</p>
        ) : listError ? (
          <div className="p-4 bg-red-50 text-red-700 rounded-md border border-red-200 text-sm">
            {listError}
          </div>
        ) : properties.length === 0 ? (
          <p className="text-gray-500 text-sm py-4 text-center">No properties found. Add one using the form above.</p>
        ) : (
          <div className="space-y-6">
            {properties.map((prop) => {
              const totalUnits = prop.units?.length || 0;
              const occupiedCount = prop.units?.filter((u) => u.is_occupied).length || 0;
              const vacantCount = totalUnits - occupiedCount;

              return (
                <div key={prop.id} className="border rounded-lg overflow-hidden bg-white">
                  <div className="bg-gray-50 px-4 py-3 border-b flex flex-wrap justify-between items-center gap-2">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">{prop.name}</h3>
                      <p className="text-xs text-gray-500">{prop.location || "No location set"}</p>
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

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="bg-gray-100 border-b text-gray-700">
                          <th className="p-3">Unit Number</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Rent (KES)</th>
                          <th className="p-3">Garbage</th>
                          <th className="p-3">Parking</th>
                          <th className="p-3">Water</th>
                        </tr>
                      </thead>
                      <tbody>
                        {prop.units?.map((unit) => (
                          <tr key={unit.id} className="border-b hover:bg-gray-50">
                            <td className="p-3 font-medium">{unit.unit_number}</td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                  unit.is_occupied
                                    ? "bg-red-100 text-red-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                              >
                                {unit.is_occupied ? "Occupied" : "Vacant"}
                              </span>
                            </td>
                            <td className="p-3">KES {unit.rent_amount?.toLocaleString()}</td>
                            <td className="p-3">KES {unit.garbage_fee?.toLocaleString()}</td>
                            <td className="p-3">KES {unit.parking_fee?.toLocaleString()}</td>
                            <td className="p-3">KES {unit.water_fee?.toLocaleString()}</td>
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