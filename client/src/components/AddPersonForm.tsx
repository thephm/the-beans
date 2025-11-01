import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PersonRole } from '../types';
import { Roaster } from '../types';


interface AddPersonFormProps {
  roasters: Roaster[];
  onSave: (person: any) => void;
  onCancel: () => void;
  onDelete?: () => void;
  mode?: 'add' | 'edit';
  initialPerson?: Partial<any>;
}

export default function AddPersonForm({ roasters, onSave, onCancel, onDelete, mode = 'add', initialPerson }: AddPersonFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: initialPerson?.name || '',
    title: initialPerson?.title || '',
    email: initialPerson?.email || '',
    mobile: initialPerson?.mobile || '',
    bio: initialPerson?.bio || '',
    roles: initialPerson?.roles || [] as PersonRole[],
    roasterId: initialPerson?.roasterId || '',
    isPrimary: initialPerson?.isPrimary || false,
  });

  useEffect(() => {
    if (initialPerson) {
      setForm({
        name: initialPerson.name || '',
        title: initialPerson.title || '',
        email: initialPerson.email || '',
        mobile: initialPerson.mobile || '',
        bio: initialPerson.bio || '',
        roles: initialPerson.roles || [] as PersonRole[],
        roasterId: initialPerson.roasterId || '',
        isPrimary: initialPerson.isPrimary || false,
      });
    }
  }, [initialPerson]);
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
      <div className="space-y-6 mb-8">
        {/* Name and Title - side by side on medium+ screens */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name
            </label>
            <input type="text" placeholder="Name" value={form.name} onChange={e => handleChange('name', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input type="text" placeholder="Title" value={form.title} onChange={e => handleChange('title', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
        </div>

        {/* Email and Mobile - side by side on medium+ screens */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input type="email" placeholder="Email" value={form.email} onChange={e => handleChange('email', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mobile
            </label>
            <input type="text" placeholder="Mobile" value={form.mobile} onChange={e => handleChange('mobile', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
        </div>

        {/* Bio - full width */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bio
          </label>
          <textarea rows={4} placeholder="Bio" value={form.bio} onChange={e => handleChange('bio', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>

        {/* Roaster, Primary, and Role - grouped in a frame */}
        <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
          <div className="space-y-4">
            {/* Roaster and Primary */}
            <div className="flex flex-col sm:flex-row items-end gap-4">
              <div className="flex-1 w-full">
                <label className="block text-sm font-medium text-gray-700 mb-2">Roaster</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white" value={form.roasterId} onChange={e => handleChange('roasterId', e.target.value)} required>
                  <option value="">Select a roaster</option>
                  {safeRoasters.map(roaster => (
                    <option key={roaster.id} value={roaster.id}>{roaster.name}</option>
                  ))}
                </select>
              </div>
              <div className="w-full sm:w-auto">
                <label className="block text-sm font-medium text-gray-700 mb-2">Primary Contact</label>
                <button
                  type="button"
                  className={`px-6 py-2 rounded-lg border text-sm font-semibold transition-colors duration-150 focus:outline-none ${form.isPrimary ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'}`}
                  onClick={() => handleChange('isPrimary', !form.isPrimary)}
                >
                  {form.isPrimary ? 'Yes' : 'No'}
                </button>
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <div className="flex gap-2 flex-wrap items-center">
                {[PersonRole.OWNER, PersonRole.ADMIN, PersonRole.BILLING].map(role => (
                  <button
                    key={role}
                    type="button"
                    className={`px-4 py-2 rounded-lg border text-sm font-semibold transition-colors duration-150 focus:outline-none ${form.roles.includes(role) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'}`}
                    onClick={() => handleRoleToggle(role)}
                  >
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-4 mt-8 justify-between items-center">
        <div>
          {mode === 'edit' && onDelete && (
            <button 
              type="button" 
              className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700"
              onClick={onDelete}
            >
              Delete
            </button>
          )}
        </div>
        <div className="flex gap-4">
          <button type="button" className="bg-gray-300 text-gray-800 px-6 py-2 rounded hover:bg-gray-400" onClick={onCancel}>Cancel</button>
          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">Save</button>
        </div>
      </div>
    </form>
  );
}
