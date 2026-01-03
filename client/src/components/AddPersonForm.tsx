import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { PersonRole } from '../types';
import { Roaster } from '../types';
import PersonRoleButtons from './PersonRoleButtons';


interface AddPersonFormProps {
  roasters?: Roaster[];
  roasterId?: string; // If provided, roaster selector is hidden and this is used
  roasterAssociations?: any[]; // List of roaster associations for this person
  onSave: (person: any) => void;
  onCancel: () => void;
  onDelete?: () => void;
  mode?: 'add' | 'edit';
  initialPerson?: Partial<any>;
  error?: string;
}

export default function AddPersonForm({ roasters, roasterId, roasterAssociations, onSave, onCancel, onDelete, mode = 'add', initialPerson, error }: AddPersonFormProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [form, setForm] = useState({
    firstName: initialPerson?.firstName || '',
    lastName: initialPerson?.lastName || '',
    title: initialPerson?.title || '',
    email: initialPerson?.email || '',
    mobile: initialPerson?.mobile || '',
    linkedinUrl: initialPerson?.linkedinUrl || '',
    instagramUrl: initialPerson?.instagramUrl || '',
    bio: initialPerson?.bio || '',
    roles: initialPerson?.roles || [] as PersonRole[],
    roasterId: roasterId || initialPerson?.roasterId || '',
    isPrimary: initialPerson?.isPrimary || false,
  });

  // State for managing editable roaster associations
  const [editableAssociations, setEditableAssociations] = useState<any[]>(
    roasterAssociations || []
  );

  useEffect(() => {
    if (roasterAssociations) {
      setEditableAssociations(roasterAssociations);
    }
  }, [roasterAssociations]);

  useEffect(() => {
    if (initialPerson) {
      setForm({
        firstName: initialPerson.firstName || '',
        lastName: initialPerson.lastName || '',
        title: initialPerson.title || '',
        email: initialPerson.email || '',
        mobile: initialPerson.mobile || '',
        linkedinUrl: initialPerson.linkedinUrl || '',
        instagramUrl: initialPerson.instagramUrl || '',
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

  // Handlers for editing roaster associations
  const handleAssociationChange = (index: number, field: string, value: any) => {
    setEditableAssociations(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAssociationRoleToggle = (index: number, role: PersonRole) => {
    setEditableAssociations(prev => {
      const updated = [...prev];
      const currentRoles = updated[index].roles || [];
      updated[index] = {
        ...updated[index],
        roles: currentRoles.includes(role)
          ? currentRoles.filter((r: PersonRole) => r !== role)
          : [...currentRoles, role],
      };
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Include updated associations in the save
    onSave({ ...form, associations: editableAssociations });
  };
  return (
    <div>
      <div className="space-y-6 mb-8">
        {/* First Name and Last Name - side by side on medium+ screens */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('admin.people.firstName', 'First Name')}
            </label>
            <input type="text" placeholder={t('admin.people.firstName', 'First Name')} value={form.firstName} onChange={e => handleChange('firstName', e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('admin.people.lastName', 'Last Name')}
            </label>
            <input type="text" placeholder={t('admin.people.lastName', 'Last Name')} value={form.lastName} onChange={e => handleChange('lastName', e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" />
          </div>
        </div>

        {/* Title - full width */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('admin.people.jobTitle', 'Title')}
          </label>
          <input type="text" placeholder={t('admin.people.jobTitle', 'Title')} value={form.title} onChange={e => handleChange('title', e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" />
        </div>

        {/* Email and Mobile - side by side on medium+ screens */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('admin.people.email', 'Email')}
            </label>
            <input type="email" placeholder={t('admin.people.email', 'Email')} value={form.email} onChange={e => handleChange('email', e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('admin.people.mobile', 'Mobile')}
            </label>
            <input type="text" placeholder={t('admin.people.mobile', 'Mobile')} value={form.mobile} onChange={e => handleChange('mobile', e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" />
          </div>
        </div>

        {/* LinkedIn URL - full width */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('admin.people.linkedinUrl', 'LinkedIn URL')}
          </label>
          <input type="url" placeholder={t('admin.people.linkedinUrlPlaceholder', 'https://www.linkedin.com/in/username')} value={form.linkedinUrl} onChange={e => handleChange('linkedinUrl', e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" />
        </div>

        {/* Instagram URL - full width */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('admin.people.instagramUrl', 'Instagram URL')}
          </label>
          <input type="url" placeholder={t('admin.people.instagramUrlPlaceholder', 'https://www.instagram.com/username')} value={form.instagramUrl} onChange={e => handleChange('instagramUrl', e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" />
        </div>

        {/* Roaster associations - stacked */}
        {editableAssociations && editableAssociations.length > 0 ? (
          <div className="space-y-4">
            {editableAssociations.map((association, index) => (
              <div key={association.id} className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                <div className="space-y-4">
                  {/* Roaster and Primary */}
                  <div className="flex flex-col sm:flex-row items-end gap-4">
                    <div className="flex-1 w-full">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('admin.people.roaster', 'Roaster')}</label>
                      <select 
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" 
                        value={association.roasterId}
                        onChange={e => handleAssociationChange(index, 'roasterId', e.target.value)}
                      >
                        <option value="">{t('admin.people.selectRoaster', 'Select a roaster')}</option>
                        {safeRoasters.map(roaster => (
                          <option key={roaster.id} value={roaster.id}>{roaster.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-full sm:w-auto">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('admin.people.primaryContact', 'Primary Contact')}</label>
                      <button
                        type="button"
                        className={`px-6 py-2 rounded-lg border text-sm font-semibold transition-colors duration-150 focus:outline-none ${association.isPrimary ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'}`}
                        onClick={() => handleAssociationChange(index, 'isPrimary', !association.isPrimary)}
                      >
                        {association.isPrimary ? t('common.yes', 'Yes') : t('common.no', 'No')}
                      </button>
                    </div>
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('admin.people.role', 'Role')}
                    </label>
                    <PersonRoleButtons 
                      selectedRoles={association.roles || []} 
                      onRoleToggle={(role) => handleAssociationRoleToggle(index, role)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Single Roaster Selection for Add Mode or No Associations */
          <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
            <div className="space-y-4">
              {/* Roaster and Primary */}
              <div className="flex flex-col sm:flex-row items-end gap-4">
                {!roasterId && roasters && (
                  <div className="flex-1 w-full">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('admin.people.roaster', 'Roaster')}</label>
                    <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" value={form.roasterId} onChange={e => handleChange('roasterId', e.target.value)} required>
                      <option value="">{t('admin.people.selectRoaster', 'Select a roaster')}</option>
                      {safeRoasters.map(roaster => (
                        <option key={roaster.id} value={roaster.id}>{roaster.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className={`w-full ${!roasterId && roasters ? 'sm:w-auto' : ''}`}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('admin.people.primaryContact', 'Primary Contact')}</label>
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('admin.people.role', 'Role')}
                </label>
                <PersonRoleButtons 
                  selectedRoles={form.roles} 
                  onRoleToggle={handleRoleToggle} 
                />
              </div>
            </div>
          </div>
        )}

        {/* Bio - full width, moved below roaster section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('admin.people.bio', 'Bio')}
          </label>
          <textarea rows={4} placeholder={t('admin.people.bio', 'Bio')} value={form.bio} onChange={e => handleChange('bio', e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" />
        </div>
      </div>
      {error && (
        <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
        </div>
      )}
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
