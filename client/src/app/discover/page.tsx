'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { SearchSection } from '@/components/SearchSection'
import { RoasterCard } from '@/components/RoasterCard'
import { apiClient } from '@/lib/api'
import { Roaster } from '@/types'
import { Coffee } from '@mui/icons-material'

export default function DiscoverPage() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [roasters, setRoasters] = useState<Roaster[]>([])
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)

  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const limit = 20
  const [filters, setFilters] = useState({
    search: '',
    location: '',
    distance: 25 // Default, will be overridden by user settings
  })

  // Load user's search radius preference from settings
  useEffect(() => {
    const loadUserSearchRadius = async () => {
      if (user) {
        try {
          const data = await apiClient.getUserSettings() as any
          const userRadius = data?.settings?.preferences?.searchRadius
          if (userRadius && typeof userRadius === 'number') {
            setFilters(prev => ({ ...prev, distance: userRadius }))
          }
        } catch (error) {
          console.error('Error loading user search radius:', error)
          // Continue with default radius
        }
      }
    }
    loadUserSearchRadius()
  }, [user])

  // Initialize filters from URL parameters
  useEffect(() => {
    if (!searchParams) return;
    const urlSearch = searchParams.get('search') || '';
    const urlLocation = searchParams.get('location') || '';
    const urlSpecialty = searchParams.get('specialty') || '';
    
    // If specialty is provided, put it in the search field instead of separate filter
    const searchValue = urlSpecialty || urlSearch;
    
    setFilters(prev => ({
      ...prev,
      search: searchValue,
      location: urlLocation
    }));
  }, [searchParams]);

  const fetchRoasters = useCallback(async (pageToLoad = 1, append = false) => {
    setLoading(true)
    try {
      const searchParams = new URLSearchParams()
      if (filters.search) searchParams.append('q', filters.search)
      if (filters.location) searchParams.append('location', filters.location)
      searchParams.append('radius', filters.distance.toString())
      
      // Only add coordinates if location is explicitly set (user clicked "use my location")
      // This prevents automatic filtering by radius on initial page load
      if (filters.location && userLocation) {
        searchParams.append('latitude', userLocation.lat.toString())
        searchParams.append('longitude', userLocation.lng.toString())
      }
      
      searchParams.append('page', String(pageToLoad))
      searchParams.append('limit', String(limit))

      const searchParamsObj: Record<string, string> = {}
      searchParams.forEach((value, key) => {
        searchParamsObj[key] = value;
      });

      const data = await apiClient.searchRoasters(searchParamsObj) as any

      const roastersReturned = (data.roasters || []).map((roaster: Roaster) => {
        return {
          ...roaster,
          specialties: roaster.specialties && roaster.specialties.length > 0
            ? [...roaster.specialties].sort((a, b) => {
                const nameA = typeof a === 'string' ? a : (a.name || '')
                const nameB = typeof b === 'string' ? b : (b.name || '')
                return nameA.localeCompare(nameB)
              })
            : roaster.specialties
        }
      })

      if (append) {
        setRoasters(prev => [...prev, ...roastersReturned])
      } else {
        setRoasters(roastersReturned)
      }

      if (data.pagination) {
        setTotalPages(data.pagination.totalPages || 1)
      } else {
        setTotalPages(1)
      }

      // Trigger popular searches refetch after successful search
      if (filters.search && filters.search.trim().length > 0 && pageToLoad === 1) {
        window.dispatchEvent(new CustomEvent('searchCompleted', { detail: { query: filters.search } }))
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }, [filters.search, filters.location, filters.distance])

  // Debounced fetch when filters change
  useEffect(() => {
    const id = setTimeout(() => {
      setPage(1)
      fetchRoasters(1, false)
    }, 300)
    return () => clearTimeout(id)
  }, [filters.search, filters.location, filters.distance, fetchRoasters])

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!sentinelRef.current) return
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !loading && page < totalPages) {
          const next = page + 1
          setPage(next)
          fetchRoasters(next, true)
        }
      })
    }, { rootMargin: '200px' })

    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [sentinelRef.current, loading, page, totalPages, fetchRoasters])

  // Remove the debounced search effect since we're handling it in the main effect
  // useEffect(() => {
  //   const timeoutId = setTimeout(() => {
  //     searchRoasters()
  //   }, 500) // Debounce search by 500ms
    
  // }, [filters])

  return (
    <div className="min-h-screen bg-gradient-to-br from-lavender-50 via-white to-orchid-50 dark:bg-gray-950 dark:bg-none">
      <div className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-4">
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-primary-700 to-orchid-600 bg-clip-text text-transparent mb-6">
              <span className="block sm:hidden">{t('discover.titleMobile')}</span>
              <span className="hidden sm:block">{t('discover.title')}</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              <span className="block sm:hidden">{t('discover.subtitleMobile')}</span>
              <span className="hidden sm:block">{t('discover.subtitle')}</span>
            </p>
          </div>

          {/* Search Section */}
          <div className="mb-12 dark:bg-gray-900 dark:rounded-2xl dark:shadow-lg">
            <SearchSection 
              searchQuery={filters.search}
              location={filters.location}
              onSearchQueryChange={(value) => setFilters(prev => ({ 
                ...prev, 
                search: value
              }))}
              onLocationChange={(value) => setFilters(prev => ({ ...prev, location: value }))}
              onSearch={(searchQuery, location) => {
                setFilters(prev => ({ ...prev, search: searchQuery, location: location }))
                setPage(1)
                fetchRoasters(1, false)
              }}
            />
          </div>

          {/* Results */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              // Loading skeletons
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden animate-pulse border border-gray-200 dark:border-gray-700">
                  <div className="h-48 bg-gray-200 dark:bg-gray-700"></div>
                  <div className="p-6">
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-2/3 mb-4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                  </div>
                </div>
              ))
            ) : roasters.length > 0 ? (
              roasters.map((roaster) => (
                <RoasterCard
                  key={roaster.id}
                  roaster={roaster}
                  userLocation={userLocation}
                  onSpecialtyClick={(specialtyName) => {
                    setFilters(prev => ({
                      ...prev,
                      search: specialtyName
                    }))
                  }}
                  returnTo="/discover"
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="mb-4">
                  <Coffee sx={{ fontSize: 96, color: '#6b7280' }} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('roasters.noRoastersFound')}</h3>
                <p className="text-gray-600 dark:text-gray-400">{t('discover.tryAdjusting')}</p>
              </div>
            )}
          </div>
          {/* Sentinel for infinite scroll */}
          <div ref={sentinelRef as any} className="w-full h-1" />
        </div>
      </div>
    </div>

  )
}

