'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

interface SearchSectionProps {
  onSearch?: (searchQuery: string, location: string) => void
  searchQuery?: string
  location?: string
  onSearchQueryChange?: (value: string) => void
  onLocationChange?: (value: string) => void
}

export function SearchSection({ 
  onSearch, 
  searchQuery = '', 
  location = '',
  onSearchQueryChange,
  onLocationChange 
}: SearchSectionProps) {
  const { t } = useTranslation()
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery)
  const [localLocation, setLocalLocation] = useState(location)

  // Sync local state with props when they change
  useEffect(() => {
    setLocalSearchQuery(searchQuery)
  }, [searchQuery])

  useEffect(() => {
    setLocalLocation(location)
  }, [location])

  const handleSearch = () => {
    if (onSearch) {
      onSearch(localSearchQuery, localLocation)
    } else {
      console.log('Searching for:', localSearchQuery, 'in', localLocation)
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleSpecialtyClick = (tag: string) => {
    setLocalSearchQuery(tag)
    onSearchQueryChange?.(tag)
    // Add a small delay to prevent rapid-fire requests
    setTimeout(() => {
      if (onSearch) {
        onSearch(tag, localLocation)
      }
    }, 100)
  }

  return (
    <section className="py-8 px-4 sm:px-6 lg:px-8 bg-white">
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
          className="bg-gradient-to-r from-lavender-50 to-orchid-50 rounded-2xl p-8 shadow-lg opacity-100"
        >
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                {t('search.searchLabel')}
              </label>
              <input
                type="text"
                id="search"
                value={localSearchQuery}
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
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>
            
            <div className="md:col-span-1 flex items-end">
              <button
                onClick={handleSearch}
                className="w-full bg-gradient-to-r from-primary-500 to-orchid-500 text-white px-4 py-3 rounded-lg font-semibold hover:shadow-lg transition-all transform hover:scale-105 whitespace-nowrap"
              >
                🔍 {t('search.searchButton')}
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <span className="text-sm text-gray-600">{t('search.popularSearches')}:</span>
            {['Espresso', 'Single Origin', 'Cold Brew', 'Fair Trade', 'Organic'].map((tag) => (
              <button
                key={tag}
                onClick={() => handleSpecialtyClick(tag)}
                className="px-3 py-1 bg-white text-primary-600 rounded-full text-sm border border-primary-200 hover:bg-primary-50 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
