'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'

export function Hero() {
  const { t } = useTranslation()
  
  return (
    <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-lavender-50 via-primary-50 to-orchid-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="opacity-100" // Fallback for SSR
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              {t('hero.title')}
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              {t('hero.subtitle')}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 opacity-100"
          >
            <Link
              href="/discover"
              className="bg-gradient-to-r from-primary-500 to-orchid-500 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
            >
              🌍 Find Roasters Near Me
            </Link>
            <Link
              href="/signup"
              className="bg-white text-primary-600 px-8 py-4 rounded-xl font-semibold text-lg border-2 border-primary-200 hover:border-primary-400 hover:bg-primary-50 transition-all"
            >
              ☕ Join The Community
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="relative opacity-100"
          >
            <div className="bg-white rounded-2xl shadow-2xl p-8 mx-auto max-w-4xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-violet-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📍</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Location-Based</h3>
                  <p className="text-gray-600">Find roasters and cafes near your location</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-orchid-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">☕</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Quality Beans</h3>
                  <p className="text-gray-600">Discover fresh, artisanal coffee roasters</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-orchid-500 to-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">💜</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Community</h3>
                  <p className="text-gray-600">Connect with fellow coffee enthusiasts</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
