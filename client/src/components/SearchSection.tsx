'use client'

import { useState, useEffect } from 'react'
import axios from 'axios';
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { apiClient } from '@/lib/api'
import { Search, MyLocation } from '@mui/icons-material'
import { useAuth } from '@/contexts/AuthContext'

interface SearchSectionProps {
  onSearch?: (searchQuery: string, location: string) => void
  searchQuery?: string
  location?: string
  onSearchQueryChange?: (value: string, specialty?: string) => void
  onLocationChange?: (value: string) => void
}

export function SearchSection({ 
  onSearch, 
  searchQuery = '', 
  location = '',
  onSearchQueryChange,
  onLocationChange 
}: SearchSectionProps) {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery)
  const [localLocation, setLocalLocation] = useState(location)
  const [popularSearches, setPopularSearches] = useState<string[]>([])
  const [detectingLocation, setDetectingLocation] = useState(false)
  
  // Reverse geocode coordinates to get city name
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      // Using OpenStreetMap Nominatim API for reverse geocoding (free, no API key needed)
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'TheBeans Coffee App' // Required by Nominatim
          }
        }
      )
      
      if (response.data && response.data.address) {
        const address = response.data.address
        // Try to get city from various fields (different regions use different names)
        const city = address.city || 
                    address.town || 
                    address.village || 
                    address.municipality ||
                    address.county
        
        if (city) {
          return city
        }
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error)
    }
    return null
  }

  // Detect user's location and fill in the closest city
  const detectLocation = () => {
    if (!navigator.geolocation) {
      alert(t('search.geolocationNotSupported') || 'Geolocation is not supported by your browser')
      return
    }

    setDetectingLocation(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        const cityName = await reverseGeocode(latitude, longitude)
        
        if (cityName) {
          handleLocationChange(cityName)
          if (onSearch) {
            onSearch(localSearchQuery, cityName)
            setTimeout(fetchPopularSearches, 200)
          }
        } else {
          alert(t('search.couldNotDetectCity') || 'Could not detect your city. Please enter it manually.')
        }
        setDetectingLocation(false)
      },
      (error) => {
        console.error('Geolocation error:', error)
        let errorMessage = t('search.locationDetectionFailed') || 'Failed to detect your location.'
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = t('search.locationPermissionDenied') || 'Location permission denied. Please enable location access.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = t('search.locationUnavailable') || 'Location information unavailable.'
            break
          case error.TIMEOUT:
            errorMessage = t('search.locationTimeout') || 'Location detection timed out.'
            break
        }
        
        alert(errorMessage)
        setDetectingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  // Fetch popular searches from backend
  const fetchPopularSearches = async () => {
    try {
      const data = await apiClient.getPopularSearches(5) as any;
      
      if (data && Array.isArray(data.popular)) {
        const queries = data.popular.map((item: any) => item.query);
        setPopularSearches(queries);
      } else {
        setPopularSearches([]);
      }
    } catch (error) {
      console.error('Error fetching popular searches:', error);
      setPopularSearches([]);
    }
  };

  useEffect(() => {
    fetchPopularSearches();

    // Listen for search completion events from discover page
    const handleSearchCompleted = () => {
      setTimeout(fetchPopularSearches, 500);
    };

    window.addEventListener('searchCompleted', handleSearchCompleted);
    
    return () => {
      window.removeEventListener('searchCompleted', handleSearchCompleted);
    };
  }, []);

  // Sync local state with props when they change
  useEffect(() => {
    setLocalSearchQuery(searchQuery)
  }, [searchQuery])

  useEffect(() => {
    setLocalLocation(location)
  }, [location])

  const handleSearch = () => {
    if (onSearch) {
      onSearch(localSearchQuery, localLocation);
      // Refetch popular searches after a search
      setTimeout(fetchPopularSearches, 200);
    }
  }

  const handleSearchQueryChange = (value: string) => {
    setLocalSearchQuery(value)
    onSearchQueryChange?.(value)
  }

  const handleLocationChange = (value: string) => {
    setLocalLocation(value)
    onLocationChange?.(value)
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handlePopularSearchClick = (query: string) => {
    setLocalSearchQuery(query)
    onSearchQueryChange?.(query)
    if (onSearch) {
      onSearch(query, localLocation)
      // Refetch popular searches after a search via pill
      setTimeout(fetchPopularSearches, 200);
    }
  }

  return (
  <section className={`px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900 dark:bg-none dark:text-gray-100 ${user ? 'pt-8 pb-8' : 'py-8'}`}>
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12 opacity-100"
        ></motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className={`bg-white dark:bg-gray-900 rounded-2xl shadow-lg dark:shadow-xl border border-gray-200 dark:border-gray-700 opacity-100 ${user ? 'pt-4 px-4 sm:px-8 pb-8' : 'p-4 sm:p-8'}`}
        >
          {/* Search input row */}
          {/* Responsive row: all fields/buttons in one row on md+ screens, stacked on mobile */}
          <div className="flex flex-col md:flex-row gap-2 mt-4 items-stretch">
            {/* Search for roasters */}
            <div className="md:flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-2 md:mb-0">
                {t('search.searchLabel')}
              </label>
              <input
                type="text"
                id="search"
                value={localSearchQuery.startsWith('specialties.') ? t(localSearchQuery) : (localSearchQuery.startsWith('search.specialties.') ? t(localSearchQuery) : localSearchQuery)}
                onChange={(e) => handleSearchQueryChange(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t('search.searchPlaceholder')}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>
            {/* Location field */}
            <div className="md:flex-1">
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-2 md:mb-0">
                {t('search.locationLabel')}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="location"
                  value={localLocation}
                  onChange={(e) => handleLocationChange(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={t('search.locationPlaceholder')}
                  className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
                <button
                  onClick={detectLocation}
                  disabled={detectingLocation}
                  className="px-4 py-3 bg-gradient-to-r from-lavender-500 to-orchid-500 text-white rounded-lg hover:shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  title={t('search.detectLocationTooltip') || 'Use my location'}
                >
                  {detectingLocation ? (
                    <span className="inline-block animate-spin">⟳</span>
                  ) : (
                    <MyLocation style={{ fontSize: 24 }} />
                  )}
                </button>
              </div>
            </div>
            {/* Search button */}
            <div className="flex items-end md:items-end">
              <button
                onClick={handleSearch}
                className="min-w-[110px] max-w-[140px] bg-gradient-to-r from-primary-500 to-orchid-500 text-white px-3 py-3 rounded-lg font-semibold hover:shadow-lg transition-all transform hover:scale-105 whitespace-nowrap flex items-center justify-center gap-2"
              >
                <Search sx={{ fontSize: 20 }} />
                {t('search.searchButton')}
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">{t('search.popularSearches')}:</span>
            {popularSearches.length === 0 ? (
              <span className="text-sm text-gray-400 ml-2">{t('search.noPopularSearches') || 'No data yet'}</span>
            ) : (
              popularSearches.map((query) => (
                <button
                  key={query}
                  onClick={() => handlePopularSearchClick(query)}
                  className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full text-sm hover:bg-primary-200 dark:hover:bg-primary-900/50 hover:text-primary-800 dark:hover:text-primary-300 transition-colors cursor-pointer break-words max-w-xs truncate"
                  title={query}
                >
                  {query}
                </button>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
