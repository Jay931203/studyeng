'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import expressionEntries from '@/data/expression-entries-v2.json'
import expressionIndex from '@/data/expression-index-v2.json'
import wordEntriesData from '@/data/word-entries.json'
import wordIndexData from '@/data/word-index.json'
import { useGameProgressStore } from '@/stores/useGameProgressStore'
import { useFamiliarityStore } from '@/stores/useFamiliarityStore'
import { useLevelStore } from '@/stores/useLevelStore'
import { useOnboardingStore } from '@/stores/useOnboardingStore'
import { useUserStore } from '@/stores/useUserStore'
import { triggerHaptic } from '@/lib/haptic'
import { calculateSessionXP } from '@/lib/xp/sessionXp'
import { checkGameMilestones, checkStreakMilestones } from '@/stores/useMilestoneStore'

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

interface WordEntry {
  id: string
  canonical: string
  pos: string
  meaning_ko: string
  cefr: string
  example_en?: string
  example_ko?: string
  [key: string]: unknown
}

interface IndexMatch {
  exprId: string
  sentenceIdx: number
  en: string
  ko: string
}

interface WordIndexMatch {
  wordId: string
  sentenceIdx: number
  en: string
  ko: string
  surfaceForm: string
}

interface MeaningCandidate {
  meaningKo: string
  cefr: string
  tag: string
}

interface ChoiceData {
  id: string
  text: string
  isCorrect: boolean
}

interface CardData {
  type: 'expression' | 'word'
  exprId: string
  expression: string
  actualMeaningKo: string
  cefr: string
  category: string
  contextEn: string | null
  choices: ChoiceData[]
}

type GamePhase = 'playing' | 'result'

const CARDS_PER_ROUND = 10
const ANSWER_REVEAL_MS = 700

const entries = expressionEntries as Record<string, ExpressionEntry>
const index = expressionIndex as Record<string, IndexMatch[]>
const wordEntries = wordEntriesData as Record<string, WordEntry>
const wordIndex = wordIndexData as Record<string, WordIndexMatch[]>

// CEFR pools: user level +/- 1
const CEFR_POOLS: Record<string, { primary: string[]; secondary: string[] }> = {
  A1: { primary: ['A1', 'A2'], secondary: [] },
  A2: { primary: ['A1', 'A2', 'B1'], secondary: [] },
  B1: { primary: ['A2', 'B1', 'B2'], secondary: [] },
  B2: { primary: ['B1', 'B2', 'C1'], secondary: [] },
  C1: { primary: ['B2', 'C1', 'C2'], secondary: [] },
  C2: { primary: ['C1', 'C2'], secondary: [] },
}

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
  verb: 'verb',
  noun: 'noun',
  adjective: 'adjective',
  adverb: 'adverb',
  preposition: 'preposition',
  conjunction: 'conjunction',
  pronoun: 'pronoun',
  determiner: 'determiner',
}

function shuffle<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function normalizeMeaning(value?: string | null) {
  return value?.trim() ?? ''
}

function getFilteredExpressionIds(level: string): string[] {
  const pool = CEFR_POOLS[level] ?? CEFR_POOLS.A1
  const allCefrs = new Set([...pool.primary, ...pool.secondary])

  return Object.keys(entries).filter((id) => {
    const entry = entries[id]
    if (!entry?.cefr) return false
    return allCefrs.has(entry.cefr.toUpperCase())
  })
}

function getFilteredWordIds(level: string): string[] {
  const pool = CEFR_POOLS[level] ?? CEFR_POOLS.A1
  const allCefrs = new Set([...pool.primary, ...pool.secondary])

  return Object.keys(wordEntries).filter((id) => {
    const entry = wordEntries[id]
    if (!entry?.cefr) return false
    return allCefrs.has(entry.cefr.toUpperCase())
  })
}

let expressionContextCache: Record<string, IndexMatch[]> | null = null

