"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api";
import { RoasterPerson, PersonRole, Roaster } from "@/types";

const ROLE_OPTIONS = [
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "billing", label: "Billing" },
];

function formatDateTime(dt?: string) {
  if (!dt) return "";
  const d = new Date(dt);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function EditPersonPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const personId = searchParams?.get("id");
  const [person, setPerson] = useState<RoasterPerson | null>(null);
  const [roasters, setRoasters] = useState<Roaster[]>([]);
  const [editData, setEditData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const roastersRes = await apiClient.getRoasters();
        const roastersData = (roastersRes as any).roasters || [];
        setRoasters(roastersData);
        if (personId && personId !== "new") {
          const roasterId = roastersData[0]?.id;
          const peopleRes = await apiClient.getPeopleForRoaster(roasterId);
          const peopleData = (peopleRes as any).data || [];
          const found = peopleData.find((p: RoasterPerson) => p.id === personId);
          setPerson(found);
          setEditData(found || {});
        } else {
          setEditData({
            name: "",
            email: "",
            mobile: "",
            roles: ["owner"],
            roasterId: "",
            isPrimary: false,
          });
        }
      } catch (e: any) {
        setError(e.message || "Failed to load data");
      }
      setLoading(false);
    }
    fetchData();
  }, [personId]);

  function handleEditChange(field: string, value: any) {
    setEditData((prev: any) => ({ ...prev, [field]: value }));
  }

  async function saveEdit() {
    setSaving(true);
    try {
      if (personId && personId !== "new") {
        await apiClient.updatePerson(personId, editData);
      } else {
        await apiClient.createPerson(editData);
      }
      router.push("/admin/people");
    } catch (e: any) {
      setError(e.message || "Save failed");
    }
    setSaving(false);
  }

  function cancelEdit() {
    router.push("/admin/people");
  }

  if (loading) return <div className="p-8">Loading...</div>;
  return (
  <div className="max-w-3xl mx-auto pt-8">
      <div className="mb-8">
        <button
          className="text-blue-700 hover:text-blue-900 text-base font-semibold flex items-center gap-2"
          onClick={() => router.push('/admin/people')}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to People
        </button>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold mb-8">{personId === "new" ? "Add Person" : "Edit Person"}</h1>
        {error && <div className="text-red-600 mb-4">{error}</div>}
        <form onSubmit={e => { e.preventDefault(); saveEdit(); }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input className="w-full border rounded px-3 py-2" value={editData.name || ""} onChange={e => handleEditChange("name", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input className="w-full border rounded px-3 py-2" value={editData.email || ""} onChange={e => handleEditChange("email", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mobile</label>
              <input className="w-full border rounded px-3 py-2" value={editData.mobile || ""} onChange={e => handleEditChange("mobile", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Roles</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {ROLE_OPTIONS.map(opt => {
                  const selected = (editData.roles || []).includes(opt.value);
                  return (
                    <button
                      type="button"
                      key={opt.value}
                      className={`px-4 py-1 rounded-full border text-sm font-semibold transition-colors duration-150 focus:outline-none ${selected ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-blue-50'}`}
                      onClick={() => {
                        const roles = editData.roles || [];
                        handleEditChange("roles", selected ? roles.filter(r => r !== opt.value) : [...roles, opt.value]);
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Roaster</label>
              <select className="w-full border rounded px-3 py-2" value={editData.roasterId || ""} onChange={e => handleEditChange("roasterId", e.target.value)}>
                <option value="">Select a roaster</option>
                {[...roasters].sort((a, b) => a.name.trim().toLowerCase().localeCompare(b.name.trim().toLowerCase())).map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-4 mt-6 md:mt-0">
              <button
                type="button"
                className={`px-4 py-1 rounded-full border text-sm font-semibold transition-colors duration-150 focus:outline-none ${editData.isPrimary ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-blue-50'}`}
                onClick={() => handleEditChange("isPrimary", !editData.isPrimary)}
              >
                Primary
              </button>
            </div>
          </div>
          <div className="flex gap-4 mt-8 justify-end">
            <button type="button" onClick={cancelEdit} className="bg-gray-300 text-gray-800 px-6 py-2 rounded hover:bg-gray-400">Cancel</button>
            <button type="submit" disabled={saving} className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">{saving ? "Saving..." : "Save"}</button>
          </div>
        </form>
        {(editData.createdAt || editData.updatedAt) && (
          <div className="mt-6 text-sm text-gray-500 bg-gray-50 rounded p-3">
            {editData.createdAt && <span>Created on {formatDateTime(editData.createdAt)}.</span>} {editData.updatedAt && <span>Updated on {formatDateTime(editData.updatedAt)}.</span>}
          </div>
        )}
      </div>
    </div>
  );
}
