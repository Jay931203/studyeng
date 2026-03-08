import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeId = 'purple-dark' | 'blue-dark' | 'light' | 'light-blue'

interface ThemeState {
  theme: ThemeId
  setTheme: (theme: ThemeId) => void
  toggleTheme: () => void
}

function normalizeTheme(theme: unknown): ThemeId {
  switch (theme) {
    case 'blue-dark':
    case 'light':
    case 'light-blue':
    case 'purple-dark':
      return theme
    case 'dark':
      return 'purple-dark'
    default:
      return 'purple-dark'
  }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'purple-dark',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => {
        const current = get().theme

        switch (current) {
          case 'purple-dark':
            set({ theme: 'light' })
            return
          case 'blue-dark':
            set({ theme: 'light-blue' })
            return
          case 'light':
            set({ theme: 'purple-dark' })
            return
          case 'light-blue':
            set({ theme: 'blue-dark' })
            return
        }
      },
    }),
    {
      name: 'studyeng-theme',
      version: 2,
      migrate: (persistedState: unknown) => {
        const state = (persistedState ?? {}) as Record<string, unknown>
        return {
          ...state,
          theme: normalizeTheme(state.theme),
        } satisfies Partial<ThemeState>
      },
    },
  ),
)
