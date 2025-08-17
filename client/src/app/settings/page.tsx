'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function SettingsPage() {
  const { t } = useTranslation()
  const { isAuthenticated, loading, user } = useAuth()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  
  // Form state
  const [settings, setSettings] = useState({
    notifications: {
      newRoasters: true,
      promotions: true,
      recommendations: false
    },
    privacy: {
      showProfile: true,
      allowLocationTracking: false
    },
    preferences: {
      roastLevel: 'no-preference',
      brewingMethods: {
        espresso: false,
        pourOver: false,
        frenchPress: false,
        coldBrew: false
      }
    }
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
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:5000/api/users/settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSuccess(false)
    
    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch('http://localhost:5000/api/users/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      })
      
      if (response.ok) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        console.error('Failed to save settings, status:', response.status)
      }
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-lavender-50 via-white to-orchid-50 flex items-center justify-center">
      <div className="text-xl">{t('common.loading')}</div>
    </div>
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-lavender-50 via-white to-orchid-50">
      <div className="pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-primary-700 to-orchid-600 bg-clip-text text-transparent mb-6">
              {t('settings.title')}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('settings.description')}
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl mx-auto">
            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800">{t('settings.saveSuccess')}</p>
              </div>
            )}
            
            <div className="space-y-8">
              {/* Notifications */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('settings.notifications')}</h3>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={settings.notifications.newRoasters}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, newRoasters: e.target.checked }
                      }))}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" 
                    />
                    <span className="ml-3 text-gray-700">{t('settings.newRoasters')}</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={settings.notifications.promotions}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, promotions: e.target.checked }
                      }))}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" 
                    />
                    <span className="ml-3 text-gray-700">{t('settings.promotions')}</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={settings.notifications.recommendations}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, recommendations: e.target.checked }
                      }))}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" 
                    />
                    <span className="ml-3 text-gray-700">{t('settings.recommendations')}</span>
                  </label>
                </div>
              </div>

              {/* Privacy */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy</h3>
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
                    <span className="ml-3 text-gray-700">{t('settings.showProfile')}</span>
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
                    <span className="ml-3 text-gray-700">{t('settings.allowLocationTracking')}</span>
                  </label>
                </div>
              </div>

              {/* Preferences */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Coffee Preferences</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Preferred roast level</label>
                    <select 
                      value={settings.preferences.roastLevel}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        preferences: { ...prev.preferences, roastLevel: e.target.value }
                      }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="light">Light roast</option>
                      <option value="medium">Medium roast</option>
                      <option value="dark">Dark roast</option>
                      <option value="no-preference">No preference</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Brewing methods</label>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex items-center">
                        <input 
                          type="checkbox" 
                          checked={settings.preferences.brewingMethods.espresso}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            preferences: { 
                              ...prev.preferences, 
                              brewingMethods: { ...prev.preferences.brewingMethods, espresso: e.target.checked }
                            }
                          }))}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" 
                        />
                        <span className="ml-2 text-sm text-gray-700">Espresso</span>
                      </label>
                      <label className="flex items-center">
                        <input 
                          type="checkbox" 
                          checked={settings.preferences.brewingMethods.pourOver}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            preferences: { 
                              ...prev.preferences, 
                              brewingMethods: { ...prev.preferences.brewingMethods, pourOver: e.target.checked }
                            }
                          }))}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" 
                        />
                        <span className="ml-2 text-sm text-gray-700">Pour over</span>
                      </label>
                      <label className="flex items-center">
                        <input 
                          type="checkbox" 
                          checked={settings.preferences.brewingMethods.frenchPress}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            preferences: { 
                              ...prev.preferences, 
                              brewingMethods: { ...prev.preferences.brewingMethods, frenchPress: e.target.checked }
                            }
                          }))}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" 
                        />
                        <span className="ml-2 text-sm text-gray-700">French press</span>
                      </label>
                      <label className="flex items-center">
                        <input 
                          type="checkbox" 
                          checked={settings.preferences.brewingMethods.coldBrew}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            preferences: { 
                              ...prev.preferences, 
                              brewingMethods: { ...prev.preferences.brewingMethods, coldBrew: e.target.checked }
                            }
                          }))}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" 
                        />
                        <span className="ml-2 text-sm text-gray-700">Cold brew</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={saving}
                  onClick={(e) => {
                    console.log('🎯 BUTTON CLICKED DIRECTLY! Event type:', e.type)
                  }}
                  className="bg-gradient-to-r from-primary-500 to-orchid-500 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
