'use client'

import { useEffect } from 'react'
import { useThemeStore } from '@/stores/useThemeStore'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeStore()

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
      root.style.colorScheme = 'dark'
      document.body.style.background = '#000000'
      document.body.style.color = '#ffffff'
    } else {
      root.classList.remove('dark')
      root.style.colorScheme = 'light'
      document.body.style.background = '#f5f5f5'
      document.body.style.color = '#111111'
    }
  }, [theme])

  return <>{children}</>
}
