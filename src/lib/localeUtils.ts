import type { SupportedLocale } from '@/stores/useLocaleStore'

/**
 * Get localized meaning from an expression or word entry.
 * Falls back to Korean if the target locale translation is missing.
 */
export function getLocalizedMeaning(
  entry: { meaning_ko?: string; meaning_ja?: string },
  locale: SupportedLocale,
): string {
  if (locale === 'ja' && entry.meaning_ja) return entry.meaning_ja
  return entry.meaning_ko ?? ''
}

/**
 * Get localized example sentence from a word entry.
 * Falls back to Korean if the target locale translation is missing.
 */
export function getLocalizedExample(
  entry: { example_ko?: string; example_ja?: string },
  locale: SupportedLocale,
): string {
  if (locale === 'ja' && entry.example_ja) return entry.example_ja
  return entry.example_ko ?? ''
}

/**
 * Get localized subtitle text from a transcript segment.
 * Falls back to Korean if the target locale translation is missing.
 */
export function getLocalizedSubtitle(
  segment: { ko?: string; ja?: string },
  locale: SupportedLocale,
): string {
  if (locale === 'ja' && segment.ja) return segment.ja
  return segment.ko ?? ''
}
