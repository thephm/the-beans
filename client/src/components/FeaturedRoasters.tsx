'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

// Mock data - in a real app, this would come from your API
const featuredRoasters = [
  {
    id: 1,
    name: 'Purple Mountain Coffee',
    location: 'Seattle, WA',
    image: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400&h=300&fit=crop',
    rating: 4.8,
    specialty: 'Single Origin Ethiopian',
    distance: '2.3 miles',
    description: 'Award-winning roaster specializing in light roasts and pour-over brewing methods.',
  },
  {
    id: 2,
    name: 'Lavender Bean Co.',
    location: 'Portland, OR',
    image: 'https://images.unsplash.com/photo-1442550528053-c431ecb55509?w=400&h=300&fit=crop',
    rating: 4.9,
    specialty: 'Espresso Blends',
    distance: '4.1 miles',
    description: 'Family-owned roastery with three cafe locations and online ordering.',
  },
  {
    id: 3,
    name: 'Violet Coffee Works',
    location: 'San Francisco, CA',
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=300&fit=crop',
    rating: 4.7,
    specialty: 'Cold Brew',
    distance: '1.8 miles',
    description: 'Modern roastery focusing on sustainable sourcing and innovative brewing techniques.',
  },
]

export function FeaturedRoasters() {
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
            Featured{' '}
            <span className="bg-gradient-to-r from-primary-600 to-orchid-600 bg-clip-text text-transparent">
              Coffee Roasters
            </span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover some of the most beloved coffee roasters in your area, handpicked for their quality and community impact
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
                <Image
                  src={roaster.image}
                  alt={roaster.name}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-4 right-4 bg-white rounded-full px-3 py-1 text-sm font-medium text-primary-600">
                  ⭐ {roaster.rating}
                </div>
                <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
                  📍 {roaster.distance}
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{roaster.name}</h3>
                <p className="text-gray-600 mb-2">📍 {roaster.location}</p>
                <p className="text-primary-600 font-medium mb-3">☕ {roaster.specialty}</p>
                <p className="text-gray-600 text-sm mb-4">{roaster.description}</p>
                
                <div className="flex gap-2">
                  <Link
                    href={`/roasters/${roaster.id}`}
                    className="flex-1 bg-gradient-to-r from-primary-500 to-orchid-500 text-white px-4 py-2 rounded-lg text-center font-medium hover:shadow-lg transition-all transform hover:scale-105"
                  >
                    View Details
                  </Link>
                  <button className="px-4 py-2 border-2 border-primary-200 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors">
                    💜
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
            href="/roasters"
            className="inline-flex items-center px-8 py-4 bg-white text-primary-600 rounded-xl font-semibold border-2 border-primary-200 hover:border-primary-400 hover:bg-primary-50 transition-all"
          >
            Explore All Roasters
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