function getContextByExprId(): Record<string, IndexMatch[]> {
  if (expressionContextCache) return expressionContextCache
  const map: Record<string, IndexMatch[]> = {}
  for (const matches of Object.values(index)) {
    for (const match of matches) {
      if (!map[match.exprId]) map[match.exprId] = []
      map[match.exprId].push(match)
    }
  }
  expressionContextCache = map
  return map
}

function pickContextSentence(exprId: string): string | null {
  const matches = getContextByExprId()[exprId]
  if (!matches?.length) return null
  const pick = matches[Math.floor(Math.random() * matches.length)]
  return pick.en
}

let wordContextCache: Record<string, WordIndexMatch[]> | null = null

function getWordContextByWordId(): Record<string, WordIndexMatch[]> {
  if (wordContextCache) return wordContextCache
  const map: Record<string, WordIndexMatch[]> = {}
  for (const matches of Object.values(wordIndex)) {
    for (const match of matches) {
      if (!map[match.wordId]) map[match.wordId] = []
      map[match.wordId].push(match)
    }
  }
  wordContextCache = map
  return map
}

function pickWordContextSentence(wordId: string): string | null {
  const matches = getWordContextByWordId()[wordId]
  if (!matches?.length) return null
  const pick = matches[Math.floor(Math.random() * matches.length)]
  return pick.en
}

function hasWordSupportContext(wordId: string) {
  const transcriptMatches = getWordContextByWordId()[wordId]
  if (transcriptMatches?.length) return true
  return Boolean(wordEntries[wordId]?.example_en?.trim())
}

function uniqueCandidates(source: MeaningCandidate[]) {
  const seen = new Set<string>()
  const deduped: MeaningCandidate[] = []

  for (const candidate of source) {
    const meaningKo = normalizeMeaning(candidate.meaningKo)
    if (!meaningKo || seen.has(meaningKo)) continue
    seen.add(meaningKo)
    deduped.push({
      meaningKo,
      cefr: candidate.cefr.toUpperCase(),
      tag: candidate.tag,
    })
  }

  return deduped
}

const expressionMeaningCandidates = uniqueCandidates(
  Object.values(entries).map((entry) => ({
    meaningKo: entry.meaning_ko ?? '',
    cefr: entry.cefr ?? '',
    tag: entry.category ?? '',
  })),
)

const wordMeaningCandidates = uniqueCandidates(
  Object.values(wordEntries).map((entry) => ({
    meaningKo: entry.meaning_ko ?? '',
    cefr: entry.cefr ?? '',
    tag: entry.pos ?? '',
  })),
)

function pickDecoyMeanings(params: {
  type: 'expression' | 'word'
  actualMeaningKo: string
  cefr: string
  category: string
}) {
  const source = params.type === 'word' ? wordMeaningCandidates : expressionMeaningCandidates
  const actual = normalizeMeaning(params.actualMeaningKo)
  const used = new Set<string>([actual])
  const decoys: string[] = []

  const buckets = [
    source.filter((candidate) => candidate.cefr === params.cefr && candidate.tag === params.category),
    source.filter((candidate) => candidate.cefr === params.cefr),
    source.filter((candidate) => candidate.tag === params.category),
    source,
  ]

  for (const bucket of buckets) {
    for (const candidate of shuffle(bucket)) {
      const meaningKo = normalizeMeaning(candidate.meaningKo)
      if (!meaningKo || used.has(meaningKo)) continue
      used.add(meaningKo)
      decoys.push(meaningKo)
      if (decoys.length === 3) return decoys
    }
  }

  return decoys
}

function buildChoices(card: Omit<CardData, 'choices'>): ChoiceData[] {
  const decoys = pickDecoyMeanings({
    type: card.type,
    actualMeaningKo: card.actualMeaningKo,
    cefr: card.cefr,
    category: card.category,
  })

  const options = [card.actualMeaningKo, ...decoys].slice(0, 4)

  return shuffle(options).map((text, index) => ({
    id: `${card.exprId}-${index}`,
    text,
    isCorrect: text === card.actualMeaningKo,
  }))
}

