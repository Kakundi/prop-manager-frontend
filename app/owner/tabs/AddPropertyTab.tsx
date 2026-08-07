"use client";

import { useEffect, useState, FormEvent } from "react";
import { createBrowserClient } from "@supabase/ssr";

// TypeScript interfaces matching database payload
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

export default function AddPropertyPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Add Form State
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

  // Edit Modal State
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

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

  // Submit New Property & Unit
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

      const { data: existingProperties, error: checkError } = await supabase
        .from("properties")
        .select("id")
        .ilike("name", cleanPropName)
        .eq("owner_id", user.id);

      if (checkError) throw checkError;

      if (existingProperties && existingProperties.length > 0) {
        propertyId = existingProperties[0].id;
      } else {
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

      setFormSuccess(`Property and Unit ${unitNumber} saved successfully!`);
      
      setUnitNumber("");
      setRentAmount("");
      setGarbageFee(0);
      setParkingFee(0);
      setWaterFee(0);

      fetchOverview();
    } catch (err: any) {
      console.error("Error adding property/unit:", err);
      setFormError(err.message || "Failed to register property and unit.");
    } finally {
      setSubmitting(false);
    }
  };

  // Update Property Record
  const handleUpdateProperty = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingProperty) return;
    setEditSubmitting(true);
    setEditError(null);

    try {
      const { error } = await supabase
        .from("properties")
        .update({
          name: editingProperty.name.trim(),
          location: editingProperty.location.trim(),
          water_rate_per_unit: Number(editingProperty.water_rate_per_unit) || 0,
        })
        .eq("id", editingProperty.id);

      if (error) throw error;

      setEditingProperty(null);
      fetchOverview();
    } catch (err: any) {
      console.error("Error updating property:", err);
      setEditError(err.message || "Failed to update property.");
    } finally {
      setEditSubmitting(false);
    }
  };

  // Update Unit Record
  const handleUpdateUnit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingUnit) return;
    setEditSubmitting(true);
    setEditError(null);

    try {
      const { error } = await supabase
        .from("units")
        .update({
          unit_number: editingUnit.unit_number.trim(),
          rent_amount: Number(editingUnit.rent_amount) || 0,
          garbage_fee: Number(editingUnit.garbage_fee) || 0,
          parking_fee: Number(editingUnit.parking_fee) || 0,
          water_fee: Number(editingUnit.water_fee) || 0,
          is_occupied: editingUnit.is_occupied,
        })
        .eq("id", editingUnit.id);

      if (error) throw error;

      setEditingUnit(null);
      fetchOverview();
    } catch (err: any) {
      console.error("Error updating unit:", err);
      setEditError(err.message || "Failed to update unit.");
    } finally {
      setEditSubmitting(false);
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

      {/* NEW PROPERTY FORM */}
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

      {/* INVENTORY LIST SECTION */}
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
          <div className="space-y-6">
            {properties.map((prop) => {
              const totalUnits = prop.units?.length || 0;
              const occupiedCount = prop.units?.filter((u) => u.is_occupied).length || 0;
              const vacantCount = totalUnits - occupiedCount;

              return (
                <div key={prop.id} className="border rounded-lg p-5 bg-gray-50 space-y-4">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 border-b pb-3">
                    <div>
                      <h3 className="font-bold text-xl text-gray-800">{prop.name}</h3>
                      <p className="text-sm text-gray-600">{prop.location || "No location set"}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-xs space-x-2 text-gray-600">
                        <span>Total Units: <strong>{totalUnits}</strong></span> |
                        <span className="text-red-600">Occupied: <strong>{occupiedCount}</strong></span> |
                        <span className="text-green-600">Vacant: <strong>{vacantCount}</strong></span>
                      </div>
                      <button
                        onClick={() => setEditingProperty(prop)}
                        className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-3 py-1.5 rounded"
                      >
                        Edit Property
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Unit Inventory & Fee Schedule</h4>
                    {prop.units && prop.units.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse bg-white rounded shadow-sm">
                          <thead>
                            <tr className="bg-gray-100 border-b text-gray-700">
                              <th className="p-3">Unit Number</th>
                              <th className="p-3">Status</th>
                              <th className="p-3">Rent (KES)</th>
                              <th className="p-3">Garbage</th>
                              <th className="p-3">Parking</th>
                              <th className="p-3">Water</th>
                              <th className="p-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {prop.units.map((unit) => (
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
                                <td className="p-3">KES {unit.rent_amount.toLocaleString()}</td>
                                <td className="p-3">KES {unit.garbage_fee.toLocaleString()}</td>
                                <td className="p-3">KES {unit.parking_fee.toLocaleString()}</td>
                                <td className="p-3">KES {unit.water_fee.toLocaleString()}</td>
                                <td className="p-3 text-right">
                                  <button
                                    onClick={() => setEditingUnit(unit)}
                                    className="text-xs bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 px-2.5 py-1 rounded font-medium"
                                  >
                                    Edit Unit
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">No units attached to this property.</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* EDIT PROPERTY MODAL */}
      {editingProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold">Edit Property</h3>
            {editError && <p className="text-sm text-red-600">{editError}</p>}
            <form onSubmit={handleUpdateProperty} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Property Name</label>
                <input
                  type="text"
                  required
                  className="w-full border rounded p-2 mt-1"
                  value={editingProperty.name}
                  onChange={(e) =>
                    setEditingProperty({ ...editingProperty, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Location</label>
                <input
                  type="text"
                  className="w-full border rounded p-2 mt-1"
                  value={editingProperty.location || ""}
                  onChange={(e) =>
                    setEditingProperty({ ...editingProperty, location: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Water Rate / Unit (KES)</label>
                <input
                  type="number"
                  className="w-full border rounded p-2 mt-1"
                  value={editingProperty.water_rate_per_unit || 0}
                  onChange={(e) =>
                    setEditingProperty({
                      ...editingProperty,
                      water_rate_per_unit: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProperty(null)}
                  className="px-4 py-2 border rounded text-sm hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {editSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT UNIT MODAL */}
      {editingUnit && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full space-y-4">
            <h3 className="text-lg font-bold">Edit Unit {editingUnit.unit_number}</h3>
            {editError && <p className="text-sm text-red-600">{editError}</p>}
            <form onSubmit={handleUpdateUnit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">Unit Number / Code</label>
                  <input
                    type="text"
                    required
                    className="w-full border rounded p-2 mt-1"
                    value={editingUnit.unit_number}
                    onChange={(e) =>
                      setEditingUnit({ ...editingUnit, unit_number: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Occupancy Status</label>
                  <select
                    className="w-full border rounded p-2 mt-1"
                    value={editingUnit.is_occupied ? "occupied" : "vacant"}
                    onChange={(e) =>
                      setEditingUnit({
                        ...editingUnit,
                        is_occupied: e.target.value === "occupied",
                      })
                    }
                  >
                    <option value="vacant">Vacant</option>
                    <option value="occupied">Occupied</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Rent Amount (KES)</label>
                  <input
                    type="number"
                    required
                    className="w-full border rounded p-2 mt-1"
                    value={editingUnit.rent_amount}
                    onChange={(e) =>
                      setEditingUnit({ ...editingUnit, rent_amount: Number(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Garbage Fee (KES)</label>
                  <input
                    type="number"
                    className="w-full border rounded p-2 mt-1"
                    value={editingUnit.garbage_fee}
                    onChange={(e) =>
                      setEditingUnit({ ...editingUnit, garbage_fee: Number(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Parking Fee (KES)</label>
                  <input
                    type="number"
                    className="w-full border rounded p-2 mt-1"
                    value={editingUnit.parking_fee}
                    onChange={(e) =>
                      setEditingUnit({ ...editingUnit, parking_fee: Number(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Water Fixed Fee (KES)</label>
                  <input
                    type="number"
                    className="w-full border rounded p-2 mt-1"
                    value={editingUnit.water_fee}
                    onChange={(e) =>
                      setEditingUnit({ ...editingUnit, water_fee: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUnit(null)}
                  className="px-4 py-2 border rounded text-sm hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {editSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}