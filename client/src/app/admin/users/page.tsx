// Admin Users Page
// This is a scaffold for the admin user management page.
// TODO: Connect to backend API and add real data fetching, editing, and deleting logic.

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

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
      const res = await fetch('/api/admin/users');
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
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{t('admin.users.title', 'User Management')}</h1>
      <table className="min-w-full bg-white border border-gray-200">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">{t('admin.users.username', 'Username')}</th>
            <th className="py-2 px-4 border-b">{t('admin.users.email', 'Email')}</th>
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
              <td className="py-2 px-4 border-b">{user.username}</td>
              <td className="py-2 px-4 border-b">{user.email}</td>
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
                  <>
                    <button className="text-green-600 hover:underline mr-2" onClick={() => saveEdit(user)}>{t('save', 'Save')}</button>
                    <button className="text-gray-600 hover:underline" onClick={cancelEdit}>{t('cancel', 'Cancel')}</button>
                  </>
                ) : (
                  <>
                    <button className="text-blue-600 hover:underline mr-2" onClick={() => startEdit(user)}>{t('edit', 'Edit')}</button>
                    <button className="text-red-600 hover:underline" onClick={() => confirmDelete(user.id)}>{t('delete', 'Delete')}</button>
                  </>
                )}
                {deletingId === user.id && (
                  <div className="mt-2 bg-white border p-2 rounded shadow text-left">
                    <div>{t('admin.users.confirmDelete', 'Are you sure you want to delete this user?')}</div>
                    <button className="text-red-600 hover:underline mr-2" onClick={() => doDelete(user.id)}>{t('delete', 'Delete')}</button>
                    <button className="text-gray-600 hover:underline" onClick={cancelDelete}>{t('cancel', 'Cancel')}</button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminUsersPage;
