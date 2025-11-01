"use client";
// Admin Users Page
// This is a scaffold for the admin user management page.
// TODO: Connect to backend API and add real data fetching, editing, and deleting logic.

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { formatDateToYYYYMMDD } from '@/lib/dateUtils';

interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  language?: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
}



const AdminUsersPage: React.FC = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/users`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data);
      setFilteredUsers(data);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  useEffect(() => {
    fetchUsers();
  }, []);



  const confirmDelete = (id: string) => setDeletingId(id);
  const cancelDelete = () => setDeletingId(null);
  const doDelete = async (id: string) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/users/${id}`, { 
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to delete user');
      }
      setDeletingId(null);
      fetchUsers();
    } catch (err: any) {
      console.error('Delete user error:', err);
      setError(err.message || 'Unknown error');
    }
  };

  if (loading) return <div>{t('loading')}</div>;
  if (error) return <div className="text-red-600">{t('error')}: {error}</div>;

  // Debug: Show raw users data if empty
  if (!users || users.length === 0) {
    return (
      <div className="container mx-auto p-4 pt-28 pl-8 pr-8">
        <div className="mb-6 ml-4 mr-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Users</h1>
        </div>
        <div className="ml-4 mr-4">
          <div className="text-red-600 mb-4">No users found or API returned empty. Debug info:</div>
          <pre>{JSON.stringify(users, null, 2)}</pre>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto pt-20 sm:pt-28 px-4 sm:px-8 lg:px-16 xl:px-32">
      {/* Header with Search */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">{t('admin.users.title', 'Users')}</h1>
        
        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder={t('admin.users.search', 'Search by username, email, or name...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Results Count */}
        <div className="text-sm text-gray-600 mb-4">
          {filteredUsers.length === users.length 
            ? t('admin.users.total', { count: users.length })
            : t('admin.users.filtered', { filteredCount: filteredUsers.length, totalCount: users.length })
          }
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredUsers.map((user) => (
          <div key={user.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            {/* User Header */}
            <div className="flex justify-between items-start mb-3">
              <div>
                <Link
                  href={`/admin/users/${user.id}/edit`}
                  className="text-lg font-semibold text-blue-600 hover:text-blue-800 text-left"
                >
                  {user.username}
                </Link>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role}
                  </span>
                  {user.language && (
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      {user.language.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="mb-3">
              <div className="flex items-center text-sm text-gray-600">
                <span className="mr-2">📧</span>
                <a href={`mailto:${user.email}`} className="text-blue-600 hover:text-blue-800">
                  {user.email}
                </a>
              </div>
            </div>

            {/* Full Name (if available) */}
            {(user.firstName || user.lastName) && (
              <div className="mb-3">
                <div className="flex items-center text-sm text-gray-600">
                  <span className="mr-2">👤</span>
                  <span>{[user.firstName, user.lastName].filter(Boolean).join(' ')}</span>
                </div>
              </div>
            )}

            {/* Dates */}
            <div className="mb-3 text-xs text-gray-500 space-y-1">
              {user.createdAt && (
                <div>Created: {formatDateToYYYYMMDD(user.createdAt)}</div>
              )}
              {user.updatedAt && (
                <div>Updated: {formatDateToYYYYMMDD(user.updatedAt)}</div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/admin/users/${user.id}/edit`}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded inline-block text-center"
              >
                {t('admin.users.edit', 'Edit')}
              </Link>
              <button
                onClick={() => confirmDelete(user.id)}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded"
              >
                {t('admin.users.delete', 'Delete')}
              </button>
            </div>

            {/* Delete Confirmation */}
            {deletingId === user.id && (
              <div className="mt-3 bg-red-50 border border-red-200 p-3 rounded">
                <div className="text-sm text-red-800 mb-3">
                  {t('admin.users.confirmDelete', 'Are you sure you want to delete this user?')}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => doDelete(user.id)}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded"
                  >
                    {t('admin.users.deleteConfirm', 'Delete')}
                  </button>
                  <button
                    onClick={cancelDelete}
                    className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded"
                  >
                    {t('admin.users.deleteCancel', 'Cancel')}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3 px-4 border-b text-left font-medium text-gray-900">
                {t('admin.users.username', 'Username')}
              </th>
              <th className="py-3 px-4 border-b text-left font-medium text-gray-900">
                {t('admin.users.email', 'Email')}
              </th>
              <th className="py-3 px-4 border-b text-left font-medium text-gray-900">
                {t('admin.users.role', 'Role')}
              </th>
              <th className="py-3 px-4 border-b text-center font-medium text-gray-900">
                {t('admin.users.language', 'Language')}
              </th>
              <th className="py-3 px-4 border-b text-center font-medium text-gray-900">
                {t('admin.users.created', 'Created')}
              </th>
              <th className="py-3 px-4 border-b text-center font-medium text-gray-900">
                {t('admin.users.actions', 'Actions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="py-3 px-4 text-left">
                  <Link
                    href={`/admin/users/${user.id}/edit`}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {user.username}
                  </Link>
                </td>
                <td className="py-3 px-4 text-left">
                  <a
                    href={`mailto:${user.email}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {user.email}
                  </a>
                </td>
                <td className="py-3 px-4 text-left">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  {user.language && (
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      {user.language.toUpperCase()}
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-center text-sm text-gray-600">
                  {user.createdAt ? formatDateToYYYYMMDD(user.createdAt) : ''}
                </td>
                <td className="py-3 px-4 text-center">
                  <div className="flex justify-center space-x-2">
                    <Link
                      href={`/admin/users/${user.id}/edit`}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded inline-block text-center"
                    >
                      {t('admin.users.edit', 'Edit')}
                    </Link>
                    <button
                      onClick={() => confirmDelete(user.id)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded"
                    >
                      {t('admin.users.delete', 'Delete')}
                    </button>
                  </div>
                  
                  {/* Delete Confirmation */}
                  {deletingId === user.id && (
                    <div className="mt-2 bg-red-50 border border-red-200 p-2 rounded text-left">
                      <div className="text-sm text-red-800 mb-2">
                        {t('admin.users.confirmDelete', 'Are you sure you want to delete this user?')}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => doDelete(user.id)}
                          className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded"
                        >
                          {t('admin.users.deleteConfirm', 'Delete')}
                        </button>
                        <button
                          onClick={cancelDelete}
                          className="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded"
                        >
                          {t('admin.users.deleteCancel', 'Cancel')}
                        </button>
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>


    </div>
  );
};

export default AdminUsersPage;
