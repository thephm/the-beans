"use client";

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Specialty } from '@/types';

const LANGUAGES = ['en', 'fr'];

const EditSpecialtyPage: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const specialtyId = params?.id as string;

  const [specialty, setSpecialty] = useState<Specialty | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');
  const [translations, setTranslations] = useState<Record<string, { name: string; description: string }>>({
    en: { name: '', description: '' },
    fr: { name: '', description: '' }
  });
  const [deprecated, setDeprecated] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch specialty data
  const fetchSpecialty = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/specialties/${specialtyId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to fetch specialty');
      const data = await res.json();
      setSpecialty(data);
      setTranslations(data.translations);
      setDeprecated(data.deprecated);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (specialtyId) {
      fetchSpecialty();
    }
  }, [specialtyId]);

  const handleSave = async () => {
    // Validate required fields
    if (!translations.en.name || !translations.fr.name) {
      setError('English and French names are required');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      
      const res = await fetch(`${apiUrl}/api/specialties/${specialtyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          translations,
          deprecated
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update specialty');
      }
      
      // Redirect back to specialties list
      router.push('/admin/specialties');
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/specialties');
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!specialty) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/specialties/${specialty.id}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete specialty');
      }
      router.push('/admin/specialties');
    } catch (err: any) {
      setError(err.message || 'Unknown error');
      setShowDeleteConfirm(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const updateTranslation = (field: 'name' | 'description', value: string) => {
    setTranslations(prev => ({
      ...prev,
      [currentLanguage]: {
        ...prev[currentLanguage],
        [field]: value
      }
    }));
  };

  if (loading) {
    return (
      <div className="container mx-auto pt-20 sm:pt-28 px-4 sm:px-8 lg:px-16 xl:px-32">
        <div className="flex justify-center items-center min-h-64">
          <div className="text-lg">{t('loading', 'Loading...')}</div>
        </div>
      </div>
    );
  }

  if (error && !specialty) {
    return (
      <div className="container mx-auto pt-20 sm:pt-28 px-4 sm:px-8 lg:px-16 xl:px-32">
        <div className="mb-6">
          <Link
            href="/admin/specialties"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('admin.specialties.backToSpecialties', 'Back to Specialties')}
          </Link>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">{t('error', 'Error')}: {error}</div>
        </div>
      </div>
    );
  }

  if (!specialty) {
    return (
      <div className="container mx-auto pt-20 sm:pt-28 px-4 sm:px-8 lg:px-16 xl:px-32">
        <div className="mb-6">
          <Link
            href="/admin/specialties"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('admin.specialties.backToSpecialties', 'Back to Specialties')}
          </Link>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-yellow-800">{t('admin.specialties.notFound', 'Specialty not found')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pt-24">
      <div className="mb-8">
        <Link
          href="/admin/specialties"
          className="inline-flex items-center text-blue-700 hover:text-blue-900 text-base font-semibold mb-4 gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('admin.specialties.backToSpecialties', 'Back to Specialties')}
        </Link>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">{t('error', 'Error')}: {error}</div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold mb-8">{t('admin.specialties.editTitle', 'Edit Specialty')}</h1>
        
        {showDeleteConfirm && (
          <div className="mb-6 bg-red-50 border border-red-200 p-4 rounded">
            <div className="text-sm text-red-800 mb-3">
              {t('admin.specialties.confirmDelete', 'Are you sure you want to delete this specialty?')}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded"
              >
                {t('admin.specialties.deleteConfirm', 'Delete')}
              </button>
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded"
              >
                {t('admin.specialties.deleteCancel', 'Cancel')}
              </button>
            </div>
          </div>
        )}
        
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          {/* Deprecated Toggle */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={deprecated}
                onChange={(e) => setDeprecated(e.target.checked)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">
                  {t('admin.specialties.deprecateToggle', 'Deprecate Specialty')}
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  {t('admin.specialties.deprecateHelp', 'Deprecated specialties are hidden from selection but remain visible on roasters that already use them.')}
                </p>
              </div>
            </label>
          </div>

          {/* Roaster Count Info */}
          {specialty.roasterCount > 0 && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                This specialty is currently used by <strong>{specialty.roasterCount}</strong> roaster{specialty.roasterCount !== 1 ? 's' : ''}.
              </p>
            </div>
          )}

          {/* Language Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.specialties.languageLabel', 'Language')}
            </label>
            <div className="flex gap-2">
              {LANGUAGES.map(lang => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setCurrentLanguage(lang)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentLanguage === lang
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
            <p className="mt-2 text-sm text-gray-500">
              {t('admin.specialties.translationsHelp', 'Provide translations for each language. Switch between languages to edit each translation.')}
            </p>
          </div>

          {/* Name Field */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.specialties.nameLabel', 'Name')} ({currentLanguage.toUpperCase()}) *
            </label>
            <input
              type="text"
              value={translations[currentLanguage]?.name || ''}
              onChange={(e) => updateTranslation('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('admin.specialties.namePlaceholder', 'Enter specialty name')}
              required
            />
          </div>

          {/* Description Field */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.specialties.descriptionLabel', 'Description')} ({currentLanguage.toUpperCase()})
            </label>
            <textarea
              value={translations[currentLanguage]?.description || ''}
              onChange={(e) => updateTranslation('description', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('admin.specialties.descriptionPlaceholder', 'Enter specialty description')}
            />
          </div>

          {/* Translation Summary */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              {t('admin.specialties.translationsTitle', 'Translations')}
            </h3>
            <div className="space-y-2 text-sm">
              {LANGUAGES.map(lang => (
                <div key={lang} className="flex items-center gap-2">
                  <span className="font-medium text-gray-600 w-8">{lang.toUpperCase()}:</span>
                  <span className={translations[lang]?.name ? 'text-green-600' : 'text-red-600'}>
                    {translations[lang]?.name || t('admin.specialties.nameLabel', 'Name') + ' ' + t('required', 'required')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 justify-between items-center">
            <div>
              <button 
                type="button" 
                onClick={handleDelete}
                disabled={saving}
                className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700"
              >
                {t('admin.specialties.delete', 'Delete')}
              </button>
            </div>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="bg-gray-300 text-gray-800 px-6 py-2 rounded hover:bg-gray-400"
              >
                {t('admin.specialties.cancel', 'Cancel')}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('admin.specialties.saving', 'Saving...')}
                  </>
                ) : (
                  t('admin.specialties.save', 'Save')
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSpecialtyPage;
