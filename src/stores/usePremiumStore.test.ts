import { beforeEach, describe, expect, it } from 'vitest'
import { usePhraseStore, type SavedPhrase } from '@/stores/usePhraseStore'
import { FREE_SAVED_PHRASES_LIMIT, usePremiumStore } from '@/stores/usePremiumStore'

function buildPhrase(index: number): SavedPhrase {
  return {
    id: `phrase-${index}`,
    videoId: `video-${index}`,
    videoTitle: `Video ${index}`,
    en: `English ${index}`,
    ko: `Korean ${index}`,
    timestampStart: index,
    timestampEnd: index + 1,
    savedAt: index,
    reviewCount: 0,
  }
}

describe('usePremiumStore', () => {
  beforeEach(() => {
    localStorage.clear()
    process.env.NEXT_PUBLIC_BILLING_ENABLED = 'true'
    usePhraseStore.setState({ phrases: [] })
    usePremiumStore.getState().resetState()
  })

  it('enforces the free phrase limit based on current saved phrases', () => {
    usePhraseStore.setState({
      phrases: Array.from({ length: FREE_SAVED_PHRASES_LIMIT }, (_, index) => buildPhrase(index)),
    })

    expect(usePremiumStore.getState().canSaveMorePhrases()).toBe(false)

    usePhraseStore.setState({
      phrases: Array.from({ length: FREE_SAVED_PHRASES_LIMIT - 1 }, (_, index) =>
        buildPhrase(index),
      ),
    })

    expect(usePremiumStore.getState().canSaveMorePhrases()).toBe(true)
  })

  it('disables premium limits when billing is not configured', () => {
    delete process.env.NEXT_PUBLIC_BILLING_ENABLED
    usePhraseStore.setState({
      phrases: Array.from({ length: FREE_SAVED_PHRASES_LIMIT }, (_, index) => buildPhrase(index)),
    })

    for (let index = 0; index < 20; index += 1) {
      expect(usePremiumStore.getState().incrementDailyView()).toBe(true)
    }

    expect(usePremiumStore.getState().canSaveMorePhrases()).toBe(true)
    expect(usePremiumStore.getState().getDailyViewsRemaining()).toBe(Infinity)
  })

  it('resets premium state back to the safe default', () => {
    usePremiumStore.setState({
      isPremium: true,
      entitlementPremium: true,
      premiumOverride: 'premium',
      dailyViewCount: 4,
      lastViewDate: '2026-03-08',
      savedPhrasesUsed: 12,
    })

    usePremiumStore.getState().resetState()

    expect(usePremiumStore.getState().isPremium).toBe(false)
    expect(usePremiumStore.getState().dailyViewCount).toBe(0)
    expect(usePremiumStore.getState().lastViewDate).toBeNull()
    expect(usePremiumStore.getState().savedPhrasesUsed).toBe(0)
  })

  it('lets admin override premium access without losing the real entitlement', () => {
    usePremiumStore.getState().setPremiumEntitlement(false)
    usePremiumStore.getState().setPremiumOverride('premium')

    expect(usePremiumStore.getState().isPremium).toBe(true)
    expect(usePremiumStore.getState().entitlementPremium).toBe(false)

    usePremiumStore.getState().setPremiumEntitlement(true)
    usePremiumStore.getState().setPremiumOverride('free')

    expect(usePremiumStore.getState().isPremium).toBe(false)
    expect(usePremiumStore.getState().entitlementPremium).toBe(true)

    usePremiumStore.getState().setPremiumOverride('inherit')

    expect(usePremiumStore.getState().isPremium).toBe(true)
  })
})
