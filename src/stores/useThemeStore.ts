import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeId = 'purple-dark' | 'blue-dark' | 'light' | 'light-blue'

interface ThemeState {
  theme: ThemeId
  setTheme: (theme: ThemeId) => void
  /** @deprecated Use setTheme instead */
  toggleTheme: () => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'purple-dark',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => {
        const current = get().theme
        if (current === 'purple-dark' || current === 'blue-dark') set({ theme: 'light' })
        else set({ theme: 'purple-dark' })
      },
    }),
    {
      name: 'studyeng-theme',
      // Migrate old 'dark'/'light' values to new theme ids
      migrate: (persistedState: unknown) => {
        const state = persistedState as Record<string, unknown>
        if (state?.theme === 'dark') {
          return { ...state, theme: 'purple-dark' as ThemeId }
        }
        if (state?.theme === 'light') {
          return { ...state, theme: 'light' as ThemeId }
        }
        return state as unknown as ThemeState
      },
      version: 1,
    }
  )
)
