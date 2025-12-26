'use client'

import { useState, useEffect } from 'react'
import RoasterSourceFields from '@/components/RoasterSourceFields'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { useFeatureFlags } from '@/hooks/useFeatureFlags'
import RoasterImage from '@/components/RoasterImage'
import ImageCarousel from '@/components/ImageCarousel'
import { apiClient } from '@/lib/api'
import { getSocial } from '@/lib/socials'
import { 
  Coffee, 
  LocationOn, 
  Favorite, 
  FavoriteBorder, 
  Language, 
  Phone, 
  Email, 
  PhotoCamera,
  Star,
  Instagram,
  Facebook,
  LinkedIn,
  YouTube,
  Pinterest,
  Reddit,
  Share
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

interface RoasterImageData {
  id: string
  url: string
  description?: string
  isPrimary?: boolean
}

interface Specialty {
  id: string
  name: string
  deprecated?: boolean
}

interface Roaster {
  id: string
  name: string
  description: string
  imageUrl: string
  city: string
  state: string
  address: string
  phone?: string
  website?: string
  email?: string
  sourceType?: string
  sourceDetails?: string
  rating: number
  reviewCount: number
  specialties: string[] | Specialty[]
  hours?: {
    [key: string]: string | { open: string; close: string }
  }
  showHours?: boolean
  onlineOnly?: boolean
  story?: string
  founded?: number
  owner?: string | { id: string; username: string; firstName: string; lastName: string }
  images?: string[]
  roasterImages?: RoasterImageData[]
  socialNetworks?: Record<string, string>
  isFavorited?: boolean
}

export default function RoasterDetail() {
  // Utility to strip deprecated social fields from payload
  function sanitizeRoasterPayload(data: any) {
    const deprecatedSocials = [
      'instagram', 'tiktok', 'facebook', 'linkedin', 'youtube', 'threads', 'pinterest', 'bluesky', 'x', 'reddit'
    ];
    const clean = { ...data };
    deprecatedSocials.forEach((field) => {
      if (field in clean) delete clean[field];
    });
    return clean;
  }

  const handleSourceSave = async () => {
    if (!roaster) return;
    setSourceSaving(true);
    try {
      await apiClient.updateRoaster(
        roaster.id,
        sanitizeRoasterPayload({
          sourceType,
          sourceDetails,
        })
      );
      setEditingSource(false);
      setRoaster({ ...roaster, sourceType, sourceDetails });
    } catch (err) {
      alert('Failed to save source attribution. Please try again.');
    } finally {
      setSourceSaving(false);
    }
  } 
  const { t } = useTranslation()
  const { user } = useAuth()
  const { showRatings } = useFeatureFlags()
  const params = useParams()
  const router = useRouter()
  const [roaster, setRoaster] = useState<Roaster | null>(null)
  const [editingSource, setEditingSource] = useState(false)
  const [sourceType, setSourceType] = useState('')
  const [sourceDetails, setSourceDetails] = useState('')
  const [sourceSaving, setSourceSaving] = useState(false)

  // Fix: define canEditSource in function body before return
  const canEditSource = user && (user.role === 'admin' || (roaster?.owner && user.id && (typeof roaster.owner === 'string' ? roaster.owner === user.id : roaster.owner.id === user.id)))
  const [roasterImages, setRoasterImages] = useState<RoasterImageData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)

  // Utility function to format time from 24-hour to 12-hour format with proper spacing
  const formatTime = (timeString: string): string => {
    // Handle closed status
    if (timeString === 'closed' || timeString.toLowerCase() === 'closed') {
      return t('time.closed', 'Closed');
    }
    
    // Handle time ranges like "6:30-19:00"
    if (timeString.includes('-')) {
      const [startTime, endTime] = timeString.split('-');
      const formattedStart = format24HourTo12Hour(startTime.trim());
      const formattedEnd = format24HourTo12Hour(endTime.trim());
      return `${formattedStart} - ${formattedEnd}`;
    }
    
    return format24HourTo12Hour(timeString);
  };

  const format24HourTo12Hour = (time: string): string => {
    if (!time || !time.includes(':')) {
      return 'Invalid time';
    }
    
    const [hoursStr, minutesStr] = time.split(':');
    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);
    
    // Validate that we got valid numbers
    if (isNaN(hours) || isNaN(minutes)) {
      return 'Invalid time';
    }
    
    const period = hours >= 12 ? t('time.pm') : t('time.am');
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Helper function to translate specialty names
  const translateSpecialty = (specialty: string | Specialty): string => {
    // Extract specialty name if it's an object
    const specialtyName = typeof specialty === 'string' ? specialty : specialty.name
    
    const specialtyMap: { [key: string]: string } = {
      'Cold Brew': 'specialties.coldBrew',
      'Single Origin': 'specialties.singleOrigin',
      'Espresso': 'specialties.espresso',
      'Decaf': 'specialties.decaf',
      'Organic': 'specialties.organic',
      'Artisanal': 'specialties.artisanal',
      'Fair Trade': 'specialties.fairTrade',
      'Dark Roast': 'specialties.darkRoast',
      'Light Roast': 'specialties.lightRoast',
      'Medium Roast': 'specialties.mediumRoast',
      'Pour Over': 'specialties.pourOver',
      'Direct Trade': 'specialties.directTrade',
      'Education': 'specialties.education',
      'Cupping': 'specialties.cupping'
    }
    return specialtyMap[specialtyName] ? t(specialtyMap[specialtyName]) : specialtyName
  }

  // Helper function to get specialty key for filtering
  const getSpecialtyKey = (specialty: string | Specialty): string => {
    return typeof specialty === 'string' ? specialty : specialty.name
  }

  useEffect(() => {
    if (params?.id) {
      fetchRoaster(params.id as string)
    }
  }, [params?.id])

  const fetchRoaster = async (id: string) => {
    try {
      setLoading(true)
      
      const roasterData = await apiClient.getRoaster(id as string) as Roaster
      
      // Sort specialties alphabetically
      if (roasterData.specialties && roasterData.specialties.length > 0) {
        const sortedSpecialties = [...roasterData.specialties].sort((a, b) => {
          const nameA = typeof a === 'string' ? a : (a.name || '');
          const nameB = typeof b === 'string' ? b : (b.name || '');
          return nameA.localeCompare(nameB);
        }) as typeof roasterData.specialties;
        roasterData.specialties = sortedSpecialties;
      }
      
  setRoaster(roasterData)
  setSourceType(roasterData.sourceType || '')
  setSourceDetails(roasterData.sourceDetails || '')
  const canEditSource = user && (user.role === 'admin' || (roaster?.owner && user.id && (typeof roaster.owner === 'string' ? roaster.owner === user.id : roaster.owner.id === user.id)))

  const handleSourceSave = async () => {
    if (!roaster) return
    setSourceSaving(true)
    try {
      await apiClient.updateRoaster(roaster.id, {
        ...sanitizeRoasterPayload({
          ...roaster,
          sourceType,
          sourceDetails,
        })
      })
      setEditingSource(false)
      setRoaster({ ...roaster, sourceType, sourceDetails })
    } catch (err) {
      alert('Failed to save source attribution. Please try again.')
    } finally {
      setSourceSaving(false)
    }
  }
      
      // Convert the images array to the format expected by the carousel
      // First try roasterImages (new format), fallback to images array (legacy)
      if (roasterData.roasterImages && roasterData.roasterImages.length > 0) {
        setRoasterImages(roasterData.roasterImages)
      } else if (roasterData.images && roasterData.images.length > 0) {
        // Convert legacy images array to carousel format
        const legacyImages = roasterData.images.map((url: string, index: number) => ({
          id: `legacy-${index}`,
          url: url,
          description: roasterData.name,
          isPrimary: index === 0
        }))
        setRoasterImages(legacyImages)
      } else {
        setRoasterImages([])
      }
      
      // Check if roaster is in favorites using isFavorited from backend
      setIsFavorite(roasterData.isFavorited || false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load roaster')
    } finally {
      setLoading(false)
    }
  }

  const toggleFavorite = async () => {
    // Check if user is authenticated
    if (!user) {
      router.push('/login')
      return
    }

    if (!roaster) return
    
    try {
      if (isFavorite) {
        await apiClient.removeFavorite(roaster.id)
      } else {
        await apiClient.addFavorite(roaster.id)
      }
      setIsFavorite(!isFavorite)
    } catch (err) {
      console.error('Toggle favorite error:', err)
      alert('Failed to update favorite. Please try again.')
    }
  }

  const handleShare = async () => {
    if (!roaster) return

    const shareData = {
      title: roaster.name,
      text: `Check out ${roaster.name} - ${roaster.description}`,
      url: window.location.href
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href)
        alert('Link copied to clipboard!')
      }
    } catch (err) {
      // User cancelled the share or an error occurred
    }
  }

  // Helper to check if there are any social links
  const hasSocialLinks = () => {
    if (!roaster) return false
    if (!roaster.socialNetworks) return false;
    return Object.keys(roaster.socialNetworks).length > 0;
  }

  // Helper to render social media icons
  const renderSocialIcons = () => {
    if (!roaster) return null

    if (!roaster.socialNetworks) return null;
    const iconMap: Record<string, { Icon: any; name: string; color: string }> = {
      instagram: { Icon: Instagram, name: 'Instagram', color: '#E4405F' },
      tiktok: { Icon: TikTokIcon, name: 'TikTok', color: '#000000' },
      facebook: { Icon: Facebook, name: 'Facebook', color: '#1877F2' },
      linkedin: { Icon: LinkedIn, name: 'LinkedIn', color: '#0A66C2' },
      youtube: { Icon: YouTube, name: 'YouTube', color: '#FF0000' },
      threads: { Icon: ThreadsIcon, name: 'Threads', color: '#000000' },
      pinterest: { Icon: Pinterest, name: 'Pinterest', color: '#E60023' },
      bluesky: { Icon: BlueskyIcon, name: 'Bluesky', color: '#1185FE' },
      x: { Icon: XIcon, name: 'X', color: '#000000' },
      reddit: { Icon: Reddit, name: 'Reddit', color: '#FF4500' },
    };
    const socialLinks = Object.entries(roaster.socialNetworks)
      .filter(([key, url]) => iconMap[key] && url)
      .map(([key, url]) => ({
        url,
        ...iconMap[key],
      }));
    if (socialLinks.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-2">
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
                fontSize: 24, 
                color: '#6B7280',
                '&:hover': { color: color }
              }} 
            />
          </a>
        ))}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:bg-gray-950 dark:bg-none">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
              <div className="h-96 bg-gray-200 dark:bg-gray-700"></div>
              <div className="p-8">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-6"></div>
                <div className="space-y-3">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !roaster) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:bg-gray-950 dark:bg-none">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="mb-4">
              <Coffee sx={{ fontSize: 96, color: '#6b7280' }} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Roaster Not Found</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'The roaster you\'re looking for doesn\'t exist.'}</p>
            <Link
              href="/discover"
              className="inline-flex items-center bg-gradient-to-r from-primary-500 to-orchid-500 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all transform hover:scale-105"
            >
              ← Back to Discover
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:bg-gray-950 dark:bg-none">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <Link 
            href="/discover" 
            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
          >
            ← Discover Roasters
          </Link>
        </nav>

        {/* Main Content */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden max-w-6xl mx-auto border border-gray-200 dark:border-gray-700">
          {/* Hero Image Carousel */}
          <div className="relative">
            <ImageCarousel
              images={roasterImages.length > 0 ? roasterImages : [{ 
                id: 'default',
                url: roaster.imageUrl || 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&h=400&fit=crop&auto=format',
                description: roaster.name
              }]}
              altPrefix={roaster.name}
              height="h-64 sm:h-80 lg:h-96"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none z-[5]"></div>
            <div className="absolute bottom-6 left-6 text-white z-20 pointer-events-none">
              <h1 className="text-4xl font-bold mb-2 drop-shadow-lg">{roaster.name}</h1>
              {(roaster.city || roaster.state) && (
                <p className="text-xl flex items-center drop-shadow-lg">
                  <LocationOn sx={{ fontSize: 24, marginRight: 1 }} />
                  {[roaster.city, roaster.state].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
            {/* Overlay share and favorite buttons on image */}
            <div className="absolute top-4 right-4 flex gap-3 z-30">
              <button
                onClick={handleShare}
                className="bg-white text-gray-700 hover:bg-gray-50 p-3 rounded-full shadow-lg transition-all transform hover:scale-110 pointer-events-auto"
                aria-label="Share roaster"
              >
                <Share />
              </button>
              <button
                onClick={toggleFavorite}
                className={`p-3 rounded-full pointer-events-auto ${
                  isFavorite 
                    ? 'bg-red-500 text-white' 
                    : 'bg-white text-red-500 hover:bg-red-50'
                } shadow-lg transition-all transform hover:scale-110`}
              >
                {isFavorite ? <Favorite /> : <FavoriteBorder />}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Info */}
              <div className="lg:col-span-2">
                {/* Rating & Reviews */}
                {showRatings && (
                  <div className="flex items-center mb-6">
                    <div className="flex items-center mr-6">
                      <Star sx={{ fontSize: 32, color: '#fbbf24' }} />
                      <span className="text-2xl font-bold text-gray-900 dark:text-white ml-2">{roaster.rating}</span>
                      <span className="text-gray-500 dark:text-gray-400 ml-2">({roaster.reviewCount} {t('roasterDetail.reviews')})</span>
                    </div>
                  </div>
                )}

                {/* Description */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t('roasterDetail.about')}</h2>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{roaster.description}</p>
                  {roaster.story && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Our Story</h3>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{roaster.story}</p>
                    </div>
                  )}
                </div>

                {/* Specialties */}
                {roaster.specialties && roaster.specialties.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('roasterDetail.specialties')}</h3>
                    <div className="flex flex-wrap gap-3">
                      {roaster.specialties.map((specialty, index) => (
                        <Link
                          key={typeof specialty === 'string' ? specialty : specialty.id || index}
                          href={`/discover?specialty=${encodeURIComponent(getSpecialtyKey(specialty))}`}
                          className="px-4 py-2 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full font-medium hover:bg-primary-200 dark:hover:bg-primary-900/50 hover:text-primary-800 dark:hover:text-primary-300 transition-colors cursor-pointer"
                        >
                          {translateSpecialty(specialty)}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hours / Online Only */}
                {/* Only show Hours section if showHours is true AND not onlineOnly */}
                {roaster.showHours !== false && !roaster.onlineOnly && (
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('roasterDetail.hours')}</h3>
                    {roaster.hours ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {(() => {
                          const hoursData = typeof roaster.hours === 'string' 
                            ? JSON.parse(roaster.hours) 
                            : roaster.hours;
                          
                          // Define day order
                          const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                          
                          // Sort entries by day order
                          const sortedEntries = Object.entries(hoursData).sort(([dayA], [dayB]) => {
                            return dayOrder.indexOf(dayA.toLowerCase()) - dayOrder.indexOf(dayB.toLowerCase());
                          });
                          
                          return sortedEntries.map(([day, hours]) => (
                            <div key={day} className="flex items-center py-1">
                              <span className="font-medium text-gray-700 dark:text-gray-300 w-24">{t(`time.${day.toLowerCase()}`)}:</span>
                              <span className="text-gray-600 dark:text-gray-400 ml-2">
                                {typeof hours === 'string' 
                                  ? formatTime(hours)
                                  : typeof hours === 'object' && hours !== null && 'open' in hours && 'close' in hours
                                    ? formatTime(`${hours.open}-${hours.close}`)
                                    : 'Hours not available'
                                }
                              </span>
                            </div>
                          ));
                        })()}
                      </div>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400">{t('roasterDetail.hoursNotAvailable', 'Hours information not available')}</p>
                    )}
                  </div>
                )}

                {/* Founded */}
                {roaster.founded && (
                  <div className="mb-8">
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">{t('roasterDetail.foundedIn', 'Founded in')}</span> {roaster.founded}
                    </p>
                  </div>
                )}

                {roaster.onlineOnly && (
                  <div className="mb-8">
                    <div className="bg-blue-50 dark:bg-gray-700 border border-blue-200 dark:border-gray-600 rounded-lg p-4">
                      <div className="flex items-center">
                        <Language sx={{ fontSize: 20, color: '#2563eb', marginRight: 1 }} />
                        <span className="text-blue-800 dark:text-blue-400 font-medium">{t('roasterDetail.onlineOnly', 'Online Only')}</span>
                      </div>
                      <p className="text-blue-700 dark:text-gray-300 text-sm mt-2">
                        {t('roasterDetail.onlineOnlyDesc', 'This roaster operates exclusively online with no physical retail location.')}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                <div className="rounded-xl p-6 sticky top-8 flex flex-col min-h-[400px] pl-0">
                  <div className="flex-grow">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('roasterDetail.contactInfo')}</h3>
                    
                    {/* Address */}
                    {(roaster.address || roaster.city || roaster.state) && (
                      <div className="mb-4">
                        <div className="flex items-start">
                          <LocationOn sx={{ fontSize: 20, color: '#6b7280', marginRight: 1, marginTop: 0.25 }} />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{t('roasterDetail.address')}</p>
                            {roaster.address && <p className="text-gray-600 dark:text-gray-300">{roaster.address}</p>}
                            {(roaster.city || roaster.state) && (
                              <p className="text-gray-600 dark:text-gray-300">
                                {[roaster.city, roaster.state].filter(Boolean).join(', ')}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                  {/* Phone */}
                  {roaster.phone && (
                    <div className="mb-4">
                      <div className="flex items-center">
                        <Phone sx={{ fontSize: 20, color: '#6b7280', marginRight: 1 }} />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{t('roasterDetail.phone')}</p>
                          <div className="flex items-center gap-2">
                            <a 
                              href={`tel:${roaster.phone}`}
                              className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                            >
                              {roaster.phone}
                            </a>
                            <a
                              href={`tel:${roaster.phone}`}
                              className="ml-2 px-3 py-1 rounded-lg bg-gradient-to-r from-primary-500 to-orchid-500 text-white hover:shadow-lg transition-all flex items-center justify-center text-sm h-8 min-w-[48px] max-w-[70px]"
                              style={{ fontWeight: 500 }}
                              title={t('roasterDetail.callAction', 'Call')}
                            >
                              {t('roasterDetail.callAction', 'Call')}
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Website */}
                  {roaster.website && (
                    <div className="mb-4">
                      <div className="flex items-center">
                        <Language sx={{ fontSize: 20, color: '#6b7280', marginRight: 1 }} />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">{t('roasterDetail.website')}</p>
                          <a 
                            href={roaster.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                          >
                            {roaster.website.replace(/^https?:\/\//, '')}
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Email */}
                  {roaster.email && (
                    <div className="mb-6">
                      <div className="flex items-center">
                        <Email sx={{ fontSize: 20, color: '#6b7280', marginRight: 1 }} />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{t('roasterDetail.email')}</p>
                          <a 
                            href={`mailto:${roaster.email}`}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline underline cursor-pointer"
                          >
                            {roaster.email}
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                  </div>

                  {/* Social Media Icons - Bottom Aligned */}
                  {hasSocialLinks() && (
                    <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-600">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('roasterDetail.socials')}</h3>
                      {renderSocialIcons()}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Manage Images Button - Outside sidebar, only on mobile */}
            {user && (user.role === 'admin' || 
              (roaster.email && user.email && roaster.email === user.email)
            ) && (
              <div className="mt-6 lg:hidden">
                <Link
                  href={`/roasters/${roaster.id}/images`}
                  className="block w-full bg-blue-600 text-white text-center py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                >
                  <PhotoCamera sx={{ fontSize: 20 }} />
                  {t('roasterDetail.manageImages', 'Manage Images')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
