import type { Series } from '@/data/seed-videos'

const seriesAliasMap: Record<string, string[]> = {
  'big-bang-theory': ['빅뱅이론', '빅뱅 이론'],
  'brooklyn-99': ['브루클린 나인나인', '브루클린 나인-나인'],
  'friends-s1': ['프렌즈'],
  'modern-family': ['모던 패밀리'],
  'parks-rec': ['팍스 앤 레크리에이션', '파크스 앤 레크리에이션'],
  seinfeld: ['사인펠드'],
  'the-office': ['디 오피스', '오피스'],
  'devil-wears-prada': ['악마는 프라다를 입는다', '악마는 프라다'],
  'forrest-gump': ['포레스트 검프'],
  'harry-potter': ['해리포터', '해리 포터'],
  'marvel-mcu': ['마블', '마블 시네마틱 유니버스'],
  'mean-girls': ['퀸카로 살아남는 법', '민 걸즈'],
  'notting-hill': ['노팅 힐'],
  'the-godfather': ['대부'],
  'carpool-karaoke': ['카풀 카라오케'],
  conan: ['코난'],
  'graham-norton': ['그레이엄 노튼 쇼', '그레이엄 노튼'],
  'jimmy-fallon': ['투나잇 쇼', '지미 팰런 쇼', '지미 팰런'],
  'mean-tweets': ['밋 트윗', '미운 트윗 읽기'],
  'ted-talks': ['테드', '테드 강연', 'TED 강연'],
  'daily-english': ['생활영어', '데일리 잉글리시'],
  'pop-hits': ['팝송', '팝 히트'],
  'rock-classics': ['록 클래식', '락 클래식'],
  'pixar-moments': ['픽사', '픽사 클래식'],
  'breaking-bad': ['브레이킹 배드', '브배'],
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
