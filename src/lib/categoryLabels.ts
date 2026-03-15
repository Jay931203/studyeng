import type { CategoryId } from '@/data/seed-videos'
import type { SupportedLocale } from '@/stores/useLocaleStore'

const CATEGORY_LABELS: Record<CategoryId, Record<SupportedLocale, string>> = {
  daily: { ko: '일상', ja: '日常', 'zh-TW': '日常', vi: 'Đời thường' },
  drama: { ko: '드라마', ja: 'ドラマ', 'zh-TW': '戲劇', vi: 'Phim truyền hình' },
  movie: { ko: '영화', ja: '映画', 'zh-TW': '電影', vi: 'Phim' },
  entertainment: { ko: '예능', ja: 'バラエティ', 'zh-TW': '綜藝', vi: 'Giải trí' },
  music: { ko: '음악', ja: '音楽', 'zh-TW': '音樂', vi: 'Âm nhạc' },
  animation: { ko: '애니', ja: 'アニメ', 'zh-TW': '動畫', vi: 'Hoạt hình' },
}

export function getCategoryLabel(category: string, locale: SupportedLocale): string {
  const key = category.toLowerCase() as CategoryId
  return CATEGORY_LABELS[key]?.[locale] ?? category
}

/**
 * Build a Record<CategoryId, string> for the given locale.
 * Drop-in replacement for the old `categoryLabels` objects scattered across the codebase.
 */
export function buildCategoryLabelMap(locale: SupportedLocale): Record<CategoryId, string> {
  const result = {} as Record<CategoryId, string>
  for (const [id, labels] of Object.entries(CATEGORY_LABELS)) {
    result[id as CategoryId] = labels[locale]
  }
  return result
}
