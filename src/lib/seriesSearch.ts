import type { Series } from '@/data/seed-videos'

const seriesAliasMap: Record<string, string[]> = {
  'ted-talks': ['\uD14C\uB4DC', '\uD14C\uB4DC \uAC15\uC5F0', 'ted \uAC15\uC5F0'],
  'ted-talks-2': ['\uD14C\uB4DC', '\uD14C\uB4DC \uAC15\uC5F0'],
  'ted-ed': ['\uD14C\uB4DC\uC5D0\uB4DC', 'ted \uAD50\uC721'],
  'ted-business': ['\uD14C\uB4DC \uBE44\uC988\uB2C8\uC2A4'],
  'daily-english': ['\uC0DD\uD65C\uC601\uC5B4', '\uB370\uC77C\uB9AC \uC601\uAE00\uB9AC\uC2DC'],
  'english-lessons': ['\uC601\uC5B4 \uC218\uC5C5', '\uC601\uC5B4 \uB808\uC2A8'],
  'crash-course': ['\uD06C\uB798\uC2DC \uCF54\uC2A4'],
  kurzgesagt: ['\uCFE0\uB974\uCE20\uAC8C\uC791\uD2B8'],
  'casey-neistat': ['\uCF00\uC774\uC2DC \uB098\uC774\uC2A4\uD0EF'],
  mkbhd: ['\uB9C8\uD034\uC2A4 \uBE0C\uB77C\uC6B4\uB9AC', '\uB9C8\uB974\uD034\uC2A4 \uBE0C\uB77C\uC6B4\uB9AC'],
  veritasium: ['\uBCA0\uB9AC\uD0C0\uC2DC\uC6C0'],
  'mark-rober': ['\uB9C8\uD06C \uB85C\uBC84'],
  'smarter-every-day': [
    '\uC2A4\uB9C8\uD130 \uC5D0\uBE0C\uB9AC\uB370\uC774',
    '\uC2A4\uB9C8\uD130 \uC5D0\uBE0C\uB9AC \uB370\uC774',
  ],
  numberphile: ['\uB118\uBC84\uD30C\uC77C'],
  'big-bang-theory': ['\uBE45\uBC45\uC774\uB860', '\uBE45\uBC45 \uC774\uB860'],
  'brooklyn-99': [
    '\uBE0C\uB8E8\uD074\uB9B0 \uB098\uC778\uB098\uC778',
    '\uBE0C\uB8E8\uD074\uB9B0 \uB098\uC778 \uB098\uC778',
    '\uBE0C\uB8E8\uD074\uB9B0 99',
  ],
  friends: ['\uD504\uB80C\uC988'],
  'modern-family': ['\uBAA8\uB358\uD328\uBC00\uB9AC'],
  'parks-and-recreation': ['\uD30C\uD06C\uC2A4 \uC564 \uB808\uD06C\uB9AC\uC5D0\uC774\uC158'],
  seinfeld: ['\uC0C8\uC778\uD384\uB4DC'],
  'the-office': ['\uB354 \uC624\uD53C\uC2A4', '\uC624\uD53C\uC2A4'],
}

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .replace(/['".,!?()[\]{}:;/_&-]+/g, ' ')
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
