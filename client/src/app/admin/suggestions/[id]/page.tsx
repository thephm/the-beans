"use client";

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useRouter } from 'next/navigation';
import { formatDateToYYYYMMDD } from '@/lib/dateUtils';
import { apiClient } from '@/lib/api';

interface Suggestion {
  id: string;
  roasterName: string;
  city: string;
  state?: string;
  country: string;
  website: string;
  submitterRole: string;
  submitterFirstName: string;
  submitterLastName?: string;
  submitterEmail: string;
  submitterPhone?: string;
  status: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
  reviewedById?: string;
}

const AdminSuggestionDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const suggestionId = params?.id as string;

  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [status, setStatus] = useState<string>('pending');
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [roasterName, setRoasterName] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [state, setState] = useState<string>('');
  const [country, setCountry] = useState<string>('');
  const [website, setWebsite] = useState<string>('');
  const [submitterFirstName, setSubmitterFirstName] = useState<string>('');
  const [submitterLastName, setSubmitterLastName] = useState<string>('');
  const [submitterEmail, setSubmitterEmail] = useState<string>('');
  const [submitterRole, setSubmitterRole] = useState<string>('');

  const fetchSuggestion = async () => {
    setLoading(true);
    setError(null);
    try {
      const suggestions = await apiClient.getSuggestions() as Suggestion[];
      
      const found = suggestions.find(s => s.id === suggestionId);
      if (!found) throw new Error('Suggestion not found');
      
      setSuggestion(found);
      setStatus(found.status);
      setAdminNotes(found.adminNotes || '');
      setRoasterName(found.roasterName || '');
      setCity(found.city || '');
      setState(found.state || '');
      setCountry(found.country || '');
      setWebsite(found.website || '');
      setSubmitterFirstName(found.submitterFirstName || '');
      setSubmitterLastName(found.submitterLastName || '');
      setSubmitterEmail(found.submitterEmail || '');
      setSubmitterRole(found.submitterRole || '');
    } catch (err: any) {
      // Redirect to 404 if unauthorized
      if (err.message?.includes('403') || err.message?.includes('401') || err.message?.includes('Forbidden')) {
        router.replace('/not-found');
        return;
      }
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!suggestion) return;
    
    setSaving(true);
    setError(null);
    
    try {
      await apiClient.updateSuggestion(suggestionId, {
        status,
        adminNotes,
        roasterName,
        city,
        state,
        country,
        website,
        submitterFirstName,
        submitterLastName,
        submitterEmail,
        submitterRole,
      });
      
      router.push('/admin/suggestions');
    } catch (err: any) {
      setError(err.message || 'Unknown error');
      alert(t('admin.suggestions.updateError', 'Failed to update suggestion: ') + err.message);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (suggestionId) {
      fetchSuggestion();
    }
  }, [suggestionId]);

  if (loading) {
    return (
      <div className="container mx-auto pt-20 sm:pt-28 px-4">
        {t('loading', 'Loading...')}
      </div>
    );
  }

  if (error || !suggestion) {
    return (
      <div className="container mx-auto pt-20 sm:pt-28 px-4">
        <div className="text-red-600">{t('error', 'Error')}: {error || 'Suggestion not found'}</div>
        <button
          onClick={() => router.push('/admin/suggestions')}
          className="mt-4 text-blue-600 hover:underline"
        >
          ← {t('admin.suggestions.backToList', 'Back to Suggestions')}
        </button>
      </div>
    );
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      case 'approved':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      case 'rejected':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      case 'done':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className="container mx-auto pt-20 sm:pt-28 px-4 sm:px-8 lg:px-16 xl:px-32">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/admin/suggestions')}
          className="text-blue-600 dark:text-blue-400 hover:underline mb-4 flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('admin.suggestions.backToList', 'Back to Suggestions')}
        </button>
        
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            {t('admin.suggestions.reviewTitle', 'Review Suggestion')}
          </h1>
          <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusBadgeClass(suggestion.status)}`}>
            {suggestion.status}
          </span>
        </div>
      </div>

      {/* Suggestion Details */}
      <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          {t('admin.suggestions.roasterInformation', 'Roaster Information')}
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('admin.suggestions.roasterName', 'Roaster Name')}
            </label>
            <input
              type="text"
              value={roasterName}
              onChange={(e) => setRoasterName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('admin.suggestions.city', 'City')}
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('admin.suggestions.state', 'State/Province')}
            </label>
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('admin.suggestions.country', 'Country')}
            </label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div className="lg:col-span-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('admin.suggestions.website', 'Website')}
            </label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>
      </div>

      {/* Submitter Information */}
      <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          {t('admin.suggestions.submitterInformation', 'Submitter Information')}
        </h2>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('admin.suggestions.firstName', 'First Name')}
              </label>
              <input
                type="text"
                value={submitterFirstName}
                onChange={(e) => setSubmitterFirstName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('admin.suggestions.lastName', 'Last Name')}
              </label>
              <input
                type="text"
                value={submitterLastName}
                onChange={(e) => setSubmitterLastName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('admin.suggestions.email', 'Email')}
              </label>
              <input
                type="email"
                value={submitterEmail}
                onChange={(e) => setSubmitterEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">{t('admin.suggestions.role', 'Role')}: </span>
              <span className="text-gray-900 dark:text-gray-100">{submitterRole}</span>
            </div>

            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">{t('admin.suggestions.submitted', 'Submitted')}: </span>
              <span className="text-gray-900 dark:text-gray-100">{formatDateToYYYYMMDD(suggestion.createdAt)}</span>
            </div>

            {suggestion.reviewedAt && (
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">{t('admin.suggestions.reviewed', 'Reviewed')}: </span>
                <span className="text-gray-900 dark:text-gray-100">{formatDateToYYYYMMDD(suggestion.reviewedAt)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Admin Review Form */}
      <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          {t('admin.suggestions.adminReview', 'Admin Review')}
        </h2>
        
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="w-full lg:w-auto">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('admin.suggestions.status', 'Status')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setStatus('pending')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  status === 'pending'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {t('admin.suggestions.pending', 'Pending')}
              </button>
              <button
                onClick={() => setStatus('approved')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  status === 'approved'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {t('admin.suggestions.approved', 'Approved')}
              </button>
              <button
                onClick={() => setStatus('rejected')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  status === 'rejected'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {t('admin.suggestions.rejected', 'Rejected')}
              </button>
              <button
                onClick={() => setStatus('done')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  status === 'done'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {t('admin.suggestions.done', 'Done')}
              </button>
            </div>
          </div>

          <div className="flex-1 w-full">
            <label htmlFor="adminNotes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('admin.suggestions.adminNotes', 'Admin Notes')}
            </label>
            <textarea
              id="adminNotes"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              placeholder={t('admin.suggestions.notesPlaceholder', 'Add internal notes about this suggestion...')}
            />
          </div>

          <div className="flex lg:flex-col gap-2 lg:justify-end w-full lg:w-auto">
            <button
              onClick={() => router.push('/admin/suggestions')}
              className="flex-1 lg:flex-none px-6 py-3 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors whitespace-nowrap"
            >
              {t('admin.suggestions.cancel', 'Cancel')}
            </button>
            
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 lg:flex-none px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            >
              {saving ? t('admin.suggestions.saving', 'Saving...') : t('admin.suggestions.save', 'Save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSuggestionDetailPage;
