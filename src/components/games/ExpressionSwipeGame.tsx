'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import expressionEntries from '@/data/expression-entries-v2.json'
import expressionIndex from '@/data/expression-index-v2.json'
import { useGameProgressStore } from '@/stores/useGameProgressStore'
import { useFamiliarityStore } from '@/stores/useFamiliarityStore'
import { useLevelStore, computeXpForSwipe } from '@/stores/useLevelStore'
import { useOnboardingStore } from '@/stores/useOnboardingStore'
import { triggerHaptic } from '@/lib/haptic'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ExpressionSwipeGameProps {
  onComplete: (correct: boolean) => void
}

interface ExpressionEntry {
  id: string
  canonical?: string
  meaning_ko?: string
  category: string
  cefr: string
  [key: string]: unknown
}

interface IndexMatch {
  exprId: string
  sentenceIdx: number
  en: string
  ko: string
}

interface CardData {
  exprId: string
  expression: string
  meaningKo: string
  cefr: string
  category: string
  contextEn: string | null
}

type GamePhase = 'playing' | 'result'

const CARDS_PER_ROUND = 10

const entries = expressionEntries as Record<string, ExpressionEntry>
const index = expressionIndex as Record<string, IndexMatch[]>

// ---------------------------------------------------------------------------
// CEFR filter by user level
// ---------------------------------------------------------------------------

