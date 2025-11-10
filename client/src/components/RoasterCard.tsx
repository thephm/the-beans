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
  Star,
  Instagram,
  Facebook,
  LinkedIn,
  YouTube,
  Pinterest,
  Reddit
} from '@mui/icons-material'
import { SvgIcon } from '@mui/material'

// Custom icons for social platforms not in MUI
const TikTokIcon = (props: any) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </SvgIcon>
)

const ThreadsIcon = (props: any) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M12.186 3.076c-.522 0-1.017.049-1.458.144-.44.096-.836.24-1.187.437a3.42 3.42 0 0 0-.932.72 3.39 3.39 0 0 0-.64 1.003 6.26 6.26 0 0 0-.353 1.234 11.39 11.39 0 0 0-.108 1.422v.696h3.334v-.696c0-.36.024-.684.072-.972.048-.288.126-.534.233-.739.107-.204.246-.36.419-.468.172-.108.383-.162.633-.162.227 0 .423.048.587.144.165.096.301.233.411.41.109.178.19.39.242.636.053.247.079.519.079.816 0 .324-.029.612-.086.864a2.17 2.17 0 0 1-.272.684 2.41 2.41 0 0 1-.468.558c-.186.162-.407.306-.662.432l-2.16 1.08v2.52h6.48v-3.024h-3.456l.624-.312c.504-.252.942-.54 1.314-.864.372-.324.684-.684.936-1.08.252-.396.444-.828.576-1.296.132-.468.198-.972.198-1.512 0-.612-.09-1.176-.27-1.692a3.78 3.78 0 0 0-.792-1.368 3.66 3.66 0 0 0-1.278-.918c-.504-.227-1.08-.34-1.728-.34z" />
  </SvgIcon>
)

const BlueskyIcon = (props: any) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 0 1-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.206-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8z" />
  </SvgIcon>
)

const XIcon = (props: any) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </SvgIcon>
)

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
    instagram?: string
    tiktok?: string
    facebook?: string
    linkedin?: string
    youtube?: string
    threads?: string
    pinterest?: string
    bluesky?: string
    x?: string
    reddit?: string
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
      'Experimental': 'experimental',
      'Carbon Neutral': 'carbonNeutral',
      'Carboneutre': 'carbonNeutral',
      'Omni Roast': 'omniRoast',
      'Torréfaction Omni': 'omniRoast',
      'Natural': 'natural',
      'Naturel': 'natural',
      'Washed': 'washed',
      'Lavé': 'washed'
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

  // Helper to render social media icons
  const renderSocialIcons = () => {
    const socialLinks = [
      { url: roaster.instagram, Icon: Instagram, name: 'Instagram', color: '#E4405F' },
      { url: roaster.tiktok, Icon: TikTokIcon, name: 'TikTok', color: '#000000' },
      { url: roaster.facebook, Icon: Facebook, name: 'Facebook', color: '#1877F2' },
      { url: roaster.linkedin, Icon: LinkedIn, name: 'LinkedIn', color: '#0A66C2' },
      { url: roaster.youtube, Icon: YouTube, name: 'YouTube', color: '#FF0000' },
      { url: roaster.threads, Icon: ThreadsIcon, name: 'Threads', color: '#000000' },
      { url: roaster.pinterest, Icon: Pinterest, name: 'Pinterest', color: '#E60023' },
      { url: roaster.bluesky, Icon: BlueskyIcon, name: 'Bluesky', color: '#1185FE' },
      { url: roaster.x, Icon: XIcon, name: 'X', color: '#000000' },
      { url: roaster.reddit, Icon: Reddit, name: 'Reddit', color: '#FF4500' },
    ].filter(social => social.url) // Only show icons where URL is defined

    if (socialLinks.length === 0) return null

    return (
      <>
        {socialLinks.map(({ url, Icon, name, color }) => (
          <a
            key={name}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-all transform hover:scale-110"
            aria-label={name}
            title={name}
          >
            <Icon 
              sx={{ 
                fontSize: 20, 
                color: '#6B7280',
                '&:hover': { color: color }
              }} 
            />
          </a>
        ))}
      </>
    )
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
          <div className="flex justify-between items-center mb-2">
            <p className="text-gray-600 flex items-center">
              <LocationOn sx={{ fontSize: 16, marginRight: 0.5 }} />
              {[roaster.city, roaster.state].filter(Boolean).join(', ')}
            </p>
            {calculateDistance()}
          </div>
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
          <div className="flex gap-2 items-center justify-between">
            <div className="flex gap-2 items-center">
              {renderSocialIcons()}
            </div>
            <div className="flex gap-2 items-center">
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
                className="bg-gradient-to-r from-primary-500 to-orchid-500 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all transform hover:scale-105"
              >
                {t('roasters.viewDetails')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
