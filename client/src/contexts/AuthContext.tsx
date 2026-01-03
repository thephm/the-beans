'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { apiClient } from '@/lib/api'
import { trackAnalytics } from '@/lib/analytics'

interface User {
  id: string
  email: string
  username: string
  firstName?: string
  lastName?: string
  avatar?: string
  language?: string
  role?: string // 'admin' | 'user' etc.
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  token?: string | null
  login: (token: string, user: User) => void
  logout: () => void
  refreshUser: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      setLoading(false)
      return
    }

    // Check for existing auth data on mount
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
        setToken(token)
        // Ensure the API client has the token
        apiClient.setToken(token)
      } catch (error) {
        console.error('Error parsing user data:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
    
    setLoading(false)
  }, [])

  const login = (token: string, userData: User) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    setToken(token)
    // Ensure the API client has the token
    apiClient.setToken(token)
  }

  const logout = () => {
    trackAnalytics('logout', { userId: user?.id })
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setToken(null)
    // Clear the token from API client
    apiClient.clearToken()
  }

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const userData = await apiClient.getCurrentUser() as User
      setUser(userData)
      localStorage.setItem('user', JSON.stringify(userData))
    } catch (error) {
      console.error('Error refreshing user data:', error)
      // If refresh fails, might be invalid token, so logout
      logout()
    }
  }, [])

  const value = {
    user,
    isAuthenticated: !!user,
    token,
    login,
    logout,
    refreshUser,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
