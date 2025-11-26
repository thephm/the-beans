'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { useFeatureFlags } from '@/hooks/useFeatureFlags'
import RoasterImage from '@/components/RoasterImage'
import { apiClient } from '@/lib/api'
import { getSocial } from '@/lib/socials'
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
  <SvgIcon {...props} viewBox="0 0 192 192">
    <path d="M141.537 88.988a66.667 66.667 0 0 0-2.518-1.143c-1.482-27.307-16.403-42.94-41.457-43.1h-.34c-14.986 0-27.449 6.396-35.12 18.037l13.779 9.452c5.73-8.695 14.717-10.816 21.348-10.816h.229c7.67.081 13.861 2.544 17.916 7.146 3.353 3.81 5.583 9.139 6.666 15.926a73 73 0 0 0-6.597-1.018c-11.567-1.376-21.536-.962-28.85 1.191-9.617 2.832-17.092 8.639-21.645 16.828-3.688 6.636-4.918 14.415-3.557 22.495 1.45 8.622 5.798 16.286 12.229 21.563 6.235 5.117 14.272 7.708 23.251 7.708h.052c14.86 0 27.032-7.442 32.24-19.745 2.455-5.798 3.717-12.534 3.743-20.036v-1.21c4.699 2.732 8.476 6.22 11.154 10.343 4.201 6.467 5.987 14.371 5.309 23.498-.69 9.288-4.04 17.827-9.439 24.04-5.395 6.208-12.523 10.12-20.635 11.328a42 42 0 0 1-7.397.665c-15.818 0-30.241-9.801-39.462-26.82l-14.854 7.67c11.544 21.34 30.656 34.188 52.59 34.188 2.98 0 5.96-.242 8.892-.728 10.766-1.79 20.447-7.175 28.043-15.593 7.593-8.424 12.223-19.633 13.043-31.575.964-13.984-2.043-25.866-8.936-35.313-4.201-5.757-9.63-10.477-16.123-14.018zm-27.688 40.586c-2.233 5.274-7.087 8.458-13.394 8.796h-.379c-4.646 0-8.542-1.494-11.253-4.318-2.668-2.775-4.114-6.528-4.69-10.854-.577-4.336.086-8.411 1.92-11.799 2.378-4.389 6.448-7.652 11.785-9.447 2.966-.997 6.444-1.497 10.329-1.497 2.37 0 4.847.175 7.388.519v1.668c-.02 6.215-.892 11.626-2.706 16.932" />
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
    isFavorited?: boolean
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
  const [isFavorited, setIsFavorited] = useState<boolean>(roaster.isFavorited || false)

  // Update isFavorited when roaster prop changes
  useEffect(() => {
    setIsFavorited(roaster.isFavorited || false)
  }, [roaster.isFavorited])

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

  const toggleFavorite = async (roasterId: string | number) => {
    const idStr = roasterId.toString()
    
    // Check if user is authenticated
    if (!user) {
      router.push('/login')
      return
    }

    try {
      const wasRemoved = isFavorited
      if (wasRemoved) {
        await apiClient.removeFavorite(idStr)
      } else {
        await apiClient.addFavorite(idStr)
      }
      setIsFavorited(!isFavorited)
      
      // Dispatch custom event for favorites page to remove card from display
      if (wasRemoved) {
        window.dispatchEvent(new CustomEvent('roasterUnfavorited', { detail: { roasterId: idStr } }))
      }
    } catch (err) {
      console.error('Toggle favorite error:', err)
      alert('Failed to update favorite. Please try again.')
    }
  }

  const handleSpecialtyClick = (specialtyName: string) => {
    if (onSpecialtyClick) {
      onSpecialtyClick(specialtyName)
    }
  }

  // Helper to render social media icons
  const renderSocialIcons = () => {
    const networks = [
      { key: 'instagram', Icon: Instagram, name: 'Instagram', color: '#E4405F' },
      { key: 'tiktok', Icon: TikTokIcon, name: 'TikTok', color: '#000000' },
      { key: 'facebook', Icon: Facebook, name: 'Facebook', color: '#1877F2' },
      { key: 'linkedin', Icon: LinkedIn, name: 'LinkedIn', color: '#0A66C2' },
      { key: 'youtube', Icon: YouTube, name: 'YouTube', color: '#FF0000' },
      { key: 'threads', Icon: ThreadsIcon, name: 'Threads', color: '#000000' },
      { key: 'pinterest', Icon: Pinterest, name: 'Pinterest', color: '#E60023' },
      { key: 'bluesky', Icon: BlueskyIcon, name: 'Bluesky', color: '#1185FE' },
      { key: 'twitter', Icon: XIcon, name: 'X', color: '#000000' },
      { key: 'reddit', Icon: Reddit, name: 'Reddit', color: '#FF4500' },
    ]

    const socialLinks = networks
      .map(({ key, Icon, name, color }) => ({
        url: getSocial(roaster as any, key),
        Icon,
        name,
        color,
      }))
      .filter(s => s.url)

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
            isFavorited
              ? 'bg-red-500 text-white' 
              : 'bg-white text-red-500 hover:bg-red-50'
          } shadow-lg transition-all transform hover:scale-110`}
          aria-label={isFavorited ? t('roasterDetail.removeFromFavorites') : t('roasterDetail.addToFavorites')}
        >
          {isFavorited ? <Favorite sx={{ fontSize: 20 }} /> : <FavoriteBorder sx={{ fontSize: 20 }} />}
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
