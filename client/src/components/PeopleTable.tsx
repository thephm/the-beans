
import React, { useEffect, useState } from 'react';
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
      const peopleRes = await apiClient.getPeople();
      setPeople(peopleRes.people || peopleRes.data || []);
      const roastersRes = await apiClient.getRoasters();
      setRoasters(roastersRes.roasters || roastersRes.data || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load data');
    }
    setLoading(false);
  }

  function startEdit(person: RoasterPerson) {
    setEditingId(person.id);
    setEditData({ ...person });
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
    setAdding(true);
    setEditingId('new');
    setEditData({
      name: '',
      email: '',
      mobile: '',
      bio: '',
      roles: ['owner'],
      roasterId: roasters[0]?.id || '',
      isActive: true,
      isPrimary: false,
    });
  }

  // Responsive: stack on mobile, table on desktop
  return (
    <div className="w-full max-w-full overflow-x-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">People</h2>
        <button onClick={startAdd} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Add Person</button>
      </div>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="block md:table w-full">
          <div className="hidden md:table-header-group">
            <div className="table-row">
              <div className="table-cell font-bold p-2">Name</div>
              <div className="table-cell font-bold p-2">Email</div>
              <div className="table-cell font-bold p-2">Mobile</div>
              <div className="table-cell font-bold p-2">Bio</div>
              <div className="table-cell font-bold p-2">Roles</div>
              <div className="table-cell font-bold p-2">Roaster</div>
              <div className="table-cell font-bold p-2">Active</div>
              <div className="table-cell font-bold p-2">Primary</div>
              <div className="table-cell font-bold p-2">Actions</div>
            </div>
          </div>
          <div className="md:table-row-group">
            {(adding ? [{ id: 'new', ...editData }] : []).concat(
              people.filter(p => !adding || p.id !== 'new')
            ).map((person: any) => (
              <div key={person.id} className="block md:table-row border-b md:border-0 mb-4 md:mb-0 bg-white md:bg-transparent rounded md:rounded-none shadow md:shadow-none p-2 md:p-0">
                {editingId === person.id ? (
                  <>
                    <div className="md:table-cell p-2">
                      <EditableCell value={editData.name} onChange={v => handleEditChange('name', v)} />
                    </div>
                    <div className="md:table-cell p-2">
                      <EditableCell value={editData.email} onChange={v => handleEditChange('email', v)} type="email" />
                    </div>
                    <div className="md:table-cell p-2">
                      <EditableCell value={editData.mobile} onChange={v => handleEditChange('mobile', v)} />
                    </div>
                    <div className="md:table-cell p-2">
                      <EditableCell value={editData.bio} onChange={v => handleEditChange('bio', v)} />
                    </div>
                    <div className="md:table-cell p-2">
                      <EditableCell value={editData.roles} onChange={v => handleEditChange('roles', v)} type="multiselect" options={ROLE_OPTIONS} />
                    </div>
                    <div className="md:table-cell p-2">
                      <EditableCell value={editData.roasterId} onChange={v => handleEditChange('roasterId', v)} type="select" options={roasters.map(r => ({ value: r.id, label: r.name }))} />
                    </div>
                    <div className="md:table-cell p-2">
                      <input type="checkbox" checked={!!editData.isActive} onChange={e => handleEditChange('isActive', e.target.checked)} />
                    </div>
                    <div className="md:table-cell p-2">
                      <input type="checkbox" checked={!!editData.isPrimary} onChange={e => handleEditChange('isPrimary', e.target.checked)} />
                    </div>
                    <div className="md:table-cell p-2 flex gap-2">
                      <button onClick={saveEdit} className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700">Save</button>
                      <button onClick={cancelEdit} className="bg-gray-300 text-gray-800 px-2 py-1 rounded hover:bg-gray-400">Cancel</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="md:table-cell p-2"><span className="font-medium">{person.name}</span></div>
                    <div className="md:table-cell p-2">{person.email}</div>
                    <div className="md:table-cell p-2">{person.mobile}</div>
                    <div className="md:table-cell p-2">{person.bio}</div>
                    <div className="md:table-cell p-2">{(person.roles || []).join(', ')}</div>
                    <div className="md:table-cell p-2">{roasters.find(r => r.id === person.roasterId)?.name || ''}</div>
                    <div className="md:table-cell p-2">{person.isActive ? 'Yes' : 'No'}</div>
                    <div className="md:table-cell p-2">{person.isPrimary ? 'Yes' : 'No'}</div>
                    <div className="md:table-cell p-2 flex gap-2">
                      <button onClick={() => startEdit(person)} className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">Edit</button>
                      <button onClick={() => handleDelete(person.id)} className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">Delete</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
