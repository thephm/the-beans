'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import { LanguageProvider } from '@/contexts/LanguageContext'
import i18n from '@/lib/i18n'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  const [mounted, setMounted] = useState(false)
  const [i18nReady, setI18nReady] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Wait for i18n to be initialized
    if (i18n.isInitialized) {
      setI18nReady(true)
    } else {
      i18n.on('initialized', () => {
        setI18nReady(true)
      })
    }

    return () => {
      i18n.off('initialized')
    }
  }, [])

  if (!mounted || !i18nReady) {
    return null
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
