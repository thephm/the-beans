'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import RoasterImage from './RoasterImage'
import { apiClient } from '@/lib/api'
import { Star, LocationOn, Favorite, FavoriteBorder } from '@mui/icons-material'

interface Roaster {
  id: string
  name: string
  city: string
  state: string
  rating: number
  specialties: string[]
  description: string
  imageUrl: string
  latitude?: number
  longitude?: number
}

export function FeaturedRoasters() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const [featuredRoasters, setFeaturedRoasters] = useState<Roaster[]>([])
  const [loading, setLoading] = useState(true)
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)
  const [distanceUnit, setDistanceUnit] = useState<'km' | 'mi'>('km')
  const [favorites, setFavorites] = useState<string[]>([])
  // Always use the latest value from localStorage on every render
  useEffect(() => {
    const settings = JSON.parse(localStorage.getItem('settings') || '{}');
    setDistanceUnit(settings?.preferences?.distanceUnit || 'km');
    const savedFavorites = JSON.parse(localStorage.getItem('favoriteRoasters') || '[]');
    setFavorites(savedFavorites)
  }, []);

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

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setUserLocation(null)
      )
    }
  }, [])
  // Haversine formula to calculate distance between two lat/lng points
  function calcDistance(lat1: number, lng1: number, lat2: number, lng2: number, unit: 'km' | 'mi') {
    const toRad = (v: number) => v * Math.PI / 180
    const R = unit === 'mi' ? 3958.8 : 6371
    const dLat = toRad(lat2 - lat1)
    const dLng = toRad(lng2 - lng1)
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  // Translate specialty using i18n keys matching backend data
  const translateSpecialty = (specialty: string) => {
    if (!specialty) return '';
    let key = specialty;
    // If specialty already starts with 'specialties.', use as-is
    if (!key.startsWith('specialties.')) {
      // Convert to camelCase key
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

  useEffect(() => {
    fetchFeaturedRoasters()
  }, [i18n.language])

  const fetchFeaturedRoasters = async () => {
    try {
      const data = await apiClient.getRoasters({ limit: 3 }) as any
      setFeaturedRoasters(data.roasters || [])
    } catch (error) {
      console.error('Failed to fetch featured roasters:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-50 via-lavender-50 to-orchid-50">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-lg text-gray-600">Loading featured roasters...</div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-50 via-lavender-50 to-orchid-50">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12 opacity-100"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            {t('roasters.featured')}{' '}
            <span className="bg-gradient-to-r from-primary-600 to-orchid-600 bg-clip-text text-transparent">
              <span className="sm:hidden">Roasters</span>
              <span className="hidden sm:inline">Coffee Roasters</span>
            </span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            <span className="block sm:hidden">{t('roasters.featuredDescriptionMobile')}</span>
            <span className="hidden sm:block">{t('roasters.featuredDescription')}</span>
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredRoasters.map((roaster, index) => (
            <motion.div
              key={roaster.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all opacity-100"
            >
              <div className="relative h-48">
                <RoasterImage
                  src={roaster.imageUrl || 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400&h=300&fit=crop'}
                  alt={roaster.name}
                  className="w-full h-full object-cover"
                  width={400}
                  height={300}
                />
                <div className="absolute top-4 right-4 bg-white rounded-full px-3 py-1 text-sm font-medium text-primary-600 flex items-center gap-1">
                  <Star sx={{ fontSize: 16 }} />
                  {roaster.rating}
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{roaster.name}</h3>
                {(roaster.city || roaster.state) && (
                  <p className="text-gray-600 mb-2 flex items-center">
                    <LocationOn sx={{ fontSize: 16, marginRight: 0.5 }} />
                    {[roaster.city, roaster.state].filter(Boolean).join(', ')}
                  </p>
                )}
                {userLocation && roaster.latitude && roaster.longitude ? (() => {
                  const dist = calcDistance(userLocation.lat, userLocation.lng, roaster.latitude, roaster.longitude, distanceUnit);
                  if (isFinite(dist) && !isNaN(dist)) {
                    return (
                      <p className="text-gray-600 mb-2">
                        {dist.toFixed(1)} {distanceUnit === 'mi' ? t('mi').toLowerCase() : t('km').toLowerCase()}
                      </p>
                    );
                  }
                  return null;
                })() : null}
                <div className="flex flex-wrap gap-2 mb-3">
                  {roaster.specialties && roaster.specialties.length > 0 ? (
                    roaster.specialties.map((spec) => (
                      <Link
                        key={spec}
                        href={`/discover?specialty=${encodeURIComponent(spec)}`}
                        className="inline-block bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-xs font-semibold border border-primary-200 hover:bg-primary-100 transition-colors"
                      >
                        {translateSpecialty(spec)}
                      </Link>
                    ))
                  ) : (
                    <span className="inline-block bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-xs font-semibold border border-primary-200">
                      {t('specialties.artisanal')}
                    </span>
                  )}
                </div>
                <p className="text-gray-600 text-sm mb-4">{roaster.description}</p>
                <div className="flex gap-2">
                  <Link
                    href={`/roasters/${roaster.id}`}
                    className="flex-1 bg-gradient-to-r from-primary-500 to-orchid-500 text-white px-4 py-2 rounded-lg text-center font-medium hover:shadow-lg transition-all transform hover:scale-105"
                  >
                    {t('roasters.viewDetails')}
                  </Link>
                  {user?.role === 'admin' && (
                    <Link
                      href={`/admin/roasters?edit=${roaster.id}&returnTo=/`}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all transform hover:scale-105"
                    >
                      Edit
                    </Link>
                  )}
                  <button
                    className={`px-4 py-2 border-2 rounded-lg transition-colors ${
                      favorites.includes(roaster.id)
                        ? 'border-red-300 text-red-600 bg-red-100 hover:bg-red-200'
                        : 'border-primary-200 text-primary-600 hover:bg-primary-50'
                    }`}
                    onClick={() => toggleFavorite(roaster.id)}
                    aria-label={favorites.includes(roaster.id) ? t('roasterDetail.removeFromFavorites') : t('roasterDetail.addToFavorites')}
                  >
                    {favorites.includes(roaster.id) ? <Favorite sx={{ fontSize: 20 }} /> : <FavoriteBorder sx={{ fontSize: 20 }} />}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center mt-12 opacity-100"
        >
          <Link
            href="/discover"
            className="inline-flex items-center px-8 py-4 bg-white text-primary-600 rounded-xl font-semibold border-2 border-primary-200 hover:border-primary-400 hover:bg-primary-50 transition-all"
          >
            {t('discover.title')}
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
