import type { SupportedLocale } from '@/stores/useLocaleStore'

/**
 * Get localized meaning from an expression or word entry.
 * Falls back to Korean if the target locale translation is missing.
 */
export function getLocalizedMeaning(
  entry: { meaning_ko?: string; meaning_ja?: string; meaning_zhTW?: string; meaning_vi?: string },
  locale: SupportedLocale,
): string {
  if (locale === 'ja' && entry.meaning_ja) return entry.meaning_ja
  if (locale === 'zh-TW' && entry.meaning_zhTW) return entry.meaning_zhTW
  if (locale === 'vi' && entry.meaning_vi) return entry.meaning_vi
  return entry.meaning_ko ?? ''
}

/**
 * Get localized example sentence from a word entry.
 * Falls back to Korean if the target locale translation is missing.
 */
export function getLocalizedExample(
  entry: { example_ko?: string; example_ja?: string; example_zhTW?: string; example_vi?: string },
  locale: SupportedLocale,
): string {
  if (locale === 'ja' && entry.example_ja) return entry.example_ja
  if (locale === 'zh-TW' && entry.example_zhTW) return entry.example_zhTW
  if (locale === 'vi' && entry.example_vi) return entry.example_vi
  return entry.example_ko ?? ''
}

/**
 * Get localized subtitle text from a transcript segment.
 * Falls back to Korean if the target locale translation is missing.
 */
export function getLocalizedSubtitle(
  segment: { ko?: string; ja?: string; zhTW?: string; vi?: string },
  locale: SupportedLocale,
): string {
  if (locale === 'ja' && segment.ja) return segment.ja
  if (locale === 'zh-TW' && segment.zhTW) return segment.zhTW
  if (locale === 'vi' && segment.vi) return segment.vi
  return segment.ko ?? ''
}
