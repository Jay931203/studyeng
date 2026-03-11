import { describe, expect, it } from 'vitest'
import { getSeriesSearchAliases, matchesSearchText } from '@/lib/seriesSearch'

describe('seriesSearch', () => {
  it('matches known Korean aliases for English series names', () => {
    const searchTerms = ['The Big Bang Theory', ...getSeriesSearchAliases('big-bang-theory')]

    expect(matchesSearchText(searchTerms, '빅뱅이론')).toBe(true)
    expect(matchesSearchText(searchTerms, '빅뱅 이론')).toBe(true)
  })

  it('matches queries even when whitespace and punctuation differ', () => {
    const searchTerms = ['Brooklyn Nine-Nine', ...getSeriesSearchAliases('brooklyn-99')]

    expect(matchesSearchText(searchTerms, '브루클린 나인나인')).toBe(true)
    expect(matchesSearchText(searchTerms, '브루클린 나인-나인')).toBe(true)
  })
})
