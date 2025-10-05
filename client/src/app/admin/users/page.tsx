"use client";
// Admin Users Page
// This is a scaffold for the admin user management page.
// TODO: Connect to backend API and add real data fetching, editing, and deleting logic.

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';

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

const ROLES = ['user', 'admin'];
const LANGUAGES = ['en', 'fr'];

const AdminUsersPage: React.FC = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<User>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

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

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditData({ 
      role: user.role, 
      language: user.language,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName
    });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingUser(null);
    setEditData({});
  };

  const saveEdit = async () => {
    if (!editingUser) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(editData),
      });
      if (!res.ok) throw new Error('Failed to update user');
      closeEditModal();
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    }
  };

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
            ? t('admin.users.total', `${users.length} users total`)
            : t('admin.users.filtered', `${filteredUsers.length} of ${users.length} users`)
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
                <button
                  onClick={() => openEditModal(user)}
                  className="text-lg font-semibold text-blue-600 hover:text-blue-800 text-left"
                >
                  {user.username}
                </button>
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
                <div>Created: {new Date(user.createdAt).toLocaleDateString()}</div>
              )}
              {user.updatedAt && (
                <div>Updated: {new Date(user.updatedAt).toLocaleDateString()}</div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => openEditModal(user)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
              >
                {t('admin.users.edit', 'Edit')}
              </button>
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
              <th className="py-3 px-4 border-b text-center font-medium text-gray-900">
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
                  <button
                    onClick={() => openEditModal(user)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {user.username}
                  </button>
                </td>
                <td className="py-3 px-4 text-left">
                  <a
                    href={`mailto:${user.email}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {user.email}
                  </a>
                </td>
                <td className="py-3 px-4 text-center">
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
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''}
                </td>
                <td className="py-3 px-4 text-center">
                  <div className="flex justify-center space-x-2">
                    <button
                      onClick={() => openEditModal(user)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
                    >
                      {t('admin.users.edit', 'Edit')}
                    </button>
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

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              {t('admin.users.editUser', 'Edit User')}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.users.username', 'Username')}
                </label>
                <input
                  type="text"
                  value={editData.username || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.users.email', 'Email')}
                </label>
                <input
                  type="email"
                  value={editData.email || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.users.firstName', 'First Name')}
                </label>
                <input
                  type="text"
                  value={editData.firstName || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, firstName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.users.lastName', 'Last Name')}
                </label>
                <input
                  type="text"
                  value={editData.lastName || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, lastName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.users.role', 'Role')}
                </label>
                <select
                  value={editData.role || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {ROLES.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.users.language', 'Language')}
                </label>
                <select
                  value={editData.language || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, language: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {LANGUAGES.map(lang => (
                    <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={closeEditModal}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {t('admin.users.cancel', 'Cancel')}
              </button>
              <button
                onClick={saveEdit}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                {t('admin.users.save', 'Save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
