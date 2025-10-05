"use client";

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { User } from '../../../../../types';

const ROLES = ['user', 'admin'];
const LANGUAGES = ['en', 'fr'];

const EditUserPage: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [editData, setEditData] = useState<Partial<User>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName
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
      const res = await fetch(`${apiUrl}/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(editData),
      });
      if (!res.ok) throw new Error('Failed to update user');
      
      // Redirect back to users list
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
    <div className="container mx-auto pt-20 sm:pt-28 px-4 sm:px-8 lg:px-16 xl:px-32">
      {/* Header with Back Link */}
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
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {t('admin.users.edit', 'Edit')} {user.username}
        </h1>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">{t('error', 'Error')}: {error}</div>
        </div>
      )}

      {/* Edit Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-4xl">
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
              {t('admin.users.firstName', 'First Name')}
            </label>
            <input
              type="text"
              value={editData.firstName || ''}
              onChange={(e) => setEditData(prev => ({ ...prev, firstName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('admin.users.firstNamePlaceholder', 'Enter first name')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.users.lastName', 'Last Name')}
            </label>
            <input
              type="text"
              value={editData.lastName || ''}
              onChange={(e) => setEditData(prev => ({ ...prev, lastName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('admin.users.lastNamePlaceholder', 'Enter last name')}
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

        {/* User Info */}
        {user.createdAt && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-xs text-gray-400">
              {user.createdBy ? (
                <>Created by <Link href={`/admin/users/${user.createdBy.id}/edit`} className="text-blue-600 hover:text-blue-800">{user.createdBy.username}</Link> on {new Date(user.createdAt).toISOString().split('T')[0]} at {new Date(user.createdAt).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}.</>
              ) : (
                <>Created on {new Date(user.createdAt).toISOString().split('T')[0]} at {new Date(user.createdAt).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}.</>
              )}
              {user.updatedAt && (
                <span>
                  {user.updatedBy ? (
                    <> Updated by <Link href={`/admin/users/${user.updatedBy.id}/edit`} className="text-blue-600 hover:text-blue-800">{user.updatedBy.username}</Link> on {new Date(user.updatedAt).toISOString().split('T')[0]} at {new Date(user.updatedAt).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}.</>
                  ) : (
                    <> Updated on {new Date(user.updatedAt).toISOString().split('T')[0]} at {new Date(user.updatedAt).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}.</>
                  )}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 mt-8">
          <button
            onClick={handleCancel}
            disabled={saving}
            className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('admin.users.cancel', 'Cancel')}
          </button>
          <button
            onClick={saveEdit}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
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
    </div>
  );
};

export default EditUserPage;