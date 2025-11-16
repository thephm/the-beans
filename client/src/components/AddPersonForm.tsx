import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { PersonRole } from '../types';
import { Roaster } from '../types';
import PersonRoleButtons from './PersonRoleButtons';


interface AddPersonFormProps {
  roasters?: Roaster[];
  roasterId?: string; // If provided, roaster selector is hidden and this is used
  onSave: (person: any) => void;
  onCancel: () => void;
  onDelete?: () => void;
  mode?: 'add' | 'edit';
  initialPerson?: Partial<any>;
}

export default function AddPersonForm({ roasters, roasterId, onSave, onCancel, onDelete, mode = 'add', initialPerson }: AddPersonFormProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [form, setForm] = useState({
    firstName: initialPerson?.firstName || '',
    lastName: initialPerson?.lastName || '',
    title: initialPerson?.title || '',
    email: initialPerson?.email || '',
    mobile: initialPerson?.mobile || '',
    linkedinUrl: initialPerson?.linkedinUrl || '',
    bio: initialPerson?.bio || '',
    roles: initialPerson?.roles || [] as PersonRole[],
    roasterId: roasterId || initialPerson?.roasterId || '',
    isPrimary: initialPerson?.isPrimary || false,
  });

  useEffect(() => {
    if (initialPerson) {
      setForm({
        firstName: initialPerson.firstName || '',
        lastName: initialPerson.lastName || '',
        title: initialPerson.title || '',
        email: initialPerson.email || '',
        mobile: initialPerson.mobile || '',
        linkedinUrl: initialPerson.linkedinUrl || '',
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
    <div>
      <div className="space-y-6 mb-8">
        {/* First Name and Last Name - side by side on medium+ screens */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.people.firstName', 'First Name')}
            </label>
            <input type="text" placeholder={t('admin.people.firstName', 'First Name')} value={form.firstName} onChange={e => handleChange('firstName', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.people.lastName', 'Last Name')}
            </label>
            <input type="text" placeholder={t('admin.people.lastName', 'Last Name')} value={form.lastName} onChange={e => handleChange('lastName', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
        </div>

        {/* Title - full width */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('admin.people.jobTitle', 'Title')}
          </label>
          <input type="text" placeholder={t('admin.people.jobTitle', 'Title')} value={form.title} onChange={e => handleChange('title', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>

        {/* Email and Mobile - side by side on medium+ screens */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.people.email', 'Email')}
            </label>
            <input type="email" placeholder={t('admin.people.email', 'Email')} value={form.email} onChange={e => handleChange('email', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.people.mobile', 'Mobile')}
            </label>
            <input type="text" placeholder={t('admin.people.mobile', 'Mobile')} value={form.mobile} onChange={e => handleChange('mobile', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
        </div>

        {/* LinkedIn URL - full width */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('admin.people.linkedinUrl', 'LinkedIn URL')}
          </label>
          <input type="url" placeholder={t('admin.people.linkedinUrlPlaceholder', 'https://www.linkedin.com/in/username')} value={form.linkedinUrl} onChange={e => handleChange('linkedinUrl', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>

        {/* Roaster, Primary, and Role - grouped in a frame */}
        <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
          <div className="space-y-4">
            {/* Roaster and Primary */}
            <div className="flex flex-col sm:flex-row items-end gap-4">
              {!roasterId && roasters && (
                <div className="flex-1 w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.people.roaster', 'Roaster')}</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white" value={form.roasterId} onChange={e => handleChange('roasterId', e.target.value)} required>
                    <option value="">{t('admin.people.selectRoaster', 'Select a roaster')}</option>
                    {safeRoasters.map(roaster => (
                      <option key={roaster.id} value={roaster.id}>{roaster.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className={`w-full ${!roasterId && roasters ? 'sm:w-auto' : ''}`}>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.people.primaryContact', 'Primary Contact')}</label>
                <button
                  type="button"
                  className={`px-6 py-2 rounded-lg border text-sm font-semibold transition-colors duration-150 focus:outline-none ${form.isPrimary ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'}`}
                  onClick={() => handleChange('isPrimary', !form.isPrimary)}
                >
                  {form.isPrimary ? t('common.yes', 'Yes') : t('common.no', 'No')}
                </button>
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('admin.people.role', 'Role')}
              </label>
              <PersonRoleButtons 
                selectedRoles={form.roles} 
                onRoleToggle={handleRoleToggle} 
              />
            </div>
          </div>
        </div>

        {/* Bio - full width, moved below roaster section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('admin.people.bio', 'Bio')}
          </label>
          <textarea rows={4} placeholder={t('admin.people.bio', 'Bio')} value={form.bio} onChange={e => handleChange('bio', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
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
              {t('common.delete', 'Delete')}
            </button>
          )}
        </div>
        <div className="flex gap-4">
          <button type="button" className="bg-gray-300 text-gray-800 px-6 py-2 rounded hover:bg-gray-400" onClick={onCancel}>{t('common.cancel', 'Cancel')}</button>
          <button type="button" className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700" onClick={handleSubmit}>{t('common.save', 'Save')}</button>
        </div>
      </div>
    </div>
  );
}
