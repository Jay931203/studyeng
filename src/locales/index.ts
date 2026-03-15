import ko, { type LocaleStrings } from './ko'
import ja from './ja'
import type { SupportedLocale } from '@/stores/useLocaleStore'

const locales: Partial<Record<SupportedLocale, LocaleStrings>> = { ko, ja }

export function getLocaleStrings(locale: SupportedLocale): LocaleStrings {
  return locales[locale] ?? ko
}

export type { LocaleStrings }
