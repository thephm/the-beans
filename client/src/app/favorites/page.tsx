'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import { RoasterCard } from '@/components/RoasterCard'
import { apiClient } from '@/lib/api'

interface Roaster {
  id: number
  name: string
  location: string
  rating: number
  specialties?: Array<{ id: string; name: string }>
  imageUrl?: string
  description?: string
}

export default function FavoritesPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { user, loading } = useAuth()
  const [favoriteRoasters, setFavoriteRoasters] = useState<Roaster[]>([])
  const [isLoading, setIsLoading] = useState(true)
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

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Listen for unfavorite events to update the display
  useEffect(() => {
    const handleUnfavorite = (event: CustomEvent) => {
      const { roasterId } = event.detail
      setFavoriteRoasters(prev => prev.filter(r => r.id.toString() !== roasterId.toString()))
    }
    
    window.addEventListener('roasterUnfavorited', handleUnfavorite as EventListener)
    return () => {
      window.removeEventListener('roasterUnfavorited', handleUnfavorite as EventListener)
    }
  }, [])

  useEffect(() => {
    const loadFavorites = async () => {
      try {
        // Get favorites from localStorage
        const favoriteRoasterIds = JSON.parse(localStorage.getItem('favoriteRoasters') || '[]')

        // Fetch roaster data
        if (favoriteRoasterIds.length > 0) {
          const roastersData = await apiClient.getRoasters({}) as any
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
      <div className="pt-24 pb-16">
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
              <h3 className="text-xl font-semibold text-gray-900 mb-4">{t('favorites.noFavoritesYet')}</h3>
              <p className="text-gray-600 mb-6">
                {t('favorites.startExploringDescription')}
              </p>
              <div className="flex justify-center">
                <button 
                  onClick={() => router.push('/discover')}
                  className="bg-gradient-to-r from-primary-500 to-orchid-500 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all transform hover:scale-105"
                >
                  {t('nav.discover')}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Favorite Roasters */}
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {favoriteRoasters.map((roaster) => (
                    <RoasterCard
                      key={roaster.id}
                      roaster={roaster}
                      userLocation={userLocation}
                      returnTo="/favorites"
                    />
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
