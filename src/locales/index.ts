import ko, { type LocaleStrings } from './ko'
import ja from './ja'
import zhTW from './zh-TW'
import vi from './vi'
import type { SupportedLocale } from '@/stores/useLocaleStore'

const locales: Partial<Record<SupportedLocale, LocaleStrings>> = { ko, ja, 'zh-TW': zhTW, vi }

export function getLocaleStrings(locale: SupportedLocale): LocaleStrings {
  return locales[locale] ?? ko
}

export type { LocaleStrings }
