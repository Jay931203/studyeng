import type { Series } from '@/data/seed-videos'

const seriesAliasMap: Record<string, string[]> = {
  'ted-talks': ['테드', '테드 강연', 'TED 강연'],
  'ted-talks-2': ['테드', '테드 강연'],
  'ted-ed': ['테드에드', 'TED 교육'],
  'ted-business': ['테드 비즈니스'],
  'daily-english': ['생활영어', '데일리 잉글리시'],
  'english-lessons': ['영어 수업', '영어 레슨'],
  'crash-course': ['크래시 코스'],
  'kurzgesagt': ['쿠르츠게작트'],
  'casey-neistat': ['케이시 나이스탯'],
  'mkbhd': ['마크스 브라운리'],
  'veritasium': ['베리타시움'],
  'mark-rober': ['마크 로버'],
  'smarter-every-day': ['스마터 에브리 데이'],
  'numberphile': ['넘버파일'],
}

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .replace(/['".,!?()[\]{}:;/_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function compactSearchText(value: string) {
  return normalizeSearchText(value).replace(/\s+/g, '')
}

export function getSeriesSearchAliases(seriesId?: string | null) {
  if (!seriesId) return []
  return seriesAliasMap[seriesId] ?? []
}

export function getSeriesSearchTerms(seriesItem?: Pick<Series, 'id' | 'title' | 'description'> | null) {
  if (!seriesItem) return []
  return [seriesItem.title, seriesItem.description, ...getSeriesSearchAliases(seriesItem.id)]
}

export function matchesSearchText(parts: Array<string | null | undefined>, query: string) {
  const normalizedQuery = normalizeSearchText(query)
  if (!normalizedQuery) return false

  const compactQuery = compactSearchText(query)
  const searchableParts = parts.filter((part): part is string => Boolean(part))
  if (searchableParts.length === 0) return false

  const haystack = searchableParts.map(normalizeSearchText).join(' ')
  if (haystack.includes(normalizedQuery)) return true

  const compactHaystack = searchableParts.map(compactSearchText).join('')
  return compactHaystack.includes(compactQuery)
}
