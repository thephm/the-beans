'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import { apiClient } from '@/lib/api'
import { Email, VpnKey } from '@mui/icons-material'

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { login } = useAuth()
  const { t } = useTranslation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const data = await apiClient.login(formData) as { token: string; user: any }
      login(data.token, data.user)
      router.push('/discover')
    } catch (error: any) {
      setError(error.message || 'Login failed')
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
    <div className="min-h-screen bg-gradient-to-br from-lavender-50 via-white to-orchid-50 flex items-center justify-center pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-primary-700 to-orchid-600 bg-clip-text text-transparent mb-6">{t('auth.welcomeBack')}</h2>
          <p className="mt-2 text-gray-600">
            {t('auth.signInToDiscover')}
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder={t('auth.email')}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                placeholder={t('auth.password')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded text-gray-900"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  {t('auth.rememberMe')}
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="text-primary-600 hover:text-primary-500">
                  {t('auth.forgotPassword')}
                </a>
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

          {/* Demo Account */}
          <div className="mt-6 p-4 bg-lavender-50 rounded-lg border border-lavender-200">
            <h3 className="text-sm font-medium text-lavender-800 mb-2">{t('auth.demo.title')}</h3>
            <p className="text-sm text-lavender-700">
              <span className="flex items-center gap-1 mb-1">
                <Email sx={{ fontSize: 16 }} />
                Email: coffee@lover.com
              </span>
              <span className="flex items-center gap-1">
                <VpnKey sx={{ fontSize: 16 }} />
                Password: password123
              </span>
            </p>
            <button
              onClick={() => setFormData({ email: 'coffee@lover.com', password: 'password123' })}
              className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              {t('auth.demo.fillCredentials')}
            </button>
          </div>

          {/* Social Login */}

        </div>

        {/* Sign up link */}
        <div className="text-center">
          <p className="text-gray-600">
            {t('auth.dontHaveAccount')}{' '}
            <Link href="/signup" className="text-primary-600 hover:text-primary-500 font-medium">
              {t('auth.signUpForFree')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
// force recompile
