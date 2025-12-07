"use client"
import { useEffect } from 'react'
import { useDarkMode } from '@/contexts/DarkModeContext'

export function DarkModeScript() {
  const { darkMode } = useDarkMode()
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const html = document.documentElement
      if (darkMode) {
        html.classList.add('dark')
      } else {
        html.classList.remove('dark')
      }
      // Force reflow for Tailwind dark mode
      setTimeout(() => {
        document.body.style.display = 'none'
        void document.body.offsetHeight
        document.body.style.display = ''
      }, 0)
    }
  }, [darkMode])
  return null
}