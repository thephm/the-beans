'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { user, logout, loading } = useAuth()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
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
              <span className="text-white font-bold text-sm">☕</span>
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-primary-700 to-orchid-600 bg-clip-text text-transparent">
              The Beans
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/discover" className="text-gray-700 hover:text-primary-600 transition-colors">
              Discover
            </Link>
            <Link href="/roasters" className="text-gray-700 hover:text-primary-600 transition-colors">
              Roasters
            </Link>
            <Link href="/cafes" className="text-gray-700 hover:text-primary-600 transition-colors">
              Cafes
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-primary-600 transition-colors">
              About
            </Link>
            <Link href="/favorites" className="text-gray-700 hover:text-primary-600 transition-colors">
              Favorites
            </Link>
            
            {/* Authentication Section */}
            {loading ? (
              <div className="w-8 h-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent"></div>
            ) : user ? (
              <div className="flex items-center space-x-4">
                <Link href="/settings" className="text-gray-700 hover:text-primary-600 transition-colors">
                  Settings
                </Link>
                <button
                  onClick={logout}
                  className="px-4 py-2 text-gray-700 hover:text-primary-600 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="/login" className="text-gray-700 hover:text-primary-600 transition-colors">
                  Login
                </Link>
                <Link 
                  href="/signup" 
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Sign Up
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
                Discover
              </Link>
              <Link href="/roasters" className="text-gray-700 hover:text-primary-600 py-2" onClick={() => setIsMobileMenuOpen(false)}>
                Roasters
              </Link>
              <Link href="/cafes" className="text-gray-700 hover:text-primary-600 py-2" onClick={() => setIsMobileMenuOpen(false)}>
                Cafes
              </Link>
              <Link href="/about" className="text-gray-700 hover:text-primary-600 py-2" onClick={() => setIsMobileMenuOpen(false)}>
                About
              </Link>
              <Link href="/favorites" className="text-gray-700 hover:text-primary-600 py-2" onClick={() => setIsMobileMenuOpen(false)}>
                Favorites
              </Link>
              
              {/* Mobile Authentication */}
              {loading ? (
                <div className="w-6 h-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent mx-auto"></div>
              ) : user ? (
                <>
                  <Link href="/settings" className="text-gray-700 hover:text-primary-600 py-2" onClick={() => setIsMobileMenuOpen(false)}>
                    Settings
                  </Link>
                  <button
                    onClick={() => {
                      logout()
                      setIsMobileMenuOpen(false)
                    }}
                    className="text-gray-700 hover:text-primary-600 py-2 text-left"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-gray-700 hover:text-primary-600 py-2" onClick={() => setIsMobileMenuOpen(false)}>
                    Login
                  </Link>
                  <Link href="/signup" className="text-gray-700 hover:text-primary-600 py-2" onClick={() => setIsMobileMenuOpen(false)}>
                    Sign Up
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
