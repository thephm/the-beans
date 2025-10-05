'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import { LanguageSelector } from './LanguageSelector'
import { UserMenu } from './UserMenu'
import { Coffee } from '@mui/icons-material'

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false)
  const { user, logout, loading } = useAuth()
  const { t } = useTranslation()
  const adminMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (adminMenuRef.current && !adminMenuRef.current.contains(event.target as Node)) {
        setIsAdminMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[9999] transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-lavender-200' 
          : 'bg-white/90 backdrop-blur-sm shadow-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-orchid-500 rounded-lg flex items-center justify-center">
              <Coffee sx={{ color: 'white', fontSize: 16 }} />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-primary-700 to-orchid-600 bg-clip-text text-transparent">
              {t('app.name')}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/discover" className="text-gray-700 hover:text-primary-600 transition-colors">
              {t('nav.discover')}
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-primary-600 transition-colors">
              {t('nav.about')}
            </Link>
            <Link href="/favorites" className="text-gray-700 hover:text-primary-600 transition-colors">
              {t('nav.favorites')}
            </Link>
            {user?.role === 'admin' && (
              <div className="relative" ref={adminMenuRef}>
                <button
                  onClick={() => setIsAdminMenuOpen(!isAdminMenuOpen)}
                  className="flex items-center text-gray-700 hover:text-gray-900 font-semibold transition-colors"
                >
                  {t('admin.title', 'Admin')}
                  <svg 
                    className={`ml-1 w-4 h-4 transition-transform ${isAdminMenuOpen ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isAdminMenuOpen && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <Link 
                      href="/admin/users" 
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-colors"
                      onClick={() => setIsAdminMenuOpen(false)}
                    >
                      {t('adminSection.users', 'Users')}
                    </Link>
                    <Link 
                      href="/admin/roasters" 
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-colors"
                      onClick={() => {
                        setIsAdminMenuOpen(false);
                        // Force a full navigation to clear query parameters
                        window.location.href = '/admin/roasters';
                      }}
                    >
                      {t('adminSection.roasters', 'Roasters')}
                    </Link>
                    <Link 
                      href="/admin/audit-logs" 
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-colors"
                      onClick={() => setIsAdminMenuOpen(false)}
                    >
                      {t('adminSection.auditLogs', 'Audit Logs')}
                    </Link>
                  </div>
                )}
              </div>
            )}
            
            {/* Language Selector */}
            <LanguageSelector />
            
            {/* Authentication Section */}
            {loading ? (
              <div className="w-8 h-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent"></div>
            ) : user ? (
              <UserMenu />
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="/login" className="text-gray-700 hover:text-primary-600 transition-colors">
                  {t('nav.login')}
                </Link>
                <Link 
                  href="/signup" 
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  {t('nav.signup')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-lavender-100 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div
            className="md:hidden border-t border-lavender-200 mt-2 pt-4 pb-4"
          >
            <div className="flex flex-col space-y-3">
              <Link href="/discover" className="text-gray-700 hover:text-primary-600 py-2" onClick={() => setIsMobileMenuOpen(false)}>
                {t('nav.discover')}
              </Link>
              <Link href="/about" className="text-gray-700 hover:text-primary-600 py-2" onClick={() => setIsMobileMenuOpen(false)}>
                {t('nav.about')}
              </Link>
              <Link href="/favorites" className="text-gray-700 hover:text-primary-600 py-2" onClick={() => setIsMobileMenuOpen(false)}>
                {t('nav.favorites')}
              </Link>
              {user?.role === 'admin' && (
                <div className="py-2">
                  <div className="text-gray-700 font-semibold mb-2">{t('admin.title', 'Admin')}</div>
                  <Link 
                    href="/admin/users" 
                    className="block pl-4 text-gray-600 hover:text-primary-600 py-1" 
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t('adminSection.users', 'Users')}
                  </Link>
                  <Link 
                    href="/admin/roasters" 
                    className="block pl-4 text-gray-600 hover:text-primary-600 py-1" 
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      // Force a full navigation to clear query parameters
                      window.location.href = '/admin/roasters';
                    }}
                  >
                    {t('adminSection.roasters', 'Roasters')}
                  </Link>
                  <Link 
                    href="/admin/audit-logs" 
                    className="block pl-4 text-gray-600 hover:text-primary-600 py-1" 
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t('adminSection.auditLogs', 'Audit Logs')}
                  </Link>
                </div>
              )}
              
              {/* Mobile Language Selector */}
              <div className="py-2">
                <LanguageSelector />
              </div>
              
              {/* Mobile Authentication */}
              {loading ? (
                <div className="w-6 h-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent mx-auto"></div>
              ) : user ? (
                <>
                  <Link href="/settings" className="text-gray-700 hover:text-primary-600 py-2" onClick={() => setIsMobileMenuOpen(false)}>
                    {t('nav.settings')}
                  </Link>
                  <button
                    onClick={() => {
                      logout()
                      setIsMobileMenuOpen(false)
                    }}
                    className="text-gray-700 hover:text-primary-600 py-2 text-left"
                  >
                    {t('nav.logout')}
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-gray-700 hover:text-primary-600 py-2" onClick={() => setIsMobileMenuOpen(false)}>
                    {t('nav.login')}
                  </Link>
                  <Link href="/signup" className="text-gray-700 hover:text-primary-600 py-2" onClick={() => setIsMobileMenuOpen(false)}>
                    {t('nav.signup')}
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

