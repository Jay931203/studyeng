import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearAccountScopedState,
  prepareAccountScopedStateForUser,
} from '@/lib/accountScope'
import { useAdminStore } from '@/stores/useAdminStore'
import { useBookmarkStore } from '@/stores/useBookmarkStore'
import { useDailyMissionStore } from '@/stores/useDailyMissionStore'
import { useDiscountStore } from '@/stores/useDiscountStore'
import { useLikeStore } from '@/stores/useLikeStore'
import { useOnboardingStore } from '@/stores/useOnboardingStore'
import { usePhraseStore } from '@/stores/usePhraseStore'
import { usePremiumStore } from '@/stores/usePremiumStore'
import { useRecommendationStore } from '@/stores/useRecommendationStore'
import { useUserStore } from '@/stores/useUserStore'
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore'

describe('accountScope', () => {
  beforeEach(() => {
    localStorage.clear()
    useWatchHistoryStore.setState({
      watchedEpisodes: {},
      viewCounts: {},
      completionCounts: {},
      watchedVideoIds: [],
      watchRecords: [],
      deletedVideoIds: [],
    })
    usePhraseStore.setState({ phrases: [] })
    useBookmarkStore.setState({ bookmarks: [] })
    useLikeStore.setState({ likes: {} })
    useRecommendationStore.setState({ recentVideoIds: [], videoSignals: {} })
    useAdminStore.setState({
      isAdmin: false,
      flaggedSubtitles: [],
      issues: [],
    })
    useDailyMissionStore.getState().resetState()
    useDiscountStore.getState().resetState()
    usePremiumStore.getState().resetState()
    useUserStore.setState({
      level: 1,
      xp: 0,
      streakDays: 0,
      lastActivityDate: null,
      showLevelUp: false,
    })
    useOnboardingStore.setState({
      hasOnboarded: false,
      hasSeenWelcome: false,
      hydrated: true,
      interests: [],
      level: 'A1',
      dailyGoal: 5,
    })
  })

  it('clears account-scoped data when a different user signs in', () => {
    localStorage.setItem('studyeng-account-owner', 'user-a')
    useWatchHistoryStore.setState({
      watchedEpisodes: {},
      viewCounts: { 'video-1': 2 },
      completionCounts: {},
      watchedVideoIds: ['video-1'],
      watchRecords: [],
      deletedVideoIds: [],
    })
    usePhraseStore.setState({
      phrases: [
        {
          id: 'phrase-1',
          videoId: 'video-1',
          videoTitle: 'Video 1',
          en: 'Hello',
          ko: '안녕',
          timestampStart: 0,
          timestampEnd: 1,
          savedAt: 1,
          reviewCount: 0,
        },
      ],
    })
    useAdminStore.setState({
      isAdmin: true,
      flaggedSubtitles: [
        {
          videoId: 'video-1',
          entryIndex: 0,
          en: 'Hello',
          flaggedAt: '2026-03-08T00:00:00.000Z',
        },
      ],
      issues: [
        {
          id: 'issue-1',
          videoId: 'video-1',
          youtubeId: 'yt-1',
          type: 'other',
          description: 'Needs review',
          timestamp: 1,
          resolved: false,
        },
      ],
    })
    usePremiumStore.setState({
      isPremium: true,
      dailyViewCount: 4,
      lastViewDate: '2026-03-08',
      savedPhrasesUsed: 12,
    })
    useDailyMissionStore.setState({
      missions: [
        {
          id: 'watch-videos',
          title: 'Watch',
          description: 'desc',
          target: 3,
          current: 2,
          completed: false,
          xpReward: 10,
        },
      ],
      lastResetDate: '2026-03-08',
      allCompleteBonus: true,
    })
    useDiscountStore.setState({
      completedDays: ['2026-03-08'],
      currentMonth: '2026-03',
      consecutiveHighMonths: 2,
    })

    prepareAccountScopedStateForUser('user-b')

    expect(useWatchHistoryStore.getState().watchedVideoIds).toEqual([])
    expect(usePhraseStore.getState().phrases).toEqual([])
    expect(useAdminStore.getState().isAdmin).toBe(false)
    expect(useAdminStore.getState().flaggedSubtitles).toEqual([])
    expect(useAdminStore.getState().issues).toEqual([])
    expect(useDailyMissionStore.getState().lastResetDate).toBeNull()
    expect(useDailyMissionStore.getState().allCompleteBonus).toBe(false)
    expect(useDiscountStore.getState().completedDays).toEqual([])
    expect(useDiscountStore.getState().consecutiveHighMonths).toBe(0)
    expect(usePremiumStore.getState().isPremium).toBe(false)
    expect(usePremiumStore.getState().dailyViewCount).toBe(0)
    expect(localStorage.getItem('studyeng-account-owner')).toBe('user-b')
  })

  it('preserves account-scoped data for the same signed-in user', () => {
    localStorage.setItem('studyeng-account-owner', 'user-a')
    useBookmarkStore.setState({ bookmarks: ['video-1'] })
    useLikeStore.setState({ likes: { 'video-1': true } })

    prepareAccountScopedStateForUser('user-a')

    expect(useBookmarkStore.getState().bookmarks).toEqual(['video-1'])
    expect(useLikeStore.getState().likes).toEqual({ 'video-1': true })
  })

  it('clears account-scoped data on logout', () => {
    localStorage.setItem('studyeng-account-owner', 'user-a')
    useUserStore.setState({
      level: 3,
      xp: 40,
      streakDays: 7,
      lastActivityDate: '2026-03-08T00:00:00.000Z',
      showLevelUp: true,
    })
    useOnboardingStore.setState({
      hasOnboarded: true,
      hasSeenWelcome: true,
      hydrated: true,
      interests: ['drama'],
      level: 'C1',
      dailyGoal: 10,
    })
    useRecommendationStore.setState({
      recentVideoIds: ['video-1'],
      videoSignals: {
        'video-1': {
          impressions: 1,
          completions: 1,
          skips: 0,
          totalCompletionRatio: 1,
          lastInteractedAt: 1,
        },
      },
    })
    useDailyMissionStore.setState({
      missions: [
        {
          id: 'save-phrase',
          title: 'Save',
          description: 'desc',
          target: 1,
          current: 1,
          completed: true,
          xpReward: 5,
        },
      ],
      lastResetDate: '2026-03-08',
      allCompleteBonus: true,
    })
    useDiscountStore.setState({
      completedDays: ['2026-03-01', '2026-03-02'],
      currentMonth: '2026-03',
      consecutiveHighMonths: 3,
    })

    clearAccountScopedState()

    expect(useUserStore.getState().level).toBe(1)
    expect(useUserStore.getState().xp).toBe(0)
    expect(useOnboardingStore.getState().hasOnboarded).toBe(false)
    expect(useRecommendationStore.getState().recentVideoIds).toEqual([])
    expect(useDailyMissionStore.getState().lastResetDate).toBeNull()
    expect(useDiscountStore.getState().completedDays).toEqual([])
    expect(useDiscountStore.getState().consecutiveHighMonths).toBe(0)
    expect(localStorage.getItem('studyeng-account-owner')).toBeNull()
  })
})
