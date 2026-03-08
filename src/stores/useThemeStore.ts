import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeId = 'teal-dark' | 'blue-dark' | 'light' | 'light-blue'
export type ThemeBackground = 'dark' | 'light'
export type ThemeAccent = 'teal' | 'blue'

interface ThemeState {
  backgroundTheme: ThemeBackground
  colorTheme: ThemeAccent
  themeId: ThemeId
  setBackgroundTheme: (theme: ThemeBackground) => void
  setColorTheme: (theme: ThemeAccent) => void
  setTheme: (theme: ThemeId) => void
  toggleTheme: () => void
}

function resolveThemeId(backgroundTheme: ThemeBackground, colorTheme: ThemeAccent): ThemeId {
  if (backgroundTheme === 'dark') {
    return colorTheme === 'blue' ? 'blue-dark' : 'teal-dark'
  }

  return colorTheme === 'blue' ? 'light-blue' : 'light'
}

function normalizeLegacyTheme(theme: unknown): {
  backgroundTheme: ThemeBackground
  colorTheme: ThemeAccent
} {
  switch (theme) {
    case 'teal-dark':
      return { backgroundTheme: 'dark', colorTheme: 'teal' }
    case 'blue-dark':
      return { backgroundTheme: 'dark', colorTheme: 'blue' }
    case 'light':
      return { backgroundTheme: 'light', colorTheme: 'teal' }
    case 'light-blue':
      return { backgroundTheme: 'light', colorTheme: 'blue' }
    case 'purple-dark':
      return { backgroundTheme: 'dark', colorTheme: 'teal' }
    case 'dark':
      return { backgroundTheme: 'dark', colorTheme: 'teal' }
    default:
      return { backgroundTheme: 'dark', colorTheme: 'teal' }
  }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      backgroundTheme: 'dark',
      colorTheme: 'teal',
      themeId: 'teal-dark',
      setBackgroundTheme: (backgroundTheme) =>
        set((state) => ({
          backgroundTheme,
          themeId: resolveThemeId(backgroundTheme, state.colorTheme),
        })),
      setColorTheme: (colorTheme) =>
        set((state) => ({
          colorTheme,
          themeId: resolveThemeId(state.backgroundTheme, colorTheme),
        })),
      setTheme: (theme) => {
        const next = normalizeLegacyTheme(theme)
        set({
          ...next,
          themeId: resolveThemeId(next.backgroundTheme, next.colorTheme),
        })
      },
      toggleTheme: () => {
        const current = get().backgroundTheme
        const nextBackground = current === 'dark' ? 'light' : 'dark'
        set((state) => ({
          backgroundTheme: nextBackground,
          themeId: resolveThemeId(nextBackground, state.colorTheme),
        }))
      },
    }),
    {
      name: 'studyeng-theme',
      version: 3,
      migrate: (persistedState: unknown) => {
        const state = (persistedState ?? {}) as Record<string, unknown>
        const backgroundTheme =
          state.backgroundTheme === 'light' || state.backgroundTheme === 'dark'
            ? state.backgroundTheme
            : normalizeLegacyTheme(state.theme).backgroundTheme
        const colorTheme =
          state.colorTheme === 'blue'
            ? 'blue'
            : state.colorTheme === 'teal' || state.colorTheme === 'violet'
              ? 'teal'
              : normalizeLegacyTheme(state.theme).colorTheme

        return {
          ...state,
          backgroundTheme,
          colorTheme,
          themeId: resolveThemeId(backgroundTheme, colorTheme),
        } satisfies Partial<ThemeState>
      },
    },
  ),
)
