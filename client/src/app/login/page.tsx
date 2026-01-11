'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import { apiClient } from '@/lib/api'
import { trackAnalytics } from '@/lib/analytics'
import { Email, VpnKey } from '@mui/icons-material'

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()
  const { t } = useTranslation()

  // Check for error parameter on mount
  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam === 'session_expired') {
      setError(t('auth.sessionExpired', 'Your session has expired. Please login again.'))
    }
  }, [searchParams, t])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const data = await apiClient.login(formData) as { token: string; user: any }
      login(data.token, data.user)
      trackAnalytics('login', { email: formData.email })
      
      // Check for redirect parameter
      const redirect = searchParams.get('redirect')
      if (redirect) {
        router.push(redirect)
      } else {
        router.push('/discover')
      }
    } catch (error: any) {
      if (error.message && error.message.toLowerCase().includes('deprecated')) {
  setError(t('auth.deprecatedAccount', 'This account has been deprecated.'));
      } else {
        setError(error.message || 'Login failed');
      }
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-lavender-50 via-white to-orchid-50 dark:bg-gray-950 dark:bg-none flex items-center justify-center pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-primary-700 to-orchid-600 bg-clip-text text-transparent mb-6">{t('auth.welcomeBack')}</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            {t('auth.signInToDiscover')}
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-xl border border-gray-200 dark:border-gray-700 p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('auth.email')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
                placeholder={t('auth.email')}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('auth.password')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
                placeholder={t('auth.password')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  {t('auth.rememberMe')}
                </label>
              </div>

              <div className="text-sm">
                <button
                  type="button"
                  className="text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 focus:outline-none"
                  onClick={() => router.push('/forgot-password')}
                >
                  {t('auth.forgotPassword')}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary-500 to-orchid-500 text-white py-3 px-4 rounded-lg hover:shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
            >
              {loading ? t('auth.signingIn') : t('auth.signIn')}
            </button>
          </form>

          {/* Social Login */}

        </div>

        {/* Sign up link */}
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-300">
            {t('auth.dontHaveAccount')}{' '}
            <Link href="/signup" className="text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 font-medium">
              {t('auth.signUpForFree')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
// force recompile
