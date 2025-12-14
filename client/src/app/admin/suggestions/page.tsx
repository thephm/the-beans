"use client";

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { formatDateToYYYYMMDD } from '@/lib/dateUtils';

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

const AdminSuggestionsPage: React.FC = () => {
  const { t } = useTranslation();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchSuggestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      
      let url = `${apiUrl}/api/suggestions`;
      if (statusFilter !== 'all') {
        url += `?status=${statusFilter}`;
      }
      
      const res = await fetch(url, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to fetch suggestions');
      const data = await res.json();
      setSuggestions(data);
      setFilteredSuggestions(data);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Filter suggestions based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredSuggestions(suggestions);
    } else {
      const filtered = suggestions.filter(suggestion => 
        suggestion.roasterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        suggestion.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        suggestion.country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        suggestion.submitterEmail?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSuggestions(filtered);
    }
  }, [searchTerm, suggestions]);

  useEffect(() => {
    fetchSuggestions();
  }, [statusFilter]);

  if (loading) return <div className="container mx-auto pt-20 sm:pt-28 px-4">{t('loading')}</div>;
  if (error) return <div className="container mx-auto pt-20 sm:pt-28 px-4 text-red-600">{t('error')}: {error}</div>;

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      case 'approved':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'rejected':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className="container mx-auto pt-20 sm:pt-28 px-4 sm:px-8 lg:px-16 xl:px-32">
      {/* Header with Search and Filters */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          {t('admin.suggestions.title', 'Roaster Suggestions')}
        </h1>
        
        {/* Status Filter */}
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {t('admin.suggestions.all', 'All')}
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === 'pending'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {t('admin.suggestions.pending', 'Pending')}
          </button>
          <button
            onClick={() => setStatusFilter('approved')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === 'approved'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {t('admin.suggestions.approved', 'Approved')}
          </button>
          <button
            onClick={() => setStatusFilter('rejected')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === 'rejected'
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {t('admin.suggestions.rejected', 'Rejected')}
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder={t('admin.suggestions.search', 'Search by roaster name, city, country, or email...')}
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
          {filteredSuggestions.length === suggestions.length 
            ? `${suggestions.length} ${t('admin.suggestions.total', 'total suggestions')}`
            : `${filteredSuggestions.length} of ${suggestions.length} ${t('admin.suggestions.showing', 'suggestions')}`
          }
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredSuggestions.map((suggestion) => (
          <div key={suggestion.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <Link
                  href={`/admin/suggestions/${suggestion.id}`}
                  className="text-lg font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                >
                  {suggestion.roasterName}
                </Link>
                <span className={`inline-flex ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(suggestion.status)}`}>
                  {suggestion.status}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">{t('admin.suggestions.location', 'Location')}:</span>
                <span className="text-gray-600 dark:text-gray-400 ml-2">
                  {suggestion.city}{suggestion.state ? `, ${suggestion.state}` : ''}, {suggestion.country}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">{t('admin.suggestions.website', 'Website')}:</span>
                <a href={suggestion.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline ml-2">
                  {suggestion.website}
                </a>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">{t('admin.suggestions.submitter', 'Submitter')}:</span>
                <span className="text-gray-600 dark:text-gray-400 ml-2">
                  {suggestion.submitterFirstName} {suggestion.submitterLastName} ({suggestion.submitterRole})
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">{t('admin.suggestions.email', 'Email')}:</span>
                <span className="text-gray-600 dark:text-gray-400 ml-2">{suggestion.submitterEmail}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">{t('admin.suggestions.submitted', 'Submitted')}:</span>
                <span className="text-gray-600 dark:text-gray-400 ml-2">{formatDateToYYYYMMDD(suggestion.createdAt)}</span>
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('admin.suggestions.roasterName', 'Roaster Name')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('admin.suggestions.location', 'Location')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('admin.suggestions.submitter', 'Submitter')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('admin.suggestions.status', 'Status')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('admin.suggestions.submitted', 'Submitted')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('admin.suggestions.actions', 'Actions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredSuggestions.map((suggestion) => (
              <tr key={suggestion.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {suggestion.roasterName}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    <a href={suggestion.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {suggestion.website}
                    </a>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {suggestion.city}{suggestion.state ? `, ${suggestion.state}` : ''}<br />
                  {suggestion.country}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-gray-100">
                    {suggestion.submitterFirstName} {suggestion.submitterLastName}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{suggestion.submitterEmail}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">{suggestion.submitterRole}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(suggestion.status)}`}>
                    {suggestion.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {formatDateToYYYYMMDD(suggestion.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Link
                    href={`/admin/suggestions/${suggestion.id}`}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                  >
                    {t('admin.suggestions.review', 'Review')}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredSuggestions.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          {t('admin.suggestions.noResults', 'No suggestions found')}
        </div>
      )}
    </div>
  );
};

export default AdminSuggestionsPage;
