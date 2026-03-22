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
 * Get localized sentence from a priming card item (expression or word).
 * Fields use sentenceKo / sentenceJa / sentenceZhTW / sentenceVi naming.
 * Falls back to Korean if the target locale translation is missing.
 */
export function getLocalizedSentence(
  entry: { sentenceKo?: string; sentenceJa?: string; sentenceZhTW?: string; sentenceVi?: string },
  locale: SupportedLocale,
): string {
  if (locale === 'ja' && entry.sentenceJa) return entry.sentenceJa
  if (locale === 'zh-TW' && entry.sentenceZhTW) return entry.sentenceZhTW
  if (locale === 'vi' && entry.sentenceVi) return entry.sentenceVi
  return entry.sentenceKo ?? ''
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

/**
 * Get localized title from an expression class entry.
 * Falls back: titleJa > titleKo > title (English)
 */
export function getLocalizedClassTitle(
  entry: { title: string; titleKo: string; titleJa?: string; titleZhTW?: string; titleVi?: string },
  locale: SupportedLocale,
): string {
  if (locale === 'ja' && entry.titleJa) return entry.titleJa
  if (locale === 'zh-TW' && entry.titleZhTW) return entry.titleZhTW
  if (locale === 'vi' && entry.titleVi) return entry.titleVi
  if (locale === 'ko') return entry.titleKo
  // For ja without titleJa, use titleJa field from data (which exists), else fall back to titleKo
  return entry.titleJa ?? entry.titleKo
}

/**
 * Get localized description from an expression class entry.
 * Falls back to Korean > English.
 */
export function getLocalizedClassDescription(
  entry: { description: string; descriptionKo: string; descriptionJa?: string; descriptionZhTW?: string; descriptionVi?: string },
  locale: SupportedLocale,
): string {
  if (locale === 'ja' && entry.descriptionJa) return entry.descriptionJa
  if (locale === 'zh-TW' && entry.descriptionZhTW) return entry.descriptionZhTW
  if (locale === 'vi' && entry.descriptionVi) return entry.descriptionVi
  if (locale === 'ko') return entry.descriptionKo
  // Fall back to English description for non-ko locales without translation
  return entry.description
}

/**
 * Localized expression category labels.
 */
const EXPR_CATEGORY_LABELS: Record<SupportedLocale, Record<string, string>> = {
  ko: {
    phrasal_verb: '구동사', idiom: '관용구', collocation: '연어',
    fixed_expression: '표현', discourse_marker: '담화', slang: '슬랭',
    hedging: '완곡', exclamation: '감탄', filler: '필러',
  },
  ja: {
    phrasal_verb: '句動詞', idiom: '慣用句', collocation: '連語',
    fixed_expression: '表現', discourse_marker: '談話', slang: 'スラング',
    hedging: '婉曲', exclamation: '感嘆', filler: 'フィラー',
  },
  'zh-TW': {
    phrasal_verb: '片語動詞', idiom: '慣用語', collocation: '搭配詞',
    fixed_expression: '表達', discourse_marker: '話語', slang: '俚語',
    hedging: '委婉語', exclamation: '感嘆詞', filler: '填充詞',
  },
  vi: {
    phrasal_verb: 'Cụm ĐT', idiom: 'Thành ngữ', collocation: 'Kết hợp',
    fixed_expression: 'Biểu thức', discourse_marker: 'Diễn ngôn', slang: 'Tiếng lóng',
    hedging: 'Uyển ngữ', exclamation: 'Thán từ', filler: 'Từ đệm',
  },
}

export function getExprCategoryLabel(category: string, locale: SupportedLocale): string {
  return EXPR_CATEGORY_LABELS[locale]?.[category] ?? category
}

/**
 * Localized POS (part of speech) labels for words.
 */
const POS_LABELS: Record<SupportedLocale, Record<string, string>> = {
  ko: {
    noun: '명사', verb: '동사', adjective: '형용사', adverb: '부사',
    preposition: '전치사', conjunction: 'conj.', pronoun: '대명사',
    interjection: 'int.', determiner: 'det.',
  },
  ja: {
    noun: '名詞', verb: '動詞', adjective: '形容詞', adverb: '副詞',
    preposition: '前置詞', conjunction: '接続詞', pronoun: '代名詞',
    interjection: '感嘆詞', determiner: '限定詞',
  },
  'zh-TW': {
    noun: '名詞', verb: '動詞', adjective: '形容詞', adverb: '副詞',
    preposition: '介詞', conjunction: '連接詞', pronoun: '代名詞',
    interjection: '感嘆詞', determiner: '限定詞',
  },
  vi: {
    noun: 'Danh từ', verb: 'Động từ', adjective: 'Tính từ', adverb: 'Trạng từ',
    preposition: 'Giới từ', conjunction: 'Liên từ', pronoun: 'Đại từ',
    interjection: 'Thán từ', determiner: 'Hạn định từ',
  },
}

export function getPosLabel(pos: string, locale: SupportedLocale): string {
  return POS_LABELS[locale]?.[pos] ?? pos
}
