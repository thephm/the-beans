
"use client";

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { SortArrow } from '@/components/SortArrow';
import { SpecialtyListItem } from '@/types';
import { formatDateToYYYYMMDD } from '@/lib/dateUtils';

const AdminSpecialtiesPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [specialties, setSpecialties] = useState<SpecialtyListItem[]>([]);
  const [filteredSpecialties, setFilteredSpecialties] = useState<SpecialtyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const fetchSpecialties = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const language = i18n.language || 'en';
      const res = await fetch(`${apiUrl}/api/specialties?language=${language}&includeDeprecated=true`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to fetch specialties');
      const data = await res.json();
      setSpecialties(data);
      setFilteredSpecialties(data);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Filter specialties based on search term
  useEffect(() => {
    let filtered = specialties;
    if (searchTerm.trim()) {
      filtered = specialties.filter(specialty => 
        specialty.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        specialty.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    // Sorting logic
    if (sortConfig) {
      filtered = [...filtered].sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }
        return 0;
      });
    } else {
      filtered = [...filtered].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }
    setFilteredSpecialties(filtered);
  }, [searchTerm, specialties, sortConfig]);

  useEffect(() => {
    fetchSpecialties();
  }, [i18n.language]);

  if (loading) return <div className="container mx-auto pt-20 sm:pt-28 px-4 sm:px-8 lg:px-16 xl:px-32">{t('loading')}</div>;
  if (error) return <div className="container mx-auto pt-20 sm:pt-28 px-4 sm:px-8 lg:px-16 xl:px-32 text-red-600">{t('error')}: {error}</div>;

  return (
    <div className="container mx-auto pt-20 sm:pt-28 px-4 sm:px-8 lg:px-16 xl:px-32">
      {/* Header with Search and Add Button */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">{t('admin.specialties.title', 'Specialties')}</h1>
          <Link
            href="/admin/specialties/add"
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            {t('common.add', 'Add')}
          </Link>
        </div>
        
        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder={t('admin.specialties.search', 'Search specialties...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
            <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Results Count */}
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {filteredSpecialties.length === specialties.length 
            ? t('admin.specialties.total', { count: specialties.length })
            : t('admin.specialties.filtered', { filteredCount: filteredSpecialties.length, totalCount: specialties.length })
          }
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredSpecialties.map((specialty) => (
          <div key={specialty.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <Link
                  href={`/admin/specialties/${specialty.id}`}
                  className="text-lg font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 block"
                >
                  {specialty.name}
                </Link>
                {specialty.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{specialty.description}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                    {specialty.roasterCount} {t('admin.specialties.roasterCount', 'Roasters')}
                  </span>
                  {specialty.deprecated && (
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                      {t('admin.specialties.deprecated', 'Deprecated')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="py-3 px-4 border-b dark:border-gray-700 text-left font-medium text-gray-900 dark:text-gray-100 cursor-pointer select-none" onClick={() => setSortConfig(sortConfig?.key === 'name' ? { key: 'name', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' } : { key: 'name', direction: 'asc' })}>
                {t('admin.specialties.name', 'Specialty')}{sortConfig?.key === 'name' && <SortArrow direction={sortConfig.direction} />}
              </th>
              <th className="py-3 px-4 border-b dark:border-gray-700 text-left font-medium text-gray-900 dark:text-gray-100 cursor-pointer select-none" onClick={() => setSortConfig(sortConfig?.key === 'description' ? { key: 'description', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' } : { key: 'description', direction: 'asc' })}>
                {t('admin.specialties.description', 'Description')}{sortConfig?.key === 'description' && <SortArrow direction={sortConfig.direction} />}
              </th>
              <th className="py-3 px-4 border-b dark:border-gray-700 text-center font-medium text-gray-900 dark:text-gray-100 cursor-pointer select-none" onClick={() => setSortConfig(sortConfig?.key === 'roasterCount' ? { key: 'roasterCount', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' } : { key: 'roasterCount', direction: 'asc' })}>
                {t('admin.specialties.roasterCount', 'Roasters')}{sortConfig?.key === 'roasterCount' && <SortArrow direction={sortConfig.direction} />}
              </th>
              <th className="py-3 px-4 border-b dark:border-gray-700 text-center font-medium text-gray-900 dark:text-gray-100 cursor-pointer select-none" onClick={() => setSortConfig(sortConfig?.key === 'deprecated' ? { key: 'deprecated', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' } : { key: 'deprecated', direction: 'asc' })}>
                {t('admin.specialties.deprecated', 'Deprecated')}{sortConfig?.key === 'deprecated' && <SortArrow direction={sortConfig.direction} />}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredSpecialties.map((specialty) => (
              <tr key={specialty.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="py-3 px-4">
                  <Link
                    href={`/admin/specialties/${specialty.id}`}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                  >
                    {specialty.name}
                  </Link>
                </td>
                <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                  {specialty.description || '-'}
                </td>
                <td className="py-3 px-4 text-center text-sm text-gray-600 dark:text-gray-400">
                  {specialty.roasterCount}
                </td>
                <td className="py-3 px-4 text-center">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    specialty.deprecated ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {specialty.deprecated ? t('admin.specialties.yes', 'Yes') : t('admin.specialties.no', 'No')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminSpecialtiesPage;
