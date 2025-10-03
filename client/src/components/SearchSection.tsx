'use client'

import { useState, useEffect } from 'react'
import axios from 'axios';
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { apiClient } from '@/lib/api'
import { Search } from '@mui/icons-material'
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
    <section className={`px-4 sm:px-6 lg:px-8 bg-white ${user ? 'pt-8 pb-8' : 'py-8'}`}>
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
          className={`bg-gradient-to-r from-lavender-50 to-orchid-50 rounded-2xl shadow-lg opacity-100 ${user ? 'pt-4 px-8 pb-8' : 'p-8'}`}
        >
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                {t('search.searchLabel')}
              </label>
              <input
                type="text"
                id="search"
                value={localSearchQuery.startsWith('specialties.') ? t(localSearchQuery) : (localSearchQuery.startsWith('search.specialties.') ? t(localSearchQuery) : localSearchQuery)}
                onChange={(e) => handleSearchQueryChange(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t('search.searchPlaceholder')}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                {t('search.locationLabel')}
              </label>
              <input
                type="text"
                id="location"
                value={localLocation}
                onChange={(e) => handleLocationChange(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t('search.locationPlaceholder')}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-gray-900"
              />
            </div>
            
            <div className="md:col-span-1 flex items-end">
              <button
                onClick={handleSearch}
                className="w-full bg-gradient-to-r from-primary-500 to-orchid-500 text-white px-4 py-3 rounded-lg font-semibold hover:shadow-lg transition-all transform hover:scale-105 whitespace-nowrap flex items-center justify-center gap-2"
              >
                <Search sx={{ fontSize: 20 }} />
                {t('search.searchButton')}
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <span className="text-sm text-gray-600">{t('search.popularSearches')}:</span>
            {popularSearches.length === 0 ? (
              <span className="text-sm text-gray-400 ml-2">{t('search.noPopularSearches') || 'No data yet'}</span>
            ) : (
              popularSearches.map((query) => (
                <button
                  key={query}
                  onClick={() => handlePopularSearchClick(query)}
                  className="px-3 py-1 bg-white text-primary-600 rounded-full text-sm border border-primary-200 hover:bg-primary-50 transition-colors break-words max-w-xs truncate"
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
