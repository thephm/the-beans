"use client";
// Admin Users Page
// This is a scaffold for the admin user management page.
// TODO: Connect to backend API and add real data fetching, editing, and deleting logic.

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { SortArrow } from '@/components/SortArrow';
import { formatDateToYYYYMMDD } from '@/lib/dateUtils';

interface User {
  id: string;
  email: string;
  username: string;
  language?: string;
  role?: string;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
  isDeprecated?: boolean;
}



const AdminUsersPage: React.FC = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      
      // Build query params
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      });
      if (sortConfig) {
        params.append('sortBy', sortConfig.key);
        params.append('sortOrder', sortConfig.direction);
      }
      
      const res = await fetch(`${apiUrl}/api/users?${params.toString()}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      
      // Handle paginated response
      if (data.users && data.pagination) {
        const mapped = data.users.map((user: any) => ({
          ...user,
          lastLogin: user.lastLogin || user.last_login || null,
          createdAt: user.createdAt || user.created_at || null,
        }));
        setUsers(mapped);
        setFilteredUsers(mapped);
        setTotalPages(data.pagination.pages || 1);
      } else {
        // Fallback for old API response format
        const mapped = Array.isArray(data) ? data.map((user: any) => ({
          ...user,
          lastLogin: user.lastLogin || user.last_login || null,
          createdAt: user.createdAt || user.created_at || null,
        })) : [];
        setUsers(mapped);
        setFilteredUsers(mapped);
      }
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on search term (client-side for now)
  useEffect(() => {
    if (!searchTerm.trim()) {
      // When search is cleared, refetch from server
      fetchUsers();
    } else {
      // Client-side filtering for search
      const filtered = users.filter(user => 
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, limit, sortConfig]);

  // Sorting is now handled by backend, display users directly
  const sortedUsers = filteredUsers;

  if (loading) return <div>{t('loading')}</div>;

  if (error) return <div className="text-red-600">{t('error')}: {error}</div>;

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
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">{t('admin.users.title', 'Users')}</h1>
        
        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder={t('admin.users.search', 'Search by username, email, or name...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            />
            <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Results Count */}
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {filteredUsers.length === users.length 
            ? t('admin.users.total', { count: users.length })
            : t('admin.users.filtered', { filteredCount: filteredUsers.length, totalCount: users.length })
          }
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredUsers.map((user) => (
          <div key={user.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
            {/* User Header */}
            <div className="flex justify-between items-start mb-3">
              <div>
                <Link
                  href={`/admin/users/${user.id}/edit`}
                  className="text-lg font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-left"
                >
                  {user.username}
                </Link>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    user.role === 'admin' ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                  }`}>
                    {user.role}
                  </span>
                  {user.language && (
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                      {user.language.toUpperCase()}
                    </span>
                  )}
                  {user.isDeprecated && (
                    <span className="px-2 py-1 text-xs font-semibold rounded bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100">Deprecated</span>
                  )}
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="mb-3">
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <span className="mr-2">📧</span>
                <a href={`mailto:${user.email}`} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
                  {user.email}
                </a>
              </div>
            </div>

            {/* Dates */}
            <div className="mb-3 text-xs text-gray-500 dark:text-gray-400 space-y-1">
              {user.lastLogin && (
                <div>Last Login: {formatDateToYYYYMMDD(user.lastLogin)}</div>
              )}
              {user.createdAt && (
                <div>Created: {formatDateToYYYYMMDD(user.createdAt)}</div>
              )}
              {user.updatedAt && (
                <div>Updated: {formatDateToYYYYMMDD(user.updatedAt)}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="py-3 px-4 border-b border-gray-200 dark:border-gray-700 text-left font-medium text-gray-900 dark:text-gray-100 w-1/5 cursor-pointer select-none" onClick={() => setSortConfig(sortConfig?.key === 'username' ? { key: 'username', direction: sortConfig?.direction === 'asc' ? 'desc' : 'asc' } : { key: 'username', direction: 'asc' })}>
                {t('admin.users.username', 'Username')}{sortConfig?.key === 'username' && <SortArrow direction={sortConfig.direction} />}
              </th>
              <th className="py-3 px-4 border-b border-gray-200 dark:border-gray-700 text-left font-medium text-gray-900 dark:text-gray-100 w-1/4 cursor-pointer select-none" onClick={() => setSortConfig(sortConfig?.key === 'email' ? { key: 'email', direction: sortConfig?.direction === 'asc' ? 'desc' : 'asc' } : { key: 'email', direction: 'asc' })}>
                {t('admin.users.email', 'Email')}{sortConfig?.key === 'email' && <SortArrow direction={sortConfig.direction} />}
              </th>
              <th className="py-3 px-4 border-b border-gray-200 dark:border-gray-700 text-left font-medium text-gray-900 dark:text-gray-100 w-1/6 cursor-pointer select-none" onClick={() => setSortConfig(sortConfig?.key === 'role' ? { key: 'role', direction: sortConfig?.direction === 'asc' ? 'desc' : 'asc' } : { key: 'role', direction: 'asc' })}>
                {t('admin.users.role', 'Role')}{sortConfig?.key === 'role' && <SortArrow direction={sortConfig.direction} />}
              </th>
              <th className="py-3 px-4 border-b border-gray-200 dark:border-gray-700 text-center font-medium text-gray-900 dark:text-gray-100 w-1/12 cursor-pointer select-none" onClick={() => setSortConfig(sortConfig?.key === 'language' ? { key: 'language', direction: sortConfig?.direction === 'asc' ? 'desc' : 'asc' } : { key: 'language', direction: 'asc' })}>
                {t('admin.users.language', 'Language')}{sortConfig?.key === 'language' && <SortArrow direction={sortConfig.direction} />}
              </th>
              <th className="py-3 px-4 border-b border-gray-200 dark:border-gray-700 text-center font-medium text-gray-900 dark:text-gray-100 w-1/5 cursor-pointer select-none" onClick={() => setSortConfig(sortConfig?.key === 'lastLogin' ? { key: 'lastLogin', direction: sortConfig?.direction === 'asc' ? 'desc' : 'asc' } : { key: 'lastLogin', direction: 'asc' })}>
                {t('admin.users.lastLogin', 'Last Login')}{sortConfig?.key === 'lastLogin' && <SortArrow direction={sortConfig.direction} />}
              </th>
              <th className="py-3 px-4 border-b border-gray-200 dark:border-gray-700 text-center font-medium text-gray-900 dark:text-gray-100 w-1/5 cursor-pointer select-none" onClick={() => setSortConfig(sortConfig?.key === 'createdAt' ? { key: 'createdAt', direction: sortConfig?.direction === 'asc' ? 'desc' : 'asc' } : { key: 'createdAt', direction: 'asc' })}>
                {t('admin.users.created', 'Created')}{sortConfig?.key === 'createdAt' && <SortArrow direction={sortConfig.direction} />}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {sortedUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="py-3 px-4 text-left">
                  <Link
                    href={`/admin/users/${user.id}/edit`}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                  >
                    {user.username}
                    {user.isDeprecated && (
                      <span className="ml-2 px-2 py-1 text-xs font-semibold rounded bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100">Deprecated</span>
                    )}
                  </Link>
                </td>
                <td className="py-3 px-4 text-left">
                  <a
                    href={`mailto:${user.email}`}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                  >
                    {user.email}
                  </a>
                </td>
                <td className="py-3 px-4 text-left">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    user.role === 'admin' ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  {user.language && (
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                      {user.language.toUpperCase()}
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-center text-sm text-gray-600 dark:text-gray-400">
                    {user.lastLogin ? formatDateToYYYYMMDD(user.lastLogin) : '-'}
                </td>
                  <td className="py-3 px-4 text-center text-sm text-gray-600 dark:text-gray-400">
                    {user.createdAt ? formatDateToYYYYMMDD(user.createdAt) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6 mt-6 rounded-lg shadow">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Page <span className="font-medium">{currentPage}</span> of{' '}
                <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + Math.max(1, currentPage - 2);
                  if (page > totalPages) return null;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-blue-50 dark:bg-blue-900 border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-300'
                          : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminUsersPage;
