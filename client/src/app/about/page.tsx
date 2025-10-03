'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { Coffee, Map, Group, Star } from '@mui/icons-material'
import { useAuth } from '@/contexts/AuthContext'

export default function AboutPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-lavender-50 via-white to-orchid-50">
      <div className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-primary-700 to-orchid-600 bg-clip-text text-transparent mb-6">
              {t('about.title')}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('about.subtitle')}
            </p>
          </div>

          {/* Mission Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-orchid-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Coffee sx={{ color: 'white', fontSize: 32 }} />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('about.mission.title')}</h2>
            </div>
            <p className="text-lg text-gray-700 text-center leading-relaxed">
              {t('about.mission.description')}
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Map sx={{ color: '#2563eb', fontSize: 24 }} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{t('about.features.discoverLocal.title')}</h3>
              <p className="text-gray-600">
                {t('about.features.discoverLocal.description')}
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <div className="w-12 h-12 bg-orchid-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Group sx={{ color: '#a855f7', fontSize: 24 }} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{t('about.features.buildCommunity.title')}</h3>
              <p className="text-gray-600">
                {t('about.features.buildCommunity.description')}
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <div className="w-12 h-12 bg-lavender-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star sx={{ color: '#8b5cf6', fontSize: 24 }} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{t('about.features.qualityFirst.title')}</h3>
              <p className="text-gray-600">
                {t('about.features.qualityFirst.description')}
              </p>
            </div>
          </div>

          {/* Story Section */}
          <div className="bg-gradient-to-r from-primary-500 to-orchid-500 rounded-2xl p-8 text-white mb-12">
            <h2 className="text-3xl font-bold mb-6 text-center">{t('about.story.title')}</h2>
            <div className="max-w-3xl mx-auto">
              <p className="text-lg leading-relaxed mb-4">
                {t('about.story.paragraph1')}
              </p>
              <p className="text-lg leading-relaxed mb-4">
                {t('about.story.paragraph2')}
              </p>
              <p className="text-lg leading-relaxed">
                {t('about.story.paragraph3')}
              </p>
            </div>
          </div>

          {/* Values Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">{t('about.values.title')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold text-primary-600 mb-3">{t('about.values.sustainability.title')}</h3>
                <p className="text-gray-700">
                  {t('about.values.sustainability.description')}
                </p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-orchid-600 mb-3">{t('about.values.community.title')}</h3>
                <p className="text-gray-700">
                  {t('about.values.community.description')}
                </p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-lavender-600 mb-3">{t('about.values.quality.title')}</h3>
                <p className="text-gray-700">
                  {t('about.values.quality.description')}
                </p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-primary-600 mb-3">{t('about.values.innovation.title')}</h3>
                <p className="text-gray-700">
                  {t('about.values.innovation.description')}
                </p>
              </div>
            </div>
          </div>

          {/* Team Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">{t('about.team.title')}</h2>
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-orchid-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Coffee sx={{ color: 'white', fontSize: 48 }} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t('about.team.subtitle')}</h3>
              <p className="text-gray-600 max-w-2xl mx-auto">
                {t('about.team.description')}
              </p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">{t('about.cta.title')}</h2>
            <p className="text-xl text-gray-600 mb-8">
              {t('about.cta.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/discover"
                className="bg-gradient-to-r from-primary-500 to-orchid-500 text-white px-8 py-3 rounded-lg hover:shadow-lg transition-all transform hover:scale-105 text-lg"
              >
                {t('about.cta.startExploring')}
              </Link>
              {!user && (
                <Link
                  href="/signup"
                  className="border-2 border-primary-500 text-primary-600 px-8 py-3 rounded-lg hover:bg-primary-50 transition-colors text-lg"
                >
                  {t('about.cta.joinCommunity')}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