function selectCards(level: string): CardData[] {
  const gameStore = useGameProgressStore.getState()
  const defaultExpressionCount = Math.round(CARDS_PER_ROUND * 0.7)
  const defaultWordCount = CARDS_PER_ROUND - defaultExpressionCount

  let filteredWordIds = getFilteredWordIds(level).filter((id) => hasWordSupportContext(id))
  if (filteredWordIds.length < defaultWordCount) {
    filteredWordIds = Object.keys(wordEntries).filter((id) => hasWordSupportContext(id))
  }

  const wordCount = Math.min(defaultWordCount, filteredWordIds.length)
  const expressionCount = CARDS_PER_ROUND - wordCount

  let filteredExpressionIds = getFilteredExpressionIds(level)
  if (filteredExpressionIds.length < expressionCount) {
    filteredExpressionIds = Object.keys(entries)
  }

  const filteredExpressionSet = new Set(filteredExpressionIds)
  const allBox1 = gameStore.getBox1Expressions()
  const allBox2 = gameStore.getBox2Expressions()
  const allBox3 = gameStore.getMasteredExpressions()

  const expressionBox1 = allBox1.filter((id) => !id.startsWith('word:') && filteredExpressionSet.has(id))
  const expressionBox2 = allBox2.filter((id) => !id.startsWith('word:') && filteredExpressionSet.has(id))
  const expressionBox3 = allBox3.filter((id) => !id.startsWith('word:') && filteredExpressionSet.has(id))
  const seenExpressions = new Set([...expressionBox1, ...expressionBox2, ...expressionBox3])
  const newExpressions = filteredExpressionIds.filter((id) => !seenExpressions.has(id))

  const selectedExpressionIds: string[] = []
  const usedExpressionIds = new Set<string>()

  const addUniqueExpressions = (source: string[], max: number) => {
    let added = 0
    for (const exprId of shuffle(source)) {
      if (added >= max) break
      if (usedExpressionIds.has(exprId)) continue
      selectedExpressionIds.push(exprId)
      usedExpressionIds.add(exprId)
      added += 1
    }
  }

  addUniqueExpressions(expressionBox1, 3)
  addUniqueExpressions(expressionBox2, 2)
  if (Math.random() < 0.1 && expressionBox3.length > 0) {
    addUniqueExpressions(expressionBox3, 1)
  }

  const remainingExpressionSlots = expressionCount - selectedExpressionIds.length
  if (remainingExpressionSlots > 0) {
    addUniqueExpressions(newExpressions, remainingExpressionSlots)
  }
  if (selectedExpressionIds.length < expressionCount) {
    addUniqueExpressions(
      filteredExpressionIds.filter((id) => !usedExpressionIds.has(id)),
      expressionCount - selectedExpressionIds.length,
    )
  }

  const filteredWordSet = new Set(filteredWordIds)
  const wordBox1 = allBox1.filter((id) => id.startsWith('word:') && filteredWordSet.has(id.slice(5)))
  const wordBox2 = allBox2.filter((id) => id.startsWith('word:') && filteredWordSet.has(id.slice(5)))
  const wordBox3 = allBox3.filter((id) => id.startsWith('word:') && filteredWordSet.has(id.slice(5)))
  const seenWordIds = new Set([...wordBox1, ...wordBox2, ...wordBox3].map((id) => id.slice(5)))
  const newWords = filteredWordIds.filter((id) => !seenWordIds.has(id))

  const selectedWordIds: string[] = []
  const usedWordIds = new Set<string>()

  const addUniqueWords = (source: string[], max: number) => {
    let added = 0
    for (const rawId of shuffle(source)) {
      if (added >= max) break
      const wordId = rawId.startsWith('word:') ? rawId.slice(5) : rawId
      if (usedWordIds.has(wordId)) continue
      selectedWordIds.push(wordId)
      usedWordIds.add(wordId)
      added += 1
    }
  }

  addUniqueWords(wordBox1, 1)
  addUniqueWords(wordBox2, 1)
  if (Math.random() < 0.1 && wordBox3.length > 0) {
    addUniqueWords(wordBox3, 1)
  }

  const remainingWordSlots = wordCount - selectedWordIds.length
  if (remainingWordSlots > 0) {
    addUniqueWords(newWords, remainingWordSlots)
  }
  if (selectedWordIds.length < wordCount) {
    addUniqueWords(
      filteredWordIds.filter((id) => !usedWordIds.has(id)),
      wordCount - selectedWordIds.length,
    )
  }

  const expressionCards = selectedExpressionIds.map((exprId) => {
    const entry = entries[exprId]
    const baseCard = {
      type: 'expression' as const,
      exprId,
      expression: entry?.canonical ?? exprId,
      actualMeaningKo: normalizeMeaning(entry?.meaning_ko ?? ''),
      cefr: entry?.cefr?.toUpperCase() ?? 'B1',
      category: entry?.category ?? '',
      contextEn: pickContextSentence(exprId),
    }

    return {
      ...baseCard,
      choices: buildChoices(baseCard),
    }
  })

  const wordCards = selectedWordIds.map((wordId) => {
    const entry = wordEntries[wordId]
    const baseCard = {
      type: 'word' as const,
      exprId: `word:${wordId}`,
      expression: entry?.canonical ?? wordId,
      actualMeaningKo: normalizeMeaning(entry?.meaning_ko ?? ''),
      cefr: entry?.cefr?.toUpperCase() ?? 'B1',
      category: entry?.pos ?? '',
      contextEn: pickWordContextSentence(wordId) ?? entry?.example_en ?? null,
    }

    return {
      ...baseCard,
      choices: buildChoices(baseCard),
    }
  })

  return shuffle([...expressionCards, ...wordCards])
}

