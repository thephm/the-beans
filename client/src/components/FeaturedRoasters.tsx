'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { RoasterCard } from './RoasterCard'
import { apiClient } from '@/lib/api'

interface Specialty {
  id: string
  name: string
  deprecated?: boolean
}

interface Roaster {
  id: string
  name: string
  city: string
  state: string
  rating: number
  specialties: Specialty[]
  description: string
  imageUrl: string
  latitude?: number
  longitude?: number
}

export function FeaturedRoasters() {
  const { t, i18n } = useTranslation()
  const [featuredRoasters, setFeaturedRoasters] = useState<Roaster[]>([])
  const [loading, setLoading] = useState(true)
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setUserLocation(null)
      )
    }
  }, [])

  useEffect(() => {
    fetchFeaturedRoasters()
  }, [i18n.language])

  const fetchFeaturedRoasters = async () => {
    try {
      const data = await apiClient.getRoasters({ limit: 3 }) as any
      
      // Sort specialties alphabetically for each roaster
      const roastersWithSortedSpecialties = (data.roasters || []).map((roaster: Roaster) => {
        return {
          ...roaster,
          specialties: roaster.specialties && roaster.specialties.length > 0
            ? [...roaster.specialties].sort((a, b) => {
                const nameA = typeof a === 'string' ? a : (a.name || '');
                const nameB = typeof b === 'string' ? b : (b.name || '');
                return nameA.localeCompare(nameB);
              })
            : roaster.specialties
        };
      });
      
      setFeaturedRoasters(roastersWithSortedSpecialties)
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
              className="opacity-100"
            >
              <RoasterCard
                roaster={roaster}
                userLocation={userLocation}
                returnTo="/"
              />
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
