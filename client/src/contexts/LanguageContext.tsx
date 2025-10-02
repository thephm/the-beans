'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from './AuthContext'
import { apiClient } from '@/lib/api'

export interface Language {
  code: string
  name: string
  nativeName: string
  flag: string
}

export const SUPPORTED_LANGUAGES: Language[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸'
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷'
  }
]

interface LanguageContextType {
  currentLanguage: Language
  changeLanguage: (languageCode: string) => Promise<void>
  supportedLanguages: Language[]
  isChanging: boolean
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation()
  const { user, isAuthenticated, login } = useAuth()
  const [isChanging, setIsChanging] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState<Language>(
    SUPPORTED_LANGUAGES[0] // Default to English
  )

  // Initialize language on mount
  useEffect(() => {
    initializeLanguage()
  }, [user, isAuthenticated])

  const initializeLanguage = async () => {
    try {
      let languageToUse = 'en' // Default fallback

      if (isAuthenticated && user?.language) {
        // Use user's saved language preference
        languageToUse = user.language
      } else {
        // Check localStorage for guest preference
        const savedLanguage = localStorage.getItem('guestLanguage')
        if (savedLanguage && SUPPORTED_LANGUAGES.find(lang => lang.code === savedLanguage)) {
          languageToUse = savedLanguage
        } else {
          // Use browser language detection as fallback
          const browserLang = navigator.language.split('-')[0]
          if (SUPPORTED_LANGUAGES.find(lang => lang.code === browserLang)) {
            languageToUse = browserLang
          }
        }
      }

      await i18n.changeLanguage(languageToUse)
      const language = SUPPORTED_LANGUAGES.find(lang => lang.code === languageToUse) || SUPPORTED_LANGUAGES[0]
      setCurrentLanguage(language)

      // If user is logged in and their saved language is different, update the backend
      if (isAuthenticated && user && user.language !== languageToUse) {
        await updateUserLanguagePreference(languageToUse)
      }
    } catch (error) {
      console.error('Error initializing language:', error)
    }
  }

  const updateUserLanguagePreference = async (languageCode: string) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      await apiClient.updateUserLanguage(languageCode)
    } catch (error) {
      console.error('Error updating user language preference:', error)
    }
  }

  const changeLanguage = async (languageCode: string) => {
    try {
      setIsChanging(true)

      const language = SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode)
      if (!language) {
        throw new Error(`Unsupported language: ${languageCode}`)
      }

      await i18n.changeLanguage(languageCode)
      await i18n.reloadResources(); // Force reload of translations
      setCurrentLanguage(language)

      if (isAuthenticated && user) {
        // Update user's language preference in the database
        await updateUserLanguagePreference(languageCode)
        // Update the user object in AuthContext to reflect the new language
        const updatedUser = { ...user, language: languageCode }
        // Use login to update user in context and localStorage (token remains the same)
        const token = localStorage.getItem('token') || ''
        login(token, updatedUser)
      } else {
        // Store guest language preference in localStorage
        localStorage.setItem('guestLanguage', languageCode)
      }
    } catch (error) {
      console.error('Error changing language:', error)
      throw error
    } finally {
      setIsChanging(false)
    }
  }

  const value = {
    currentLanguage,
    changeLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
    isChanging
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
