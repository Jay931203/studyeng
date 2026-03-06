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
    } else {
      root.classList.remove('dark')
      root.style.colorScheme = 'light'
    }
  }, [theme])

  return <>{children}</>
}
