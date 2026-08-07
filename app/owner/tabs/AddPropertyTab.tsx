"use client";

import { useEffect, useState, FormEvent } from "react";
import { createBrowserClient } from "@supabase/ssr";

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

  // Form inputs
  const [propertyName, setPropertyName] = useState("");
  const [location, setLocation] = useState("");
  const [waterRate, setWaterRate] = useState<number | "">("");

  const [unitNumber, setUnitNumber] = useState("");
  const [rentAmount, setRentAmount] = useState<number | "">("");
  const [garbageFee, setGarbageFee] = useState<number | "">(0);
  const [parkingFee, setParkingFee] = useState<number | "">(0);
  const [waterFee, setWaterFee] = useState<number | "">(0);

  // Form states
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // List states
  const [properties, setProperties] = useState<Property[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  // Modal edit states
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Load properties list
  const fetchOverview = async () => {
    try {
      setListLoading(true);
      setListError(null);
      const res = await fetch("/owner/api/properties-overview");

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to fetch (Status: ${res.status})`);
      }

      const data = await res.json();
      setProperties(data.properties || []);
    } catch (err: any) {
      console.error("Fetch overview error:", err);
      setListError(err.message || "Failed to load properties.");
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  // Save New Property and Unit
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("User session invalid.");

      const cleanPropName = propertyName.trim();
      let propertyId: string;

      const { data: existing, error: checkError } = await supabase
        .from("properties")
        .select("id")
        .ilike("name", cleanPropName)
        .eq("owner_id", user.id);

      if (checkError) throw checkError;

      if (existing && existing.length > 0) {
        propertyId = existing[0].id;
      } else {
        const { data: newProp, error: propError } = await supabase
          .from("properties")
          .insert({
            name: cleanPropName,
            location: location.trim(),
            water_rate_per_unit: Number(waterRate) || 0,
            owner_id: user.id,
          })
          .select("id")
          .single();

        if (propError) throw propError;
        propertyId = newProp.id;
      }

      const { error: unitError } = await supabase
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

      if (unitError) throw unitError;

      setFormSuccess(`Saved property and unit ${unitNumber}`);
      setUnitNumber("");
      setRentAmount("");
      setGarbageFee(0);
      setParkingFee(0);
      setWaterFee(0);

      fetchOverview();
    } catch (err: any) {
      setFormError(err.message || "Failed to save record.");
    } finally {
      setSubmitting(false);
    }
  };

  // Update Property Handler
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
      setEditError(err.message || "Failed to update property.");
    } finally {
      setEditSubmitting(false);
    }
  };

  // Update Unit Handler
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

      {/* FORM SECTION */}
      <form onSubmit={handleSubmit} className="border p-6 rounded-lg bg-white shadow-sm space-y-6">
        {formError && <div className="p-3 bg-red-100 text-red-700 rounded">{formError}</div>}
        {formSuccess && <div className="p-3 bg-green-100 text-green-700 rounded">{formSuccess}</div>}

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
                placeholder="N/A"
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
              <label className="block text-sm font-medium">Unit Name / Number (Text) *</label>
              <input
                type="text"
                required
                className="w-full border rounded p-2 mt-1"
                placeholder="e.g. 001"
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
                value={rentAmount}
                onChange={(e) => setRentAmount(e.target.value ? Number(e.target.value) : "")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Garbage Fee</label>
              <input
                type="number"
                className="w-full border rounded p-2 mt-1"
                placeholder="N/A"
                value={garbageFee}
                onChange={(e) => setGarbageFee(e.target.value ? Number(e.target.value) : 0)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Parking Fee</label>
              <input
                type="number"
                className="w-full border rounded p-2 mt-1"
                placeholder="N/A"
                value={parkingFee}
                onChange={(e) => setParkingFee(e.target.value ? Number(e.target.value) : 0)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Water Rate / Unit</label>
              <input
                type="number"
                className="w-full border rounded p-2 mt-1"
                placeholder="N/A"
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
          {submitting ? "Saving..." : "Save Property"}
        </button>
      </form>

      {/* REGISTERED PROPERTIES & UNITS INVENTORY TABLE */}
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
          <p className="text-gray-500">Loading records...</p>
        ) : listError ? (
          <p className="text-red-500">{listError}</p>
        ) : (
          <div className="space-y-6">
            {properties.map((prop) => {
              const totalUnits = prop.units?.length || 0;
              const occupiedCount = prop.units?.filter((u) => u.is_occupied).length || 0;
              const vacantCount = totalUnits - occupiedCount;

              return (
                <div key={prop.id} className="border rounded-lg p-5 bg-gray-50 space-y-4">
                  {/* PROPERTY HEADER & EDIT BUTTON */}
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 border-b pb-3">
                    <div>
                      <h3 className="font-bold text-xl text-gray-800">{prop.name}</h3>
                      <p className="text-sm text-gray-600">{prop.location}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-xs space-x-2 text-gray-600">
                        <span>Total Units: <strong>{totalUnits}</strong></span> |
                        <span>Occupied: <strong>{occupiedCount}</strong></span> |
                        <span>Vacant: <strong>{vacantCount}</strong></span>
                      </div>
                      <button
                        onClick={() => setEditingProperty(prop)}
                        className="text-xs bg-gray-800 text-white hover:bg-black px-3 py-1.5 rounded font-medium"
                      >
                        Edit Property
                      </button>
                    </div>
                  </div>

                  {/* UNITS TABLE WITH ACTIONS COLUMN */}
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
                            <td className="p-3 text-right">
                              <button
                                onClick={() => setEditingUnit(unit)}
                                className="text-xs bg-blue-600 text-white hover:bg-blue-700 px-3 py-1 rounded font-medium"
                              >
                                Edit Unit
                              </button>
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

      {/* MODAL: EDIT PROPERTY */}
      {editingProperty && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
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

      {/* MODAL: EDIT UNIT */}
      {editingUnit && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full space-y-4">
            <h3 className="text-lg font-bold">Edit Unit {editingUnit.unit_number}</h3>
            {editError && <p className="text-sm text-red-600">{editError}</p>}
            <form onSubmit={handleUpdateUnit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">Unit Number</label>
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
                  <label className="block text-sm font-medium">Status</label>
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
                  <label className="block text-sm font-medium">Water Fee (KES)</label>
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