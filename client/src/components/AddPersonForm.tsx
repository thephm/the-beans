import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PersonRole } from '../types';
import { Roaster } from '../types';

interface AddPersonFormProps {
  roasters: Roaster[];
  onSave: (person: any) => void;
  onCancel: () => void;
}

export default function AddPersonForm({ roasters, onSave, onCancel }: AddPersonFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    email: '',
    mobile: '',
    bio: '',
    roles: [] as PersonRole[],
    roasterId: '',
    isPrimary: false,
  });
  const safeRoasters = Array.isArray(roasters) ? roasters : [];
  const handleChange = (field: string, value: any) => {
    setForm(f => ({ ...f, [field]: value }));
  };
  const handleRoleToggle = (role: string) => {
    setForm(f => ({
      ...f,
      roles: f.roles.includes(role as PersonRole)
        ? f.roles.filter((r: PersonRole) => r !== (role as PersonRole))
        : [...f.roles, role as PersonRole],
    }));
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };
  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-6 mb-8">
        <div>
          <input type="text" placeholder="Name" value={form.name} onChange={e => handleChange('name', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
        </div>
        <div>
          <input type="email" placeholder="Email" value={form.email} onChange={e => handleChange('email', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>
        <div>
          <input type="text" placeholder="Mobile" value={form.mobile} onChange={e => handleChange('mobile', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>
        <div>
          <textarea placeholder="Bio" value={form.bio} onChange={e => handleChange('bio', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>
        <div className="flex flex-col sm:flex-row items-end gap-2 w-full">
          <div className="flex-1">
            <label className="block mb-1 font-medium">Roaster</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={form.roasterId} onChange={e => handleChange('roasterId', e.target.value)} required>
              <option value="">Select a roaster</option>
              {safeRoasters.map(roaster => (
                <option key={roaster.id} value={roaster.id}>{roaster.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 flex sm:justify-end items-end mt-2 sm:mt-0 justify-start">
            <button
              type="button"
              className={`px-4 py-1 rounded-full border text-sm font-semibold transition-colors duration-150 focus:outline-none ${form.isPrimary ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-blue-50'}`}
              onClick={() => handleChange('isPrimary', !form.isPrimary)}
              style={{marginBottom: '2px'}}
            >
              Primary
            </button>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap mt-2 items-center">
          <span className="font-medium mr-2">Role:</span>
          {[PersonRole.OWNER, PersonRole.ADMIN, PersonRole.BILLING].map(role => (
            <button
              key={role}
              type="button"
              className={`px-4 py-1 rounded-full border text-sm font-semibold transition-colors duration-150 focus:outline-none ${form.roles.includes(role) ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-blue-50'}`}
              onClick={() => handleRoleToggle(role)}
            >
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </button>
          ))}
        </div>
        {/* Primary button moved next to Roaster select above */}
      </div>
      <div className="flex gap-4 mt-8 justify-end">
        <button type="button" className="bg-gray-300 text-gray-800 px-6 py-2 rounded hover:bg-gray-400" onClick={onCancel}>Cancel</button>
        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">Save</button>
      </div>
    </form>
  );
}
