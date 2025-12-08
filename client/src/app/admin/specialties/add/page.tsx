"use client";

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const LANGUAGES = ['en', 'fr'];

const AddSpecialtyPage: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();

  const [currentLanguage, setCurrentLanguage] = useState<string>('en');
  const [translations, setTranslations] = useState<Record<string, { name: string; description: string }>>({
    en: { name: '', description: '' },
    fr: { name: '', description: '' }
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      
      const res = await fetch(`${apiUrl}/api/specialties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          translations,
          deprecated: false
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create specialty');
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

  const updateTranslation = (field: 'name' | 'description', value: string) => {
    setTranslations(prev => ({
      ...prev,
      [currentLanguage]: {
        ...prev[currentLanguage],
        [field]: value
      }
    }));
  };

  return (
    <div className="max-w-3xl mx-auto pt-24">
      <div className="mb-8">
        <Link
          href="/admin/specialties"
          className="inline-flex items-center text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 text-base font-semibold mb-4 gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('admin.specialties.backToSpecialties', 'Back to Specialties')}
        </Link>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="text-red-800 dark:text-red-200">{t('error', 'Error')}: {error}</div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold mb-8 dark:text-gray-100">{t('admin.specialties.addTitle', 'Add Specialty')}</h1>
        
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          {/* Language Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {t('admin.specialties.translationsHelp', 'Provide translations for each language. Switch between languages to edit each translation.')}
            </p>
          </div>

          {/* Name Field */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('admin.specialties.nameLabel', 'Name')} ({currentLanguage.toUpperCase()}) *
            </label>
            <input
              type="text"
              value={translations[currentLanguage].name}
              onChange={(e) => updateTranslation('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              placeholder={t('admin.specialties.namePlaceholder', 'Enter specialty name')}
              required
            />
          </div>

          {/* Description Field */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('admin.specialties.descriptionLabel', 'Description')} ({currentLanguage.toUpperCase()})
            </label>
            <textarea
              value={translations[currentLanguage].description}
              onChange={(e) => updateTranslation('description', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              placeholder={t('admin.specialties.descriptionPlaceholder', 'Enter specialty description')}
            />
          </div>

          {/* Translation Summary */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('admin.specialties.translationsTitle', 'Translations')}
            </h3>
            <div className="space-y-2 text-sm">
              {LANGUAGES.map(lang => (
                <div key={lang} className="flex items-center gap-2">
                  <span className="font-medium text-gray-600 dark:text-gray-400 w-8">{lang.toUpperCase()}:</span>
                  <span className={translations[lang].name ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                    {translations[lang].name || t('admin.specialties.nameLabel', 'Name') + ' ' + t('required', 'required')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-6 py-2 rounded hover:bg-gray-400 dark:hover:bg-gray-500"
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
        </form>
      </div>
    </div>
  );
};

export default AddSpecialtyPage;
