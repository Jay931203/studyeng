'use client'

import { useEffect } from 'react'
import { useThemeStore, type ThemeId } from '@/stores/useThemeStore'

function applyTheme(theme: ThemeId) {
  const root = document.documentElement
  root.setAttribute('data-theme', theme)

  if (theme.startsWith('light')) {
    root.classList.remove('dark')
    root.style.colorScheme = 'light'
  } else {
    root.classList.add('dark')
    root.style.colorScheme = 'dark'
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeStore()

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  return <>{children}</>
}
