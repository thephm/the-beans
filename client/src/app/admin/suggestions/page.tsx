"use client";

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { formatDateToYYYYMMDD } from '@/lib/dateUtils';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user } = useAuth();
  const [allSuggestions, setAllSuggestions] = useState<Suggestion[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('new');
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);

  const fetchSuggestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      
      // Always fetch all suggestions for accurate counts
      let url = `${apiUrl}/api/suggestions`;
      
      const res = await fetch(url, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      
      // Redirect to 404 if unauthorized
      if (res.status === 403 || res.status === 401) {
        window.location.href = '/not-found';
        return;
      }
      
      if (!res.ok) throw new Error('Failed to fetch suggestions');
      const data = await res.json();
      setAllSuggestions(data);
      
      // Filter by status locally
      const filtered = statusFilter === 'all' 
        ? data 
        : data.filter((s: Suggestion) => s.status === statusFilter);
      setSuggestions(filtered);
      setFilteredSuggestions(filtered);
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

  // Select first suggestion by default, clear if no results
  useEffect(() => {
    if (filteredSuggestions.length > 0) {
      // Check if current selection is still in the filtered list
      const isCurrentSelectionInList = selectedSuggestion && 
        filteredSuggestions.some(s => s.id === selectedSuggestion.id);
      
      // If not in list or no selection, select the first item
      if (!isCurrentSelectionInList) {
        setSelectedSuggestion(filteredSuggestions[0]);
      }
    } else {
      setSelectedSuggestion(null);
    }
  }, [filteredSuggestions]);

  useEffect(() => {
    // Only fetch if user is admin
    if (user?.role === 'admin') {
      fetchSuggestions();
    }
  }, [statusFilter, user]);

  // Calculate counts for each status from ALL suggestions
  const getStatusCount = (status: string) => {
    if (status === 'all') return allSuggestions.length;
    return allSuggestions.filter(s => s.status === status).length;
  };

  if (loading) return <div className="container mx-auto pt-20 sm:pt-28 px-4">{t('loading')}</div>;
  if (error) return <div className="container mx-auto pt-20 sm:pt-28 px-4 text-red-600">{t('error')}: {error}</div>;

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      case 'approved':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      case 'in_progress':
        return 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200';
      case 'rejected':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      case 'done':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'new':
        return t('admin.suggestions.new', 'New');
      case 'approved':
        return t('admin.suggestions.approved', 'Approved');
      case 'in_progress':
        return t('admin.suggestions.inProgress', 'In Progress');
      case 'rejected':
        return t('admin.suggestions.rejected', 'Rejected');
      case 'done':
        return t('admin.suggestions.done', 'Done');
      default:
        return status;
    }
  };

  return (
    <div className="container mx-auto pt-20 sm:pt-28 px-4 sm:px-8 lg:px-16 xl:px-32">
      {/* Header */}
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        {t('admin.suggestions.title', 'Roaster Suggestions')}
      </h1>

      {/* Two Column Layout - Search/Filters on left, Details on right */}
      <div className="flex flex-col lg:flex-row gap-6 mb-6">
        {/* Left Column - Search and Filters */}
        <div className="lg:w-1/3">
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

          {/* Status Filter Buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setStatusFilter('new')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                statusFilter === 'new'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <span>{t('admin.suggestions.new', 'New')}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${
                statusFilter === 'new' 
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' 
                  : 'bg-yellow-600 text-white'
              }`}>
                {getStatusCount('new')}
              </span>
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                statusFilter === 'approved'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <span>{t('admin.suggestions.approved', 'Approved')}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${
                statusFilter === 'approved' 
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' 
                  : 'bg-blue-600 text-white'
              }`}>
                {getStatusCount('approved')}
              </span>
            </button>
            <button
              onClick={() => setStatusFilter('in_progress')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                statusFilter === 'in_progress'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <span>{t('admin.suggestions.inProgress', 'In Progress')}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${
                statusFilter === 'in_progress' 
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' 
                  : 'bg-purple-600 text-white'
              }`}>
                {getStatusCount('in_progress')}
              </span>
            </button>
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                statusFilter === 'rejected'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <span>{t('admin.suggestions.rejected', 'Rejected')}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${
                statusFilter === 'rejected' 
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' 
                  : 'bg-red-600 text-white'
              }`}>
                {getStatusCount('rejected')}
              </span>
            </button>
            <button
              onClick={() => setStatusFilter('done')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                statusFilter === 'done'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <span>{t('admin.suggestions.done', 'Done')}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${
                statusFilter === 'done' 
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' 
                  : 'bg-green-600 text-white'
              }`}>
                {getStatusCount('done')}
              </span>
            </button>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                statusFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <span>{t('admin.suggestions.all', 'All')}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${
                statusFilter === 'all' 
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' 
                  : 'bg-blue-600 text-white'
              }`}>
                {getStatusCount('all')}
              </span>
            </button>
          </div>

          {/* Results Count */}
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {filteredSuggestions.length === suggestions.length 
              ? `${suggestions.length} ${t('admin.suggestions.total', 'total suggestions')}`
              : `${filteredSuggestions.length} of ${suggestions.length} ${t('admin.suggestions.showing', 'suggestions')}`
            }
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredSuggestions.map((suggestion) => (
              <div 
                key={suggestion.id} 
                onClick={() => setSelectedSuggestion(suggestion)}
                className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors ${
                  selectedSuggestion?.id === suggestion.id ? 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-500' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                      {suggestion.roasterName}
                    </div>
                    <span className={`inline-flex ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(suggestion.status)}`}>
                      {getStatusText(suggestion.status)}
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
                    <span className="font-medium text-gray-700 dark:text-gray-300">{t('admin.suggestions.submitter', 'Submitter')}:</span>
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
                    {t('admin.suggestions.submitter', 'Submitter')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredSuggestions.map((suggestion) => (
                  <tr 
                    key={suggestion.id} 
                    onClick={() => setSelectedSuggestion(suggestion)}
                    className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      selectedSuggestion?.id === suggestion.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {suggestion.roasterName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {suggestion.city}{suggestion.state ? `, ${suggestion.state}` : ''}, {suggestion.country}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {suggestion.submitterFirstName} {suggestion.submitterLastName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{suggestion.submitterEmail}</div>
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

        {/* Right Column - Detail Panel */}
        {selectedSuggestion && (
          <div className="lg:w-2/3 lg:sticky lg:top-24 lg:h-fit">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-lg">
              {/* Header */}
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {t('admin.suggestions.details', 'Suggestion Details')}
                </h2>
              </div>

              {/* Roaster Information */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {selectedSuggestion.roasterName}
                  </h3>
                  <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusBadgeClass(selectedSuggestion.status)}`}>
                    {getStatusText(selectedSuggestion.status)}
                  </span>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {t('admin.suggestions.roasterInfo', 'Roaster Information')}
                  </h4>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {t('admin.suggestions.location', 'Location')}
                      </dt>
                      <dd className="text-sm text-gray-900 dark:text-gray-100">
                        {selectedSuggestion.city}{selectedSuggestion.state ? `, ${selectedSuggestion.state}` : ''}, {selectedSuggestion.country}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {t('admin.suggestions.website', 'Website')}
                      </dt>
                      <dd className="text-sm">
                        <a 
                          href={selectedSuggestion.website} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                        >
                          {selectedSuggestion.website}
                        </a>
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {t('admin.suggestions.submitterInfo', 'Submitter Information')}
                  </h4>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {t('admin.suggestions.name', 'Name')}
                      </dt>
                      <dd className="text-sm text-gray-900 dark:text-gray-100">
                        {selectedSuggestion.submitterFirstName} {selectedSuggestion.submitterLastName}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {t('admin.suggestions.email', 'Email')}
                      </dt>
                      <dd className="text-sm text-gray-900 dark:text-gray-100">
                        {selectedSuggestion.submitterEmail}
                      </dd>
                    </div>
                    {selectedSuggestion.submitterPhone && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          {t('admin.suggestions.phone', 'Phone')}
                        </dt>
                        <dd className="text-sm text-gray-900 dark:text-gray-100">
                          {selectedSuggestion.submitterPhone}
                        </dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {t('admin.suggestions.role', 'Role')}
                      </dt>
                      <dd className="text-sm text-gray-900 dark:text-gray-100">
                        {selectedSuggestion.submitterRole}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {t('admin.suggestions.timestamps', 'Timestamps')}
                  </h4>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {t('admin.suggestions.submitted', 'Submitted')}
                      </dt>
                      <dd className="text-sm text-gray-900 dark:text-gray-100">
                        {formatDateToYYYYMMDD(selectedSuggestion.createdAt)}
                      </dd>
                    </div>
                    {selectedSuggestion.reviewedAt && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          {t('admin.suggestions.reviewed', 'Reviewed')}
                        </dt>
                        <dd className="text-sm text-gray-900 dark:text-gray-100">
                          {formatDateToYYYYMMDD(selectedSuggestion.reviewedAt)}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>

                {selectedSuggestion.adminNotes && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      {t('admin.suggestions.notes', 'Admin Notes')}
                    </h4>
                    <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                      {selectedSuggestion.adminNotes}
                    </p>
                  </div>
                )}

                {/* Action Button */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <Link
                    href={`/admin/suggestions/${selectedSuggestion.id}`}
                    className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    {t('admin.suggestions.edit', 'Edit')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSuggestionsPage;