const CEFR_POOLS: Record<string, { primary: string[]; secondary: string[]; secondaryChance: number }> = {
  beginner: {
    primary: ['A1', 'A2'],
    secondary: ['B1'],
    secondaryChance: 0.1,
  },
  intermediate: {
    primary: ['B1', 'B2'],
    secondary: ['A2', 'C1'],
    secondaryChance: 0.1,
  },
  advanced: {
    primary: ['B2', 'C1', 'C2'],
    secondary: [],
    secondaryChance: 0,
  },
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function getFilteredExpressionIds(level: string): string[] {
  const pool = CEFR_POOLS[level] ?? CEFR_POOLS.beginner
  const allCefrs = new Set([...pool.primary, ...pool.secondary])

  return Object.keys(entries).filter((id) => {
    const entry = entries[id]
    if (!entry?.cefr) return false
    return allCefrs.has(entry.cefr.toUpperCase())
  })
}

// ---------------------------------------------------------------------------
// Context sentence lookup (pre-build a reverse index: exprId -> matches)
// ---------------------------------------------------------------------------

let _contextCache: Record<string, IndexMatch[]> | null = null

function getContextByExprId(): Record<string, IndexMatch[]> {
  if (_contextCache) return _contextCache
  const map: Record<string, IndexMatch[]> = {}
  for (const matches of Object.values(index)) {
    for (const m of matches) {
      if (!map[m.exprId]) map[m.exprId] = []
      map[m.exprId].push(m)
    }
  }
  _contextCache = map
  return map
}

function pickContextSentence(exprId: string): string | null {
  const ctx = getContextByExprId()
  const matches = ctx[exprId]
  if (!matches || matches.length === 0) return null
  const pick = matches[Math.floor(Math.random() * matches.length)]
  return pick.en
}

// ---------------------------------------------------------------------------
// Card selection logic
// ---------------------------------------------------------------------------

function selectCards(level: string): CardData[] {
  const gameStore = useGameProgressStore.getState()
  const familiarityStore = useFamiliarityStore.getState()

  let filteredIds = getFilteredExpressionIds(level)

  // If not enough, relax the filter
  if (filteredIds.length < CARDS_PER_ROUND) {
    filteredIds = Object.keys(entries)
  }

  const filteredSet = new Set(filteredIds)

  // Categorize
  const box1 = gameStore.getBox1Expressions().filter((id) => filteredSet.has(id))
  const box2 = gameStore.getBox2Expressions().filter((id) => filteredSet.has(id))
  const box3 = gameStore.getMasteredExpressions().filter((id) => filteredSet.has(id))
  const seenSet = new Set([...box1, ...box2, ...box3])
  const newExprs = filteredIds.filter((id) => !seenSet.has(id))

  const selected: string[] = []
  const usedSet = new Set<string>()

  const addUnique = (source: string[], max: number) => {
    const shuffled = shuffle(source)
    let added = 0
    for (const id of shuffled) {
      if (added >= max) break
      if (usedSet.has(id)) continue
      selected.push(id)
      usedSet.add(id)
      added++
    }
  }

  // Priority: box1 up to 4, box2 up to 3, new fill remaining, box3 10% chance 1
  addUnique(box1, 4)
  addUnique(box2, 3)

  // Box 3: 10% chance include 1
  if (Math.random() < 0.1 && box3.length > 0) {
    addUnique(box3, 1)
  }

  // Fill remaining with new expressions
  const remaining = CARDS_PER_ROUND - selected.length
  if (remaining > 0) {
    addUnique(newExprs, remaining)
  }

  // If still not enough, pull from any available
  if (selected.length < CARDS_PER_ROUND) {
    const all = filteredIds.filter((id) => !usedSet.has(id))
    addUnique(all, CARDS_PER_ROUND - selected.length)
  }

  // Build card data
  const cards: CardData[] = shuffle(selected).map((exprId) => {
    const entry = entries[exprId]
    return {
      exprId,
      expression: entry?.canonical ?? exprId,
      meaningKo: entry?.meaning_ko ?? '',
      cefr: entry?.cefr?.toUpperCase() ?? 'B1',
      category: entry?.category ?? '',
      contextEn: pickContextSentence(exprId),
    }
  })

  return cards
}

// ---------------------------------------------------------------------------
// Category display names
// ---------------------------------------------------------------------------

const CATEGORY_LABELS: Record<string, string> = {
  idiom: 'idiom',
  phrasal_verb: 'phrasal verb',
  collocation: 'collocation',
  fixed_expression: 'fixed expression',
  sentence_frame: 'sentence frame',
  discourse_marker: 'discourse marker',
  slang: 'slang',
  interjection: 'interjection',
  exclamation: 'exclamation',
  filler: 'filler',
}

// ---------------------------------------------------------------------------
// Floating XP text
// ---------------------------------------------------------------------------

function FloatingXP({ xp }: { xp: number }) {
  return (
    <motion.div
      initial={{ opacity: 1, y: 0 }}
      animate={{ opacity: 0, y: -40 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 pointer-events-none z-50 text-lg font-bold"
      style={{ color: 'var(--accent-text)' }}
    >
      +{xp} XP
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Streak flash
// ---------------------------------------------------------------------------

function StreakFlash({ streak }: { streak: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.4 }}
      className="absolute top-16 left-1/2 -translate-x-1/2 pointer-events-none z-50 text-xl font-bold"
      style={{ color: 'var(--accent-text)' }}
    >
      {streak}x streak!
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function ExpressionSwipeGame({ onComplete }: ExpressionSwipeGameProps) {
  const level = useOnboardingStore((s) => s.level)
  const updateLeitner = useGameProgressStore((s) => s.updateLeitner)
  const updateBestStreak = useGameProgressStore((s) => s.updateBestStreak)
  const incrementSessionCount = useGameProgressStore((s) => s.incrementSessionCount)
  const bestStreak = useGameProgressStore((s) => s.bestStreak)
  const markFamiliar = useFamiliarityStore((s) => s.markFamiliar)
  const familiarEntries = useFamiliarityStore((s) => s.entries)
  const getFamiliarCount = useFamiliarityStore((s) => s.getFamiliarCount)
  const recalculateScore = useLevelStore((s) => s.recalculateScore)
  const checkLevelUp = useLevelStore((s) => s.checkLevelUp)

  const [cards] = useState<CardData[]>(() => selectCards(level))
  const [currentIdx, setCurrentIdx] = useState(0)
  const [phase, setPhase] = useState<GamePhase>('playing')
  const [streak, setStreak] = useState(0)
  const [roundXP, setRoundXP] = useState(0)
  const [results, setResults] = useState<Array<{ exprId: string; correct: boolean }>>([])

  // Feedback states
  const [flashColor, setFlashColor] = useState<'green' | 'red' | null>(null)
  const [floatingXP, setFloatingXP] = useState<number | null>(null)
  const [streakFlash, setStreakFlash] = useState<number | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [slideDir, setSlideDir] = useState<'left' | 'right' | null>(null)

  const maxStreakRef = useRef(0)

  const currentCard = cards[currentIdx] ?? null

  // Complete the round
  const finishRound = useCallback(() => {
    incrementSessionCount('expressionSwipe')
    if (maxStreakRef.current > bestStreak) {
      updateBestStreak(maxStreakRef.current)
    }
    setPhase('result')
  }, [incrementSessionCount, bestStreak, updateBestStreak])

  // Advance to next card or finish
  const advanceCard = useCallback(() => {
    if (currentIdx + 1 >= cards.length) {
      finishRound()
    } else {
      setCurrentIdx((prev) => prev + 1)
      setSlideDir(null)
    }
    setIsAnimating(false)
  }, [currentIdx, cards.length, finishRound])

  // Handle answer
  const handleAnswer = useCallback(
    (known: boolean) => {
      if (!currentCard || isAnimating) return
      setIsAnimating(true)

      const exprId = currentCard.exprId

      // Visual feedback
      setFlashColor(known ? 'green' : 'red')
      setSlideDir(known ? 'right' : 'left')

      // Haptic
      triggerHaptic(known ? 40 : [30, 50, 30])

      // Store updates
      updateLeitner(exprId, known)

      let xpGained = 0
      if (known) {
        markFamiliar(exprId)
        const newCount = getFamiliarCount(exprId) + 1
        const rawXP = computeXpForSwipe(exprId, newCount)
        xpGained = useGameProgressStore.getState().addGameXP(rawXP)
        setRoundXP((prev) => prev + xpGained)
        if (xpGained > 0) setFloatingXP(xpGained)

        // Recalculate score after short delay
        setTimeout(() => {
          const updatedEntries = useFamiliarityStore.getState().entries
          recalculateScore(updatedEntries)
          checkLevelUp(level)
        }, 50)
      }

      // Streak
      const newStreak = known ? streak + 1 : 0
      setStreak(newStreak)
      if (newStreak > maxStreakRef.current) {
        maxStreakRef.current = newStreak
      }

      // Streak flash at milestones
      if (known && (newStreak === 5 || newStreak === 10 || newStreak === 15 || newStreak === 20)) {
        setStreakFlash(newStreak)
        setTimeout(() => setStreakFlash(null), 1200)
      }

      // Record result
      setResults((prev) => [...prev, { exprId, correct: known }])

      // Advance after animation
      setTimeout(() => {
        setFlashColor(null)
        setFloatingXP(null)
        advanceCard()
      }, 300)
    },
    [
      currentCard,
      isAnimating,
      updateLeitner,
      markFamiliar,
      getFamiliarCount,
      recalculateScore,
      checkLevelUp,
      level,
      streak,
      advanceCard,
    ],
  )

  // Result screen data
  const correctCount = results.filter((r) => r.correct).length
  const wrongResults = results.filter((r) => !r.correct)

  // Replay wrong ones
  const handleReplay = useCallback(() => {
    // This would need a new component instance; simplest: call onComplete to re-mount
    onComplete(false)
  }, [onComplete])

  const handleExit = useCallback(() => {
    onComplete(correctCount >= cards.length / 2)
  }, [onComplete, correctCount, cards.length])

  // ---------------------------------------------------------------------------
  // Result screen
  // ---------------------------------------------------------------------------

  if (phase === 'result') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center h-full px-5 py-8 overflow-y-auto"
      >
        {/* Score */}
        <div className="mb-6 text-center">
          <p className="text-sm uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
            결과
          </p>
          <p className="text-5xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {correctCount}
            <span className="text-2xl font-normal" style={{ color: 'var(--text-muted)' }}>
              {' '}
              / {cards.length}
            </span>
          </p>
        </div>

        {/* Stats */}
        <div
          className="w-full max-w-sm rounded-2xl border p-4 mb-6 grid grid-cols-2 gap-4"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-card)',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          <div className="text-center">
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
              획득 XP
            </p>
            <p className="text-xl font-bold" style={{ color: 'var(--accent-text)' }}>
              +{Math.round(roundXP * 10) / 10}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
              최고 연속
            </p>
            <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {maxStreakRef.current}
            </p>
          </div>
        </div>

        {/* Wrong expressions */}
        {wrongResults.length > 0 && (
          <div className="w-full max-w-sm mb-6">
            <p className="text-xs uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
              다시 볼 표현
            </p>
            <div className="space-y-2">
              {wrongResults.map(({ exprId }) => {
                const entry = entries[exprId]
                return (
                  <div
                    key={exprId}
                    className="rounded-xl border px-4 py-3 flex items-center justify-between"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--border-card)',
                    }}
                  >
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {entry?.canonical ?? exprId}
                    </span>
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {entry?.meaning_ko ?? ''}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="w-full max-w-sm flex gap-3 mt-auto">
          {wrongResults.length > 0 && (
            <button
              onClick={handleReplay}
              className="flex-1 rounded-xl py-3.5 font-medium text-sm border transition-colors active:scale-[0.98]"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-card)',
                color: 'var(--text-primary)',
              }}
            >
              다시 풀기
            </button>
          )}
          <button
            onClick={handleExit}
            className="flex-1 rounded-xl py-3.5 font-medium text-sm transition-colors active:scale-[0.98]"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: '#fff',
            }}
          >
            그만하기
          </button>
        </div>
      </motion.div>
    )
  }

  // ---------------------------------------------------------------------------
  // Playing screen
  // ---------------------------------------------------------------------------

  if (!currentCard) {
    return (
      <div className="flex items-center justify-center h-full">
        <p style={{ color: 'var(--text-muted)' }}>표현을 불러올 수 없습니다</p>
      </div>
    )
  }

  return (
    <div className="relative flex flex-col h-full px-5 py-4">
      {/* Header: progress + streak */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          {currentIdx + 1} / {cards.length}
        </p>
        {streak > 0 && (
          <motion.p
            key={streak}
            initial={{ scale: 1.3 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.15 }}
            className="text-sm font-bold"
            style={{ color: 'var(--accent-text)' }}
          >
            {streak}x
          </motion.p>
        )}
      </div>

      {/* Progress bar */}
      <div
        className="w-full h-1 rounded-full mb-6 overflow-hidden"
        style={{ backgroundColor: 'var(--bg-secondary)' }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: 'var(--accent-primary)' }}
          initial={false}
          animate={{ width: `${((currentIdx) / cards.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Card area */}
      <div className="flex-1 flex items-center justify-center relative">
        {/* Flash overlay */}
        <AnimatePresence>
          {flashColor && (
            <motion.div
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 rounded-2xl pointer-events-none z-10"
              style={{
                backgroundColor: flashColor === 'green' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              }}
            />
          )}
        </AnimatePresence>

        {/* Floating XP */}
        <AnimatePresence>
          {floatingXP !== null && floatingXP > 0 && <FloatingXP key={`xp-${currentIdx}`} xp={floatingXP} />}
        </AnimatePresence>

        {/* Streak flash */}
        <AnimatePresence>{streakFlash && <StreakFlash key={`streak-${streakFlash}`} streak={streakFlash} />}</AnimatePresence>

        {/* Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCard.exprId + '-' + currentIdx}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{
              opacity: 0,
              x: slideDir === 'right' ? 120 : slideDir === 'left' ? -120 : 0,
              transition: { duration: 0.25 },
            }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-full max-w-sm rounded-2xl border p-6 flex flex-col items-center text-center"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-card)',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            {/* CEFR + category */}
            <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
              {currentCard.cefr}
              {currentCard.category ? ` \u00B7 ${CATEGORY_LABELS[currentCard.category] ?? currentCard.category}` : ''}
            </p>

            {/* Expression */}
            <p className="text-2xl font-bold mb-3 leading-snug" style={{ color: 'var(--text-primary)' }}>
              {currentCard.expression}
            </p>

            {/* Korean meaning */}
            <p className="text-base mb-5" style={{ color: 'var(--text-secondary)' }}>
              {currentCard.meaningKo}
            </p>

            {/* Context sentence */}
            {currentCard.contextEn && (
              <p
                className="text-sm leading-relaxed italic px-2 mb-6 max-w-[280px]"
                style={{ color: 'var(--text-muted)' }}
              >
                &ldquo;{currentCard.contextEn}&rdquo;
              </p>
            )}

            {!currentCard.contextEn && <div className="mb-6" />}

            {/* Buttons */}
            <div className="flex gap-3 w-full">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAnswer(false)}
                disabled={isAnimating}
                className="flex-1 rounded-xl py-3 font-medium text-sm border transition-colors"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-card)',
                  color: 'var(--text-secondary)',
                }}
              >
                몰라요
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAnswer(true)}
                disabled={isAnimating}
                className="flex-1 rounded-xl py-3 font-medium text-sm transition-colors"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  color: '#fff',
                }}
              >
                알아요
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
