"use client";
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { SortArrow } from '@/components/SortArrow';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { apiClient } from '@/lib/api';
import { Roaster, RoasterImage, RoasterPerson, PersonRole } from '@/types';
import SimpleImageUpload from '@/components/SimpleImageUpload';
import SpecialtyPillSelector from '@/components/SpecialtyPillSelector';
import AddPersonForm from '@/components/AddPersonForm';
import PersonRoleButtons from '@/components/PersonRoleButtons';


const AdminRoastersPage: React.FC = () => {

  // All hooks and state declarations must come first
  const { t } = useTranslation();
  const { showRatings } = useFeatureFlags();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [roasters, setRoasters] = useState<Roaster[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showUnverifiedOnly, setShowUnverifiedOnly] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [images, setImages] = useState<RoasterImage[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [verifiedFilter, setVerifiedFilter] = useState<'all' | 'verified' | 'unverified'>('unverified');
  const [featuredFilter, setFeaturedFilter] = useState<'all' | 'featured'>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);
  const [globalCounts, setGlobalCounts] = useState<{ all: number; verified: number; unverified: number; featured: number } | null>(null);
  // person management state
  const [people, setPeople] = useState<RoasterPerson[]>([]);
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [editingPerson, setEditingPerson] = useState<RoasterPerson | null>(null);
  const [personForm, setpersonForm] = useState({
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    linkedinUrl: '',
    instagramUrl: '',
    bio: '',
    roles: [] as PersonRole[],
    isPrimary: false
  });

  // Calculate completeness score for a roaster (out of 39 possible points)
  function calculateCompleteness(r: Roaster) {
    let points = 0;
    const totalPossible = 39;
    // Name
    if (r.name) points += 2;
    // Description
    if (r.description) points += 2;
    // Country
    if (r.country) points += 1;
    // Website
    if (r.website) points += 2;
    // Social networks (socialNetworks JSON or legacy fields)
      const sn = r.socialNetworks || {};
      const instagram = sn.instagram || '';
      const linkedin = sn.linkedin || '';
      const facebook = sn.facebook || '';
    if (instagram) points += 2;
    if (linkedin) points += 1;
    if (facebook) points += 1;
    // Specialty (check roasterSpecialties if included)
    if (Array.isArray(r.specialties) && r.specialties.length > 0) points += 2;
    // Image - check uploaded images (roasterImages) or fallback imageUrl or images array
    const hasImage = (Array.isArray(r.roasterImages) && r.roasterImages.length > 0) || r.imageUrl || (Array.isArray(r.images) && r.images.length > 0);
    if (hasImage) points += 5;
    // Contacts - use people included from the admin endpoint
    const people = Array.isArray(r.people) ? r.people : [];
    // Primary contact points: first name, last name, email, mobile, isPrimary, role, bio
    const primary = people.find((p: any) => p.isPrimary) || people[0];
    if (primary) {
      if (primary.firstName) points += 1;
      if (primary.lastName) points += 1;
      if (primary.email) points += 2;
      if (primary.mobile) points += 2;
      if (primary.isPrimary) points += 2;
      if (primary.roles && primary.roles.length > 0) points += 1; // role
      if (primary.bio) points += 1;
    }
    const pct = Math.round((points / totalPossible) * 100);
    return { points, pct };
  }

  // Fetch roasters when pagination, filters, search, or sorting change
  useEffect(() => {
    fetchRoasters();
  }, [currentPage, limit, verifiedFilter, featuredFilter, searchQuery, sortConfig]);

  // Check for edit query parameter on mount
  useEffect(() => {
    const editId = searchParams?.get('edit');
    if (editId && roasters.length > 0) {
      setEditingId(editId);
    }
  }, [searchParams, roasters]);

  const fetchRoasters = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = { page: currentPage, limit };
      if (searchQuery && searchQuery.trim()) params.search = searchQuery.trim();
      if (featuredFilter === 'featured') params.featured = 'true';
      if (verifiedFilter === 'verified') params.verified = 'true';
      if (verifiedFilter === 'unverified') params.verified = 'false';
      // Add sorting if configured
      if (sortConfig) {
        params.sortBy = sortConfig.key;
        params.sortOrder = sortConfig.direction;
      }

      const data = await apiClient.getRoasters(params) as any;
      setRoasters(data.roasters || []);
      setTotalPages(data.pagination?.pages || 1);
      if (data.globalCounts) {
        setGlobalCounts(data.globalCounts);
      }
    } catch (err: any) {
      console.error('Fetch roasters error:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };


  const onFormSuccess = () => {
    setEditingId(null);
    setShowAddForm(false);
    // Always navigate to the Roasters list after save/delete
    router.push('/admin/roasters');
    fetchRoasters();
  };

  const onFormCancel = () => {
    setEditingId(null);
    setShowAddForm(false);
    router.push('/admin/roasters');
  };

  const handleVerify = async (roaster: Roaster, postToRedditPrompt = true) => {
    if (!roaster?.id) return;
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

      let postToReddit = false;
      if (postToRedditPrompt) {
        postToReddit = window.confirm(`Also post ${roaster.name} to configured Reddit communities?`);
      }

      setVerifyingId(roaster.id);

      const res = await fetch(`${apiUrl}/api/roasters/${roaster.id}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: postToReddit ? JSON.stringify({ postToReddit: true }) : undefined,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `API returned ${res.status}`);
      }

      // Refresh list
      await fetchRoasters();
    } catch (err: any) {
      console.error('Verify error:', err);
      alert(err?.message || 'Failed to verify roaster');
    } finally {
      setVerifyingId(null);
    }
  };

  // Use backend globalCounts for filter badges
  const getVerifiedCount = (type: 'all' | 'verified' | 'unverified') => {
    if (!globalCounts) return 0;
    if (type === 'all') return globalCounts.all;
    if (type === 'verified') return globalCounts.verified;
    return globalCounts.unverified;
  };

  const getFeaturedCount = (type: 'all' | 'featured') => {
    if (!globalCounts) return 0;
    if (type === 'all') return globalCounts.all;
    return globalCounts.featured;
  };

  const changePage = (page: number) => {
    setCurrentPage(page);
  };

  // Sorting is now handled by the backend
  // Display roasters directly as returned from API (already sorted and paginated)
  const filteredRoasters = roasters;

  let content: React.ReactNode = null;
  if (editingId || showAddForm) {
    const roaster = editingId ? roasters.find(r => r.id === editingId) : undefined;
    content = <RoasterForm roaster={roaster} onSuccess={onFormSuccess} onCancel={onFormCancel} />;
  } else {
    content = (
      <div className="p-4 pt-20 sm:pt-28 px-4 sm:px-8 lg:px-32">
        <div className="mb-6 max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">{t('adminSection.roasters', 'Roasters')}</h1>
          <button
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            onClick={() => setShowAddForm(true)}
          >
            {t('common.add', 'Add')}
          </button>
        </div>
        {/* Search bar and Filter Buttons */}
        <div className="mb-6 max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search Input */}
            <div className="flex-1 lg:max-w-md">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('admin.roasters.searchPlaceholder', 'Search by name, description, city, or country...')}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                    aria-label={t('common.clear', 'Clear')}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              {/* Verified Filters */}
              <button
                onClick={() => {
                  setVerifiedFilter('verified');
                  setFeaturedFilter('all');
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  verifiedFilter === 'verified'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                <span>{t('adminForms.roasters.verified', 'Verified')}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  verifiedFilter === 'verified' 
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' 
                    : 'bg-green-600 text-white'
                }`}>
                  {getVerifiedCount('verified')}
                </span>
              </button>
              <button
                onClick={() => {
                  setVerifiedFilter('unverified');
                  setFeaturedFilter('all');
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  verifiedFilter === 'unverified'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                <span>{t('admin.roasters.unverified', 'Unverified')}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  verifiedFilter === 'unverified' 
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' 
                    : 'bg-orange-600 text-white'
                }`}>
                  {getVerifiedCount('unverified')}
                </span>
              </button>
              {/* Featured Filter */}
              <button
                onClick={() => {
                  const newFeatured = featuredFilter === 'featured' ? 'all' : 'featured';
                  setFeaturedFilter(newFeatured);
                  if (newFeatured === 'featured') {
                    setVerifiedFilter('all');
                  }
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  featuredFilter === 'featured'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                <span>{t('adminForms.roasters.featured', 'Featured')}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  featuredFilter === 'featured' 
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' 
                    : 'bg-yellow-600 text-white'
                }`}>
                  {getFeaturedCount('featured')}
                </span>
              </button>
            </div>
          </div>
          {/* Search Results Count */}
          {searchQuery && (
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {t('admin.roasters.searchResults', 'Found {{count}} roaster(s)', { count: filteredRoasters.length })}
            </div>
          )}
        </div>
        <div className="max-w-6xl mx-auto">
          {filteredRoasters.length === 0 ? (
            <div className="text-gray-500 dark:text-gray-400 text-center py-12">
              {searchQuery 
                ? t('admin.roasters.noSearchResults', 'No roasters match your search.')
                : t('admin.roasters.noRoasters', 'No roasters found.')
              }
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {filteredRoasters.map((roaster) => (
                  <div key={roaster.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm dark:shadow-gray-900/50">
                    {/* Roaster Header */}
                    <div className="mb-3">
                      <button
                        className="text-lg font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-left"
                        onClick={() => setEditingId(roaster.id)}
                      >
                        {roaster.name}
                      </button>
                      {/* Status Badges */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {roaster.verified && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                            <span className="mr-1">✔️</span>
                            {t('adminForms.roasters.verified', 'Verified')}
                          </span>
                        )}
                        {roaster.featured && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400">
                            <span className="mr-1">⭐</span>
                            {t('adminForms.roasters.featured', 'Featured')}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Location */}
                    <div className="mb-3">
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <span className="mr-2">📍</span>
                        <span>
                          {[roaster.city, roaster.country].filter(Boolean).join(', ') || '-'}
                        </span>
                      </div>
                    </div>
                    {/* Completeness Score */}
                    <div className="mb-3">
                      {(() => {
                        const r = calculateCompleteness(roaster);
                        return (
                          <div className="text-sm">
                            <div className="flex items-center justify-between">
                              <div className="text-gray-600 dark:text-gray-400">{t('adminForms.roasters.completeness', 'Completeness')}</div>
                              <div className="font-semibold text-gray-900 dark:text-gray-100">{r.pct}%</div>
                            </div>
                            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden mt-1">
                              <div style={{ width: `${r.pct}%` }} className="h-2 bg-gradient-to-r from-green-400 to-yellow-400"></div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                    {/* Rating */}
                    {showRatings && roaster.rating && (
                      <div className="mb-3">
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <span className="mr-2">⭐</span>
                          <span>{roaster.rating}</span>
                        </div>
                      </div>
                    )}
                    {/* Actions */}
                    <div className="mt-3">
                      {!roaster.verified && (
                        <button
                          className="bg-orange-600 text-white px-3 py-1 rounded hover:bg-orange-700 mr-2"
                          onClick={() => handleVerify(roaster, true)}
                          disabled={verifyingId === roaster.id}
                        >
                          {verifyingId === roaster.id ? t('roasters.verifying', 'Verifying...') : t('roasters.verify', 'Verify')}
                        </button>
                      )}
                      <button
                        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                        onClick={() => setEditingId(roaster.id)}
                      >
                        {t('common.edit', 'Edit')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-4 py-4 border-b dark:border-gray-700 text-left text-gray-900 dark:text-gray-100 cursor-pointer select-none" onClick={() => setSortConfig(sortConfig?.key === 'name' ? { key: 'name', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' } : { key: 'name', direction: 'asc' })}>
                        {t('adminForms.roasters.name', 'Name')}
                        {sortConfig?.key === 'name' && <SortArrow direction={sortConfig.direction} />}
                      </th>
                      <th className="px-4 py-4 border-b dark:border-gray-700 text-left text-gray-900 dark:text-gray-100 cursor-pointer select-none" onClick={() => setSortConfig(sortConfig?.key === 'city' ? { key: 'city', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' } : { key: 'city', direction: 'asc' })}>
                        {t('adminForms.roasters.city', 'City')}
                        {sortConfig?.key === 'city' && <SortArrow direction={sortConfig.direction} />}
                      </th>
                      <th className="px-4 py-4 min-w-[140px] whitespace-nowrap border-b dark:border-gray-700 text-left text-gray-900 dark:text-gray-100 cursor-pointer select-none" onClick={() => setSortConfig(sortConfig?.key === 'country' ? { key: 'country', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' } : { key: 'country', direction: 'asc' })}>
                        {t('adminForms.roasters.country', 'Country')}
                        {sortConfig?.key === 'country' && <SortArrow direction={sortConfig.direction} />}
                      </th>
                      <th className="px-4 py-4 min-w-[160px] whitespace-nowrap border-b dark:border-gray-700 text-left text-gray-900 dark:text-gray-100 cursor-pointer select-none" onClick={() => setSortConfig(sortConfig?.key === 'completeness' ? { key: 'completeness', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' } : { key: 'completeness', direction: 'asc' })}>
                        {t('adminForms.roasters.completeness', 'Completeness')}
                        {sortConfig?.key === 'completeness' && <SortArrow direction={sortConfig.direction} />}
                      </th>
                      <th className="px-4 py-4 border-b dark:border-gray-700 text-center text-gray-900 dark:text-gray-100 cursor-pointer select-none" onClick={() => setSortConfig(sortConfig?.key === 'verified' ? { key: 'verified', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' } : { key: 'verified', direction: 'asc' })}>
                        {t('adminForms.roasters.verified', 'Verified')}
                        {sortConfig?.key === 'verified' && <SortArrow direction={sortConfig.direction} />}
                      </th>
                      <th className="px-4 py-4 border-b dark:border-gray-700 text-center text-gray-900 dark:text-gray-100 cursor-pointer select-none" onClick={() => setSortConfig(sortConfig?.key === 'featured' ? { key: 'featured', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' } : { key: 'featured', direction: 'asc' })}>
                        {t('adminForms.roasters.featured', 'Featured')}
                        {sortConfig?.key === 'featured' && <SortArrow direction={sortConfig.direction} />}
                      </th>
                      {showRatings && <th className="px-4 py-4 border-b dark:border-gray-700 text-left text-gray-900 dark:text-gray-100 cursor-pointer select-none" onClick={() => setSortConfig(sortConfig?.key === 'rating' ? { key: 'rating', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' } : { key: 'rating', direction: 'asc' })}>
                        {t('adminForms.roasters.rating', 'Rating')}
                        {sortConfig?.key === 'rating' && <SortArrow direction={sortConfig.direction} />}
                      </th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRoasters.map((roaster) => (
                      <tr key={roaster.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-2 font-medium">
                          <div className="flex items-center gap-3">
                            <button
                              className="text-blue-600 dark:text-blue-400 hover:underline text-left"
                              onClick={() => setEditingId(roaster.id)}
                            >
                              {roaster.name}
                            </button>
                            {/* Verify button removed from desktop Name column per request */}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{roaster.city || '-'}</td>
                        <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{roaster.country || '-'}</td>
                        <td className="px-4 py-2 text-gray-900 dark:text-gray-100 w-36">
                          {(() => {
                            const r = calculateCompleteness(roaster);
                            return (
                              <div className="min-w-[120px]">
                                <div className="text-sm font-medium mb-1">{r.pct}%</div>
                                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                                  <div style={{ width: `${r.pct}%` }} className="h-2 bg-gradient-to-r from-green-400 to-yellow-400"></div>
                                </div>
                              </div>
                            );
                          })()}
                        </td>
                        <td className="px-4 py-2 text-center text-gray-900 dark:text-gray-100">{roaster.verified ? '✔️' : ''}</td>
                        <td className="px-4 py-2 text-center text-gray-900 dark:text-gray-100">{roaster.featured ? '⭐' : ''}</td>
                        {showRatings && <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{roaster.rating || '-'}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6 mt-6 rounded-lg shadow">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => changePage(Math.max(1, currentPage - 1))}
                  disabled={currentPage <= 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => changePage(Math.min(totalPages, currentPage + 1))}
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
                          onClick={() => changePage(page)}
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
      </div>
    );
  }

  return content;
};

interface RoasterFormProps {
  roaster?: Roaster;
  onSuccess: () => void;
  onCancel: () => void;
}

const RoasterForm: React.FC<RoasterFormProps> = ({ roaster, onSuccess, onCancel }) => {
  // Fetch suggestions for this roaster
  const fetchSuggestions = async () => {
    if (!roaster?.id) return;
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/suggestions`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const allSuggestions = await res.json();
        const roasterSuggestions = allSuggestions.filter((s: any) => s.roasterId === roaster.id);
        setSuggestions(roasterSuggestions);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  // Fetch and set selected source countries when editing a roaster
  useEffect(() => {
    if (roaster?.id) {
      fetchSourceCountries();
      fetchSuggestions();
    }
  }, [roaster?.id]);
  // Fetch available countries when form mounts
  useEffect(() => {
    fetchCountries();
  }, []);
  // Note: People are fetched by the loadPeople useEffect below (line ~760)
  const [formData, setFormData] = useState({
    name: roaster?.name || '',
    description: roaster?.description || '',
    email: roaster?.email || '',
    phone: roaster?.phone || '',
    website: roaster?.website || '',
    address: roaster?.address || '',
    city: roaster?.city || '',
    state: roaster?.state || '',
    zipCode: roaster?.zipCode || '',
    country: roaster?.country || '',
    latitude: roaster?.latitude || '',
    longitude: roaster?.longitude || '',
    founded: roaster?.founded || '',
    specialtyIds: roaster?.specialties?.map(s => s.id) || [],
    verified: roaster?.verified || false,
    featured: roaster?.featured || false,
    rating: roaster?.rating || 0,
    onlineOnly: roaster?.onlineOnly || false,
      showHours: roaster?.showHours !== undefined ? roaster.showHours : false,
    hours: roaster?.hours || {
      monday: { open: '08:00', close: '18:00', closed: false },
      tuesday: { open: '08:00', close: '18:00', closed: false },
      wednesday: { open: '08:00', close: '18:00', closed: false },
      thursday: { open: '08:00', close: '18:00', closed: false },
      friday: { open: '08:00', close: '18:00', closed: false },
      saturday: { open: '08:00', close: '18:00', closed: false },
      sunday: { open: '08:00', close: '18:00', closed: false },
    },
    images: roaster?.images || [],
    instagram: roaster?.socialNetworks?.instagram || '',
    tiktok: roaster?.socialNetworks?.tiktok || '',
    facebook: roaster?.socialNetworks?.facebook || '',
    linkedin: roaster?.socialNetworks?.linkedin || '',
    youtube: roaster?.socialNetworks?.youtube || '',
    threads: roaster?.socialNetworks?.threads || '',
    pinterest: roaster?.socialNetworks?.pinterest || '',
    bluesky: roaster?.socialNetworks?.bluesky || '',
    x: roaster?.socialNetworks?.x || '',
    reddit: roaster?.socialNetworks?.reddit || '',
  });
  const router = useRouter();
  useEffect(() => {
    if (roaster?.id) {
      const fetchRoaster = async () => {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
          const res = await fetch(`${apiUrl}/api/roasters/${roaster.id}`);
          if (res.ok) {
            const data = await res.json();
            // Extract individual social fields from socialNetworks object for form display
            const socialNetworks = data.socialNetworks || {};
            setFormData({
              name: data.name || '',
              description: data.description || '',
              email: data.email || '',
              phone: data.phone || '',
              website: data.website || '',
              address: data.address || '',
              city: data.city || '',
              state: data.state || '',
              zipCode: data.zipCode || '',
              country: data.country || '',
              latitude: data.latitude || '',
              longitude: data.longitude || '',
              founded: data.founded || '',
              specialtyIds: data.specialties?.map((s: any) => s.id) || [],
              verified: data.verified || false,
              featured: data.featured || false,
              rating: data.rating || 0,
              onlineOnly: data.onlineOnly || false,
              showHours: data.showHours !== undefined ? data.showHours : true,
              hours: convertHoursFormat(data.hours) || {
                monday: { open: '08:00', close: '18:00', closed: false },
                tuesday: { open: '08:00', close: '18:00', closed: false },
                wednesday: { open: '08:00', close: '18:00', closed: false },
                thursday: { open: '08:00', close: '18:00', closed: false },
                friday: { open: '08:00', close: '18:00', closed: false },
                saturday: { open: '08:00', close: '18:00', closed: false },
                sunday: { open: '08:00', close: '18:00', closed: false },
              },
              images: data.images || [],
              instagram: socialNetworks.instagram || '',
              tiktok: socialNetworks.tiktok || '',
              facebook: socialNetworks.facebook || '',
              linkedin: socialNetworks.linkedin || '',
              youtube: socialNetworks.youtube || '',
              threads: socialNetworks.threads || '',
              pinterest: socialNetworks.pinterest || '',
              bluesky: socialNetworks.bluesky || '',
              x: socialNetworks.x || '',
              reddit: socialNetworks.reddit || '',
            });
          }
        } catch (err) {
          // Optionally handle error
        }
      };
      fetchRoaster();
    }
  }, [roaster?.id]);

  // Fetch images when editing existing roaster
  useEffect(() => {
    if (roaster?.id) {
      fetchImages();
    }
  }, [roaster?.id]);
  // Handles input changes for all fields
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setFormData((prev: any) => {
      const updates: any = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      };
      
      // If onlineOnly is being turned on, turn off showHours
      if (name === 'onlineOnly' && checked) {
        updates.showHours = false;
      }
      
      return updates;
    });
  };

  // Posting is handled on a separate confirmation/progress page.

  // Handles changes for hours fields
  const handleHoursChange = (day: string, field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      hours: {
        ...prev.hours,
        [day]: {
          ...prev.hours?.[day],
          [field]: value,
        },
      },
    }));
  };
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reusable chevron component
  const ChevronIcon = ({ isExpanded }: { isExpanded: boolean }) => (
    <svg 
      className={`w-5 h-5 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
  const [images, setImages] = useState<RoasterImage[]>([]);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // person management state
  const [people, setPeople] = useState<RoasterPerson[]>([]);
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [editingPerson, setEditingPerson] = useState<RoasterPerson | null>(null);
  const [personForm, setpersonForm] = useState<RoasterPerson>({
    id: '',
    roasterId: '',
    firstName: '',
    lastName: '',
    title: '',
    email: '',
    mobile: '',
    linkedinUrl: '',
    instagramUrl: '',
    bio: '',
    userId: '',
    roles: [],
    isActive: true,
    isPrimary: false,
    createdAt: '',
    updatedAt: ''
  });

  // Source countries state
  const [availableCountries, setAvailableCountries] = useState<any[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(false);
  const [sourceCountriesExpanded, setSourceCountriesExpanded] = useState(false);
  
  // Suggestions state
  const [suggestions, setSuggestions] = useState<any[]>([]);
  
  // Section expand/collapse state
  const [basicInfoExpanded, setBasicInfoExpanded] = useState(true);
  const [locationExpanded, setLocationExpanded] = useState(true);
  const [contactsExpanded, setContactsExpanded] = useState(true);
  const [specialtiesExpanded, setSpecialtiesExpanded] = useState(true);
  const [settingsExpanded, setSettingsExpanded] = useState(true);
  const [urlImagesExpanded, setUrlImagesExpanded] = useState(false);
  const [socialNetworksExpanded, setSocialNetworksExpanded] = useState(false);

  // Basic form UI for editing roaster
  // ...existing code...
  const [hoursExpanded, setHoursExpanded] = useState(true);
  const [imagesExpanded, setImagesExpanded] = useState(true);

  // Expand source countries section if countries are already selected
  useEffect(() => {
    if (selectedCountries.length > 0) {
      setSourceCountriesExpanded(true);
    }
  }, [selectedCountries]);

  // Expand URL images section if URL images exist
  useEffect(() => {
    if (formData.images && formData.images.length > 0) {
      setUrlImagesExpanded(true);
    }
  }, [formData.images]);

  // Utility function to convert Unsplash URLs to proper image URLs
  const convertToImageUrl = (url: string): string => {
    if (!url) return url;
    

    
    // Handle Unsplash URLs
    if (url.includes('unsplash.com')) {
      // If it's already a direct images.unsplash.com URL, return as is
      if (url.includes('images.unsplash.com')) {
        return url;
      }
      
      // Convert various Unsplash URL formats to direct image URLs
      if (url.includes('/photos/')) {
        const photoPathMatch = url.match(/\/photos\/([^/?#]+)/);
        if (photoPathMatch) {
          const photoId = photoPathMatch[1];
          
          // For URLs like https://unsplash.com/photos/ZmOhgTobRQI
          // The photo ID is directly after /photos/
          const directImageUrl = `https://images.unsplash.com/photo-${photoId}?w=800&h=600&fit=crop&auto=format&q=80`;
          
          return directImageUrl;
        }
      }
    }
    

    return url; // Return original URL if not Unsplash or already processed
  };

  // Helper function to convert old hours format to new format
  const convertHoursFormat = (hours: any) => {
    // Handle case where hours is stored as a stringified JSON in the DB
    if (typeof hours === 'string') {
      try {
        hours = JSON.parse(hours);
      } catch (err) {
        // If parsing fails, fall through and treat as missing
        console.warn('convertHoursFormat: failed to parse string hours', err);
      }
    }
  // Restore missing handleInputChange function
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  // Restore missing handleHoursChange function
  const handleHoursChange = (day: string, field: string, value: string | boolean) => {
    setFormData(prev => {
      const currentDay = (prev.hours as any)[day];
      let newValue = value;
      // If toggling 'closed' to false, set default times if not present
      if (field === 'closed' && value === false) {
        // Always set both open and close to defaults if not present
        return {
          ...prev,
          hours: {
            ...prev.hours,
            [day]: {
              closed: false,
              open: '08:00',
              close: '18:00',
            }
          }
        };
      }
      // Time validation logic
      if (field === 'open' && typeof value === 'string') {
        const closeTime = currentDay?.close;
        if (closeTime && value >= closeTime) {
          const [hours, minutes] = value.split(':');
          const newCloseHour = Math.min(23, parseInt(hours) + 1);
          newValue = value;
          return {
            ...prev,
            hours: {
              ...prev.hours,
              [day]: {
                ...currentDay,
                open: newValue,
                close: `${newCloseHour.toString().padStart(2, '0')}:${minutes}`
              }
            }
          };
        }
      } else if (field === 'close' && typeof value === 'string') {
        const openTime = currentDay?.open;
        if (openTime && value <= openTime) {
          return prev;
        }
      }
      return {
        ...prev,
        hours: {
          ...prev.hours,
          [day]: {
            ...currentDay,
            [field]: newValue
          }
        }
      };
    });
  };
    if (!hours) {
      return {
        monday: { open: '', close: '', closed: true },
        tuesday: { open: '', close: '', closed: true },
        wednesday: { open: '', close: '', closed: true },
        thursday: { open: '', close: '', closed: true },
        friday: { open: '', close: '', closed: true },
        saturday: { open: '', close: '', closed: true },
        sunday: { open: '', close: '', closed: true },
      };
    }

    // If already in new format, return as-is
    if (hours.monday && typeof hours.monday === 'object' && 'open' in hours.monday) {
      return hours;
    }

    // Convert old format "6:00-20:00" to new format
    const convertedHours: any = {};
    const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    dayNames.forEach(day => {
      const dayHours = hours[day];
      if (!dayHours || dayHours === 'closed') {
        convertedHours[day] = { open: '', close: '', closed: true };
      } else if (typeof dayHours === 'string' && dayHours.includes('-')) {
        const [open, close] = dayHours.split('-');
        convertedHours[day] = { open: open || '', close: close || '', closed: false };
      } else {
        convertedHours[day] = { open: '', close: '', closed: true };
      }
    });

    return convertedHours;
  };


  // Fetch images when editing existing roaster
  const fetchImages = async () => {
    if (!roaster?.id) return;
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/roasters/${roaster.id}/images`);
      if (response.ok) {
        const data = await response.json();
        setImages(data.images || []);
        setImagesLoaded(true);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
      setImagesLoaded(true);
    }
  };

  // Fetch all available countries for source country selection
  const fetchCountries = async () => {
    try {
      setCountriesLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/countries`);
      if (response.ok) {
        const countries = await response.json();
        setAvailableCountries(countries);
      }
    } catch (error) {
      console.error('Error fetching countries:', error);
    } finally {
      setCountriesLoading(false);
    }
  };

  // Fetch roaster's current source countries
  const fetchSourceCountries = async () => {
    if (!roaster?.id) return;
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/roasters/${roaster.id}/source-countries`);
      if (response.ok) {
        const countries = await response.json();
        setSelectedCountries(countries.map((c: any) => c.id));
      }
    } catch (error) {
      console.error('Error fetching source countries:', error);
    }
  };



  const handleSubmit = async (e?: React.FormEvent, afterSaveNavigate?: string) => {
    if (e && typeof (e as any).preventDefault === 'function') (e as any).preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      // Convert hours back to backend format
      const convertedHours: any = {};
      Object.entries(formData.hours as any).forEach(([day, dayData]: [string, any]) => {
        if (dayData.closed) {
          convertedHours[day] = 'closed';
        } else {
          // Always persist open/close, defaulting if missing
          const open = dayData.open || '08:00';
          const close = dayData.close || '18:00';
          convertedHours[day] = `${open}-${close}`;
        }
      });

      // Build consolidated socialNetworks map from individual inputs for backend
      const socialKeys = ['instagram','tiktok','facebook','linkedin','youtube','threads','pinterest','bluesky','x','reddit'];
      const socialNetworks: Record<string,string> = {};
      socialKeys.forEach((k) => {
        const v = (formData as any)[k];
        if (v && String(v).trim() !== '') socialNetworks[k] = String(v).trim();
      });

      // Create payload without individual social fields
      const { instagram, tiktok, facebook, linkedin, youtube, threads, pinterest, bluesky, x, reddit, ...payloadData } = formData;

      const payload = {
        ...payloadData,
        hours: convertedHours,
        latitude: formData.latitude ? parseFloat(String(formData.latitude)) : undefined,
        longitude: formData.longitude ? parseFloat(String(formData.longitude)) : undefined,
        founded: formData.founded ? parseInt(String(formData.founded)) : undefined,
        rating: parseFloat(String(formData.rating)) || 0,
        specialtyIds: formData.specialtyIds, // Send specialty IDs array directly
        // Include consolidated map when any networks provided
        ...(Object.keys(socialNetworks).length > 0 ? { socialNetworks } : {}),
      };

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const url = roaster 
        ? `${apiUrl}/api/roasters/${roaster.id}`
        : `${apiUrl}/api/roasters`;
      
      const method = roaster ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        if (errorData.errors && Array.isArray(errorData.errors)) {
          // Handle validation errors
          const errorMessages = errorData.errors.map((err: any) => err.msg).join(', ');
          throw new Error(errorMessages);
        }
        throw new Error(errorData.error || errorData.message || 'Failed to save roaster');
      }

      const savedRoaster = await res.json();
      const roasterId = roaster?.id || savedRoaster.id;

      // Update source countries if roaster was saved successfully
      if (roasterId) {
        const sourceCountriesRes = await fetch(`${apiUrl}/api/roasters/${roasterId}/source-countries`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ countryIds: selectedCountries }),
        });

        if (!sourceCountriesRes.ok) {
          console.error('Failed to update source countries');
          // Don't throw error here as the roaster was successfully saved
        }
      }

      // After saving, fetch the updated roaster and update formData
      if (roasterId) {
        const res = await fetch(`${apiUrl}/api/roasters/${roasterId}`);
        if (res.ok) {
          const data = await res.json();
          // Extract individual social fields from socialNetworks object for form display
          const socialNetworks = data.socialNetworks || {};
          setFormData({
            name: data.name || '',
            description: data.description || '',
            email: data.email || '',
            phone: data.phone || '',
            website: data.website || '',
            address: data.address || '',
            city: data.city || '',
            state: data.state || '',
            zipCode: data.zipCode || '',
            country: data.country || '',
            latitude: data.latitude || '',
            longitude: data.longitude || '',
            founded: data.founded || '',
            specialtyIds: data.specialties?.map(s => s.id) || [],
            verified: data.verified || false,
            featured: data.featured || false,
            rating: data.rating || 0,
            onlineOnly: data.onlineOnly || false,
            showHours: typeof data.showHours === 'boolean' ? data.showHours : true,
            hours: convertHoursFormat(data.hours) || {
              monday: { open: '08:00', close: '18:00', closed: false },
              tuesday: { open: '08:00', close: '18:00', closed: false },
              wednesday: { open: '08:00', close: '18:00', closed: false },
              thursday: { open: '08:00', close: '18:00', closed: false },
              friday: { open: '08:00', close: '18:00', closed: false },
              saturday: { open: '08:00', close: '18:00', closed: false },
              sunday: { open: '08:00', close: '18:00', closed: false },
            },
            images: data.images || [],
            instagram: socialNetworks.instagram || '',
            tiktok: socialNetworks.tiktok || '',
            facebook: socialNetworks.facebook || '',
            linkedin: socialNetworks.linkedin || '',
            youtube: socialNetworks.youtube || '',
            threads: socialNetworks.threads || '',
            pinterest: socialNetworks.pinterest || '',
            bluesky: socialNetworks.bluesky || '',
            x: socialNetworks.x || '',
            reddit: socialNetworks.reddit || '',
          });
        }

        // If this is a new roaster and contact info is filled, save the contact
        if (!roaster?.id && personForm.firstName) {
          try {
            const personPayload = { ...personForm, roasterId: roasterId };
            const personResponse = await fetch(`${apiUrl}/api/people`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
              },
              body: JSON.stringify(personPayload)
            });

            if (!personResponse.ok) {
              console.error('Failed to save contact person');
              // Don't throw error here as the roaster was successfully saved
            } else {
              // Reset the person form after successful save
              resetPersonForm();
            }
          } catch (err) {
            console.error('Error saving contact person:', err);
            // Don't throw error here as the roaster was successfully saved
          }
        }
      }
      onSuccess();

      // Navigate after save if requested (used for "Save and Post")
      if (afterSaveNavigate) {
        try {
          router.push(afterSaveNavigate);
        } catch (navErr) {
          // ignore navigation error
        }
      }
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // person management functions
  const fetchPeople = async () => {
    if (!roaster?.id) return;
    
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/people/roaster/${roaster.id}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      
      if (response.ok) {
        const data = await response.json();
        // API returns {data: [...], count: ...}
        const peopleArray = data.data || data.people || data || [];
        setPeople(peopleArray);
      }
    } catch (error) {
      // Silently handle error
    }
  };

  const resetPersonForm = () => {
    setpersonForm({
      id: '',
      roasterId: '',
      firstName: '',
      lastName: '',
      title: '',
      email: '',
      mobile: '',
      linkedinUrl: '',
      instagramUrl: '',
      bio: '',
      roles: [],
      isActive: true,
      isPrimary: false,
      createdAt: '',
      updatedAt: ''
    });
    setEditingPerson(null);
    setShowAddPerson(false);
    setError(null); // Clear any existing errors
  };

  const handleAddPerson = () => {
    resetPersonForm();
    setShowAddPerson(true);
  };

  const handleEditPerson = (person: RoasterPerson) => {
    setpersonForm({
      id: person.id,
      roasterId: person.roasterId,
      firstName: person.firstName,
      lastName: person.lastName || '',
      title: person.title || '',
      email: person.email || '',
      mobile: person.mobile || '',
      linkedinUrl: person.linkedinUrl || '',
      instagramUrl: person.instagramUrl || '',
      bio: person.bio || '',
      roles: person.roles,
      isActive: person.isActive,
      isPrimary: person.isPrimary,
      createdAt: person.createdAt,
      updatedAt: person.updatedAt
    });
    setEditingPerson(person);
    setShowAddPerson(true);
    setError(null); // Clear any existing errors when editing
  };

  const handlePersonRoleChange = (role: PersonRole) => {
    setpersonForm(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }));
  };

  const submitPerson = async (personData?: any) => {
    // If personData is provided (from AddPersonForm), use it; otherwise fall back to personForm state
    const dataToSave = personData || personForm;
    
    if (!roaster?.id && !formData.name) return;
    
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      
      const url = editingPerson 
        ? `${apiUrl}/api/people/${editingPerson.id}`
        : `${apiUrl}/api/people`;
      
      const method = editingPerson ? 'PUT' : 'POST';
      
      // Sanitize payload - convert empty strings to undefined for optional fields
      const sanitizedData = { ...dataToSave };
  if (sanitizedData.email === '') sanitizedData.email = undefined;
  if (sanitizedData.linkedinUrl === '') sanitizedData.linkedinUrl = undefined;
  if (sanitizedData.instagramUrl === '') sanitizedData.instagramUrl = undefined;
  if (sanitizedData.mobile === '') sanitizedData.mobile = undefined;
  if (sanitizedData.lastName === '') sanitizedData.lastName = undefined;
  if (sanitizedData.title === '') sanitizedData.title = null;
  if (sanitizedData.bio === '') sanitizedData.bio = undefined;
  if (sanitizedData.roasterId === '') sanitizedData.roasterId = undefined;
      
      const payload = editingPerson
        ? { ...sanitizedData }
        : { ...sanitizedData, roasterId: roaster?.id || 'temp' };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setError(null); // Clear any existing errors on success
        setEditingPerson(null);
        setShowAddPerson(false);
        resetPersonForm();
        if (roaster?.id) {
          fetchPeople(); // Only fetch if roaster exists
        }
      } else {
        const errorData = await response.json();
        
        // Handle validation errors with specific field messages
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const errorMessages = errorData.errors.map((err: any) => err.msg).join(', ');
          throw new Error(errorMessages);
        }
        
        throw new Error(errorData.error || 'Failed to save person');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save person');
    }
  };

  const deletePerson = async (personId: string) => {
    if (!confirm('Are you sure you want to delete this person?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      
      const response = await fetch(`${apiUrl}/api/people/${personId}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });

      if (response.ok) {
        fetchPeople();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete person');
      }
    } catch (error) {
      setError('Failed to delete person');
    }
  };

  // Fetch people when editing existing roaster
  React.useEffect(() => {
    let isMounted = true;
    
    const loadPeople = async () => {
      if (!roaster?.id || !isMounted) return;
      
      try {
        const token = localStorage.getItem('token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const response = await fetch(`${apiUrl}/api/people/roaster/${roaster.id}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });
        
        if (response.ok && isMounted) {
          const data = await response.json();
          // API returns {data: [...], count: ...}
          const peopleArray = data.data || data.people || data || [];
          setPeople(peopleArray);
        }
      } catch (error) {
        // Silently handle error
      }
    };
    
    loadPeople();
    
    return () => {
      isMounted = false;
    };
  }, [roaster?.id]);

  const getRoleBadgeColor = (role: PersonRole) => {
    switch (role) {
      case PersonRole.OWNER:
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400';
      case PersonRole.ADMIN:
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400';
      case PersonRole.ROASTER:
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400';
      case PersonRole.EMPLOYEE:
        return 'bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-400';
      case PersonRole.BILLING:
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
      case PersonRole.MARKETING:
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400';
      case PersonRole.SCOUT:
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="p-4 pt-20 sm:pt-28 px-4 sm:px-8 lg:px-32 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="mb-6 max-w-6xl mx-auto">
        {/* Breadcrumb Navigation */}
        <nav className="mb-4">
          <button
            onClick={onCancel}
            className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors font-medium"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('admin.roasters.backToRoasters', 'Back to Roasters')}
          </button>
        </nav>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {roaster 
            ? t('adminForms.roasters.editRoaster', 'Edit Roaster') 
            : t('admin.roasters.addTitle', 'Add Roaster')
          }
        </h1>
      </div>
      <div className="max-w-6xl mx-auto">
        {/* ...existing code... */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 select-none">
                  {t('adminForms.roasters.basicInformation', 'Basic Information')}
                </h3>
                <button
                  type="button"
                  onClick={() => setBasicInfoExpanded(!basicInfoExpanded)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  title={basicInfoExpanded ? 'Collapse section' : 'Expand section'}
                >
                  <svg 
                    className="w-4 h-4 transition-transform duration-200" 
                    style={{ transform: basicInfoExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              
              {basicInfoExpanded && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('adminForms.roasters.name', 'Name')} *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('adminForms.roasters.description', 'Description')}
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={5}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('adminForms.roasters.email', 'Email')}
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('adminForms.roasters.phone', 'Phone')}
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('adminForms.roasters.website', 'Website')}
                    </label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('adminForms.roasters.founded', 'Founded')}
                    </label>
                    <input
                      type="number"
                      name="founded"
                      value={formData.founded}
                      onChange={handleInputChange}
                      placeholder="e.g. 2020"
                      min="1800"
                      max="2100"
                      step="1"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  {roaster?.id && suggestions.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('adminForms.roasters.suggestions', 'Suggestions')}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {suggestions.map((suggestion) => (
                          <a
                            key={suggestion.id}
                            href={`/admin/suggestions/${suggestion.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1 text-sm font-mono bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                          >
                            {suggestion.id.substring(0, 8)}...
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Location & Details */}
            <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 select-none">
                  {t('adminForms.roasters.locationDetails', 'Location & Details')}
                </h3>
                <button
                  type="button"
                  onClick={() => setLocationExpanded(!locationExpanded)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  title={locationExpanded ? 'Collapse section' : 'Expand section'}
                >
                  <svg 
                    className="w-4 h-4 transition-transform duration-200" 
                    style={{ transform: locationExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              
              {locationExpanded && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('adminForms.roasters.address', 'Address')}
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('adminForms.roasters.city', 'City')}
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('adminForms.roasters.state', 'State')}
                      </label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('admin.roasters.zipCode', 'Zip Code')}
                      </label>
                      <input
                        type="text"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('admin.roasters.country', 'Country')}
                      </label>
                      <input
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('admin.roasters.latitude', 'Latitude')}
                      </label>
                      <input
                        type="number"
                        step="any"
                        name="latitude"
                        value={formData.latitude}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('admin.roasters.longitude', 'Longitude')}
                      </label>
                      <input
                        type="number"
                        step="any"
                        name="longitude"
                        value={formData.longitude}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Source Countries */}
          <div className="mt-6 p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 select-none">
                {t('adminForms.roasters.sourceCountries', 'Source Countries')}
              </h3>
              <button
                type="button"
                onClick={() => setSourceCountriesExpanded(!sourceCountriesExpanded)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                title={sourceCountriesExpanded ? 'Collapse section' : 'Expand section'}
              >
                <svg 
                  className="w-4 h-4 transition-transform duration-200" 
                  style={{ transform: sourceCountriesExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            
            {sourceCountriesExpanded && (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('adminForms.roasters.sourceCountriesDescription', 'Select the coffee origin countries that this roaster sources from.')}
                </p>
                
                {countriesLoading ? (
                  <div className="text-center py-4">
                    <div className="text-gray-500">{t('common.loading', 'Loading...')}</div>
                  </div>
                ) : (
                  <div className="space-y-2">
                {availableCountries.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-[500px] overflow-y-auto border border-gray-200 rounded-md p-3 bg-white">
                    {availableCountries.map((country) => (
                      <label key={country.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer min-w-0" title={country.name}>
                        <input
                          type="checkbox"
                          checked={selectedCountries.includes(country.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCountries(prev => [...prev, country.id]);
                            } else {
                              setSelectedCountries(prev => prev.filter(id => id !== country.id));
                            }
                          }}
                          className="rounded border-gray-300 dark:border-gray-600 text-blue-600 dark:bg-gray-700 focus:ring-blue-500 flex-shrink-0"
                        />
                        <div className="flex items-center space-x-1 min-w-0 overflow-hidden">
                          {country.flagSvg && (
                            <img 
                              src={country.flagSvg} 
                              alt={`${country.name} flag`}
                              className="w-4 h-3 flex-shrink-0 object-cover rounded-sm"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                          <span className="text-sm text-gray-700 dark:text-gray-300 truncate block">{country.name}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm">
                    {t('adminForms.roasters.noCountriesAvailable', 'No countries available')}
                  </div>
                )}
                {selectedCountries.length > 0 && (
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {t('adminForms.roasters.selectedCountriesCount', 'Selected countries: {{count}}', { count: selectedCountries.length })}
                  </div>
                  )}
                </div>
                )}
              </>
            )}
          </div>

          {/* Social Networks */}
          <div className="mt-6 p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 select-none">
                {t('adminForms.roasters.socialNetworks', 'Social Networks')}
              </h3>
              <button
                type="button"
                onClick={() => setSocialNetworksExpanded(!socialNetworksExpanded)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                title={socialNetworksExpanded ? 'Collapse section' : 'Expand section'}
              >
                <svg 
                  className="w-4 h-4 transition-transform duration-200" 
                  style={{ transform: socialNetworksExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            
            {socialNetworksExpanded && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('adminForms.roasters.instagram', 'Instagram')}
                    </label>
                    <input
                      type="text"
                      name="instagram"
                      value={formData.instagram}
                      onChange={handleInputChange}
                      placeholder="https://instagram.com/..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('adminForms.roasters.tiktok', 'TikTok')}
                    </label>
                    <input
                      type="text"
                      name="tiktok"
                      value={formData.tiktok}
                      onChange={handleInputChange}
                      placeholder="https://tiktok.com/@..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('adminForms.roasters.facebook', 'Facebook')}
                    </label>
                    <input
                      type="text"
                      name="facebook"
                      value={formData.facebook}
                      onChange={handleInputChange}
                      placeholder="https://facebook.com/..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('adminForms.roasters.linkedin', 'LinkedIn')}
                    </label>
                    <input
                      type="text"
                      name="linkedin"
                      value={formData.linkedin}
                      onChange={handleInputChange}
                      placeholder="https://linkedin.com/company/..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('adminForms.roasters.youtube', 'YouTube')}
                    </label>
                    <input
                      type="text"
                      name="youtube"
                      value={formData.youtube}
                      onChange={handleInputChange}
                      placeholder="https://youtube.com/@..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('adminForms.roasters.threads', 'Threads')}
                    </label>
                    <input
                      type="text"
                      name="threads"
                      value={formData.threads}
                      onChange={handleInputChange}
                      placeholder="https://threads.net/@..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('adminForms.roasters.pinterest', 'Pinterest')}
                    </label>
                    <input
                      type="text"
                      name="pinterest"
                      value={formData.pinterest}
                      onChange={handleInputChange}
                      placeholder="https://pinterest.com/..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('adminForms.roasters.bluesky', 'BlueSky')}
                    </label>
                    <input
                      type="text"
                      name="bluesky"
                      value={formData.bluesky}
                      onChange={handleInputChange}
                      placeholder="https://bsky.app/profile/..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('adminForms.roasters.x', 'X (Twitter)')}
                    </label>
                    <input
                      type="text"
                      name="x"
                      value={formData.x}
                      onChange={handleInputChange}
                      placeholder="https://x.com/..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('adminForms.roasters.reddit', 'Reddit')}
                    </label>
                    <input
                      type="text"
                      name="reddit"
                      value={formData.reddit}
                      onChange={handleInputChange}
                      placeholder="https://reddit.com/r/..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                    {/* Post button moved to form actions at bottom of page */}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Contacts Pane */}
          <div className="mt-6 p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 select-none">
                {roaster?.id ? t('adminForms.roasters.contacts', 'Contacts') : t('adminForms.roasters.contact', 'Contact')}
              </h3>
              <div className="flex items-center gap-2">
                {roaster?.id && (
                  <button
                    type="button"
                    onClick={handleAddPerson}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
                  >
                    {t('common.add', 'Add')}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setContactsExpanded(!contactsExpanded)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  title={contactsExpanded ? 'Collapse section' : 'Expand section'}
                >
                  <svg 
                    className="w-4 h-4 transition-transform duration-200" 
                    style={{ transform: contactsExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>
            {contactsExpanded && (
              <>
                {/* Render contact cards for existing contacts */}
                {people.length > 0 ? (
                  <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {people.map((person) => (
                      <div key={person.id} className="w-full">
                        {editingPerson && editingPerson.id === person.id ? (
                          <AddPersonForm
                            roasterId={roaster?.id}
                            initialPerson={personForm}
                            mode="edit"
                            onSave={submitPerson}
                            onCancel={resetPersonForm}
                          />
                        ) : (
                          <div className="border rounded-lg p-4 bg-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between mx-auto w-full">
                            <div>
                              <div className="font-semibold text-gray-900">
                                <a 
                                  href={`/admin/people/edit/${person.id}`}
                                  className="text-blue-600 hover:text-blue-800 hover:underline"
                                >
                                  {`${person.firstName} ${person.lastName || ''}`.trim()}
                                </a>
                              </div>
                              {person.email && (
                                <a 
                                  href={`mailto:${person.email}`}
                                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline underline"
                                >
                                  {person.email}
                                </a>
                              )}
                              {person.mobile && <div className="text-sm text-gray-700 dark:text-gray-300">{person.mobile}</div>}
                              {person.bio && <div className="text-xs text-gray-500 mt-1">{person.bio}</div>}
                            </div>
                            <div className="mt-2 sm:mt-0 flex gap-2">
                              <button type="button" className="text-blue-600 hover:underline" onClick={() => handleEditPerson(person)}>
                                {t('common.edit', 'Edit')}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  roaster?.id && (
                    <div className="text-gray-500 mb-4">{t('adminForms.roasters.noContactsFound', 'No contacts found for this roaster.')}</div>
                  )
                )}
                {/* Inline add contact form - shown by default when adding new roaster, or when "Add Contact" clicked when editing */}
                {(!roaster?.id || showAddPerson) && !editingPerson && (
                  <AddPersonForm
                    roasterId={roaster?.id}
                    initialPerson={personForm}
                    mode="add"
                    onSave={submitPerson}
                    onCancel={resetPersonForm}
                  />
                )}
              </>
            )}
          </div>
            
            {/* ...existing code... */}

          {/* Specialties Pane */}
          <div className="mt-6 p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 select-none">
                {t('adminForms.roasters.specialties', 'Specialties')}
              </h3>
              <button
                type="button"
                onClick={() => setSpecialtiesExpanded(!specialtiesExpanded)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                title={specialtiesExpanded ? 'Collapse section' : 'Expand section'}
              >
                <svg 
                  className="w-4 h-4 transition-transform duration-200" 
                  style={{ transform: specialtiesExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            
            {specialtiesExpanded && (
              <SpecialtyPillSelector
                selectedSpecialtyIds={formData.specialtyIds}
                onChange={(specialtyIds) => setFormData({ ...formData, specialtyIds })}
                language={typeof window !== 'undefined' ? localStorage.getItem('language') || 'en' : 'en'}
              />
            )}
          </div>

          {/* Settings Pane - Online Only, Rating, Verified, Featured */}
          <div className="mt-8 p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 select-none">
                {t('adminForms.roasters.settings', 'Settings')}
              </h3>
              <button
                type="button"
                onClick={() => setSettingsExpanded(!settingsExpanded)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                title={settingsExpanded ? 'Collapse section' : 'Expand section'}
              >
                <svg 
                  className="w-4 h-4 transition-transform duration-200" 
                  style={{ transform: settingsExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            
            {settingsExpanded && (
              <div className="space-y-4">
            
            <div className="space-y-4">
              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('adminForms.roasters.rating', 'Rating')}
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  name="rating"
                  value={formData.rating}
                  onChange={handleInputChange}
                  className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              {/* Checkboxes on same line with responsive stacking */}
              <div className="flex flex-col sm:flex-row sm:space-x-6 space-y-3 sm:space-y-0">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="verified"
                    checked={formData.verified}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
                  />
                  <label className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('adminForms.roasters.verified', 'Verified')}
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="featured"
                    checked={formData.featured}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
                  />
                  <label className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('adminForms.roasters.featured', 'Featured')}
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="onlineOnly"
                    checked={formData.onlineOnly}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
                  />
                  <label className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('adminForms.roasters.onlineOnly', 'Online Only')}
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="showHours"
                    checked={formData.showHours}
                    onChange={handleInputChange}
                    disabled={formData.onlineOnly}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <label className={`ml-2 block text-sm font-medium ${formData.onlineOnly ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
                    {t('adminForms.roasters.showHours', 'Show Hours')}
                  </label>
                </div>
              </div>
            </div>
            </div>
          )}
        </div>

        {/* Opening Hours Section - Only show if not online only AND showHours is enabled */}
        {!formData.onlineOnly && formData.showHours && (
            <div className="mt-8 p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 select-none">
                  {t('adminForms.roasters.hours.title', 'Opening Hours')}
                </h3>
                <button
                  type="button"
                  onClick={() => setHoursExpanded(!hoursExpanded)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  title={hoursExpanded ? 'Collapse section' : 'Expand section'}
                >
                  <svg 
                    className="w-4 h-4 transition-transform duration-200" 
                    style={{ transform: hoursExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              
              {hoursExpanded && (
                <div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {Object.entries(formData.hours as Record<string, any>).map(([day, dayHours]: [string, any]) => (
                  <div key={day} className="p-3 bg-white rounded-md space-y-2 border border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                      <div className="w-full sm:w-24">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                          {t(`adminForms.roasters.hours.${day}`, day.charAt(0).toUpperCase() + day.slice(1))}
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={dayHours?.closed || false}
                          onChange={(e) => handleHoursChange(day, 'closed', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {t('adminForms.roasters.hours.closed', 'Closed')}
                        </span>
                      </div>
                    </div>
                    {!dayHours?.closed && (
                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 sm:pl-28">
                        <div className="flex items-center space-x-2">
                          <label className="text-sm text-gray-600 w-12">
                            {t('adminForms.roasters.hours.open', 'Open')}:
                          </label>
                          <input
                            type="time"
                            value={dayHours?.open || '08:00'}
                            onChange={(e) => handleHoursChange(day, 'open', e.target.value)}
                            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <label className="text-sm text-gray-600 w-12">
                            {t('adminForms.roasters.hours.close', 'Close')}:
                          </label>
                          <input
                            type="time"
                            value={dayHours?.close || '18:00'}
                            onChange={(e) => handleHoursChange(day, 'close', e.target.value)}
                            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
                </div>
              )}
            </div>
          )}

          {/* Images Section - Only show when editing existing roaster and images are loaded */}
          {roaster?.id && imagesLoaded && (
            <div className="mt-8 p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 select-none">
                  {t('adminForms.roasters.uploadedImages', 'Uploaded Images')}
                </h3>
                <button
                  type="button"
                  onClick={() => setImagesExpanded(!imagesExpanded)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  title={imagesExpanded ? 'Collapse section' : 'Expand section'}
                >
                  <svg 
                    className="w-4 h-4 transition-transform duration-200" 
                    style={{ transform: imagesExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              
              {imagesExpanded && (
                <div>
                  <SimpleImageUpload
                    roasterId={roaster?.id ?? ""}
                    existingImages={images}
                    onImagesUpdated={(updatedImages) => setImages(updatedImages)}
                    canEdit={true}
                  />
                </div>
              )}
            </div>
          )}

          {/* URL Images Section - Show when editing existing roaster with URL images */}
          {roaster?.id && (
            <div className="mt-8 p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 select-none">
                  {t('adminForms.roasters.urlImages', 'URL Images')} ({(formData.images || []).length})
                </h3>
                <button
                  type="button"
                  onClick={() => setUrlImagesExpanded(!urlImagesExpanded)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  title={urlImagesExpanded ? 'Collapse section' : 'Expand section'}
                >
                  <svg 
                    className="w-4 h-4 transition-transform duration-200" 
                    style={{ transform: urlImagesExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              
              {urlImagesExpanded && (
                <>
              
              {/* Existing URL Images */}
              {formData.images && formData.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                  {formData.images.map((imageUrl, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border">
                        <img
                          src={convertToImageUrl(imageUrl)}
                          alt={`${formData.name} - Image ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {

                            // Try alternative format for Unsplash
                            if (imageUrl.includes('unsplash.com') && !e.currentTarget.src.includes('/images/default-cafe.svg')) {
                              const photoId = imageUrl.match(/\/photos\/([^/?#]+)/)?.[1];
                              if (photoId) {
                                e.currentTarget.src = `https://images.unsplash.com/${photoId}?w=800&h=600&fit=crop&auto=format&q=80`;
                                return;
                              }
                            }
                            e.currentTarget.src = '/images/default-cafe.svg';
                          }}
                          onLoad={() => {

                          }}
                        />
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <input
                          type="text"
                          value={imageUrl}
                          onChange={(e) => {
                            const newImages = [...(formData.images || [])];
                            newImages[index] = e.target.value;
                            setFormData({ ...formData, images: newImages });
                          }}
                          className="text-xs text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 border dark:border-gray-600 rounded px-2 py-1 w-full mr-2"
                          placeholder="Image URL"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newImages = (formData.images || []).filter((_, i) => i !== index);
                            setFormData({ ...formData, images: newImages });
                          }}
                          className="text-red-500 hover:text-red-700 text-sm font-bold px-2 py-1"
                          title="Remove image"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New URL Image */}
              <div className="mb-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder={t('adminForms.roasters.addImageUrl', 'Add image URL...')}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.target as HTMLInputElement;
                        const newUrl = input.value.trim();
                        if (newUrl && newUrl.startsWith('http')) {
                          const convertedUrl = convertToImageUrl(newUrl);
                          const newImages = [...(formData.images || []), convertedUrl];
                          setFormData({ ...formData, images: newImages });
                          input.value = '';
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      const newUrl = input.value.trim();
                      if (newUrl && newUrl.startsWith('http')) {
                        const convertedUrl = convertToImageUrl(newUrl);
                        const newImages = [...(formData.images || []), convertedUrl];
                        setFormData({ ...formData, images: newImages });
                        input.value = '';
                      }
                    }}
                    className="min-w-[110px] px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap ml-auto"
                  >
                    {t('common.add', 'Add')}
                  </button>
                </div>
              </div>

              <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                <p className="font-medium">ℹ️ {t('adminForms.roasters.aboutUrlImages', 'About URL Images:')}</p>
                <p>{t('adminForms.roasters.urlImagesFallback', 'Image URLs serve as fallback images when uploaded images are not accessible.')}</p>
              </div>
                </>
              )}
            </div>
          )}

          {/* Form Actions */}
          <div className="mt-8 flex flex-row items-center w-full flex-wrap">
            {/* Left: Delete button (edit only) */}
            {roaster?.id && (
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm('Are you sure you want to delete this roaster? This action cannot be undone.')) {
                    try {
                      const token = localStorage.getItem('token');
                      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
                      const response = await fetch(`${apiUrl}/api/roasters/${roaster.id}`, {
                        method: 'DELETE',
                        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                      });
                      if (response.ok) {
                        alert('Roaster deleted successfully.');
                        onSuccess();
                      } else {
                        const errorData = await response.json();
                        alert(errorData.error || 'Failed to delete roaster.');
                      }
                    } catch (err) {
                      alert('Failed to delete roaster.');
                    }
                  }
                }}
                className="min-w-[110px] px-5 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {t('adminForms.roasters.delete', 'Delete')}
              </button>
            )}
            {/* Right: Cancel and Save buttons (always right aligned) */}
              <div className={roaster?.id ? "flex flex-row gap-3 ml-auto" : "flex flex-row gap-3 justify-end w-full"}>
              <button
                type="button"
                onClick={onCancel}
                className="min-w-[110px] px-5 py-2 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                {t('adminForms.roasters.cancel', 'Cancel')}
              </button>

              <button
                type="button"
                onClick={() => handleSubmit(undefined, `/admin/roasters/${roaster?.id}/post`)}
                disabled={!formData.verified}
                className="min-w-[110px] px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('adminForms.roasters.saveAndPost', 'Save and Post')}
              </button>

              <button
                type="submit"
                disabled={loading}
                className="min-w-[110px] px-5 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading 
                  ? t('adminForms.roasters.saving', 'Saving...') 
                  : t('adminForms.roasters.save', 'Save')
                }
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminRoastersPage;