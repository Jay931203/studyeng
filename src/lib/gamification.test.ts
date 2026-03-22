import { describe, expect, it } from 'vitest'
import {
  addXp,
  calculateXpForLevel,
  mergeStreakStateSnapshots,
  reconcileStreakState,
  shouldUpdateStreak,
} from './gamification'

describe('gamification', () => {
  describe('calculateXpForLevel', () => {
    it('level 1 requires 100 XP', () => {
      expect(calculateXpForLevel(1)).toBe(100)
    })

    it('level 2 requires 200 XP', () => {
      expect(calculateXpForLevel(2)).toBe(200)
    })

    it('level 10 requires 1000 XP', () => {
      expect(calculateXpForLevel(10)).toBe(1000)
    })
  })

  describe('shouldUpdateStreak', () => {
    it('returns true if last active was yesterday', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      expect(shouldUpdateStreak(yesterday, new Date())).toBe(true)
    })

    it('returns false if last active was today', () => {
      const today = new Date()
      expect(shouldUpdateStreak(today, today)).toBe(false)
    })

    it('returns "reset" if last active was more than 1 day ago', () => {
      const twoDaysAgo = new Date()
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
      expect(shouldUpdateStreak(twoDaysAgo, new Date())).toBe('reset')
    })

    it('returns true if no previous active date (first time)', () => {
      expect(shouldUpdateStreak(null, new Date())).toBe(true)
    })
  })

  describe('addXp', () => {
    it('adds XP without leveling up', () => {
      const result = addXp({ level: 1, xp: 0 }, 50)
      expect(result).toEqual({ level: 1, xp: 50, leveledUp: false })
    })

    it('levels up when XP exceeds threshold', () => {
      const result = addXp({ level: 1, xp: 80 }, 30)
      expect(result).toEqual({ level: 2, xp: 10, leveledUp: true })
    })

    it('can level up multiple times', () => {
      const result = addXp({ level: 1, xp: 0 }, 350)
      expect(result).toEqual({ level: 3, xp: 50, leveledUp: true })
    })
  })

  describe('reconcileStreakState', () => {
    it('keeps an active streak if the last activity was yesterday', () => {
      expect(
        reconcileStreakState(
          {
            streakDays: 5,
            lastActivityDate: '2026-03-21T09:00:00.000Z',
          },
          new Date('2026-03-22T10:00:00.000Z')
        )
      ).toEqual({
        streakDays: 5,
        lastActivityDate: '2026-03-21T09:00:00.000Z',
      })
    })

    it('clears a broken streak before the next activity', () => {
      expect(
        reconcileStreakState(
          {
            streakDays: 5,
            lastActivityDate: '2026-03-19T09:00:00.000Z',
          },
          new Date('2026-03-22T10:00:00.000Z')
        )
      ).toEqual({
        streakDays: 0,
        lastActivityDate: '2026-03-19T09:00:00.000Z',
      })
    })
  })

  describe('mergeStreakStateSnapshots', () => {
    it('prefers the more recent streak snapshot', () => {
      expect(
        mergeStreakStateSnapshots(
          {
            streakDays: 8,
            lastActivityDate: '2026-03-20T08:00:00.000Z',
          },
          {
            streakDays: 3,
            lastActivityDate: '2026-03-22T08:00:00.000Z',
          },
          new Date('2026-03-22T10:00:00.000Z')
        )
      ).toEqual({
        streakDays: 3,
        lastActivityDate: '2026-03-22T08:00:00.000Z',
      })
    })

    it('drops stale streak values during merge', () => {
      expect(
        mergeStreakStateSnapshots(
          {
            streakDays: 12,
            lastActivityDate: '2026-03-18T08:00:00.000Z',
          },
          {
            streakDays: 9,
            lastActivityDate: '2026-03-17T08:00:00.000Z',
          },
          new Date('2026-03-22T10:00:00.000Z')
        )
      ).toEqual({
        streakDays: 0,
        lastActivityDate: '2026-03-18T08:00:00.000Z',
      })
    })
  })
})
