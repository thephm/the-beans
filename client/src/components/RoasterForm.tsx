
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Roaster, RoasterImage, RoasterPerson, PersonRole } from '../types/index';
import RoasterSourceFields, { RoasterSourceType } from './RoasterSourceFields';
import SpecialtyPillSelector from './SpecialtyPillSelector';
import SimpleImageUpload from './SimpleImageUpload';
import AddPersonForm from './AddPersonForm';

interface RoasterFormProps {
  roaster?: Roaster;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const defaultFormData = {
  name: '',
  description: '',
  email: '',
  phone: '',
  website: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  country: '',
  specialties: [],
  sourceType: '',
  sourceDetails: '',
  sourceCountries: [],
  images: [],
  socialNetworks: {},
};

const RoasterForm: React.FC<RoasterFormProps> = ({ roaster, onSuccess, onCancel }) => {
  const { t } = useTranslation();
  // Only use socialNetworks, ignore any legacy social fields
  const initialFormData = roaster ? { ...defaultFormData, ...roaster, socialNetworks: roaster.socialNetworks || {} } : defaultFormData;
  const [formData, setFormData] = useState<any>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const countryInputRef = useRef<HTMLInputElement>(null);

  // Handle specialty selection
  const handleSpecialtyChange = (specialtyIds: string[]) => {
    setFormData((prev: any) => ({ ...prev, specialties: specialtyIds }));
  };

  // Handle image upload
  const handleImagesUpdated = (images: RoasterImage[]) => {
    setFormData((prev: any) => ({ ...prev, images }));
  };

  // Initial Source attribution handlers
  const handleSourceTypeChange = (type: RoasterSourceType) => {
    setFormData((prev: any) => ({ ...prev, sourceType: type, sourceDetails: '' }));
  };
  const handleSourceDetailsChange = (details: string) => {
    setFormData((prev: any) => ({ ...prev, sourceDetails: details }));
  };

  // Form submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setFieldErrors({});

    // Validate required fields
    const errors: { [key: string]: string } = {};
    if (!formData.country || formData.country.trim() === '') {
      errors.country = t('roaster.errors.countryRequired', 'Country is required');
      // Focus on country field
      if (countryInputRef.current) {
        countryInputRef.current.focus();
        countryInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSaving(false);
      return;
    }

    // Remove deprecated social fields before submit
    const deprecatedSocials = [
      'instagram', 'tiktok', 'facebook', 'linkedin', 'youtube', 'threads', 'pinterest', 'bluesky', 'x', 'reddit'
    ];
    const cleanFormData = { ...formData };
    deprecatedSocials.forEach((field) => {
      if (field in cleanFormData) delete cleanFormData[field];
    });
    try {
      // TODO: Replace with actual API call (create or update)
      // await apiClient.createRoaster(cleanFormData) or updateRoaster
      setSaving(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Error saving roaster');
      setSaving(false);
    }
  };

  return (
    <form className="max-w-3xl mx-auto bg-white shadow rounded p-6" onSubmit={handleSubmit}>
      <h2 className="text-2xl font-bold mb-6">{t('admin.roasters.formTitle', 'Roaster')}</h2>
      {error && <div className="text-red-500 mb-4">{error}</div>}

      {/* Name */}
      <div className="mb-4">
        <label className="block font-semibold mb-1">{t('roaster.name', 'Name')}</label>
        <input
          type="text"
          className="border rounded px-2 py-1 w-full"
          value={formData.name}
          onChange={e => setFormData((prev: any) => ({ ...prev, name: e.target.value }))}
          required
        />
      </div>

      {/* Description */}
      <div className="mb-4">
        <label className="block font-semibold mb-1">{t('roaster.description', 'Description')}</label>
        <textarea
          className="border rounded px-2 py-1 w-full"
          value={formData.description}
          onChange={e => setFormData((prev: any) => ({ ...prev, description: e.target.value }))}
        />
      </div>

      {/* Location fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block font-semibold mb-1">{t('roaster.address', 'Address')}</label>
          <input
            type="text"
            className="border rounded px-2 py-1 w-full"
            value={formData.address}
            onChange={e => setFormData((prev: any) => ({ ...prev, address: e.target.value }))}
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">{t('roaster.city', 'City')}</label>
          <input
            type="text"
            className="border rounded px-2 py-1 w-full"
            value={formData.city}
            onChange={e => setFormData((prev: any) => ({ ...prev, city: e.target.value }))}
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">{t('roaster.state', 'State')}</label>
          <input
            type="text"
            className="border rounded px-2 py-1 w-full"
            value={formData.state}
            onChange={e => setFormData((prev: any) => ({ ...prev, state: e.target.value }))}
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">{t('roaster.zipCode', 'Zip Code')}</label>
          <input
            type="text"
            className="border rounded px-2 py-1 w-full"
            value={formData.zipCode}
            onChange={e => setFormData((prev: any) => ({ ...prev, zipCode: e.target.value }))}
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">
            {t('roaster.country', 'Country')} <span className="text-red-500">*</span>
          </label>
          <input
            ref={countryInputRef}
            type="text"
            className={`border rounded px-2 py-1 w-full ${fieldErrors.country ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : ''}`}
            value={formData.country}
            onChange={e => {
              setFormData((prev: any) => ({ ...prev, country: e.target.value }));
              // Clear error when user starts typing
              if (fieldErrors.country) {
                setFieldErrors((prev) => ({ ...prev, country: '' }));
              }
            }}
            required
          />
          {fieldErrors.country && (
            <p className="text-red-500 text-sm mt-1">{fieldErrors.country}</p>
          )}
        </div>
      </div>

      {/* Initial Source Attribution (after location, before source countries) */}
      <RoasterSourceFields
        sourceType={formData.sourceType}
        sourceDetails={formData.sourceDetails}
        onSourceTypeChange={handleSourceTypeChange}
        onSourceDetailsChange={handleSourceDetailsChange}
      />

      {/* Source Countries (placeholder) */}
      <div className="mb-4">
        <label className="block font-semibold mb-1">{t('roaster.sourceCountries', 'Source Countries')}</label>
        {/* TODO: Implement source countries selector */}
        <input
          type="text"
          className="border rounded px-2 py-1 w-full"
          value={formData.sourceCountries?.join(', ')}
          onChange={e => setFormData((prev: any) => ({ ...prev, sourceCountries: e.target.value.split(',').map((s: string) => s.trim()) }))}
        />
      </div>

      {/* Specialties */}
      <SpecialtyPillSelector
        selectedSpecialtyIds={formData.specialties}
        onChange={handleSpecialtyChange}
      />

      {/* Images */}
      <SimpleImageUpload
        roasterId={roaster?.id || ''}
        existingImages={roaster?.roasterImages || []}
        onImagesUpdated={handleImagesUpdated}
        canEdit={true}
      />

      {/* Owner/People (optional, placeholder) */}
      {/* <AddPersonForm ... /> */}

      {/* Submit/Cancel buttons */}
      <div className="flex gap-4 mt-8">
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700"
          disabled={saving}
        >
          {saving ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
        </button>
        {onCancel && (
          <button
            type="button"
            className="bg-gray-300 text-gray-700 px-6 py-2 rounded shadow hover:bg-gray-400"
            onClick={onCancel}
          >
            {t('common.cancel', 'Cancel')}
          </button>
        )}
      </div>
    </form>
  );
};

export default RoasterForm;