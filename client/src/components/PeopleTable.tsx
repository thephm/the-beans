
"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../lib/api';
import { RoasterPerson, PersonRole, Roaster } from '../types';

const ROLE_OPTIONS = [
  { value: 'owner', label: 'Owner' },
  { value: 'admin', label: 'Admin' },
  { value: 'billing', label: 'Billing' },
];

function EditableCell({ value, onChange, type = 'text', options, ...props }: any) {
  if (type === 'select') {
    return (
      <select className="border rounded px-2 py-1" value={value} onChange={e => onChange(e.target.value)} {...props}>
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    );
  }
  if (type === 'multiselect') {
    return (
      <select multiple className="border rounded px-2 py-1" value={value} onChange={e => {
        const selected = Array.from(e.target.selectedOptions, (o: any) => o.value);
        onChange(selected);
      }} {...props}>
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    );
  }
  return (
    <input className="border rounded px-2 py-1 w-full" value={value} onChange={e => onChange(e.target.value)} {...props} />
  );
}

export default function PeopleTable() {
  const router = useRouter();
  const [people, setPeople] = useState<RoasterPerson[]>([]);
  const [roasters, setRoasters] = useState<Roaster[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const roastersRes = await apiClient.getRoasters();
      // roastersRes is { roasters: Roaster[], pagination: ... }
      const roastersData = (roastersRes as any).roasters || [];
      setRoasters(roastersData);
      const firstRoasterId = roastersData[0]?.id;
      if (firstRoasterId) {
        const peopleRes = await apiClient.getPeopleForRoaster(firstRoasterId);
        const peopleData = (peopleRes as import('../types').ApiResponse<import('../types').RoasterPerson[]>);
  // ...existing code...
        setPeople(peopleData.data || []);
      } else {
        setPeople([]);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load data');
  // ...existing code...
    }
    setLoading(false);
  }

  function startEdit(person: RoasterPerson) {
  router.push(`/admin/people/edit?id=${person.id}`);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditData({});
    setAdding(false);
  }

  function handleEditChange(field: string, value: any) {
    setEditData((prev: any) => ({ ...prev, [field]: value }));
  }

  async function saveEdit() {
    try {
      if (adding) {
        await apiClient.createPerson(editData);
      } else {
        await apiClient.updatePerson(editingId!, editData);
      }
      await fetchData();
      cancelEdit();
    } catch (e: any) {
      setError(e.message || 'Save failed');
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this person?')) return;
    try {
      await apiClient.deletePerson(id);
      await fetchData();
    } catch (e: any) {
      setError(e.message || 'Delete failed');
    }
  }

  function startAdd() {
    if (!roasters.length) {
      setError('No roasters available. Cannot add person.');
      return;
    }
    router.push('/admin/people/edit?id=new');
  }

  // Responsive: stack on mobile, table on desktop
  return (
    <div className="w-full max-w-full overflow-x-auto">
      <div className="flex justify-end items-center mb-4">
        <button
          onClick={startAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          disabled={!roasters.length}
        >
          Add Person
        </button>
      </div>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <table className="w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Name</th>
              <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Email</th>
              <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Mobile</th>
              <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Roles</th>
              <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Roaster</th>
              <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Created</th>
              <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Primary</th>
              <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(adding ? [{ id: 'new', ...editData }] : []).concat(
              people.filter(p => !adding || p.id !== 'new')
            ).map((person: any) => (
              (
                <tr key={person.id} className="border-b">
                  <td className="px-4 py-2 font-medium">{person.name}</td>
                  <td className="px-4 py-2">{person.email}</td>
                  <td className="px-4 py-2">{person.mobile}</td>
                  <td className="px-4 py-2">
                    {(person.roles || []).map(role => (
                      <span key={role} className={`inline-flex px-2 py-1 text-xs font-medium rounded-full mr-1 ${
                        role === 'owner' ? 'bg-purple-100 text-purple-800' :
                        role === 'admin' ? 'bg-gray-100 text-gray-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {role}
                      </span>
                    ))}
                  </td>
                  <td className="px-4 py-2">{roasters.find(r => r.id === person.roasterId)?.name || ''}</td>
                  <td className="px-4 py-2">{person.createdAt ? new Date(person.createdAt).toISOString().slice(0, 10) : ''}</td>
                  <td className="px-4 py-2">{person.isPrimary ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-2 flex gap-2">
                    <button onClick={() => startEdit(person)} className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">Edit</button>
                    <button onClick={() => handleDelete(person.id)} className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">Delete</button>
                  </td>
                </tr>
              )
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
