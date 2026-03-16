import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeId = 'teal-dark' | 'blue-dark' | 'purple-dark' | 'rainbow-dark'
export type ThemeAccent = 'teal' | 'blue' | 'purple' | 'rainbow'

interface ThemeState {
  colorTheme: ThemeAccent
  themeId: ThemeId
  setColorTheme: (theme: ThemeAccent) => void
}

function resolveThemeId(colorTheme: ThemeAccent): ThemeId {
  if (colorTheme === 'blue') return 'blue-dark'
  if (colorTheme === 'purple') return 'purple-dark'
  if (colorTheme === 'rainbow') return 'rainbow-dark'
  return 'teal-dark'
}

function extractColorTheme(state: Record<string, unknown>): ThemeAccent {
  // Handle current colorTheme field
  if (state.colorTheme === 'blue') return 'blue'
  if (state.colorTheme === 'purple' || state.colorTheme === 'violet') return 'purple'
  if (state.colorTheme === 'rainbow') return 'rainbow'
  if (state.colorTheme === 'teal') return 'teal'

  // Handle legacy theme field
  const legacy = state.theme
  if (legacy === 'blue-dark' || legacy === 'light-blue') return 'blue'
  if (legacy === 'purple-dark' || legacy === 'light-purple') return 'purple'
  if (legacy === 'rainbow-dark' || legacy === 'light-rainbow') return 'rainbow'
  return 'teal'
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      colorTheme: 'teal',
      themeId: 'teal-dark',
      setColorTheme: (colorTheme) =>
        set({
          colorTheme,
          themeId: resolveThemeId(colorTheme),
        }),
    }),
    {
      name: 'studyeng-theme',
      version: 4,
      migrate: (persistedState: unknown) => {
        const state = (persistedState ?? {}) as Record<string, unknown>
        const colorTheme = extractColorTheme(state)

        return {
          colorTheme,
          themeId: resolveThemeId(colorTheme),
        } satisfies Partial<ThemeState>
      },
    },
  ),
)
