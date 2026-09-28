import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { PersonRole } from '../types';
import { Roaster } from '../types';
import PersonRoleButtons from './PersonRoleButtons';
import { stripToRootUrl } from '../lib/url';
import { apiClient } from '../lib/api';


interface AddPersonFormProps {
  showRoasterSelector?: boolean;
  roasterId?: string; // If provided, roaster selector is hidden and this is used
  roasterAssociations?: any[]; // List of roaster associations for this person
  onSave: (person: any) => void;
  onCancel: () => void;
  onDelete?: () => void;
  mode?: 'add' | 'edit';
  initialPerson?: Partial<any>;
  error?: string;
  roleOptions?: PersonRole[];
}

interface RoasterSearchFieldProps {
  value: string
  initialRoaster?: Roaster | null
  label: string
  onChange: (roaster: Roaster | null) => void
}

export function RoasterSearchField({ value, initialRoaster, label, onChange }: RoasterSearchFieldProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [selectedRoaster, setSelectedRoaster] = useState<Roaster | null>(initialRoaster || null);
  const [results, setResults] = useState<Roaster[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (initialRoaster && initialRoaster.id === value) setSelectedRoaster(initialRoaster);
  }, [initialRoaster, value]);

  useEffect(() => {
    const term = query.trim();
    if (selectedRoaster || term.length < 2) {
      setResults([]);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await apiClient.getRoasters({ search: term, limit: 10 }) as any;
        if (!cancelled) {
          setResults(Array.isArray(data?.roasters) ? data.roasters : []);
          setIsOpen(true);
        }
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, selectedRoaster]);

  const selectRoaster = (roaster: Roaster) => {
    setSelectedRoaster(roaster);
    setQuery('');
    setResults([]);
    setIsOpen(false);
    onChange(roaster);
  };

  const clearRoaster = () => {
    setSelectedRoaster(null);
    setQuery('');
    setResults([]);
    onChange(null);
  };

  return (
    <div className="relative">
      {selectedRoaster ? (
        <div className="flex items-center gap-2 rounded-lg border border-green-300 bg-green-50 px-3 py-2 dark:border-green-800 dark:bg-green-900/30">
          <span className="flex-1 text-gray-900 dark:text-gray-100">{selectedRoaster.name}</span>
          <button type="button" onClick={clearRoaster} aria-label={t('adminResources.clearProviderRoaster', 'Remove roaster')} title={t('adminResources.clearProviderRoaster', 'Remove roaster')} className="text-lg font-bold leading-none text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">&times;</button>
        </div>
      ) : (
        <>
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setIsOpen(true);
            }}
            onFocus={() => query.trim().length >= 2 && setIsOpen(true)}
            onBlur={() => setIsOpen(false)}
            placeholder={t('admin.posts.searchRoaster', 'Search for a roaster...')}
            aria-label={label}
            aria-autocomplete="list"
            aria-expanded={isOpen && query.trim().length >= 2}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
          {isOpen && query.trim().length >= 2 && (
            <div role="listbox" className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800">
              {isSearching ? (
                <p className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{t('common.loading', 'Loading...')}</p>
              ) : results.length > 0 ? results.map((roaster) => (
                <button
                  key={roaster.id}
                  type="button"
                  role="option"
                  aria-selected={false}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectRoaster(roaster)}
                  className="block w-full border-b border-gray-200 px-4 py-2 text-left last:border-b-0 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-700"
                >
                  <span className="block font-medium">{roaster.name}</span>
                  {(roaster.city || roaster.state || roaster.country) && <span className="block text-sm text-gray-500 dark:text-gray-400">{[roaster.city, roaster.state || roaster.country].filter(Boolean).join(', ')}</span>}
                </button>
              )) : (
                <p className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{t('admin.roasters.noSearchResults', 'No roasters found.')}</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function AddPersonForm({ showRoasterSelector = false, roasterId, roasterAssociations, onSave, onCancel, onDelete, mode = 'add', initialPerson, error, roleOptions }: AddPersonFormProps) {
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
  const [roasterValidationError, setRoasterValidationError] = useState('');

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
  const showPrimaryToggle = !(editableAssociations && editableAssociations.length > 0);
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

  const handleAssociationRoasterChange = (index: number, roaster: Roaster | null) => {
    setEditableAssociations(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], roasterId: roaster?.id || '', roaster: roaster || null };
      return updated;
    });
    setRoasterValidationError('');
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
    if ((showRoasterSelector && !form.roasterId) || editableAssociations.some((association) => !association.roasterId)) {
      setRoasterValidationError(t('admin.people.roasterRequired', 'Please select a roaster'));
      return;
    }
    setRoasterValidationError('');
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

        {/* Email, Mobile, Primary - side by side on medium+ screens */}
        <div className={`grid grid-cols-1 ${showPrimaryToggle ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6`}>
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
          {showPrimaryToggle && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('admin.people.primaryContact', 'Primary Contact')}
              </label>
              <button
                type="button"
                className={`w-full px-6 py-2 rounded-lg border text-sm font-semibold transition-colors duration-150 focus:outline-none ${form.isPrimary ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'}`}
                onClick={() => handleChange('isPrimary', !form.isPrimary)}
              >
                {form.isPrimary ? t('common.yes', 'Yes') : t('common.no', 'No')}
              </button>
            </div>
          )}
        </div>

        {/* Instagram and LinkedIn - match Email/Mobile column widths */}
        <div className={`grid grid-cols-1 ${showPrimaryToggle ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6`}>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('admin.people.instagramUrl', 'Instagram URL')}
            </label>
            <input type="url" placeholder={t('admin.people.instagramUrlPlaceholder', 'https://www.instagram.com/username')} value={form.instagramUrl} onChange={e => handleChange('instagramUrl', e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" onPaste={(event) => {
              event.preventDefault();
              handleChange('instagramUrl', stripToRootUrl(event.clipboardData.getData('text')));
            }} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('admin.people.linkedinUrl', 'LinkedIn URL')}
            </label>
            <input type="url" placeholder={t('admin.people.linkedinUrlPlaceholder', 'https://www.linkedin.com/in/username')} value={form.linkedinUrl} onChange={e => handleChange('linkedinUrl', e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" onPaste={(event) => {
              event.preventDefault();
              handleChange('linkedinUrl', stripToRootUrl(event.clipboardData.getData('text')));
            }} />
          </div>
          {showPrimaryToggle && <div className="hidden md:block" />}
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
                      <RoasterSearchField
                        value={association.roasterId || ''}
                        initialRoaster={association.roaster}
                        label={t('admin.people.roaster', 'Roaster')}
                        onChange={(roaster) => handleAssociationRoasterChange(index, roaster)}
                      />
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
                      onRoleToggle={(role) => handleAssociationRoleToggle(index, role as PersonRole)}
                      roles={roleOptions}
                      size="sm"
                      layout="wrap"
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
              {/* Roaster */}
              {!roasterId && showRoasterSelector && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('admin.people.roaster', 'Roaster')}</label>
                  <RoasterSearchField
                    value={form.roasterId}
                    initialRoaster={initialPerson?.roaster}
                    label={t('admin.people.roaster', 'Roaster')}
                    onChange={(roaster) => {
                      handleChange('roasterId', roaster?.id || '');
                      setRoasterValidationError('');
                    }}
                  />
                </div>
              )}

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('admin.people.role', 'Role')}
                </label>
                <PersonRoleButtons 
                  selectedRoles={form.roles} 
                  onRoleToggle={handleRoleToggle} 
                  roles={roleOptions}
                  size="sm"
                  layout="wrap"
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
      {(error || roasterValidationError) && (
        <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-800 dark:text-red-200 text-sm">{roasterValidationError || error}</p>
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
