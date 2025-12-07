"use client"
import React from 'react'
import { useDarkMode } from '@/contexts/DarkModeContext'

export function BodyWithTheme({ children }: { children: React.ReactNode }) {
  const { darkMode } = useDarkMode()
  return (
    <body className={`min-h-screen ${darkMode ? 'dark bg-gray-950' : 'bg-gradient-lavender'}`}>
      {children}
    </body>
  )
}