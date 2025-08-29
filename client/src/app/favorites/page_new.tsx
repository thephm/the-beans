'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import Link from 'next/link'

interface Roaster {
  id: number
  name: string
  location: string
  rating: number
  specialties?: string[]
  imageUrl?: string
  description?: string
}

export default function FavoritesPage() {
  const { t } = useTranslation()
  // Helper function to translate specialty names
  const translateSpecialty = (specialty: string) => {
    if (!specialty) return '';
    let key = specialty;
    // If specialty already starts with 'specialties.', use as-is
    if (!key.startsWith('specialties.')) {
      key = key.replace(/\s+(.)/g, (_, c) => c.toUpperCase());
      key = key.charAt(0).toLowerCase() + key.slice(1);
      key = key.replace(/[^a-zA-Z0-9]/g, '');
      key = `specialties.${key}`;
    }
    const translated = t(key);
    if (translated === key) {
      // Fallback: show original specialty string (without 'specialties.' prefix)
      return specialty.startsWith('specialties.') ? specialty.replace('specialties.', '') : specialty;
    }
    return translated;
  }
  const router = useRouter()
  const { user, loading } = useAuth()
  const [favoriteRoasters, setFavoriteRoasters] = useState<Roaster[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [favorites, setFavorites] = useState<{[key: string]: boolean}>({})

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  const toggleFavorite = (id: number) => {
    const key = `roaster-${id}`
    const storageKey = 'favoriteRoasters'
    const currentFavorites = JSON.parse(localStorage.getItem(storageKey) || '[]')
    
    let updatedFavorites
    if (currentFavorites.includes(id.toString())) {
      updatedFavorites = currentFavorites.filter((favId: string) => favId !== id.toString())
    } else {
      updatedFavorites = [...currentFavorites, id.toString()]
    }
    
    localStorage.setItem(storageKey, JSON.stringify(updatedFavorites))
    
    // Update local state
    const favoritesObject = {...favorites}
    if (updatedFavorites.includes(id.toString())) {
      favoritesObject[key] = true
    } else {
      delete favoritesObject[key]
    }
    setFavorites(favoritesObject)
    
    // Remove from the display list if unfavorited
    if (!updatedFavorites.includes(id.toString())) {
      setFavoriteRoasters(prev => prev.filter(r => r.id !== id))
    }
  }

  useEffect(() => {
    const loadFavorites = async () => {
      try {
        // Get favorites from localStorage
        const favoriteRoasterIds = JSON.parse(localStorage.getItem('favoriteRoasters') || '[]')

        // Create favorites object for state management
        const favoritesObject: {[key: string]: boolean} = {}
        favoriteRoasterIds.forEach((id: string) => {
          favoritesObject[`roaster-${id}`] = true
        })
        setFavorites(favoritesObject)

        // Fetch roaster data
        if (favoriteRoasterIds.length > 0) {
          const roastersResponse = await fetch('http://localhost:5000/api/roasters')
          const roastersData = await roastersResponse.json()
          // Handle both array and object response formats
          const allRoasters = roastersData.roasters || roastersData
          const favoriteRoastersData = allRoasters.filter((r: Roaster) => favoriteRoasterIds.includes(r.id.toString()))
          setFavoriteRoasters(favoriteRoastersData)
        }
      } catch (error) {
        console.error('Error loading favorites:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadFavorites()
  }, [])

  if (isLoading) {
    return <div className="min-h-screen bg-gradient-to-br from-lavender-50 via-white to-orchid-50 flex items-center justify-center">
      <div className="text-xl">Loading...</div>
    </div>
  }

  const hasFavorites = favoriteRoasters.length > 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-lavender-50 via-white to-orchid-50">
      <div className="pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-primary-700 to-orchid-600 bg-clip-text text-transparent mb-6">
              {t('favorites.title')}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('favorites.subtitle')}
            </p>
          </div>

          {!hasFavorites ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-orchid-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">No favorites yet</h3>
              <p className="text-gray-600 mb-6">
                Start exploring and add your favorite roasters to keep them here for easy access.
              </p>
              <div className="flex justify-center">
                <button 
                  onClick={() => router.push('/roasters')}
                  className="bg-gradient-to-r from-primary-500 to-orchid-500 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all transform hover:scale-105"
                >
                  Explore Roasters
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Favorite Roasters */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('favorites.roasters')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {favoriteRoasters.map((roaster) => (
                    <div key={roaster.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all group">
                      <div className="relative h-48">
                        <img 
                          src={roaster.imageUrl || '/placeholder-coffee.jpg'} 
                          alt={roaster.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=300&fit=crop'
                          }}
                        />
                      </div>
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{roaster.name}</h3>
                            <p className="text-gray-600 mb-1">{roaster.location}</p>
                            <p className="text-sm text-primary-600 font-medium">{roaster.specialties?.[0] ? translateSpecialty(roaster.specialties[0]) : ''}</p>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="text-yellow-400">★</span>
                            <span className="text-sm font-medium text-gray-700">{roaster.rating}</span>
                          </div>
                        </div>

                        {roaster.description && (
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{roaster.description}</p>
                        )}

                        <div className="flex space-x-3">
                          <Link
                            href={`/roasters/${roaster.id}`}
                            className="flex-1 bg-gradient-to-r from-primary-500 to-orchid-500 text-white px-4 py-2 rounded-lg text-center font-medium hover:shadow-lg transition-all transform hover:scale-105"
                          >
                            View Details
                          </Link>
                          <button
                            onClick={() => toggleFavorite(roaster.id)}
                            className="px-4 py-2 border-2 border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            💔 Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
