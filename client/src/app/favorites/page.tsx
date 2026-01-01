
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

export default function FavouritesPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { user, loading } = useAuth()
  const [favouriteRoasters, setFavouriteRoasters] = useState<Roaster[]>([])
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

  // Listen for unfavourite events to update the display
  useEffect(() => {
    const handleUnfavourited = (event: CustomEvent) => {
      const { roasterId } = event.detail
      setFavouriteRoasters(prev => prev.filter(r => r.id.toString() !== roasterId.toString()))
    }
    window.addEventListener('roasterUnfavourited', handleUnfavourited as EventListener)
    return () => {
      window.removeEventListener('roasterUnfavourited', handleUnfavourited as EventListener)
    }
  }, [])

  useEffect(() => {
    const loadFavourites = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        // Fetch favourites from backend API
        const favouritesData = await apiClient.getFavourites() as any
        setFavouriteRoasters(favouritesData)
      } catch (error) {
        console.error('Error loading favourites:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadFavourites()
  }, [user])

  if (isLoading) {
    return <div className="min-h-screen bg-gradient-to-br from-lavender-50 via-white to-orchid-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="text-xl">Loading...</div>
    </div>
  }

  const hasFavourites = favouriteRoasters.length > 0

  return (
    <main className="min-h-screen bg-gradient-to-br from-lavender-50 via-white to-orchid-50 dark:bg-gray-950 dark:bg-none">
      <section className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="pt-24 pb-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-primary-700 to-orchid-600 bg-clip-text text-transparent mb-6">
              {t('favourites.title')}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              {t('favourites.subtitle')}
            </p>
          </div>

          {!hasFavourites ? (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-orchid-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">{t('favourites.noFavouritesYet')}</h3>
              <p className="text-gray-600 dark:text-gray-200 mb-6">
                {t('favourites.startExploringDescription')}
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
              {/* Favourite Roasters */}
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {favouriteRoasters.map((roaster) => (
                    <RoasterCard
                      key={roaster.id}
                      roaster={roaster}
                      userLocation={userLocation}
                      returnTo="/favourites"
                      showActions={true}
                      onSpecialtyClick={(specialtyName) => {
                        if (specialtyName) {
                          router.push(`/discover?specialty=${encodeURIComponent(specialtyName)}`);
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
