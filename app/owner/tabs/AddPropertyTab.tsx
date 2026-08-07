"use client";

import { useEffect, useState, FormEvent } from "react";
import { createBrowserClient } from "@supabase/ssr";

// TypeScript interfaces matching database payload
interface Unit {
  id: string;
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

export default function AddPropertyPage() {
  // Initialize Supabase browser client for form actions
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Form State
  const [propertyName, setPropertyName] = useState("");
  const [location, setLocation] = useState("");
  const [waterRate, setWaterRate] = useState<number | "">("");
  
  const [unitNumber, setUnitNumber] = useState("");
  const [rentAmount, setRentAmount] = useState<number | "">("");
  const [garbageFee, setGarbageFee] = useState<number | "">(0);
  const [parkingFee, setParkingFee] = useState<number | "">(0);
  const [waterFee, setWaterFee] = useState<number | "">(0);

  // Submitting & Loading State
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // List State
  const [properties, setProperties] = useState<Property[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  // Fetch registered properties from route handler
  const fetchOverview = async () => {
    try {
      setListLoading(true);
      setListError(null);
      const res = await fetch("/owner/api/properties-overview");

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Unauthorized access. Please re-login.");
        }
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to fetch (Status: ${res.status})`);
      }

      const data = await res.json();
      setProperties(data.properties || []);
    } catch (err: any) {
      console.error("Error fetching properties overview:", err);
      setListError(err.message || "An error occurred while loading properties.");
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  // Form Submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("User authentication session not found. Please log in again.");
      }

      const cleanPropName = propertyName.trim();
      let propertyId: string;

      // Check if property exists
      const { data: existingProperties, error: checkError } = await supabase
        .from("properties")
        .select("id")
        .ilike("name", cleanPropName)
        .eq("owner_id", user.id);

      if (checkError) throw checkError;

      if (existingProperties && existingProperties.length > 0) {
        propertyId = existingProperties[0].id;
      } else {
        // Insert new property
        const { data: newProperty, error: insertPropError } = await supabase
          .from("properties")
          .insert({
            name: cleanPropName,
            location: location.trim(),
            water_rate_per_unit: Number(waterRate) || 0,
            owner_id: user.id,
          })
          .select("id")
          .single();

        if (insertPropError) throw insertPropError;
        propertyId = newProperty.id;
      }

      // Insert Unit linked to Property
      const { error: insertUnitError } = await supabase
        .from("units")
        .insert({
          property_id: propertyId,
          unit_number: unitNumber.trim(),
          rent_amount: Number(rentAmount) || 0,
          garbage_fee: Number(garbageFee) || 0,
          parking_fee: Number(parkingFee) || 0,
          water_fee: Number(waterFee) || 0,
          is_occupied: false,
        });

      if (insertUnitError) throw insertUnitError;

      setFormSuccess(`Property and Unit ${unitNumber} registered successfully!`);
      
      // Reset unit form fields
      setUnitNumber("");
      setRentAmount("");
      setGarbageFee(0);
      setParkingFee(0);
      setWaterFee(0);

      // Refresh list
      fetchOverview();
    } catch (err: any) {
      console.error("Error adding property/unit:", err);
      setFormError(err.message || "Failed to register property and unit.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Add New Property & Units</h1>
        <p className="text-gray-600">
          Configure property names, locations, unit codes/numbers, and fee schedules.
        </p>
      </div>

      {/* FORM SECTION */}
      <form onSubmit={handleSubmit} className="border p-6 rounded-lg bg-white shadow-sm space-y-6">
        {formError && (
          <div className="p-3 bg-red-100 text-red-700 rounded border border-red-300">
            {formError}
          </div>
        )}
        {formSuccess && (
          <div className="p-3 bg-green-100 text-green-700 rounded border border-green-300">
            {formSuccess}
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">1. Property Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium">Property Name *</label>
              <input
                type="text"
                required
                className="w-full border rounded p-2 mt-1"
                placeholder="e.g. Sunrise Apartments"
                value={propertyName}
                onChange={(e) => setPropertyName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Location</label>
              <input
                type="text"
                className="w-full border rounded p-2 mt-1"
                placeholder="e.g. Westlands, Nairobi"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Water Rate / Unit (KES)</label>
              <input
                type="number"
                className="w-full border rounded p-2 mt-1"
                placeholder="e.g. 150"
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
              <label className="block text-sm font-medium">Unit Name / Number *</label>
              <input
                type="text"
                required
                className="w-full border rounded p-2 mt-1"
                placeholder="e.g. A1 or 102"
                value={unitNumber}
                onChange={(e) => setUnitNumber(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Rent Per Unit (KES) *</label>
              <input
                type="number"
                required
                className="w-full border rounded p-2 mt-1"
                placeholder="e.g. 25000"
                value={rentAmount}
                onChange={(e) => setRentAmount(e.target.value ? Number(e.target.value) : "")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Garbage Fee (KES)</label>
              <input
                type="number"
                className="w-full border rounded p-2 mt-1"
                value={garbageFee}
                onChange={(e) => setGarbageFee(e.target.value ? Number(e.target.value) : 0)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Parking Fee (KES)</label>
              <input
                type="number"
                className="w-full border rounded p-2 mt-1"
                value={parkingFee}
                onChange={(e) => setParkingFee(e.target.value ? Number(e.target.value) : 0)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Water Fixed Fee (KES)</label>
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
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {submitting ? "Saving..." : "Save Property & Unit"}
        </button>
      </form>

      {/* LIST SECTION */}
      <div className="border p-6 rounded-lg bg-white shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b pb-3">
          <div>
            <h2 className="text-xl font-bold">Registered Properties & Units</h2>
            <p className="text-sm text-gray-500">
              Complete inventory of your registered properties, unit codes, and occupancy status.
            </p>
          </div>
          <button
            onClick={fetchOverview}
            className="border px-4 py-2 rounded text-sm hover:bg-gray-50"
          >
            Refresh List
          </button>
        </div>

        {listLoading ? (
          <p className="text-gray-500">Loading property records...</p>
        ) : listError ? (
          <p className="text-red-500">{listError}</p>
        ) : properties.length === 0 ? (
          <p className="text-gray-500">
            No properties registered yet. Fill out the form above to add your first property and unit.
          </p>
        ) : (
          <div className="space-y-4">
            {properties.map((prop) => (
              <div key={prop.id} className="border rounded p-4 bg-gray-50 space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-lg">{prop.name}</h3>
                  <span className="text-sm text-gray-500">{prop.location || "No location set"}</span>
                </div>

                <div className="mt-2">
                  <h4 className="text-sm font-semibold text-gray-700">Units ({prop.units?.length || 0}):</h4>
                  {prop.units && prop.units.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                      {prop.units.map((unit) => (
                        <div key={unit.id} className="bg-white border p-3 rounded text-sm space-y-1">
                          <div className="flex justify-between font-medium">
                            <span>Unit {unit.unit_number}</span>
                            <span className={unit.is_occupied ? "text-red-600" : "text-green-600"}>
                              {unit.is_occupied ? "Occupied" : "Vacant"}
                            </span>
                          </div>
                          <div className="text-gray-600 text-xs">
                            Rent: KES {unit.rent_amount.toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">No units attached to this property.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}