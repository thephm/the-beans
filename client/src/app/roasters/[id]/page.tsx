'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import RoasterImage from '@/components/RoasterImage'
import { apiClient } from '@/lib/api'
import { 
  Coffee, 
  LocationOn, 
  Favorite, 
  FavoriteBorder, 
  Language, 
  Phone, 
  Email, 
  PhotoCamera,
  Star
} from '@mui/icons-material'

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
  rating: number
  reviewCount: number
  specialties: string[]
  hours?: {
    [key: string]: string | { open: string; close: string }
  }
  onlineOnly?: boolean
  story?: string
  founded?: string
  owner?: string | { id: string; username: string; firstName: string; lastName: string }
}

export default function RoasterDetail() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const [roaster, setRoaster] = useState<Roaster | null>(null)
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
  const translateSpecialty = (specialty: string): string => {
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
    return specialtyMap[specialty] ? t(specialtyMap[specialty]) : specialty
  }

  useEffect(() => {
    if (params?.id) {
      fetchRoaster(params.id as string)
    }
  }, [params?.id])

  const fetchRoaster = async (id: string) => {
    try {
      setLoading(true)
      const data = await apiClient.getRoaster(id as string) as Roaster
      setRoaster(data)
      
      // Check if roaster is in favorites
      const favorites = JSON.parse(localStorage.getItem('favoriteRoasters') || '[]')
      setIsFavorite(favorites.includes(id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load roaster')
    } finally {
      setLoading(false)
    }
  }

  const toggleFavorite = () => {
    // Check if user is authenticated
    if (!user) {
      router.push('/login')
      return
    }

    if (!roaster) return
    
    const favorites = JSON.parse(localStorage.getItem('favoriteRoasters') || '[]')
    let updatedFavorites
    
    if (isFavorite) {
      updatedFavorites = favorites.filter((id: string) => id !== roaster.id)
    } else {
      updatedFavorites = [...favorites, roaster.id]
    }
    
    localStorage.setItem('favoriteRoasters', JSON.stringify(updatedFavorites))
    setIsFavorite(!isFavorite)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="h-96 bg-gray-200"></div>
              <div className="p-8">
                <div className="h-8 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-6"></div>
                <div className="space-y-3">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="mb-4">
              <Coffee sx={{ fontSize: 96, color: '#6b7280' }} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Roaster Not Found</h2>
            <p className="text-gray-600 mb-6">{error || 'The roaster you\'re looking for doesn\'t exist.'}</p>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <Link 
            href="/discover" 
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            ← Discover Roasters
          </Link>
        </nav>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden max-w-6xl mx-auto">
          {/* Hero Image */}
          <div className="relative h-64 sm:h-80 lg:h-96">
            <RoasterImage
              src={roaster.imageUrl || 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&h=400&fit=crop&auto=format'}
              alt={roaster.name}
              className="w-full h-full object-cover"
              width={800}
              height={400}
            />
            <div className="absolute inset-0 bg-black bg-opacity-20"></div>
            <div className="absolute bottom-6 left-6 text-white">
              <h1 className="text-4xl font-bold mb-2">{roaster.name}</h1>
              {(roaster.city || roaster.state) && (
                <p className="text-xl flex items-center">
                  <LocationOn sx={{ fontSize: 24, marginRight: 1 }} />
                  {[roaster.city, roaster.state].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
            <button
              onClick={toggleFavorite}
              className={`absolute top-6 right-6 p-3 rounded-full ${
                isFavorite 
                  ? 'bg-red-500 text-white' 
                  : 'bg-white text-red-500 hover:bg-red-50'
              } shadow-lg transition-all transform hover:scale-110`}
            >
              {isFavorite ? <Favorite /> : <FavoriteBorder />}
            </button>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Info */}
              <div className="lg:col-span-2">
                {/* Rating & Reviews */}
                <div className="flex items-center mb-6">
                  <div className="flex items-center mr-6">
                    <Star sx={{ fontSize: 32, color: '#fbbf24' }} />
                    <span className="text-2xl font-bold text-gray-900 ml-2">{roaster.rating}</span>
                    <span className="text-gray-500 ml-2">({roaster.reviewCount} {t('roasterDetail.reviews')})</span>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('roasterDetail.about')}</h2>
                  <p className="text-gray-700 leading-relaxed">{roaster.description}</p>
                  {roaster.story && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Our Story</h3>
                      <p className="text-gray-700 leading-relaxed">{roaster.story}</p>
                    </div>
                  )}
                </div>

                {/* Specialties */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{t('roasterDetail.specialties')}</h3>
                  <div className="flex flex-wrap gap-3">
                    {roaster.specialties.map((specialty) => (
                      <Link
                        key={specialty}
                        href={`/discover?specialty=${encodeURIComponent(specialty)}`}
                        className="px-4 py-2 bg-primary-100 text-primary-700 rounded-full font-medium hover:bg-primary-200 hover:text-primary-800 transition-colors cursor-pointer"
                      >
                        {translateSpecialty(specialty)}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Hours / Online Only */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{t('roasterDetail.hours')}</h3>
                  {roaster.onlineOnly ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <Language sx={{ fontSize: 20, color: '#2563eb', marginRight: 1 }} />
                        <span className="text-blue-800 font-medium">{t('roasterDetail.onlineOnly', 'Online Only')}</span>
                      </div>
                      <p className="text-blue-700 text-sm mt-2">
                        {t('roasterDetail.onlineOnlyDesc', 'This roaster operates exclusively online with no physical retail location.')}
                      </p>
                    </div>
                  ) : roaster.hours ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(
                        typeof roaster.hours === 'string' 
                          ? JSON.parse(roaster.hours) 
                          : roaster.hours
                      ).map(([day, hours]) => (
                        <div key={day} className="flex items-center py-1">
                          <span className="font-medium text-gray-700 w-24">{t(`time.${day.toLowerCase()}`)}:</span>
                          <span className="text-gray-600 ml-2">
                            {typeof hours === 'string' 
                              ? formatTime(hours)
                              : typeof hours === 'object' && hours !== null && 'open' in hours && 'close' in hours
                                ? formatTime(`${hours.open}-${hours.close}`)
                                : 'Hours not available'
                            }
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">{t('roasterDetail.hoursNotAvailable', 'Hours information not available')}</p>
                  )}
                </div>
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-gray-50 rounded-xl p-6 sticky top-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{t('roasterDetail.contactInfo')}</h3>
                  
                  {/* Address */}
                  <div className="mb-4">
                    <div className="flex items-start">
                      <LocationOn sx={{ fontSize: 20, color: '#6b7280', marginRight: 1, marginTop: 0.25 }} />
                      <div>
                        <p className="font-medium text-gray-900">{t('roasterDetail.address')}</p>
                        <p className="text-gray-600">{roaster.address}</p>
                        <p className="text-gray-600">{roaster.city}, {roaster.state}</p>
                      </div>
                    </div>
                  </div>

                  {/* Phone */}
                  {roaster.phone && (
                    <div className="mb-4">
                      <div className="flex items-center">
                        <Phone sx={{ fontSize: 20, color: '#6b7280', marginRight: 1 }} />
                        <div>
                          <p className="font-medium text-gray-900">{t('roasterDetail.phone')}</p>
                          <a 
                            href={`tel:${roaster.phone}`}
                            className="text-primary-600 hover:text-primary-700"
                          >
                            {roaster.phone}
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Website */}
                  {roaster.website && (
                    <div className="mb-4">
                      <div className="flex items-center">
                        <Language sx={{ fontSize: 20, color: '#6b7280', marginRight: 1 }} />
                        <div>
                          <p className="font-medium text-gray-900">{t('roasterDetail.website')}</p>
                          <a 
                            href={roaster.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-700"
                          >
                            {t('roasterDetail.visitWebsite')}
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
                          <p className="font-medium text-gray-900">{t('roasterDetail.email')}</p>
                          <a 
                            href={`mailto:${roaster.email}`}
                            className="text-primary-600 hover:text-primary-700"
                          >
                            {roaster.email}
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Founded */}
                  {roaster.founded && (
                    <div className="mb-4 pb-4 border-b border-gray-200">
                      <p className="font-medium text-gray-900">Founded</p>
                      <p className="text-gray-600">{roaster.founded}</p>
                    </div>
                  )}

                  {/* Owner */}
                  {roaster.owner && (
                    <div className="mb-6">
                      <p className="font-medium text-gray-900">{t('roasterDetail.owner')}</p>
                      <p className="text-gray-600">
                        {typeof roaster.owner === 'string' 
                          ? roaster.owner
                          : `${(roaster.owner as any).firstName} ${(roaster.owner as any).lastName}`
                        }
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    {/* Manage Images Button for admins and email match */}
                    {user && (user.role === 'admin' || 
                      (roaster.email && user.email && roaster.email === user.email)
                    ) && (
                      <Link
                        href={`/roasters/${roaster.id}/images`}
                        className="block w-full bg-blue-600 text-white text-center py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                      >
                        <PhotoCamera sx={{ fontSize: 20 }} />
                        {t('roasterDetail.manageImages', 'Manage Images')}
                      </Link>
                    )}
                    
                    <button
                      onClick={toggleFavorite}
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-all transform hover:scale-105 flex items-center justify-center gap-2 ${
                        isFavorite
                          ? 'bg-red-100 text-red-700 border-2 border-red-300 hover:bg-red-200'
                          : 'bg-white border-2 border-red-300 text-red-600 hover:bg-red-50'
                      }`}
                    >
                      {isFavorite ? <Favorite sx={{ fontSize: 20 }} /> : <FavoriteBorder sx={{ fontSize: 20 }} />}
                      {isFavorite ? t('roasterDetail.removeFromFavorites') : t('roasterDetail.addToFavorites')}
                    </button>
                    
                    {roaster.website && (
                      <a
                        href={roaster.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full bg-gradient-to-r from-primary-500 to-orchid-500 text-white text-center py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                      >
                        {t('roasterDetail.visitWebsite')}
                        <Language sx={{ fontSize: 20 }} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
