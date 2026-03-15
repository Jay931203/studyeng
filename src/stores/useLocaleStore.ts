import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type SupportedLocale = 'ko' | 'ja' | 'zh-TW' | 'vi'

interface LocaleState {
  locale: SupportedLocale
  setLocale: (locale: SupportedLocale) => void
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set, get) => ({
      locale: 'ko',
      setLocale: (locale) => {
        if (get().locale !== locale) set({ locale })
      },
    }),
    {
      name: 'studyeng-locale',
      version: 2,
      migrate: (persisted: unknown, version: number) => {
        const state = (persisted ?? {}) as Record<string, unknown>
        if (version < 2) {
          // v0/v1 → v2: expand to 4-locale support, preserve existing locale
          const raw = state.locale as string | undefined
          const valid: SupportedLocale[] = ['ko', 'ja', 'zh-TW', 'vi']
          const locale = valid.includes(raw as SupportedLocale)
            ? (raw as SupportedLocale)
            : 'ko'
          return { ...state, locale } as unknown as LocaleState
        }
        return state as unknown as LocaleState
      },
    },
  ),
)
