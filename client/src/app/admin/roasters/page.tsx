"use client";
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { SortArrow } from '@/components/SortArrow';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { apiClient } from '@/lib/api';
import { Roaster } from '@/types';
import CSVImportDialog from '@/components/CSVImportDialog';


const AdminRoastersPage: React.FC = () => {

  // All hooks and state declarations must come first
  const { t } = useTranslation();
  const { showRatings } = useFeatureFlags();
  const [roasters, setRoasters] = useState<Roaster[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [verifiedFilter, setVerifiedFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [featuredFilter, setFeaturedFilter] = useState<'all' | 'featured'>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);
  const [globalCounts, setGlobalCounts] = useState<{ all: number; verified: number; unverified: number; featured: number } | null>(null);
  const [topCountries, setTopCountries] = useState<Array<{ country: string; count: number }>>([]);
  const [topCities, setTopCities] = useState<Array<{ city: string; count: number }>>([]);
  const [countryFilter, setCountryFilter] = useState<string>('');
  const [cityFilter, setCityFilter] = useState<string>('');
  const [showAllCountries, setShowAllCountries] = useState<boolean>(false);
  const [showAllCities, setShowAllCities] = useState<boolean>(false);
  const [hasUserSetFilter, setHasUserSetFilter] = useState<boolean>(false);
  const [showCSVImport, setShowCSVImport] = useState<boolean>(false);

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
  }, [currentPage, limit, verifiedFilter, featuredFilter, searchQuery, sortConfig, countryFilter, cityFilter]);

  const fetchRoasters = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = { page: currentPage, limit };
      if (searchQuery && searchQuery.trim()) params.search = searchQuery.trim();
      if (featuredFilter === 'featured') params.featured = 'true';
      if (verifiedFilter === 'verified') params.verified = 'true';
      if (countryFilter) {
        params.country = countryFilter;
        params.topCitiesCountry = countryFilter; // Still needed for city list
      }
      if (cityFilter) params.city = cityFilter;
      if (verifiedFilter === 'unverified') params.verified = 'false';
      // Add sorting if configured
      if (sortConfig) {
        params.sortBy = sortConfig.key;
        params.sortOrder = sortConfig.direction;
      }

      const data = await apiClient.getRoasters(params) as any;
      const roastersData = data.roasters || [];
      
      setRoasters(roastersData);
      setTotalPages(data.pagination?.pages || 1);
      if (data.globalCounts) {
        setGlobalCounts(data.globalCounts);
      }
      if (data.topCountries) {
        setTopCountries(data.topCountries);
      }
      if (data.topCities) {
        setTopCities(data.topCities);
      }
    } catch (err: any) {
      console.error('Fetch roasters error:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (roaster: Roaster) => {
    if (!roaster?.id) return;
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

      setVerifyingId(roaster.id);

      const res = await fetch(`${apiUrl}/api/roasters/${roaster.id}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
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

  const changePage = (page: number) => {
    setCurrentPage(page);
  };

  // Sorting is now handled by the backend
  // Display roasters directly as returned from API (already sorted and paginated)
  const filteredRoasters = roasters;

  const content = (
    <div className="p-4 pt-20 sm:pt-28 px-4 sm:px-8 lg:px-32">
      <div className="mb-6 max-w-7xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">{t('adminSection.roasters', 'Roasters')}</h1>
        <div className="flex flex-wrap gap-2 justify-end self-end sm:self-auto">
          <Link
            href="/admin/instagram-import"
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 flex items-center"
          >
            <span className="sm:hidden">Instagram</span>
            <span className="hidden sm:inline">{t('admin.roasters.importInstagram', 'Import Instagram')}</span>
          </Link>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center"
            onClick={() => setShowCSVImport(true)}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="sm:hidden">CSV</span>
            <span className="hidden sm:inline">{t('admin.roasters.importCSV', 'Import CSV')}</span>
          </button>
          <Link
            href="/admin/roasters/new-admin"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            {t('common.add', 'Add')}
          </Link>
        </div>
      </div>
      
      {/* Scorecard Grid */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr_1fr] gap-2">
          {/* Count Cards Column - 2x2 Grid */}
          <div className="w-full lg:w-auto">
            <div className="grid grid-cols-4 sm:grid-cols-2 lg:grid-cols-2 gap-2 h-full lg:min-w-[240px]">
              {/* Total Card */}
              <button
                onClick={() => {
                  setVerifiedFilter('all');
                  setFeaturedFilter('all');
                  setCountryFilter('');
                  setCityFilter('');
                  setCurrentPage(1);
                  setHasUserSetFilter(true);
                }}
                className={`p-2 rounded-lg border-2 transition-all ${
                  verifiedFilter === 'all' && featuredFilter === 'all' && !countryFilter && !cityFilter
                    ? 'bg-blue-100 border-blue-500 dark:bg-blue-500/20 dark:border-blue-400'
                    : 'bg-white border-gray-300 hover:border-gray-400 dark:bg-gray-800/30 dark:border-gray-700 dark:hover:border-gray-600'
                }`}
              >
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-200 mb-1">{t('admin.roasters.all', 'All')}</div>
                <div className="text-xl sm:text-2xl font-bold text-blue-500 dark:text-blue-300 text-center">{globalCounts?.all || 0}</div>
              </button>

              {/* Verified Card */}
              <button
                onClick={() => {
                  setVerifiedFilter('verified');
                  setFeaturedFilter('all');
                  setCountryFilter('');
                  setCityFilter('');
                  setCurrentPage(1);
                  setHasUserSetFilter(true);
                }}
                className={`p-2 rounded-lg border-2 transition-all ${
                  verifiedFilter === 'verified'
                    ? 'bg-green-100 border-green-500 dark:bg-green-500/20 dark:border-green-400'
                    : 'bg-white border-gray-300 hover:border-gray-400 dark:bg-gray-800/30 dark:border-gray-700 dark:hover:border-gray-600'
                }`}
              >
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-200 mb-1">{t('adminForms.roasters.verified', 'Verified')}</div>
                <div className="text-xl sm:text-2xl font-bold text-green-500 dark:text-green-300 text-center">{globalCounts?.verified || 0}</div>
              </button>

              {/* Featured Card */}
              <button
                onClick={() => {
                  setFeaturedFilter('featured');
                  setVerifiedFilter('all');
                  setCountryFilter('');
                  setCityFilter('');
                  setCurrentPage(1);
                  setHasUserSetFilter(true);
                }}
                className={`p-2 rounded-lg border-2 transition-all ${
                  featuredFilter === 'featured'
                    ? 'bg-yellow-100 border-yellow-500 dark:bg-yellow-500/20 dark:border-yellow-400'
                    : 'bg-white border-gray-300 hover:border-gray-400 dark:bg-gray-800/30 dark:border-gray-700 dark:hover:border-gray-600'
                }`}
              >
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-200 mb-1">{t('adminForms.roasters.featured', 'Featured')}</div>
                <div className="text-xl sm:text-2xl font-bold text-yellow-500 dark:text-yellow-300 text-center">{globalCounts?.featured || 0}</div>
              </button>

              {/* Unverified Card */}
              <button
                onClick={() => {
                  setVerifiedFilter('unverified');
                  setFeaturedFilter('all');
                  setCountryFilter('');
                  setCityFilter('');
                  setCurrentPage(1);
                  setHasUserSetFilter(true);
                }}
                className={`p-2 rounded-lg border-2 transition-all ${
                  verifiedFilter === 'unverified'
                    ? 'bg-orange-100 border-orange-500 dark:bg-orange-500/20 dark:border-orange-400'
                    : 'bg-white border-gray-300 hover:border-gray-400 dark:bg-gray-800/30 dark:border-gray-700 dark:hover:border-gray-600'
                }`}
              >
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-200 mb-1">{t('admin.roasters.unverified', 'Unverified')}</div>
                <div className="text-xl sm:text-2xl font-bold text-orange-500 dark:text-orange-300 text-center">{globalCounts?.unverified || 0}</div>
              </button>
            </div>
          </div>

          {/* Top Countries */}
          <div className="hidden lg:block p-3 rounded-lg bg-white border-2 border-gray-300 dark:bg-gray-800/30 dark:border-gray-700">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-200">{t('admin.roasters.topCountries', 'Top Countries')}</h3>
              <div className="flex gap-2">
                {countryFilter && (
                  <button
                    onClick={() => {
                      setCountryFilter('');
                      setCurrentPage(1);
                      setHasUserSetFilter(true);
                    }}
                    className="text-sm text-blue-400 hover:text-blue-300 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {t('common.clear', 'Clear')}
                  </button>
                )}
                {/* Mobile collapse button */}
                <button
                  onClick={() => setShowAllCountries(!showAllCountries)}
                  className="lg:hidden text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  {showAllCountries ? '▲' : '▼'}
                </button>
              </div>
            </div>
            <div className={`${!showAllCountries ? 'hidden lg:block' : ''}`}>
              {topCountries.slice(0, 5).map((item) => (
                <button
                  key={item.country}
                  onClick={() => {
                    setCountryFilter(item.country);
                    setCityFilter('');
                    setCurrentPage(1);
                    setHasUserSetFilter(true);
                  }}
                  className={`w-full flex justify-between items-center px-3 py-1 rounded text-sm transition-colors ${
                    countryFilter === item.country
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/30 dark:text-blue-300'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700/30'
                  }`}
                >
                  <span>{item.country || '(blank)'}</span>
                  <span className="font-semibold">{item.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Top Cities */}
          <div className="hidden lg:block p-3 rounded-lg bg-white border-2 border-gray-300 dark:bg-gray-800/30 dark:border-gray-700">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-200">{t('admin.roasters.topCities', 'Top Cities')}</h3>
              <div className="flex gap-2">
                {cityFilter && (
                  <button
                    onClick={() => {
                      setCityFilter('');
                      setCurrentPage(1);
                      setHasUserSetFilter(true);
                    }}
                    className="text-sm text-blue-400 hover:text-blue-300 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {t('common.clear', 'Clear')}
                  </button>
                )}
                {/* Mobile collapse button */}
                <button
                  onClick={() => setShowAllCities(!showAllCities)}
                  className="lg:hidden text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  {showAllCities ? '▲' : '▼'}
                </button>
              </div>
            </div>
            <div className={`${!showAllCities ? 'hidden lg:block' : ''}`}>
              {topCities.slice(0, 5).map((item) => (
                <button
                  key={item.city}
                  onClick={() => {
                    setCityFilter(item.city);
                    setCountryFilter('');
                    setCurrentPage(1);
                    setHasUserSetFilter(true);
                  }}
                  className={`w-full flex justify-between items-center px-3 py-1 rounded text-sm transition-colors ${
                    cityFilter === item.city
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/30 dark:text-blue-300'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700/30'
                  }`}
                >
                  <span>{item.city || '(blank)'}</span>
                  <span className="font-semibold">{item.count}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Search bar */}
      <div className="mb-6 max-w-7xl mx-auto">
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
        {/* Search Results Count */}
        {searchQuery && (
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {t('admin.roasters.searchResults', 'Found {{count}} roaster(s)', { count: filteredRoasters.length })}
          </div>
        )}
      </div>
      
      <div className="max-w-7xl mx-auto">
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
            <div className="md:hidden space-y-3">
              {filteredRoasters.map((roaster) => (
                <Link
                  key={roaster.id}
                  href={`/admin/roasters/edit/${roaster.id}`}
                  className="block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-sm dark:shadow-gray-900/50"
                >
                  {/* Roaster Header */}
                  <div className="mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-primary-600 dark:text-primary-400 text-left">
                        {roaster.name}
                      </span>
                    </div>
                    {/* Status Badges */}
                    <div className="flex flex-wrap gap-2 mt-1">
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
                  <div className="mb-2">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <span className="mr-2">📍</span>
                      <span>
                        {[roaster.city, roaster.country].filter(Boolean).join(', ') || '-'}
                      </span>
                    </div>
                  </div>
                  {/* Completeness Score */}
                  <div className="mb-2">
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
                    <div className="mb-2">
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <span className="mr-2">⭐</span>
                        <span>{roaster.rating}</span>
                      </div>
                    </div>
                  )}
                </Link>
              ))}
            </div>
            {/* Desktop Table View */}
            <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-x-auto border border-gray-200 dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider cursor-pointer select-none" onClick={() => setSortConfig(sortConfig?.key === 'name' ? { key: 'name', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' } : { key: 'name', direction: 'asc' })}>
                      {t('adminForms.roasters.name', 'Name')}
                      {sortConfig?.key === 'name' && <SortArrow direction={sortConfig.direction} />}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider cursor-pointer select-none" onClick={() => setSortConfig(sortConfig?.key === 'city' ? { key: 'city', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' } : { key: 'city', direction: 'asc' })}>
                      {t('adminForms.roasters.city', 'City')}
                      {sortConfig?.key === 'city' && <SortArrow direction={sortConfig.direction} />}
                    </th>
                    <th className="px-6 py-3 min-w-[140px] whitespace-nowrap text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider cursor-pointer select-none" onClick={() => setSortConfig(sortConfig?.key === 'country' ? { key: 'country', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' } : { key: 'country', direction: 'asc' })}>
                      {t('adminForms.roasters.country', 'Country')}
                      {sortConfig?.key === 'country' && <SortArrow direction={sortConfig.direction} />}
                    </th>
                    <th className="px-6 py-3 min-w-[160px] whitespace-nowrap text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider cursor-pointer select-none" onClick={() => setSortConfig(sortConfig?.key === 'completeness' ? { key: 'completeness', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' } : { key: 'completeness', direction: 'asc' })}>
                      {t('adminForms.roasters.completeness', 'Completeness')}
                      {sortConfig?.key === 'completeness' && <SortArrow direction={sortConfig.direction} />}
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider cursor-pointer select-none" onClick={() => setSortConfig(sortConfig?.key === 'verified' ? { key: 'verified', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' } : { key: 'verified', direction: 'asc' })}>
                      {t('adminForms.roasters.verified', 'Verified')}
                      {sortConfig?.key === 'verified' && <SortArrow direction={sortConfig.direction} />}
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider cursor-pointer select-none" onClick={() => setSortConfig(sortConfig?.key === 'featured' ? { key: 'featured', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' } : { key: 'featured', direction: 'asc' })}>
                      {t('adminForms.roasters.featured', 'Featured')}
                      {sortConfig?.key === 'featured' && <SortArrow direction={sortConfig.direction} />}
                    </th>
                    {showRatings && <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider cursor-pointer select-none" onClick={() => setSortConfig(sortConfig?.key === 'rating' ? { key: 'rating', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' } : { key: 'rating', direction: 'asc' })}>
                      {t('adminForms.roasters.rating', 'Rating')}
                      {sortConfig?.key === 'rating' && <SortArrow direction={sortConfig.direction} />}
                    </th>}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredRoasters.map((roaster) => (
                    <tr key={roaster.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 font-medium">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/admin/roasters/edit/${roaster.id}`}
                              className="text-primary-600 dark:text-primary-400 hover:underline text-left"
                            >
                              {roaster.name}
                            </Link>
                          </div>
                          {/* Verify button removed from desktop Name column per request */}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-900 dark:text-gray-100">{roaster.city || '-'}</td>
                      <td className="px-6 py-4 text-gray-900 dark:text-gray-100">{roaster.country || '-'}</td>
                      <td className="px-6 py-4 text-gray-900 dark:text-gray-100 w-36">
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
                      <td className="px-6 py-4 text-center text-gray-900 dark:text-gray-100">{roaster.verified ? '✔️' : ''}</td>
                      <td className="px-6 py-4 text-center text-gray-900 dark:text-gray-100">{roaster.featured ? '⭐' : ''}</td>
                      {showRatings && <td className="px-6 py-4 text-gray-900 dark:text-gray-100">{roaster.rating || '-'}</td>}
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

      {/* CSV Import Dialog */}
      <CSVImportDialog
        isOpen={showCSVImport}
        onClose={() => setShowCSVImport(false)}
        onSuccess={() => {
          setShowCSVImport(false);
          fetchRoasters();
        }}
      />
    </div>
  );

  return content;
};

export default AdminRoastersPage;