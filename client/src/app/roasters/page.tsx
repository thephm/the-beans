'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'

interface Roaster {
  id: string
  name: string
  description: string
  address: string
  city: string
  state: string
  phone: string
  website: string
  specialties: string[]
  rating: number
  reviewCount: number
  imageUrl: string
  priceRange: string
}

export default function RoastersPage() {
  const { t } = useTranslation()
  const [roasters, setRoasters] = useState<Roaster[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('name')
  const [favorites, setFavorites] = useState<string[]>([])

  // Helper function to translate specialty names
  const translateSpecialty = (specialty: string): string => {
    const specialtyMap: { [key: string]: string } = {
      'Cold Brew': 'search.specialties.coldBrew',
      'Single Origin': 'search.specialties.singleOrigin',
      'Espresso': 'search.specialties.espresso',
      'Decaf': 'search.specialties.decaf',
      'Organic': 'search.specialties.organic',
      'Artisanal': 'search.specialties.artisanal',
      'Fair Trade': 'search.specialties.fairTrade',
      'Dark Roast': 'search.specialties.darkRoast',
      'Light Roast': 'search.specialties.lightRoast',
      'Medium Roast': 'search.specialties.mediumRoast'
    }
    
    return specialtyMap[specialty] ? t(specialtyMap[specialty]) : specialty
  }

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = JSON.parse(localStorage.getItem('favoriteRoasters') || '[]')
    setFavorites(savedFavorites)
  }, [])

  // Debug log
  console.log('Roasters state:', roasters, 'Type:', typeof roasters, 'Is array:', Array.isArray(roasters))

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

  useEffect(() => {
    fetchRoasters()
  }, [sortBy])

  const fetchRoasters = async (retryCount = 0) => {
    try {
      const response = await fetch(`http://localhost:5000/api/roasters?sort=${sortBy}`)
      if (response.ok) {
        const data = await response.json()
        // The API returns { roasters: [...], pagination: {...} }
        // so we need to extract the roasters array
        const roastersArray = data.roasters || []
        setRoasters(roastersArray)
      } else {
        console.error('Failed to fetch roasters:', response.status, response.statusText)
        setRoasters([]) // Set empty array as fallback
      }
    } catch (error) {
      console.error('Failed to fetch roasters:', error)
      // Retry once after 1 second if backend isn't ready yet
      if (retryCount < 2) {
        console.log('Retrying fetch roasters in 1 second...')
        setTimeout(() => fetchRoasters(retryCount + 1), 1000)
        return
      }
      setRoasters([]) // Set empty array as fallback after retries
    } finally {
      // Always set loading to false after retries complete or on first successful call
      if (retryCount === 0) {
        setTimeout(() => setLoading(false), 100)
      } else if (retryCount >= 2) {
        setLoading(false)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-lavender-50 via-white to-orchid-50">
      <div className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-primary-700 to-orchid-600 bg-clip-text text-transparent mb-6">
              Coffee Roasters
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Explore our collection of artisanal coffee roasters.
            </p>
          </div>

          {/* Filters & Sort */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8 bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center space-x-4 mb-4 sm:mb-0">
              <span className="text-gray-700 font-medium">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="name">Name A-Z</option>
                <option value="-name">Name Z-A</option>
                <option value="-rating">Highest Rated</option>
                <option value="-reviewCount">Most Reviewed</option>
                <option value="city">Location</option>
              </select>
            </div>
            <div className="text-sm text-gray-600">
              {roasters.length} roasters found
            </div>
          </div>

          {/* Roasters Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-6">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : roasters && Array.isArray(roasters) && roasters.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {(roasters || []).filter(roaster => roaster && roaster.id).map((roaster) => (
                <div key={roaster.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all transform hover:scale-105">
                  <img
                    src={roaster.imageUrl}
                    alt={roaster.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{roaster.name}</h3>
                      <div className="flex items-center">
                        <span className="text-yellow-400">⭐</span>
                        <span className="text-gray-600 ml-1">{roaster.rating}</span>
                        <span className="text-gray-400 ml-1">({roaster.reviewCount})</span>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-2">📍 {roaster.city}, {roaster.state}</p>
                    <p className="text-gray-700 mb-4 line-clamp-2">{roaster.description}</p>
                    
                    {/* Specialties */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {roaster.specialties.slice(0, 3).map((specialty) => (
                        <Link
                          key={specialty}
                          href={`/discover?specialty=${encodeURIComponent(specialty)}`}
                          className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm hover:bg-primary-200 hover:text-primary-800 transition-colors cursor-pointer"
                        >
                          ☕ {translateSpecialty(specialty)}
                        </Link>
                      ))}
                      {roaster.specialties.length > 3 && (
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                          +{roaster.specialties.length - 3} {t('common.more')}
                        </span>
                      )}
                    </div>

                    {/* Price Range */}
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm text-gray-600">Price Range: {roaster.priceRange}</span>
                      {roaster.website && (
                        <a 
                          href={roaster.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700 text-sm"
                        >
                          🌐 Website
                        </a>
                      )}
                    </div>

                    {/* Contact Info */}
                    <div className="border-t pt-4">
                      <p className="text-sm text-gray-600 mb-2">📍 {roaster.address}</p>
                      {roaster.phone && (
                        <p className="text-sm text-gray-600 mb-4">📞 {roaster.phone}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <Link
                        href={`/roasters/${roaster.id}`}
                        className="flex-1 bg-gradient-to-r from-primary-500 to-orchid-500 text-white text-center py-2 px-4 rounded-lg hover:shadow-lg transition-all transform hover:scale-105"
                      >
                        View Details 💜
                      </Link>
                      <button 
                        onClick={() => toggleFavorite(roaster.id)}
                        className={`px-4 py-2 border rounded-lg transition-all transform hover:scale-105 ${
                          favorites.includes(roaster.id)
                            ? 'bg-red-100 border-red-300 text-red-600 hover:bg-red-200'
                            : 'border-primary-500 text-primary-600 hover:bg-primary-50'
                        }`}
                      >
                        {favorites.includes(roaster.id) ? '❤️' : '🤍'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">☕</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Roasters Found</h3>
              <p className="text-gray-600 mb-6">We're constantly adding new roasters. Check back soon!</p>
              <button 
                onClick={() => {
                  setSortBy('name')
                  fetchRoasters()
                }}
                className="bg-gradient-to-r from-primary-500 to-orchid-500 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all transform hover:scale-105"
              >
                Discover Roasters 🔍
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
