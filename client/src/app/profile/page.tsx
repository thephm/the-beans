'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { apiClient } from '@/lib/api'

export default function ProfilePage() {
  const { t } = useTranslation()
  const { user, isAuthenticated, loading, refreshUser } = useAuth()
  const router = useRouter()
  
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, loading, router])

  useEffect(() => {
    if (user) {
      setEmail(user.email || '')
      setUsername(user.username || '')
    }
  }, [user])

  const handleSave = async (e: any) => {
    e.preventDefault()
    setMessage(null)
    setIsSaving(true)

    try {
      const updateData: { email?: string; username?: string } = {}
      
      if (email !== user?.email) {
        updateData.email = email
      }
      if (username !== user?.username) {
        updateData.username = username
      }

      if (Object.keys(updateData).length === 0) {
        setMessage({ type: 'error', text: t('profile.noChanges', 'No changes to save') })
        setIsSaving(false)
        return
      }

      const response = await apiClient.updateProfile(updateData)
      setMessage({ type: 'success', text: t('profile.updateSuccess', 'Profile updated successfully') })
      
      // Refresh user data in context
      if (refreshUser) {
        await refreshUser()
      }
    } catch (error: any) {
      console.error('Profile update error:', error)
      setMessage({ 
        type: 'error', 
        text: error.message || t('profile.updateError', 'Failed to update profile') 
      })
    } finally {
      setIsSaving(false)
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
              {t('profile.title')}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              {t('profile.description')}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-xl border border-gray-200 dark:border-gray-700 p-8 max-w-2xl mx-auto">
            <div className="flex items-center space-x-6 mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-orchid-500 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                {user?.username?.slice(0, 2).toUpperCase() || '?'}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {user?.username}
                </h2>
                <p className="text-gray-600 dark:text-gray-300">{user?.email}</p>
              </div>
            </div>

            {message && (
              <div className={`mb-6 p-4 rounded-lg ${
                message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('auth.email')}</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('auth.username')}</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                  minLength={3}
                  maxLength={50}
                />
              </div>

              <div className="pt-4 flex justify-end">
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSaving ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