function StreakFlash({ streak }: { streak: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.82 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.82 }}
      transition={{ duration: 0.35 }}
      className="pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 rounded-full border px-4 py-2 text-sm font-bold"
      style={{
        top: 'calc(env(safe-area-inset-top, 0px) + 4.5rem)',
        color: 'var(--accent-text)',
        borderColor: 'rgba(var(--accent-primary-rgb), 0.28)',
        backgroundColor: 'rgba(var(--accent-primary-rgb), 0.16)',
      }}
    >
      {streak}x combo
    </motion.div>
  )
}

export function ExpressionSwipeGame({ onComplete }: ExpressionSwipeGameProps) {
  const level = useOnboardingStore((state) => state.level)
  const updateLeitner = useGameProgressStore((state) => state.updateLeitner)
  const updateBestStreak = useGameProgressStore((state) => state.updateBestStreak)
  const incrementSessionCount = useGameProgressStore((state) => state.incrementSessionCount)
  const bestStreak = useGameProgressStore((state) => state.bestStreak)
  const markFamiliar = useFamiliarityStore((state) => state.markFamiliar)
  const recalculateScore = useLevelStore((state) => state.recalculateScore)
  const checkLevelUp = useLevelStore((state) => state.checkLevelUp)

  const [cards] = useState<CardData[]>(() => selectCards(level))
  const [currentIdx, setCurrentIdx] = useState(0)
  const [phase, setPhase] = useState<GamePhase>('playing')
  const [streak, setStreak] = useState(0)
  const [sessionXPAwarded, setSessionXPAwarded] = useState(0)
  const [results, setResults] = useState<
    Array<{
      exprId: string
      expression: string
      selectedMeaningKo: string
      actualMeaningKo: string
      correct: boolean
    }>
  >([])
  const [flashColor, setFlashColor] = useState<'green' | 'red' | null>(null)
  const [streakFlash, setStreakFlash] = useState<number | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [slideDir, setSlideDir] = useState<'left' | 'right' | null>(null)
  const [feedback, setFeedback] = useState<{
    correct: boolean
    title: string
    detail: string
  } | null>(null)
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null)
  const [bestCombo, setBestCombo] = useState(0)
  const [sessionStart] = useState(() => Date.now())

  const maxStreakRef = useRef(0)

  const currentCard = cards[currentIdx] ?? null

  const finishRound = useCallback(() => {
    incrementSessionCount('expressionSwipe')
    if (maxStreakRef.current > bestStreak) {
      updateBestStreak(maxStreakRef.current)
    }

    const xpAmount = calculateSessionXP('expressionSwipe', sessionStart)
    if (xpAmount > 0) {
      const actual = useGameProgressStore.getState().addSessionXP(xpAmount)
      setSessionXPAwarded(actual)
    }

    const gameStore = useGameProgressStore.getState()
    if (!gameStore.isStreakBonusAwardedToday()) {
      const userState = useUserStore.getState()
      userState.checkAndUpdateStreak()
      const streakDays = useUserStore.getState().streakDays
      gameStore.awardStreakBonus(streakDays)
      checkStreakMilestones(streakDays)
    }

    const totalSessions = useGameProgressStore.getState().getTotalSessions()
    checkGameMilestones(totalSessions)
    setPhase('result')
  }, [bestStreak, incrementSessionCount, sessionStart, updateBestStreak])

  const advanceCard = useCallback(() => {
    if (currentIdx + 1 >= cards.length) {
      finishRound()
      return
    }

    setCurrentIdx((prev) => prev + 1)
    setSlideDir(null)
    setSelectedChoiceId(null)
    setFeedback(null)
    setIsAnimating(false)
  }, [cards.length, currentIdx, finishRound])

  const handleChoice = useCallback(
    (choice: ChoiceData) => {
      if (!currentCard || isAnimating || selectedChoiceId) return

      setIsAnimating(true)
      setSelectedChoiceId(choice.id)

      const isCorrect = choice.isCorrect
      const exprId = currentCard.exprId

      setFlashColor(isCorrect ? 'green' : 'red')
      setSlideDir(isCorrect ? 'right' : 'left')
      setFeedback({
        correct: isCorrect,
        title: isCorrect ? 'GOOD' : 'MISS',
        detail: isCorrect ? choice.text : `정답: ${currentCard.actualMeaningKo}`,
      })

      triggerHaptic(isCorrect ? 40 : [30, 50, 30])
      updateLeitner(exprId, isCorrect)

      if (isCorrect) {
        markFamiliar(exprId)
        window.setTimeout(() => {
          const updatedEntries = useFamiliarityStore.getState().entries
          recalculateScore(updatedEntries)
          checkLevelUp(level)
        }, 50)
      }

      const nextStreak = isCorrect ? streak + 1 : 0
      setStreak(nextStreak)
      if (nextStreak > maxStreakRef.current) {
        maxStreakRef.current = nextStreak
        setBestCombo(nextStreak)
      }
      if (isCorrect && [3, 5, 8, 10].includes(nextStreak)) {
        setStreakFlash(nextStreak)
        window.setTimeout(() => setStreakFlash(null), 1000)
      }

      setResults((prev) => [
        ...prev,
        {
          exprId,
          expression: currentCard.expression,
          selectedMeaningKo: choice.text,
          actualMeaningKo: currentCard.actualMeaningKo,
          correct: isCorrect,
        },
      ])

      window.setTimeout(() => {
        setFlashColor(null)
        advanceCard()
      }, ANSWER_REVEAL_MS)
    },
    [
      advanceCard,
      checkLevelUp,
      currentCard,
      isAnimating,
      level,
      markFamiliar,
      recalculateScore,
      selectedChoiceId,
      streak,
      updateLeitner,
    ],
  )

  const correctCount = results.filter((result) => result.correct).length
  const wrongResults = results.filter((result) => !result.correct)

  const handleReplay = useCallback(() => {
    onComplete(false)
  }, [onComplete])

  const handleExit = useCallback(() => {
    onComplete(correctCount >= cards.length / 2)
  }, [cards.length, correctCount, onComplete])

  if (phase === 'result') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex h-full flex-col items-center overflow-y-auto px-5 py-8"
      >
        <div className="mb-6 text-center">
          <p className="mb-2 text-sm uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            RESULT
          </p>
          <p className="text-5xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {correctCount}
            <span className="text-2xl font-normal" style={{ color: 'var(--text-muted)' }}>
              {' '}
              / {cards.length}
            </span>
          </p>
        </div>

        <div
          className="mb-6 grid w-full max-w-sm grid-cols-2 gap-4 rounded-2xl border p-4"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-card)',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          <div className="text-center">
            <p className="mb-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              SESSION XP
            </p>
            <p className="text-xl font-bold" style={{ color: 'var(--accent-text)' }}>
              +{sessionXPAwarded}
            </p>
          </div>
          <div className="text-center">
            <p className="mb-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              BEST COMBO
            </p>
            <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {bestCombo}
            </p>
          </div>
        </div>

        {wrongResults.length > 0 && (
          <div className="mb-6 w-full max-w-sm">
            <p className="mb-3 text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              REVIEW
            </p>
            <div className="space-y-2">
              {wrongResults.map((result) => (
                <div
                  key={`${result.exprId}-${result.selectedMeaningKo}`}
                  className="rounded-xl border px-4 py-3"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-card)',
                  }}
                >
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {result.expression}
                  </p>
                  <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                    내가 고른 뜻: {result.selectedMeaningKo}
                  </p>
                  <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    정답: {result.actualMeaningKo}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto flex w-full max-w-sm gap-3">
          {wrongResults.length > 0 && (
            <button
              onClick={handleReplay}
              className="flex-1 rounded-xl border py-3.5 text-sm font-medium transition-colors active:scale-[0.98]"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-card)',
                color: 'var(--text-primary)',
              }}
            >
              다시 하기
            </button>
          )}
          <button
            onClick={handleExit}
            className="flex-1 rounded-xl py-3.5 text-sm font-medium transition-colors active:scale-[0.98]"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: '#fff',
            }}
          >
            끝내기
          </button>
        </div>
      </motion.div>
    )
  }

  if (!currentCard) {
    return (
      <div className="flex h-full items-center justify-center">
        <p style={{ color: 'var(--text-muted)' }}>표현을 불러올 수 없습니다.</p>
      </div>
    )
  }

  const supportText =
    currentCard.contextEn ??
    (currentCard.type === 'word'
      ? '예문이 준비된 단어만 출제됩니다.'
      : '가장 자연스러운 뜻을 탭해 고르세요.')

  return (
    <div className="relative flex h-full flex-col px-5 pb-5 pt-3">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          {currentIdx + 1} / {cards.length}
        </p>
        {streak > 0 && (
          <motion.p
            key={streak}
            initial={{ scale: 1.24 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.15 }}
            className="rounded-full border px-3 py-1 text-sm font-bold"
            style={{
              color: 'var(--accent-text)',
              borderColor: 'rgba(var(--accent-primary-rgb), 0.28)',
              backgroundColor: 'rgba(var(--accent-primary-rgb), 0.14)',
            }}
          >
            {streak}x combo
          </motion.p>
        )}
      </div>

      <div
        className="mb-6 h-1 w-full overflow-hidden rounded-full"
        style={{ backgroundColor: 'var(--bg-secondary)' }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: 'var(--accent-primary)' }}
          initial={false}
          animate={{ width: `${(currentIdx / cards.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="relative flex flex-1 items-center justify-center">
        <AnimatePresence>
          {flashColor && (
            <motion.div
              initial={{ opacity: 0.48 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.32 }}
              className="pointer-events-none absolute inset-0 z-10 rounded-2xl"
              style={{
                backgroundColor:
                  flashColor === 'green'
                    ? 'rgba(34, 197, 94, 0.14)'
                    : 'rgba(239, 68, 68, 0.14)',
              }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {streakFlash && <StreakFlash key={`streak-${streakFlash}`} streak={streakFlash} />}
        </AnimatePresence>

        <AnimatePresence>
          {feedback && (
            <motion.div
              key={`${feedback.title}-${feedback.detail}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="pointer-events-none absolute top-4 z-20 flex justify-center"
            >
              <div
                className="rounded-full border px-4 py-2 text-xs font-semibold"
                style={{
                  color: feedback.correct ? '#86efac' : '#fca5a5',
                  borderColor: feedback.correct ? 'rgba(34, 197, 94, 0.24)' : 'rgba(239, 68, 68, 0.24)',
                  backgroundColor: feedback.correct ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                }}
              >
                {feedback.title}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentCard.exprId}-${currentIdx}`}
            initial={{ opacity: 0, x: 36 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{
              opacity: 0,
              x: slideDir === 'right' ? 110 : slideDir === 'left' ? -110 : 0,
              transition: { duration: 0.24 },
            }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            className="flex w-full max-w-md flex-col"
          >
            <div
              className="rounded-[28px] border px-6 py-6 text-center"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-card)',
                boxShadow: 'var(--card-shadow)',
              }}
            >
              <p
                className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em]"
                style={{ color: 'var(--accent-text)' }}
              >
                Meaning Match
              </p>
              <p className="mb-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                {currentCard.cefr}
                {currentCard.category
                  ? ` · ${CATEGORY_LABELS[currentCard.category] ?? currentCard.category}`
                  : ''}
              </p>
              <p className="mb-3 text-2xl font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>
                {currentCard.expression}
              </p>
              <p
                className="mx-auto min-h-[44px] max-w-[320px] text-sm leading-relaxed"
                style={{ color: currentCard.contextEn ? 'var(--text-secondary)' : 'var(--text-muted)' }}
              >
                {currentCard.contextEn ? `"${currentCard.contextEn}"` : supportText}
              </p>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              {currentCard.choices.map((choice, index) => {
                const isSelected = selectedChoiceId === choice.id
                const isCorrectChoice = selectedChoiceId !== null && choice.isCorrect
                const isWrongSelected = isSelected && !choice.isCorrect

                let backgroundColor = 'var(--bg-card)'
                let borderColor = 'var(--border-card)'
                let textColor = 'var(--text-primary)'

                if (selectedChoiceId !== null) {
                  if (isCorrectChoice) {
                    backgroundColor = 'rgba(34, 197, 94, 0.14)'
                    borderColor = 'rgba(34, 197, 94, 0.34)'
                    textColor = '#ffffff'
                  } else if (isWrongSelected) {
                    backgroundColor = 'rgba(239, 68, 68, 0.14)'
                    borderColor = 'rgba(239, 68, 68, 0.34)'
                    textColor = '#ffffff'
                  } else {
                    backgroundColor = 'var(--bg-secondary)'
                    textColor = 'var(--text-muted)'
                  }
                }

                return (
                  <motion.button
                    key={choice.id}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.2, ease: 'easeOut' }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleChoice(choice)}
                    disabled={selectedChoiceId !== null || isAnimating}
                    className="min-h-[96px] rounded-2xl border px-4 py-4 text-left text-sm font-medium transition-all"
                    style={{ backgroundColor, borderColor, color: textColor }}
                  >
                    <div className="mb-2">
                      <span
                        className="text-[10px] font-semibold uppercase tracking-[0.18em]"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {String.fromCharCode(65 + index)}
                      </span>
                    </div>
                    <p className="leading-relaxed">{choice.text}</p>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
