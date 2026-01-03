'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

import { useEffect, useState, useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '@/contexts/LanguageContext'
import { apiClient } from '@/lib/api'

export default function SettingsPage() {
  const { t } = useTranslation()
  const { isAuthenticated, loading, user } = useAuth()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const languageContext = useLanguage()
  
  // Form state
  const [settings, setSettings] = useState({
    notifications: {
    },
    privacy: {
      showProfile: true,
      allowLocationTracking: false
    },
    preferences: {
      roastLevel: 'no-preference',
      distanceUnit: 'km', // 'km' (default) or 'mi'
      searchRadius: 25 // Default search radius in km (1-20,037)
    },
    language: user?.language || 'en',
  })

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, loading, router])

  // Load existing settings when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadSettings()
    }
  }, [isAuthenticated, user])

  const loadSettings = async () => {
    try {
      const data = await apiClient.getUserSettings() as any
      setSettings((prev) => ({ ...prev, ...data.settings, language: user?.language || 'en' }))
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSuccess(false)
    try {
      // Save language preference if changed
      if (languageContext && settings.language !== user?.language) {
        await languageContext.changeLanguage(settings.language)
      }
      await apiClient.updateUserSettings(settings)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      localStorage.setItem('settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-lavender-50 via-white to-orchid-50 dark:bg-gray-950 dark:bg-none flex items-center justify-center">
      <div className="text-xl">{t('common.loading')}</div>
    </div>
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-lavender-50 via-white to-orchid-50 dark:bg-gray-950 dark:bg-none">
      <div className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-primary-700 to-orchid-600 bg-clip-text text-transparent mb-6 leading-normal pb-2">
              {t('settings.title')}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              <span className="sm:hidden">{t('settings.descriptionMobile')}</span>
              <span className="hidden sm:inline">{t('settings.description')}</span>
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-xl border border-gray-200 dark:border-gray-700 p-8 max-w-2xl mx-auto">
            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800">{t('settings.saveSuccess')}</p>
              </div>
            )}
            
            <div className="space-y-8">
              {/* Preferences (Language & Distance Unit) */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('settings.preferences')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Language Preference */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('settings.language')}</label>
                    <select
                      value={settings.language}
                      onChange={e => setSettings(prev => ({ ...prev, language: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {languageContext?.supportedLanguages.map(lang => (
                        <option key={lang.code} value={lang.code}>{lang.nativeName}</option>
                      ))}
                    </select>
                  </div>
                  {/* Distance Unit */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('distanceUnit')}</label>
                    <select
                      value={settings.preferences.distanceUnit}
                      onChange={e => setSettings(prev => ({
                        ...prev,
                        preferences: { ...prev.preferences, distanceUnit: e.target.value }
                      }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="km">{t('km')}</option>
                      <option value="mi">{t('mi')}</option>
                    </select>
                  </div>
                </div>
                {/* Search Radius */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('settings.searchRadius')} (km)</label>
                  <input
                    type="number"
                    min="1"
                    max="20037"
                    value={settings.preferences.searchRadius}
                    onChange={e => {
                      const inputValue = e.target.value
                      // Allow empty field
                      if (inputValue === '') {
                        setSettings(prev => ({
                          ...prev,
                          preferences: { ...prev.preferences, searchRadius: '' as any }
                        }))
                        return
                      }
                      const value = parseInt(inputValue)
                      if (!isNaN(value) && value >= 1 && value <= 20037) {
                        setSettings(prev => ({
                          ...prev,
                          preferences: { ...prev.preferences, searchRadius: value }
                        }))
                      }
                    }}
                    onBlur={e => {
                      // On blur, ensure we have a valid value or reset to default
                      const value = parseInt(e.target.value)
                      if (isNaN(value) || value < 1) {
                        setSettings(prev => ({
                          ...prev,
                          preferences: { ...prev.preferences, searchRadius: 25 }
                        }))
                      }
                    }}
                    className="w-32 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="25"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('settings.searchRadiusHint', 'Enter a value between 1 and 20,037 km')}</p>
                </div>
              </div>
              {/* Privacy */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Privacy</h3>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={settings.privacy.showProfile}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        privacy: { ...prev.privacy, showProfile: e.target.checked }
                      }))}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" 
                    />
                    <span className="ml-3 text-gray-700 dark:text-gray-300">{t('settings.showProfile')}</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={settings.privacy.allowLocationTracking}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        privacy: { ...prev.privacy, allowLocationTracking: e.target.checked }
                      }))}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" 
                    />
                    <span className="ml-3 text-gray-700 dark:text-gray-300">{t('settings.allowLocationTracking')}</span>
                  </label>
                </div>
              </div>

              {/* Coffee Preferences */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('settings.coffeePreferences')}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('settings.roastLevel')}</label>
                    <select 
                      value={settings.preferences.roastLevel}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        preferences: { ...prev.preferences, roastLevel: e.target.value }
                      }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="light">{t('settings.light')} roast</option>
                      <option value="medium">{t('settings.medium')} roast</option>
                      <option value="dark">{t('settings.dark')} roast</option>
                      <option value="no-preference">{t('settings.noPreference')}</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button 
                  type="submit"
                  disabled={saving}
                  className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
