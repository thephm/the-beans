'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { useFeatureFlags } from '@/hooks/useFeatureFlags'
import RoasterImage from '@/components/RoasterImage'
import { 
  LocationOn, 
  Favorite, 
  FavoriteBorder,
  Star
} from '@mui/icons-material'

interface Specialty {
  id: string
  name: string
  deprecated?: boolean
}

interface RoasterCardProps {
  roaster: {
    id: string | number
    name: string
    city?: string
    state?: string
    rating?: number
    specialties?: Specialty[]
    description?: string
    imageUrl?: string
    latitude?: number
    longitude?: number
    distance?: number
    verified?: boolean
  }
  userLocation?: { lat: number; lng: number } | null
  onSpecialtyClick?: (specialtyName: string) => void
  returnTo?: string
}

export function RoasterCard({ roaster, userLocation, onSpecialtyClick, returnTo = '/' }: RoasterCardProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { showRatings } = useFeatureFlags()
  const router = useRouter()
  const [favorites, setFavorites] = useState<string[]>([])

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = JSON.parse(localStorage.getItem('favoriteRoasters') || '[]')
    setFavorites(savedFavorites)
  }, [])

  // Helper function to translate specialty names
  const translateSpecialty = (specialty: Specialty | string): string => {
    const name = typeof specialty === 'string' ? specialty : specialty.name
    
    // Map of specialty names to translation keys
    const specialtyMap: { [key: string]: string } = {
      'Espresso': 'espresso',
      'Single Origin': 'singleOrigin',
      'Cold Brew': 'coldBrew',
      'Decaf': 'decaf',
      'Organic': 'organic',
      'Artisanal': 'artisanal',
      'Fair Trade': 'fairTrade',
      'Dark Roast': 'darkRoast',
      'Light Roast': 'lightRoast',
      'Medium Roast': 'mediumRoast',
      'Pour Over': 'pourOver',
      'Direct Trade': 'directTrade',
      'Education': 'education',
      'Cupping': 'cupping',
      'Blends': 'blends',
      'Ethiopian': 'ethiopian',
      'Italian Roast': 'italianRoast',
      'Nitro Coffee': 'nitroCoffee',
      'Sustainable': 'sustainable',
      'Awards': 'awards',
      'Récompenses': 'awards', // French database value that needs to map to awards
      'Microlots': 'microlots',
      'Experimental': 'experimental'
    }
    
    const key = specialtyMap[name]
    return key ? t(`specialties.${key}`, name) : name
  }

  const toggleFavorite = (roasterId: string | number) => {
    const idStr = roasterId.toString()
    
    // Check if user is authenticated
    if (!user) {
      router.push('/login')
      return
    }

    let updatedFavorites
    const wasRemoved = favorites.includes(idStr)
    if (wasRemoved) {
      updatedFavorites = favorites.filter(id => id !== idStr)
    } else {
      updatedFavorites = [...favorites, idStr]
    }
    setFavorites(updatedFavorites)
    localStorage.setItem('favoriteRoasters', JSON.stringify(updatedFavorites))
    
    // Dispatch custom event for favorites page to remove card from display
    if (wasRemoved) {
      window.dispatchEvent(new CustomEvent('roasterUnfavorited', { detail: { roasterId: idStr } }))
    }
  }

  const handleSpecialtyClick = (specialtyName: string) => {
    if (onSpecialtyClick) {
      onSpecialtyClick(specialtyName)
    }
  }

  const calculateDistance = () => {
    // Try to use backend-provided distance if present and valid
    if (typeof roaster.distance === 'number' && isFinite(roaster.distance)) {
      // Use user preference for unit if available
      const settings = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('settings') || '{}') : {}
      const unit = settings?.preferences?.distanceUnit || 'mi'
      let dist = roaster.distance
      if (unit === 'km') dist = dist * 1.60934
      return (
        <span className="text-sm text-gray-500 flex items-center">
          <LocationOn sx={{ fontSize: 14, marginRight: 0.25 }} />
          {dist.toFixed(1)} {unit === 'km' ? t('km').toLowerCase() : t('mi').toLowerCase()}
        </span>
      )
    }
    // If not, try to calculate from userLocation and roaster lat/lng
    if (userLocation && roaster.latitude && roaster.longitude) {
      const settings = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('settings') || '{}') : {}
      const unit = settings?.preferences?.distanceUnit || 'mi'
      const toRad = (v: number) => v * Math.PI / 180
      const R = unit === 'mi' ? 3958.8 : 6371
      const dLat = toRad(roaster.latitude - userLocation.lat)
      const dLng = toRad(roaster.longitude - userLocation.lng)
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(toRad(userLocation.lat)) * Math.cos(toRad(roaster.latitude)) * Math.sin(dLng/2) * Math.sin(dLng/2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
      const dist = R * c
      return (
        <span className="text-sm text-gray-500 flex items-center">
          <LocationOn sx={{ fontSize: 14, marginRight: 0.25 }} />
          {dist.toFixed(1)} {unit === 'km' ? t('km').toLowerCase() : t('mi').toLowerCase()}
        </span>
      )
    }
    return null
  }

  const roasterIdStr = roaster.id.toString()

  return (
    <div className={`bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow flex flex-col ${
      user?.role === 'admin' && !roaster.verified ? 'border-4 border-red-500' : ''
    }`}>
      <div className="relative h-48">
        <RoasterImage
          src={roaster.imageUrl || 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&h=600&fit=crop'}
          alt={roaster.name}
          width={800}
          height={192}
          className="w-full h-full object-cover"
        />
        <button
          onClick={() => toggleFavorite(roaster.id)}
          className={`absolute bottom-4 right-4 p-2 rounded-full z-20 pointer-events-auto ${
            favorites.includes(roasterIdStr)
              ? 'bg-red-500 text-white' 
              : 'bg-white text-red-500 hover:bg-red-50'
          } shadow-lg transition-all transform hover:scale-110`}
          aria-label={favorites.includes(roasterIdStr) ? t('roasterDetail.removeFromFavorites') : t('roasterDetail.addToFavorites')}
        >
          {favorites.includes(roasterIdStr) ? <Favorite sx={{ fontSize: 20 }} /> : <FavoriteBorder sx={{ fontSize: 20 }} />}
        </button>
      </div>
      <div className="px-6 pt-6 pb-4 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-gray-900">{roaster.name}</h3>
          {showRatings && roaster.rating && (
            <div className="flex items-center">
              <Star sx={{ fontSize: 20, color: '#fbbf24' }} />
              <span className="text-gray-600 ml-1">{roaster.rating}</span>
            </div>
          )}
        </div>
        {(roaster.city || roaster.state) && (
          <p className="text-gray-600 mb-2 flex items-center">
            <LocationOn sx={{ fontSize: 16, marginRight: 0.5 }} />
            {[roaster.city, roaster.state].filter(Boolean).join(', ')}
          </p>
        )}
        {roaster.description && (
          <p className="text-gray-700 mb-4">{roaster.description}</p>
        )}
        <div className="flex flex-wrap gap-2 mb-4">
          {roaster.specialties && roaster.specialties.map((specialty) => (
            <button
              key={specialty.id}
              onClick={() => handleSpecialtyClick(specialty.name)}
              className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm hover:bg-primary-200 hover:text-primary-800 transition-colors cursor-pointer"
            >
              {translateSpecialty(specialty)}
            </button>
          ))}
        </div>
        <div className="mt-auto">
          <div className="flex justify-between items-center mb-4">
            {calculateDistance()}
          </div>
          <div className="flex gap-2 items-center justify-between">
            {user?.role === 'admin' && (
              <Link
                href={`/admin/roasters?edit=${roaster.id}&returnTo=${returnTo}`}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all transform hover:scale-105"
              >
                Edit
              </Link>
            )}
            <Link
              href={`/roasters/${roaster.id}`}
              className="bg-gradient-to-r from-primary-500 to-orchid-500 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all transform hover:scale-105 ml-auto"
            >
              {t('roasters.viewDetails')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
