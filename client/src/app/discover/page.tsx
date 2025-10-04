'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { SearchSection } from '@/components/SearchSection'
import RoasterImage from '@/components/RoasterImage'
import { apiClient } from '@/lib/api'
import { 
  Coffee, 
  LocationOn, 
  Favorite, 
  FavoriteBorder,
  Star
} from '@mui/icons-material'

interface Roaster {
  id: string
  name: string
  description: string
  address: string
  city: string
  state: string
  specialties: string[]
  rating: number
  distance: number
  imageUrl: string
  latitude?: number
  longitude?: number
  verified: boolean
}

export default function DiscoverPage() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [roasters, setRoasters] = useState<Roaster[]>([])
  const [favorites, setFavorites] = useState<string[]>([])
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)
  // Get user location for distance calculation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setUserLocation(null)
      )
    }
  }, [])

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = JSON.parse(localStorage.getItem('favoriteRoasters') || '[]')
    setFavorites(savedFavorites)
  }, [])

  const toggleFavorite = (roasterId: string) => {
    let updatedFavorites
    if (favorites.includes(roasterId)) {
      updatedFavorites = favorites.filter(id => id !== roasterId)
    } else {
      updatedFavorites = [...favorites, roasterId]
    }
    setFavorites(updatedFavorites)
    localStorage.setItem('favoriteRoasters', JSON.stringify(updatedFavorites))
  }

  // Helper function to translate specialty names
  const translateSpecialty = (specialty: string): string => {
    // Use i18n.language to force re-render on language change
    void i18n.language;
    if (!specialty) return '';
    let key = specialty;
    if (!key.startsWith('specialties.')) {
      key = key.replace(/\s+(.)/g, (_, c) => c.toUpperCase());
      key = key.charAt(0).toLowerCase() + key.slice(1);
      key = key.replace(/[^a-zA-Z0-9]/g, '');
      key = `specialties.${key}`;
    }
    const translated = t(key);
    if (translated === key) {
      return specialty.startsWith('specialties.') ? specialty.replace('specialties.', '') : specialty;
    }
    return translated;
  }
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    search: '',
    location: '',
    distance: 25
  })

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

  const searchRoasters = useCallback(async () => {
    setLoading(true)
    try {
      const searchParams = new URLSearchParams()
      if (filters.search) searchParams.append('q', filters.search)
      if (filters.location) searchParams.append('location', filters.location)
      searchParams.append('distance', filters.distance.toString())

      const searchParamsObj: Record<string, string> = {}
      searchParams.forEach((value, key) => {
        searchParamsObj[key] = value;
      });

      const data = await apiClient.searchRoasters(searchParamsObj) as any
      setRoasters(data.roasters || [])
        
      // Trigger popular searches refetch after successful search
      if (filters.search && filters.search.trim().length > 0) {
        // Dispatch a custom event that SearchSection can listen to
        window.dispatchEvent(new CustomEvent('searchCompleted', { 
          detail: { query: filters.search } 
        }))
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }, [filters.search, filters.location, filters.distance])

  useEffect(() => {
    // Debounce the search to prevent rapid-fire API calls
    const timeoutId = setTimeout(() => {
      searchRoasters()
    }, 300) // Debounce search by 300ms
    
    return () => clearTimeout(timeoutId)
  }, [searchRoasters])

  // Remove the debounced search effect since we're handling it in the main effect
  // useEffect(() => {
  //   const timeoutId = setTimeout(() => {
  //     searchRoasters()
  //   }, 500) // Debounce search by 500ms
    
  // }, [filters])

  return (
    <div className="min-h-screen bg-gradient-to-br from-lavender-50 via-white to-orchid-50">
      <div className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-4">
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-primary-700 to-orchid-600 bg-clip-text text-transparent mb-6">
              <span className="block sm:hidden">{t('discover.titleMobile')}</span>
              <span className="hidden sm:block">{t('discover.title')}</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              <span className="block sm:hidden">{t('discover.subtitleMobile')}</span>
              <span className="hidden sm:block">{t('discover.subtitle')}</span>
            </p>
          </div>

          {/* Search Section */}
          <div className="mb-12">
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
                searchRoasters()
              }}
            />
          </div>

          {/* Results */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              // Loading skeletons
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-6">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))
            ) : roasters.length > 0 ? (
              roasters.map((roaster) => (
                <div key={roaster.id} className={`bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow ${
                  user?.role === 'admin' && !roaster.verified ? 'border-4 border-red-500' : ''
                }`}>
                  <RoasterImage
                    src={roaster.imageUrl || 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&h=600&fit=crop'}
                    alt={roaster.name}
                    width={800}
                    height={192}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{roaster.name}</h3>
                      <div className="flex items-center">
                        <Star sx={{ fontSize: 20, color: '#fbbf24' }} />
                        <span className="text-gray-600 ml-1">{roaster.rating}</span>
                      </div>
                    </div>
                    {(roaster.city || roaster.state) && (
                      <p className="text-gray-600 mb-2 flex items-center">
                        <LocationOn sx={{ fontSize: 16, marginRight: 0.5 }} />
                        {[roaster.city, roaster.state].filter(Boolean).join(', ')}
                      </p>
                    )}
                    <p className="text-gray-700 mb-4">{roaster.description}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {roaster.specialties.map((specialty) => (
                        <button
                          key={specialty}
                          onClick={() => {
                            setFilters(prev => ({
                              ...prev,
                              search: translateSpecialty(specialty)
                            }))
                          }}
                          className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm hover:bg-primary-200 hover:text-primary-800 transition-colors cursor-pointer"
                        >
                          {translateSpecialty(specialty)}
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-between items-center">
                      {(() => {
                        // Try to use backend-provided distance if present and valid
                        if (typeof roaster.distance === 'number' && isFinite(roaster.distance)) {
                          // Use user preference for unit if available
                          const settings = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('settings') || '{}') : {};
                          const unit = settings?.preferences?.distanceUnit || 'mi';
                          let dist = roaster.distance;
                          if (unit === 'km') dist = dist * 1.60934;
                          return (
                            <span className="text-sm text-gray-500 flex items-center">
                              <LocationOn sx={{ fontSize: 14, marginRight: 0.25 }} />
                              {dist.toFixed(1)} {unit === 'km' ? t('km').toLowerCase() : t('mi').toLowerCase()}
                            </span>
                          );
                        }
                        // If not, try to calculate from userLocation and roaster lat/lng
                        if (userLocation && roaster.latitude && roaster.longitude) {
                          const settings = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('settings') || '{}') : {};
                          const unit = settings?.preferences?.distanceUnit || 'mi';
                          const toRad = (v: number) => v * Math.PI / 180;
                          const R = unit === 'mi' ? 3958.8 : 6371;
                          const dLat = toRad(roaster.latitude - userLocation.lat);
                          const dLng = toRad(roaster.longitude - userLocation.lng);
                          const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(toRad(userLocation.lat)) * Math.cos(toRad(roaster.latitude)) * Math.sin(dLng/2) * Math.sin(dLng/2);
                          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                          const dist = R * c;
                          return (
                            <span className="text-sm text-gray-500 flex items-center">
                              <LocationOn sx={{ fontSize: 14, marginRight: 0.25 }} />
                              {dist.toFixed(1)} {unit === 'km' ? t('km').toLowerCase() : t('mi').toLowerCase()}
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    <div className="flex space-x-3 mt-4">
                      <Link
                        href={`/roasters/${roaster.id}`}
                        className="flex-1 bg-gradient-to-r from-primary-500 to-orchid-500 text-white px-4 py-2 rounded-lg text-center font-medium hover:shadow-lg transition-all transform hover:scale-105"
                      >
                        {t('discover.viewDetails')}
                      </Link>
                      {user?.role === 'admin' && (
                        <Link
                          href={`/admin/roasters?edit=${roaster.id}&returnTo=/discover`}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all transform hover:scale-105"
                        >
                          Edit
                        </Link>
                      )}
                      <button
                        onClick={() => toggleFavorite(roaster.id)}
                        className={`px-4 py-2 border rounded-lg transition-all transform hover:scale-105 ${
                          favorites.includes(roaster.id)
                            ? 'bg-red-100 border-red-300 text-red-600 hover:bg-red-200'
                            : 'border-primary-500 text-primary-600 hover:bg-primary-50'
                        }`}
                        aria-label={favorites.includes(roaster.id) ? t('roasterDetail.removeFromFavorites') : t('roasterDetail.addToFavorites')}
                      >
                        {favorites.includes(roaster.id) ? <Favorite sx={{ fontSize: 20 }} /> : <FavoriteBorder sx={{ fontSize: 20 }} />}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="mb-4">
                  <Coffee sx={{ fontSize: 96, color: '#6b7280' }} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('roasters.noRoastersFound')}</h3>
                <p className="text-gray-600">{t('discover.tryAdjusting')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

  )
}

