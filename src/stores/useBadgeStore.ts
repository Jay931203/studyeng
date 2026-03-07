import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Badge {
  id: string
  name: string
  description: string
  icon: string       // SVG path data for the badge icon
  condition: string  // Human-readable condition
  earned: boolean
  earnedAt?: number  // timestamp
}

export interface BadgeStats {
  videosWatched: number
  streakDays: number
  gamesCleared: number
  phrasesSaved: number
  level: number
}

interface BadgeState {
  badges: Badge[]
  newlyEarned: Badge[]        // badges that were just earned (for toast notification)
  gamesCleared: number        // track games cleared locally
  dismissNewBadge: () => void // clear the newly earned queue (one at a time)
  incrementGamesCleared: () => void
  checkBadges: (stats: BadgeStats) => void
}

const BADGE_DEFINITIONS: Omit<Badge, 'earned' | 'earnedAt'>[] = [
  {
    id: 'first-video',
    name: '첫 걸음',
    description: '첫 영상 시청',
    icon: 'M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z',
    condition: 'videosWatched >= 1',
  },
  {
    id: 'video-10',
    name: '영상 마니아',
    description: '영상 10개 시청',
    icon: 'M1.5 5.625c0-1.036.84-1.875 1.875-1.875h17.25c1.035 0 1.875.84 1.875 1.875v12.75c0 1.035-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 011.5 18.375V5.625zM21 7.5H3v9h18v-9z',
    condition: 'videosWatched >= 10',
  },
  {
    id: 'streak-3',
    name: '3일 연속',
    description: '3일 연속 학습 달성',
    icon: 'M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.176 7.547 7.547 0 01-1.705-1.715.75.75 0 00-1.152-.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248z',
    condition: 'streakDays >= 3',
  },
  {
    id: 'streak-7',
    name: '일주일 완주',
    description: '7일 연속 학습 달성',
    icon: 'M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.176 7.547 7.547 0 01-1.705-1.715.75.75 0 00-1.152-.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248z',
    condition: 'streakDays >= 7',
  },
  {
    id: 'streak-30',
    name: '한 달의 기적',
    description: '30일 연속 학습 달성',
    icon: 'M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.176 7.547 7.547 0 01-1.705-1.715.75.75 0 00-1.152-.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248z',
    condition: 'streakDays >= 30',
  },
  {
    id: 'first-game',
    name: '게임 시작',
    description: '첫 게임 클리어',
    icon: 'M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.491 48.491 0 01-4.163-.3c-1.108-.128-2.03-1.05-2.03-2.164v-.008c0-.795.474-1.515 1.2-1.826C7.004 1.382 9.378.75 12 .75s4.996.632 6.45 1.683c.726.311 1.2 1.031 1.2 1.826v.008c0 1.114-.922 2.036-2.03 2.164a48.491 48.491 0 01-4.163.3.64.64 0 01-.657-.643v0zm-3 0v0a.64.64 0 00-.657.643 48.491 48.491 0 004.163.3c1.108.128 2.03-.249 2.03-1.364v-.008c0-.795-.474-1.515-1.2-1.826A12.072 12.072 0 0012 3.25c-2.622 0-4.996.632-6.45 1.683-.726.311-1.2 1.031-1.2 1.826v.008c0 1.114.922 1.492 2.03 1.364a48.491 48.491 0 004.163-.3.64.64 0 00.657-.643v0zM12 11.25a.75.75 0 01.75.75v6a.75.75 0 01-1.5 0v-6a.75.75 0 01.75-.75zm0 9.75a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z',
    condition: 'gamesCleared >= 1',
  },
  {
    id: 'phrases-5',
    name: '표현 수집가',
    description: '표현 5개 저장',
    icon: 'M16.5 3.75V16.5L12 14.25 7.5 16.5V3.75m9 0H18A2.25 2.25 0 0120.25 6v12A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18V6A2.25 2.25 0 016 3.75h1.5m9 0h-9',
    condition: 'phrasesSaved >= 5',
  },
  {
    id: 'phrases-20',
    name: '표현 마스터',
    description: '표현 20개 저장',
    icon: 'M16.5 3.75V16.5L12 14.25 7.5 16.5V3.75m9 0H18A2.25 2.25 0 0120.25 6v12A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18V6A2.25 2.25 0 016 3.75h1.5m9 0h-9',
    condition: 'phrasesSaved >= 20',
  },
  {
    id: 'level-5',
    name: '레벨 5 달성',
    description: '레벨 5에 도달',
    icon: 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z',
    condition: 'level >= 5',
  },
  {
    id: 'level-10',
    name: '레벨 10 달성',
    description: '레벨 10에 도달',
    icon: 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z',
    condition: 'level >= 10',
  },
]

function createInitialBadges(): Badge[] {
  return BADGE_DEFINITIONS.map((def) => ({
    ...def,
    earned: false,
  }))
}

// Condition evaluator: checks a badge condition against current stats
function evaluateCondition(condition: string, stats: BadgeStats): boolean {
  const conditionMap: Record<string, boolean> = {
    'videosWatched >= 1': stats.videosWatched >= 1,
    'videosWatched >= 10': stats.videosWatched >= 10,
    'streakDays >= 3': stats.streakDays >= 3,
    'streakDays >= 7': stats.streakDays >= 7,
    'streakDays >= 30': stats.streakDays >= 30,
    'gamesCleared >= 1': stats.gamesCleared >= 1,
    'phrasesSaved >= 5': stats.phrasesSaved >= 5,
    'phrasesSaved >= 20': stats.phrasesSaved >= 20,
    'level >= 5': stats.level >= 5,
    'level >= 10': stats.level >= 10,
  }
  return conditionMap[condition] ?? false
}

export const useBadgeStore = create<BadgeState>()(
  persist(
    (set, get) => ({
      badges: createInitialBadges(),
      newlyEarned: [],
      gamesCleared: 0,

      dismissNewBadge: () => {
        set((state) => ({
          newlyEarned: state.newlyEarned.slice(1),
        }))
      },

      incrementGamesCleared: () => {
        set((state) => ({ gamesCleared: state.gamesCleared + 1 }))
      },

      checkBadges: (stats) => {
        const { badges } = get()
        const newlyEarned: Badge[] = []
        const updatedBadges = badges.map((badge) => {
          if (badge.earned) return badge

          const shouldEarn = evaluateCondition(badge.condition, stats)
          if (shouldEarn) {
            const earnedBadge: Badge = {
              ...badge,
              earned: true,
              earnedAt: Date.now(),
            }
            newlyEarned.push(earnedBadge)
            return earnedBadge
          }

          return badge
        })

        if (newlyEarned.length > 0) {
          set((state) => ({
            badges: updatedBadges,
            newlyEarned: [...state.newlyEarned, ...newlyEarned],
          }))
        }
      },
    }),
    {
      name: 'studyeng-badges',
      // Ensure newly defined badges are always present even if
      // localStorage has an older set of badges
      merge: (persisted, current) => {
        const persistedState = persisted as Partial<BadgeState> | undefined
        if (!persistedState?.badges) return current

        // Merge: keep earned state from persisted, add any new badge definitions
        const mergedBadges = createInitialBadges().map((defaultBadge) => {
          const saved = persistedState.badges?.find((b) => b.id === defaultBadge.id)
          if (saved?.earned) {
            return { ...defaultBadge, earned: true, earnedAt: saved.earnedAt }
          }
          return defaultBadge
        })

        return {
          ...current,
          ...persistedState,
          badges: mergedBadges,
          newlyEarned: [], // Always start fresh on reload
        }
      },
    }
  )
)
