"use client";

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { User } from '../../../../../types';
import { formatDateToYYYYMMDD, formatDateTimeToYYYYMMDD } from '../../../../../lib/dateUtils';

const ROLES = ['user', 'admin'];
const LANGUAGES = ['en', 'fr'];

const EditUserPage: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;
  // Auth context for current user
  // Use correct import path for useAuth
  // @ts-ignore-next-line
  const { user: currentUser } = require('../../../../../contexts/AuthContext').useAuth();

  const [user, setUser] = useState<User | null>(null);
  const [editData, setEditData] = useState<Partial<User>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch user data
  const fetchUser = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/users/${userId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to fetch user');
      const userData = await res.json();
      setUser(userData);
        setEditData({
          role: userData.role,
          language: userData.language,
          username: userData.username,
          email: userData.email
        });
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUser();
    }
  }, [userId]);

  const saveEdit = async () => {
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      // Only send fields that are present
      const payload: any = {
        role: editData.role,
        language: editData.language,
        username: editData.username,
        email: editData.email,
        isDeprecated: !!editData.isDeprecated
      };
      const res = await fetch(`${apiUrl}/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to update user');
      router.push('/admin/users');
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/users');
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!user) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/users/${user.id}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      let responseData = null;
      try {
        responseData = await res.json();
      } catch {}
      if (!res.ok) {
        let errorMsg = 'Failed to delete user';
        if (responseData) {
          // Prefer server-provided userMessage for UI-friendly text
          if (responseData.userMessage) {
            errorMsg = responseData.userMessage;
          } else if (responseData.code === 'USER_DELETE_CONFLICT') {
            // Localized fallback for known conflict code
            errorMsg = t('admin.users.deleteRelatedError', 'Cannot delete user: user has related records in the database. Remove or reassign related data before deleting.');
          } else {
            errorMsg = responseData.error || responseData.message || errorMsg;
          }
        }
        setError(errorMsg);
        setShowDeleteConfirm(false);
        return;
      }
      // Check for deprecated flag in response
      if (responseData && responseData.deprecated) {
        let errorMsg = t('admin.users.deleteDeprecated', 'User could not be deleted because they have related records. User was marked as deprecated instead.');
        if (responseData.relatedRecords && responseData.relatedRecords.length > 0) {
          errorMsg += '\n' + t('admin.users.relatedRecordsList', 'Related records found:') + ' ' + responseData.relatedRecords.map((r: string) => r).join(', ');
        }
        setError(errorMsg);
        setShowDeleteConfirm(false);
        return;
      }
      router.push('/admin/users');
    } catch (err: any) {
      setError(err.message || 'Unknown error');
      setShowDeleteConfirm(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
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

  if (error) {
    return (
      <div className="container mx-auto pt-20 sm:pt-28 px-4 sm:px-8 lg:px-16 xl:px-32">
        <div className="mb-6">
          <Link
            href="/admin/users"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('admin.users.backToUsers', 'Back to Users')}
          </Link>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">{t('error', 'Error')}: {error}</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto pt-20 sm:pt-28 px-4 sm:px-8 lg:px-16 xl:px-32">
        <div className="mb-6">
          <Link
            href="/admin/users"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('admin.users.backToUsers', 'Back to Users')}
          </Link>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-yellow-800">{t('admin.users.userNotFound', 'User not found')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pt-24">
      <div className="mb-8">
        <Link
          href="/admin/users"
          className="inline-flex items-center text-blue-700 hover:text-blue-900 text-base font-semibold mb-4 gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('admin.users.backToUsers', 'Back to Users')}
        </Link>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">{t('error', 'Error')}: {error}</div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg shadow p-8">
  <h1 className="text-2xl font-bold mb-8">{t('admin.users.editUser', 'Edit User')}</h1>
        {user?.isDeprecated && (
          <span className="inline-block mb-4 px-3 py-1 text-sm font-semibold rounded bg-yellow-200 text-yellow-900">{t('admin.users.deprecated', 'Deprecated')}</span>
        )}
        
        {showDeleteConfirm && (
          <div className="mb-6 bg-red-50 border border-red-200 p-4 rounded">
            <div className="text-sm text-red-800 mb-3">
              {t('admin.users.confirmDelete', 'Are you sure you want to delete this user?')}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded"
              >
                {t('admin.users.deleteConfirm', 'Delete')}
              </button>
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded"
              >
                {t('admin.users.deleteCancel', 'Cancel')}
              </button>
            </div>
          </div>
        )}
        
        <form onSubmit={e => { e.preventDefault(); saveEdit(); }}>
          {/* Hide deprecated checkbox if editing own account */}
          {user?.id !== currentUser?.id && (
            <div className="mb-6">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={!!editData.isDeprecated}
                  onChange={e => setEditData(prev => ({ ...prev, isDeprecated: e.target.checked }))}
                  className="form-checkbox h-4 w-4 text-yellow-600"
                />
                <span className="ml-2 text-sm text-yellow-900 font-medium">{t('admin.users.deprecatedCheckbox', 'Deprecated')}</span>
              </label>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('admin.users.username', 'Username')}
              </label>
              <input
                type="text"
                value={editData.username || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, username: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('admin.users.usernamePlaceholder', 'Enter username')}
              />
            </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.users.email', 'Email')}
            </label>
            <input
              type="email"
              value={editData.email || ''}
              onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('admin.users.emailPlaceholder', 'Enter email address')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.users.role', 'Role')}
            </label>
            <select
              value={editData.role || ''}
              onChange={(e) => setEditData(prev => ({ ...prev, role: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {ROLES.map(role => (
                <option key={role} value={role}>
                  {role === 'admin' ? t('admin.users.roleAdmin', 'Admin') : t('admin.users.roleUser', 'User')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.users.language', 'Language')}
            </label>
            <select
              value={editData.language || ''}
              onChange={(e) => setEditData(prev => ({ ...prev, language: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {LANGUAGES.map(lang => (
                <option key={lang} value={lang}>
                  {lang === 'en' ? t('admin.users.langEn', 'English') : t('admin.users.langFr', 'French')}
                </option>
              ))}
            </select>
          </div>
          </div>
          <div className="flex gap-4 mt-8 justify-between items-center">
            <div>
              <button 
                type="button" 
                onClick={handleDelete}
                disabled={saving}
                className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700"
              >
                {t('admin.users.delete', 'Delete')}
              </button>
            </div>
            <div className="flex gap-4">
              <button type="button" onClick={handleCancel} disabled={saving} className="bg-gray-300 text-gray-800 px-6 py-2 rounded hover:bg-gray-400">{t('admin.users.cancel', 'Cancel')}</button>
              <button type="submit" disabled={saving} className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
                {saving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('admin.users.saving', 'Saving...')}
                  </>
                ) : (
                  t('admin.users.save', 'Save')
                )}
              </button>
            </div>
          </div>
        </form>
        {(user.createdAt || user.updatedAt) && (
          <div className="mt-6 text-sm text-gray-500 bg-gray-50 rounded p-3">
              {user.createdAt && <span>{t('admin.users.createdOn', 'Created on')} {formatDateTimeToYYYYMMDD(user.createdAt)}.</span>} {user.updatedAt && <span>{t('admin.users.updatedOn', 'Updated on')} {formatDateTimeToYYYYMMDD(user.updatedAt)}.</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default EditUserPage;