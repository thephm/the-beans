'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Roaster {
  id: number
  name: string
  location: string
  specialty: string
  rating: number
  imageUrl?: string
  description?: string
}

interface Cafe {
  id: number
  name: string
  location: string
  rating: number
  imageUrl?: string
  amenities?: string[]
}

export default function FavoritesPage() {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const [favoriteRoasters, setFavoriteRoasters] = useState<Roaster[]>([])
  const [favoriteCafes, setFavoriteCafes] = useState<Cafe[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [favorites, setFavorites] = useState<{[key: string]: boolean}>({})

  const toggleFavorite = (id: number, type: 'roaster' | 'cafe') => {
    const key = `${type}-${id}`
    const storageKey = type === 'roaster' ? 'favoriteRoasters' : 'favoriteCafes'
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
      if (type === 'roaster') {
        setFavoriteRoasters(prev => prev.filter(r => r.id !== id))
      } else {
        setFavoriteCafes(prev => prev.filter(c => c.id !== id))
      }
    }
  }

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, loading, router])

  useEffect(() => {
    const loadFavorites = async () => {
      if (!isAuthenticated) return

      try {
        // Get favorites from localStorage using the actual keys used by roasters/cafes pages
        const favoriteRoasterIds = JSON.parse(localStorage.getItem('favoriteRoasters') || '[]')
        const favoriteCafeIds = JSON.parse(localStorage.getItem('favoriteCafes') || '[]')

        // Create favorites object for state management
        const favoritesObject: {[key: string]: boolean} = {}
        favoriteRoasterIds.forEach((id: string) => {
          favoritesObject[`roaster-${id}`] = true
        })
        favoriteCafeIds.forEach((id: string) => {
          favoritesObject[`cafe-${id}`] = true
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

        // Fetch cafe data  
        if (favoriteCafeIds.length > 0) {
          const cafesResponse = await fetch('http://localhost:5000/api/cafes')
          const cafesData = await cafesResponse.json()
          // Handle both array and object response formats
          const allCafes = cafesData.cafes || cafesData
          const favoriteCafesData = allCafes.filter((c: Cafe) => favoriteCafeIds.includes(c.id.toString()))
          setFavoriteCafes(favoriteCafesData)
        }
      } catch (error) {
        console.error('Error loading favorites:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadFavorites()
  }, [isAuthenticated])

  if (loading || isLoading) {
    return <div className="min-h-screen bg-gradient-to-br from-lavender-50 via-white to-orchid-50 flex items-center justify-center">
      <div className="text-xl">Loading...</div>
    </div>
  }

  if (!isAuthenticated) {
    return null
  }

  const hasFavorites = favoriteRoasters.length > 0 || favoriteCafes.length > 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-lavender-50 via-white to-orchid-50">
      <div className="pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-primary-700 to-orchid-600 bg-clip-text text-transparent mb-6">
              Your Favorites
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Keep track of your favorite roasters and cafes
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
                Start exploring and add your favorite roasters and cafes to keep them here for easy access.
              </p>
              <div className="flex justify-center space-x-4">
                <button 
                  onClick={() => router.push('/roasters')}
                  className="bg-gradient-to-r from-primary-500 to-orchid-500 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all transform hover:scale-105"
                >
                  Explore Roasters
                </button>
                <button 
                  onClick={() => router.push('/cafes')}
                  className="border border-primary-500 text-primary-600 px-6 py-3 rounded-lg hover:bg-primary-50 transition-colors"
                >
                  Browse Cafes
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Favorite Roasters */}
              {favoriteRoasters.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Favorite Roasters</h2>
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
                              <p className="text-sm text-primary-600 font-medium">{roaster.specialty}</p>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className="text-yellow-400">★</span>
                              <span className="text-sm font-medium text-gray-700">{roaster.rating}</span>
                            </div>
                          </div>
                          
                          <div className="flex space-x-3">
                            <Link 
                              href={`/roasters/${roaster.id}`}
                              className="flex-1 bg-gradient-to-r from-primary-500 to-orchid-500 text-white py-2 px-4 rounded-lg hover:shadow-lg transition-all text-center"
                            >
                              View Details
                            </Link>
                            <button
                              onClick={() => toggleFavorite(roaster.id, 'roaster')}
                              className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                            >
                              <span className="text-lg">❤️</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Favorite Cafes */}
              {favoriteCafes.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Favorite Cafes</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {favoriteCafes.map((cafe) => (
                      <div key={cafe.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all group">
                        <div className="relative h-48">
                          <img 
                            src={cafe.imageUrl || '/placeholder-coffee.jpg'} 
                            alt={cafe.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=300&fit=crop'
                            }}
                          />
                        </div>
                        <div className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-xl font-bold text-gray-900 mb-2">{cafe.name}</h3>
                              <p className="text-gray-600 mb-2">{cafe.location}</p>
                              {cafe.amenities && (
                                <div className="flex flex-wrap gap-1">
                                  {cafe.amenities.slice(0, 2).map((amenity, idx) => (
                                    <span key={idx} className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded">
                                      {amenity}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className="text-yellow-400">★</span>
                              <span className="text-sm font-medium text-gray-700">{cafe.rating}</span>
                            </div>
                          </div>
                          
                          <div className="flex space-x-3">
                            <Link 
                              href={`/cafes/${cafe.id}`}
                              className="flex-1 bg-gradient-to-r from-primary-500 to-orchid-500 text-white py-2 px-4 rounded-lg hover:shadow-lg transition-all text-center"
                            >
                              View Details
                            </Link>
                            <button
                              onClick={() => toggleFavorite(cafe.id, 'cafe')}
                              className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                            >
                              <span className="text-lg">❤️</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
