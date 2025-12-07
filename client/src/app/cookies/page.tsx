'use client'

import { useTranslation } from 'react-i18next'
import { Coffee, Security, Info } from '@mui/icons-material'

export default function CookiePolicyPage() {
  const { t } = useTranslation()
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-lavender-50 via-white to-orchid-50 dark:bg-gray-950 dark:bg-none">
      <div className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-orchid-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Coffee sx={{ color: 'white', fontSize: 40 }} />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-primary-700 to-orchid-600 bg-clip-text text-transparent mb-6">
              {t('cookies.title')}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('cookies.subtitle')}
            </p>
          </div>

          {/* What Are Cookies Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <Info sx={{ color: '#2563eb', fontSize: 24 }} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{t('cookies.whatAreCookies.title')}</h2>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('cookies.whatAreCookies.description')}
            </p>
            <p className="text-gray-700 leading-relaxed">
              {t('cookies.whatAreCookies.analogy')}
            </p>
          </div>

          {/* How We Use Cookies Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                <Security sx={{ color: '#059669', fontSize: 24 }} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{t('cookies.howWeUse.title')}</h2>
            </div>
            <div className="space-y-6">
              {/* Essential Cookies */}
              <div className="border-l-4 border-primary-500 pl-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t('cookies.howWeUse.essential.title')}
                </h3>
                <p className="text-gray-700">
                  {t('cookies.howWeUse.essential.description')}
                </p>
              </div>

              {/* Analytics Cookies */}
              <div className="border-l-4 border-orchid-500 pl-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t('cookies.howWeUse.analytics.title')}
                </h3>
                <p className="text-gray-700">
                  {t('cookies.howWeUse.analytics.description')}
                </p>
              </div>

              {/* Preference Cookies */}
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t('cookies.howWeUse.preferences.title')}
                </h3>
                <p className="text-gray-700">
                  {t('cookies.howWeUse.preferences.description')}
                </p>
              </div>
            </div>
          </div>

          {/* Managing Cookies Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('cookies.managing.title')}</h2>
            <div className="space-y-4">
              <p className="text-gray-700">
                {t('cookies.managing.description')}
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t('cookies.managing.browserSettings.title')}
                </h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>{t('cookies.managing.browserSettings.chrome')}</li>
                  <li>{t('cookies.managing.browserSettings.firefox')}</li>
                  <li>{t('cookies.managing.browserSettings.safari')}</li>
                  <li>{t('cookies.managing.browserSettings.edge')}</li>
                </ul>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800">
                  <strong>{t('cookies.managing.warning.title')}</strong> {t('cookies.managing.warning.description')}
                </p>
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('cookies.contact.title')}</h2>
            <p className="text-gray-700 mb-4">
              {t('cookies.contact.description')}
            </p>
            <div className="bg-primary-50 rounded-lg p-4">
              <p className="text-primary-800">
                <strong>{t('cookies.contact.email')}</strong> hello@thebeans.app
              </p>
            </div>
          </div>

          {/* Last Updated */}
          <div className="text-center mt-8">
            <p className="text-gray-500 text-sm">
              {t('cookies.lastUpdated')} October 3, 2025
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}