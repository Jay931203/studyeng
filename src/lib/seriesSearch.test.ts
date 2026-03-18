import { describe, expect, it } from 'vitest'
import { getSeriesSearchAliases, matchesSearchText } from '@/lib/seriesSearch'

describe('seriesSearch', () => {
  it('matches known Korean aliases for English series names', () => {
    const searchTerms = ['The Big Bang Theory', ...getSeriesSearchAliases('big-bang-theory')]

    expect(matchesSearchText(searchTerms, '\uBE45\uBC45\uC774\uB860')).toBe(true)
    expect(matchesSearchText(searchTerms, '\uBE45\uBC45 \uC774\uB860')).toBe(true)
  })

  it('matches queries even when whitespace and punctuation differ', () => {
    const searchTerms = ['Brooklyn Nine-Nine', ...getSeriesSearchAliases('brooklyn-99')]

    expect(matchesSearchText(searchTerms, '\uBE0C\uB8E8\uD074\uB9B0 \uB098\uC778\uB098\uC778')).toBe(true)
    expect(matchesSearchText(searchTerms, '\uBE0C\uB8E8\uD074\uB9B0 \uB098\uC778-\uB098\uC778')).toBe(true)
  })
})
