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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<User>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const startEdit = (user: User) => {
    setEditId(user.id);
    setEditData({ role: user.role, language: user.language });
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditData({});
  };

  const saveEdit = async (user: User) => {
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
      setEditId(null);
      setEditData({});
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    }
  };

  const confirmDelete = (id: string) => setDeletingId(id);
  const cancelDelete = () => setDeletingId(null);
  const doDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete user');
      setDeletingId(null);
      fetchUsers();
    } catch (err: any) {
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
    <div className="container mx-auto p-4 pt-28 pl-8 pr-8">
      <div className="mb-6 ml-4 mr-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Users</h1>
      </div>
      <div className="ml-4 mr-4">
        <table className="min-w-full bg-white border border-gray-200">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b text-left">{t('admin.users.username', 'Username')}</th>
            <th className="py-2 px-4 border-b text-left">{t('admin.users.email', 'Email')}</th>
            <th className="py-2 px-4 border-b">{t('admin.users.role', 'Role')}</th>
            <th className="py-2 px-4 border-b">{t('admin.users.language', 'Language')}</th>
            <th className="py-2 px-4 border-b">{t('admin.users.createdAt', 'Created')}</th>
            <th className="py-2 px-4 border-b">{t('admin.users.updatedAt', 'Updated')}</th>
            <th className="py-2 px-4 border-b">{t('admin.users.actions', 'Actions')}</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="text-center">
              <td className="py-2 px-4 border-b text-left">
                <Link
                  href={`/profile?userId=${user.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  {user.username}
                </Link>
              </td>
              <td className="py-2 px-4 border-b text-left">
                <a
                  href={`mailto:${user.email}`}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  {user.email}
                </a>
              </td>
              <td className="py-2 px-4 border-b">
                {editId === user.id ? (
                  <select
                    value={editData.role || ''}
                    onChange={e => setEditData(ed => ({ ...ed, role: e.target.value }))}
                    className="border rounded px-2 py-1"
                  >
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                ) : (
                  user.role
                )}
              </td>
              <td className="py-2 px-4 border-b">
                {editId === user.id ? (
                  <select
                    value={editData.language || ''}
                    onChange={e => setEditData(ed => ({ ...ed, language: e.target.value }))}
                    className="border rounded px-2 py-1"
                  >
                    {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                ) : (
                  user.language
                )}
              </td>
              <td className="py-2 px-4 border-b">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''}</td>
              <td className="py-2 px-4 border-b">{user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : ''}</td>
              <td className="py-2 px-4 border-b">
                {editId === user.id ? (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => saveEdit(user)}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                    >
                      {t('save', 'Save')}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
                    >
                      {t('cancel', 'Cancel')}
                    </button>
                  </div>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => startEdit(user)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                    >
                      {t('edit', 'Edit')}
                    </button>
                    <button
                      onClick={() => confirmDelete(user.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                    >
                      {t('delete', 'Delete')}
                    </button>
                  </div>
                )}
                {deletingId === user.id && (
                  <div className="mt-2 bg-white border p-2 rounded shadow text-left">
                    <div className="mb-3">{t('admin.users.confirmDelete', 'Are you sure you want to delete this user?')}</div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => doDelete(user.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                      >
                        {t('delete', 'Delete')}
                      </button>
                      <button
                        onClick={cancelDelete}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
                      >
                        {t('cancel', 'Cancel')}
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
