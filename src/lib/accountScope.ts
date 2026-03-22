import { useAdminStore } from '@/stores/useAdminStore'
import { useBookmarkStore } from '@/stores/useBookmarkStore'
import { useDailyMissionStore } from '@/stores/useDailyMissionStore'
import { useDiscountStore } from '@/stores/useDiscountStore'
import { useLikeStore } from '@/stores/useLikeStore'
import { useLevelChallengeStore } from '@/stores/useLevelChallengeStore'
import { useLevelStore } from '@/stores/useLevelStore'
import { useMilestoneStore } from '@/stores/useMilestoneStore'
import { useOnboardingStore } from '@/stores/useOnboardingStore'
import { usePhraseStore } from '@/stores/usePhraseStore'
import { usePremiumStore } from '@/stores/usePremiumStore'
import { useRecommendationStore } from '@/stores/useRecommendationStore'
import { useTierStore } from '@/stores/useTierStore'
import { useUserStore } from '@/stores/useUserStore'
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore'
import { useGameProgressStore } from '@/stores/useGameProgressStore'
import { useLearnAccessStore } from '@/stores/useLearnAccessStore'
import { useLearnProgressStore } from '@/stores/useLearnProgressStore'
import { useFamiliarityStore } from '@/stores/useFamiliarityStore'

const ACCOUNT_OWNER_STORAGE_KEY = 'studyeng-account-owner'

function getStoredAccountOwner() {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(ACCOUNT_OWNER_STORAGE_KEY)
}

function setStoredAccountOwner(userId: string | null) {
  if (typeof window === 'undefined') return

  if (userId) {
    window.localStorage.setItem(ACCOUNT_OWNER_STORAGE_KEY, userId)
    return
  }

  window.localStorage.removeItem(ACCOUNT_OWNER_STORAGE_KEY)
}

export function resetAccountScopedState() {
  const onboardingHydrated = useOnboardingStore.getState().hydrated

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
  useLearnProgressStore.getState().resetState()
  useFamiliarityStore.getState().resetState()
  useUserStore.setState({
    level: 1,
    xp: 0,
    streakDays: 0,
    lastActivityDate: null,
    showLevelUp: false,
    totalXpEarned: 0,
    xpHistory: [],
  })
  useTierStore.setState({
    currentTier: 0,
    benefitTier: 0,
    monthlyXpHistory: {},
    championMonths: 0,
    championLegacy: false,
    lastTierUpdateDate: '',
    tierAtMonthStart: 0,
    tierMonthStartMonth: '',
  })
  useMilestoneStore.setState({
    achieved: {},
  })
  useGameProgressStore.setState({
    leitner: {},
    bestStreak: 0,
    totalSessions: {
      expressionSwipe: 0,
      listenAndFill: 0,
    },
    dailyGameXP: 0,
    dailyGameXPDate: '',
    dailySessionXP: 0,
    dailySessionXPDate: '',
    streakBonusDate: '',
    dailyStreakBonusXP: 0,
    monthlyStreakXP: 0,
    monthlyStreakXPMonth: '',
  })
  useLearnAccessStore.getState().resetState()
  useLevelStore.setState({
    absorptionScore: 0,
    rawScore: 0,
    videoXP: {},
    videoAwardCounts: {},
    dailyVideoXP: 0,
    dailyVideoXPDate: '',
    levelHistory: [],
    pendingLevelUp: null,
    videoCompletionLog: [],
  })
  useLevelChallengeStore.setState({
    challengeAttempts: [],
    lastPassedLevel: null,
  })
  useOnboardingStore.setState({
    hasOnboarded: false,
    hasSeenWelcome: false,
    hydrated: onboardingHydrated,
    interests: [],
    level: 'A1',
    dailyGoal: 5,
  })
}

export function prepareAccountScopedStateForUser(userId: string) {
  const storedOwner = getStoredAccountOwner()

  if (storedOwner !== userId) {
    resetAccountScopedState()
    setStoredAccountOwner(userId)
  }
}

export function clearAccountScopedState() {
  resetAccountScopedState()
  setStoredAccountOwner(null)
}
