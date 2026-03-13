'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import expressionEntries from '@/data/expression-entries-v2.json'
import expressionIndex from '@/data/expression-index-v2.json'
import wordEntriesData from '@/data/word-entries.json'
import wordIndexData from '@/data/word-index.json'
import { useGameProgressStore } from '@/stores/useGameProgressStore'
import { useFamiliarityStore } from '@/stores/useFamiliarityStore'
import { useLevelStore } from '@/stores/useLevelStore'
import { useOnboardingStore } from '@/stores/useOnboardingStore'
import { calculateSessionXP } from '@/lib/xp/sessionXp'
import { checkGameMilestones, checkStreakMilestones } from '@/stores/useMilestoneStore'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ListenFillGameProps {
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

interface QuestionData {
  type: 'expression' | 'word'
  exprId: string
  videoId: string
  sentenceIdx: number
  en: string
  ko: string
  expression: string
  meaningKo: string
  cefr: string
  category: string
  before: string
  after: string
  choices: string[]
}

type GamePhase = 'playing' | 'result'

const QUESTIONS_PER_ROUND = 8

const entries = expressionEntries as Record<string, ExpressionEntry>
const index = expressionIndex as Record<string, IndexMatch[]>
const wordEntries = wordEntriesData as Record<string, WordEntry>
const wordIndex = wordIndexData as Record<string, WordIndexMatch[]>

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
  // POS labels for words
  verb: 'verb',
  noun: 'noun',
  adjective: 'adjective',
  adverb: 'adverb',
  preposition: 'preposition',
  conjunction: 'conjunction',
  pronoun: 'pronoun',
  determiner: 'determiner',
}

// ---------------------------------------------------------------------------
// CEFR filter
// ---------------------------------------------------------------------------

const CEFR_BY_LEVEL: Record<string, Set<string>> = {
  beginner: new Set(['A1', 'A2', 'B1']),
  intermediate: new Set(['B1', 'B2']),
  advanced: new Set(['B2', 'C1', 'C2']),
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function applyBlank(
  sentence: string,
  expression: string,
): { before: string; after: string } | null {
  const idx = sentence.toLowerCase().indexOf(expression.toLowerCase())
  if (idx === -1) return null
  return {
    before: sentence.slice(0, idx),
    after: sentence.slice(idx + expression.length),
  }
}

// ---------------------------------------------------------------------------
// Build a flat pool: { exprId, videoId, sentenceIdx, en, ko }
// ---------------------------------------------------------------------------

interface PoolEntry {
  exprId: string
  videoId: string
  sentenceIdx: number
  en: string
  ko: string
}

let _poolCache: PoolEntry[] | null = null

function buildPool(): PoolEntry[] {
  if (_poolCache) return _poolCache
  const pool: PoolEntry[] = []
  for (const [videoId, matches] of Object.entries(index)) {
    for (const m of matches) {
      pool.push({
        exprId: m.exprId,
        videoId,
        sentenceIdx: m.sentenceIdx,
        en: m.en,
        ko: m.ko,
      })
    }
  }
  _poolCache = pool
  return pool
}

// ---------------------------------------------------------------------------
// Word pool
// ---------------------------------------------------------------------------

interface WordPoolEntry {
  wordId: string
  videoId: string
  sentenceIdx: number
  en: string
  ko: string
  surfaceForm: string
}

let _wordPoolCache: WordPoolEntry[] | null = null

function buildWordPool(): WordPoolEntry[] {
  if (_wordPoolCache) return _wordPoolCache
  const pool: WordPoolEntry[] = []
  for (const [videoId, matches] of Object.entries(wordIndex)) {
    for (const m of matches) {
      pool.push({
        wordId: m.wordId,
        videoId,
        sentenceIdx: m.sentenceIdx,
        en: m.en,
        ko: m.ko,
        surfaceForm: m.surfaceForm,
      })
    }
  }
  _wordPoolCache = pool
  return pool
}

// ---------------------------------------------------------------------------
// Distractor generation
// ---------------------------------------------------------------------------

function generateDistractors(
  correctExprId: string,
  correctCategory: string,
): string[] {
  const correctEntry = entries[correctExprId]
  const correctCanonical = correctEntry?.canonical ?? correctExprId

  // Gather same-category expressions
  const sameCategory: string[] = []
  const otherCategory: string[] = []

  for (const [id, entry] of Object.entries(entries)) {
    if (id === correctExprId) continue
    const canonical = entry.canonical ?? id
    if (canonical === correctCanonical) continue
    if (entry.category === correctCategory) {
      sameCategory.push(canonical)
    } else {
      otherCategory.push(canonical)
    }
  }

  const candidates = shuffle(sameCategory)
  if (candidates.length < 3) {
    candidates.push(...shuffle(otherCategory))
  }

  // Deduplicate and take 3
  const seen = new Set<string>([correctCanonical])
  const result: string[] = []
  for (const c of candidates) {
    if (result.length >= 3) break
    if (seen.has(c)) continue
    seen.add(c)
    result.push(c)
  }

  return result
}

// ---------------------------------------------------------------------------
// Word distractor generation
// ---------------------------------------------------------------------------

function generateWordDistractors(
  correctWordId: string,
  correctCefr: string,
): string[] {
  const correctEntry = wordEntries[correctWordId]
  const correctSurface = correctEntry?.canonical ?? correctWordId

  // Gather same-CEFR words first, then others
  const sameCefr: string[] = []
  const otherCefr: string[] = []

  for (const [id, entry] of Object.entries(wordEntries)) {
    if (id === correctWordId) continue
    const canonical = entry.canonical ?? id
    if (canonical === correctSurface) continue
    if (entry.cefr?.toUpperCase() === correctCefr) {
      sameCefr.push(canonical)
    } else {
      otherCefr.push(canonical)
    }
  }

  const candidates = shuffle(sameCefr)
  if (candidates.length < 3) {
    candidates.push(...shuffle(otherCefr))
  }

  const seen = new Set<string>([correctSurface])
  const result: string[] = []
  for (const c of candidates) {
    if (result.length >= 3) break
    if (seen.has(c)) continue
    seen.add(c)
    result.push(c)
  }

  return result
}

// ---------------------------------------------------------------------------
// Word blank application (uses surfaceForm for exact match)
// ---------------------------------------------------------------------------

function applyWordBlank(
  sentence: string,
  surfaceForm: string,
): { before: string; after: string } | null {
  const idx = sentence.indexOf(surfaceForm)
  if (idx === -1) {
    // Fallback: case-insensitive search
    const lowerIdx = sentence.toLowerCase().indexOf(surfaceForm.toLowerCase())
    if (lowerIdx === -1) return null
    return {
      before: sentence.slice(0, lowerIdx),
      after: sentence.slice(lowerIdx + surfaceForm.length),
    }
  }
  return {
    before: sentence.slice(0, idx),
    after: sentence.slice(idx + surfaceForm.length),
  }
}

// ---------------------------------------------------------------------------
// Question selection
// ---------------------------------------------------------------------------

function selectQuestions(level: string): QuestionData[] {
  const cefrSet = CEFR_BY_LEVEL[level] ?? CEFR_BY_LEVEL.beginner

  // Determine split: 50% expressions, 50% words
  const exprTarget = Math.round(QUESTIONS_PER_ROUND * 0.5)
  const wordTarget = QUESTIONS_PER_ROUND - exprTarget

  // --- Expression questions ---
  const pool = buildPool()
  let filtered = pool.filter((p) => {
    const entry = entries[p.exprId]
    if (!entry?.cefr) return false
    return cefrSet.has(entry.cefr.toUpperCase())
  })
  if (filtered.length < exprTarget) {
    filtered = pool
  }

  const shuffledExpr = shuffle(filtered)
  const exprQuestions: QuestionData[] = []
  const usedExprIds = new Set<string>()

  for (const item of shuffledExpr) {
    if (exprQuestions.length >= exprTarget) break
    if (usedExprIds.has(item.exprId)) continue

    const entry = entries[item.exprId]
    if (!entry) continue

    const canonical = entry.canonical ?? item.exprId
    const blank = applyBlank(item.en, canonical)
    if (!blank) continue

    usedExprIds.add(item.exprId)

    const distractors = generateDistractors(item.exprId, entry.category)
    const choices = shuffle([canonical, ...distractors])

    exprQuestions.push({
      type: 'expression',
      exprId: item.exprId,
      videoId: item.videoId,
      sentenceIdx: item.sentenceIdx,
      en: item.en,
      ko: item.ko,
      expression: canonical,
      meaningKo: entry.meaning_ko ?? '',
      cefr: entry.cefr?.toUpperCase() ?? 'B1',
      category: entry.category ?? '',
      before: blank.before,
      after: blank.after,
      choices,
    })
  }

  // --- Word questions ---
  const wordPool = buildWordPool()
  let filteredWords = wordPool.filter((p) => {
    const entry = wordEntries[p.wordId]
    if (!entry?.cefr) return false
    return cefrSet.has(entry.cefr.toUpperCase())
  })
  if (filteredWords.length < wordTarget) {
    filteredWords = wordPool
  }

  const shuffledWords = shuffle(filteredWords)
  const wordQuestions: QuestionData[] = []
  const usedWordIds = new Set<string>()

  for (const item of shuffledWords) {
    if (wordQuestions.length >= wordTarget) break
    if (usedWordIds.has(item.wordId)) continue

    const entry = wordEntries[item.wordId]
    if (!entry) continue

    const blank = applyWordBlank(item.en, item.surfaceForm)
    if (!blank) continue

    usedWordIds.add(item.wordId)

    const cefr = entry.cefr?.toUpperCase() ?? 'B1'
    const distractors = generateWordDistractors(item.wordId, cefr)
    // Use surfaceForm as the correct answer (matches what was blanked)
    const choices = shuffle([item.surfaceForm, ...distractors])

    wordQuestions.push({
      type: 'word',
      exprId: `word:${item.wordId}`,
      videoId: item.videoId,
      sentenceIdx: item.sentenceIdx,
      en: item.en,
      ko: item.ko,
      expression: item.surfaceForm,
      meaningKo: entry.meaning_ko ?? '',
      cefr,
      category: entry.pos ?? '',
      before: blank.before,
      after: blank.after,
      choices,
    })
  }

  // Fill up with more expressions if not enough word questions
  if (wordQuestions.length < wordTarget) {
    const extraExprNeeded = wordTarget - wordQuestions.length
    for (const item of shuffledExpr) {
      if (exprQuestions.length + extraExprNeeded <= exprQuestions.length) break
      if (usedExprIds.has(item.exprId)) continue

      const entry = entries[item.exprId]
      if (!entry) continue

      const canonical = entry.canonical ?? item.exprId
      const blank = applyBlank(item.en, canonical)
      if (!blank) continue

      usedExprIds.add(item.exprId)

      const distractors = generateDistractors(item.exprId, entry.category)
      const choices = shuffle([canonical, ...distractors])

      exprQuestions.push({
        type: 'expression',
        exprId: item.exprId,
        videoId: item.videoId,
        sentenceIdx: item.sentenceIdx,
        en: item.en,
        ko: item.ko,
        expression: canonical,
        meaningKo: entry.meaning_ko ?? '',
        cefr: entry.cefr?.toUpperCase() ?? 'B1',
        category: entry.category ?? '',
        before: blank.before,
        after: blank.after,
        choices,
      })

      if (exprQuestions.length >= exprTarget + (wordTarget - wordQuestions.length)) break
    }
  }

  return shuffle([...exprQuestions, ...wordQuestions])
}

// ---------------------------------------------------------------------------
// YouTube IFrame API hook
// ---------------------------------------------------------------------------

// YT types come from @types/youtube

function useYouTubePlayer(
  containerRef: React.RefObject<HTMLDivElement | null>,
) {
  const playerRef = useRef<YT.Player | null>(null)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let destroyed = false
    const timeoutId = setTimeout(() => {
      if (!destroyed && !ready) {
        setFailed(true)
      }
    }, 8000)

    const createPlayer = () => {
      if (destroyed || !containerRef.current) return
      try {
        playerRef.current = new window.YT.Player(containerRef.current, {
          height: '0',
          width: '0',
          playerVars: {
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            playsinline: 1,
          },
          events: {
            onReady: () => {
              if (!destroyed) {
                clearTimeout(timeoutId)
                setReady(true)
              }
            },
            onError: () => {
              if (!destroyed) {
                clearTimeout(timeoutId)
                setFailed(true)
              }
            },
          },
        })
      } catch {
        if (!destroyed) {
          clearTimeout(timeoutId)
          setFailed(true)
        }
      }
    }

    if (window.YT?.Player) {
      createPlayer()
    } else {
      // Load the API script if not already present
      const existingScript = document.querySelector(
        'script[src="https://www.youtube.com/iframe_api"]',
      )
      if (!existingScript) {
        const script = document.createElement('script')
        script.src = 'https://www.youtube.com/iframe_api'
        document.head.appendChild(script)
      }

      const prevCallback = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        prevCallback?.()
        createPlayer()
      }
    }

    return () => {
      destroyed = true
      clearTimeout(timeoutId)
      try {
        playerRef.current?.destroy()
      } catch {
        // ignore
      }
      playerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const playSegment = useCallback(
    (videoId: string, start: number, end: number) => {
      const player = playerRef.current
      if (!player || !ready) return

      try {
        ;(player as any).loadVideoById({ videoId, startSeconds: start })
        player.playVideo()

        const poll = setInterval(() => {
          try {
            const currentTime = player.getCurrentTime?.()
            if (currentTime !== undefined && currentTime >= end) {
              player.pauseVideo()
              clearInterval(poll)
            }
          } catch {
            clearInterval(poll)
          }
        }, 100)

        // Safety: clear poll after 30s max
        setTimeout(() => clearInterval(poll), 30000)
      } catch {
        // silent fail
      }
    },
    [ready],
  )

  return { ready, failed, playSegment }
}

// ---------------------------------------------------------------------------
// Expression info popup
// ---------------------------------------------------------------------------

function ExpressionPopup({
  expression,
  meaningKo,
  cefr,
  category,
}: {
  expression: string
  meaningKo: string
  cefr: string
  category: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.95 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-sm rounded-xl border px-4 py-3 z-40"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-card)',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      <p className="text-base font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
        {expression}
      </p>
      <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
        {meaningKo}
      </p>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        {cefr}
        {category ? ` \u00B7 ${CATEGORY_LABELS[category] ?? category}` : ''}
      </p>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Transcript cache
// ---------------------------------------------------------------------------

const transcriptCache: Record<
  string,
  Array<{ start: number; end: number; en: string; ko: string }>
> = {}

async function loadTranscript(
  videoId: string,
): Promise<Array<{ start: number; end: number; en: string; ko: string }> | null> {
  if (transcriptCache[videoId]) return transcriptCache[videoId]
  try {
    const res = await fetch(`/transcripts/${videoId}.json`)
    if (!res.ok) return null
    const data = await res.json()
    transcriptCache[videoId] = data
    return data
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function ListenFillGame({ onComplete }: ListenFillGameProps) {
  const level = useOnboardingStore((s) => s.level)
  const incrementSessionCount = useGameProgressStore((s) => s.incrementSessionCount)
  const updateLeitner = useGameProgressStore((s) => s.updateLeitner)
  const markFamiliar = useFamiliarityStore((s) => s.markFamiliar)
  const recalculateScore = useLevelStore((s) => s.recalculateScore)
  const checkLevelUp = useLevelStore((s) => s.checkLevelUp)

  // YouTube player
  const playerContainerRef = useRef<HTMLDivElement | null>(null)
  const { ready: ytReady, failed: ytFailed, playSegment } = useYouTubePlayer(playerContainerRef)

  // Game state
  const [questions] = useState<QuestionData[]>(() => selectQuestions(level))
  const [currentIdx, setCurrentIdx] = useState(0)
  const [phase, setPhase] = useState<GamePhase>('playing')
  const [sessionXPAwarded, setSessionXPAwarded] = useState(0)
  const [results, setResults] = useState<
    Array<{ exprId: string; correct: boolean }>
  >([])

  const sessionStartRef = useRef(Date.now())

  // Per-question state
  const [selected, setSelected] = useState<string | null>(null)
  const [replaysUsed, setReplaysUsed] = useState(0)
  const [showPopup, setShowPopup] = useState(false)
  const [isAdvancing, setIsAdvancing] = useState(false)

  // Transcript timing for current question
  const [segmentTiming, setSegmentTiming] = useState<{
    start: number
    end: number
  } | null>(null)
  const [timingLoaded, setTimingLoaded] = useState(false)

  const currentQ = questions[currentIdx] ?? null

  // Load transcript timing when question changes
  useEffect(() => {
    if (!currentQ) return
    setTimingLoaded(false)
    setSegmentTiming(null)

    loadTranscript(currentQ.videoId).then((transcript) => {
      if (!transcript) {
        setTimingLoaded(true)
        return
      }
      const seg = transcript[currentQ.sentenceIdx]
      if (seg) {
        setSegmentTiming({ start: seg.start, end: seg.end })
      }
      setTimingLoaded(true)
    })
  }, [currentQ])

  // Play audio
  const handlePlay = useCallback(() => {
    if (!currentQ || !segmentTiming || replaysUsed >= 3) return
    playSegment(currentQ.videoId, segmentTiming.start, segmentTiming.end)
    setReplaysUsed((prev) => prev + 1)
  }, [currentQ, segmentTiming, replaysUsed, playSegment])

  // Whether audio is available
  const audioAvailable = ytReady && !ytFailed && segmentTiming !== null
  const remainingPlays = 3 - replaysUsed

  // Handle choice selection
  const handleSelect = useCallback(
    (choice: string) => {
      if (selected || !currentQ || isAdvancing) return
      setSelected(choice)

      const correct = choice === currentQ.expression

      // Update Leitner
      updateLeitner(currentQ.exprId, correct)

      if (correct) {
        markFamiliar(currentQ.exprId)

        // Recalculate Absorption Score (used for content recommendations, not XP)
        setTimeout(() => {
          const updatedEntries = useFamiliarityStore.getState().entries
          recalculateScore(updatedEntries)
          checkLevelUp(level)
        }, 50)
      }

      // Record result
      setResults((prev) => [
        ...prev,
        { exprId: currentQ.exprId, correct },
      ])

      // Show popup after 0.8s
      setTimeout(() => setShowPopup(true), 800)

      // Advance after 1.5s
      setTimeout(() => {
        setIsAdvancing(true)
        setTimeout(() => {
          if (currentIdx + 1 >= questions.length) {
            incrementSessionCount('listenAndFill')

            // Award session completion XP
            const xpAmount = calculateSessionXP('listenAndFill', sessionStartRef.current)
            if (xpAmount > 0) {
              const actual = useGameProgressStore.getState().addSessionXP(xpAmount)
              setSessionXPAwarded(actual)
            }

            // Streak bonus (once per day)
            const gameStore = useGameProgressStore.getState()
            if (!gameStore.isStreakBonusAwardedToday()) {
              const { useUserStore } = require('@/stores/useUserStore')
              const userState = useUserStore.getState()
              userState.checkAndUpdateStreak()
              const streakDays = useUserStore.getState().streakDays
              const totalMonthlyXP = userState.totalXpEarned
              gameStore.awardStreakBonus(streakDays, totalMonthlyXP)
              checkStreakMilestones(streakDays)
            }

            // Check game milestones
            const totalSessions = useGameProgressStore.getState().getTotalSessions()
            checkGameMilestones(totalSessions)

            setPhase('result')
          } else {
            setCurrentIdx((prev) => prev + 1)
            setSelected(null)
            setReplaysUsed(0)
            setShowPopup(false)
            setIsAdvancing(false)
          }
        }, 100)
      }, 1500)
    },
    [
      selected,
      currentQ,
      isAdvancing,
      currentIdx,
      questions.length,
      updateLeitner,
      markFamiliar,
      recalculateScore,
      checkLevelUp,
      level,
      incrementSessionCount,
    ],
  )

  // Exit handler
  const handleExit = useCallback(() => {
    const correctCount = results.filter((r) => r.correct).length
    onComplete(correctCount >= questions.length / 2)
  }, [results, questions.length, onComplete])

  // ---------------------------------------------------------------------------
  // Result screen
  // ---------------------------------------------------------------------------

  if (phase === 'result') {
    const correctCount = results.filter((r) => r.correct).length

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center h-full px-5 py-8 overflow-y-auto"
      >
        {/* Score */}
        <div className="mb-6 text-center">
          <p
            className="text-sm uppercase tracking-wider mb-2"
            style={{ color: 'var(--text-muted)' }}
          >
            결과
          </p>
          <p className="text-5xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {correctCount}
            <span
              className="text-2xl font-normal"
              style={{ color: 'var(--text-muted)' }}
            >
              {' '}
              / {questions.length}
            </span>
          </p>
        </div>

        {/* Stats */}
        <div
          className="w-full max-w-sm rounded-2xl border p-4 mb-6"
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
              +{sessionXPAwarded}
            </p>
          </div>
        </div>

        {/* Learned expressions */}
        {results.length > 0 && (
          <div className="w-full max-w-sm mb-6">
            <p
              className="text-xs uppercase tracking-wider mb-3"
              style={{ color: 'var(--text-muted)' }}
            >
              학습한 표현
            </p>
            <div className="space-y-2">
              {results.map(({ exprId, correct }) => {
                const isWord = exprId.startsWith('word:')
                const lookupId = isWord ? exprId.slice(5) : exprId
                const entry = isWord ? wordEntries[lookupId] : entries[lookupId]
                return (
                  <div
                    key={exprId}
                    className="rounded-xl border px-4 py-3 flex items-center justify-between"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--border-card)',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {correct ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          className="w-4 h-4 text-green-400 flex-shrink-0"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.5 12.75l6 6 9-13.5"
                          />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          className="w-4 h-4 flex-shrink-0"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      )}
                      <span
                        className="font-medium text-sm"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {entry?.canonical ?? lookupId}
                      </span>
                    </div>
                    <span
                      className="text-xs"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {entry?.meaning_ko ?? ''}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Exit button */}
        <div className="w-full max-w-sm mt-auto">
          <button
            onClick={handleExit}
            className="w-full rounded-xl py-3.5 font-medium text-sm transition-colors active:scale-[0.98]"
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
  // No questions available
  // ---------------------------------------------------------------------------

  if (!currentQ) {
    return (
      <div className="flex items-center justify-center h-full">
        <p style={{ color: 'var(--text-muted)' }}>문제를 불러올 수 없습니다</p>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Playing screen
  // ---------------------------------------------------------------------------

  const isCorrect = selected === currentQ.expression

  return (
    <div className="relative flex flex-col h-full px-5 py-4">
      {/* Hidden YouTube player */}
      <div
        ref={playerContainerRef}
        className="absolute"
        style={{ top: -9999, left: -9999, width: 0, height: 0 }}
      />

      {/* Header: progress + exit */}
      <div className="flex items-center justify-between mb-4">
        <p
          className="text-sm font-medium"
          style={{ color: 'var(--text-secondary)' }}
        >
          {currentIdx + 1} / {questions.length}
        </p>
        <button
          onClick={handleExit}
          className="text-xs px-3 py-1.5 rounded-lg border transition-colors active:scale-[0.97]"
          style={{
            borderColor: 'var(--border-card)',
            color: 'var(--text-muted)',
            backgroundColor: 'var(--bg-secondary)',
          }}
        >
          나가기
        </button>
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
          animate={{ width: `${(currentIdx / questions.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col items-center relative">
        {/* Play button or fallback */}
        <div className="mb-6">
          {audioAvailable && !ytFailed ? (
            <div className="flex items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handlePlay}
                disabled={replaysUsed >= 3 || !!selected}
                className="flex items-center gap-2 rounded-xl border px-5 py-2.5 font-medium text-sm transition-colors"
                style={{
                  backgroundColor:
                    replaysUsed >= 3
                      ? 'var(--bg-secondary)'
                      : 'var(--accent-primary)',
                  borderColor:
                    replaysUsed >= 3
                      ? 'var(--border-card)'
                      : 'var(--accent-primary)',
                  color: replaysUsed >= 3 ? 'var(--text-muted)' : '#fff',
                  opacity: replaysUsed >= 3 ? 0.6 : 1,
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
                    clipRule="evenodd"
                  />
                </svg>
                듣기
              </motion.button>
              <span
                className="text-xs"
                style={{ color: 'var(--text-muted)' }}
              >
                {remainingPlays > 0
                  ? `${remainingPlays}회 남음`
                  : '재생 완료'}
              </span>
            </div>
          ) : (
            // Text-only fallback: show Korean translation
            <div
              className="rounded-xl border px-5 py-3 text-center"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-card)',
              }}
            >
              <p
                className="text-xs mb-1"
                style={{ color: 'var(--text-muted)' }}
              >
                한국어 힌트
              </p>
              <p
                className="text-sm font-medium"
                style={{ color: 'var(--text-secondary)' }}
              >
                {currentQ.ko}
              </p>
            </div>
          )}
        </div>

        {/* Sentence with blank */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ.exprId + '-' + currentIdx}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-full max-w-sm rounded-2xl border p-5 mb-6 text-center"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-card)',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <p
              className="text-base leading-relaxed font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              {currentQ.before}
              {selected ? (
                <span
                  className="font-bold px-1 py-0.5 rounded mx-0.5 inline-block"
                  style={{
                    color: isCorrect ? '#22c55e' : '#ef4444',
                    backgroundColor: isCorrect
                      ? 'rgba(34, 197, 94, 0.1)'
                      : 'rgba(239, 68, 68, 0.1)',
                  }}
                >
                  {currentQ.expression}
                </span>
              ) : (
                <span
                  className="inline-block border-b-2 mx-1 min-w-[80px]"
                  style={{ borderColor: 'var(--accent-primary)' }}
                >
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                </span>
              )}
              {currentQ.after}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* 4 choices */}
        <div className="flex flex-col gap-2.5 w-full max-w-sm">
          {currentQ.choices.map((choice, i) => {
            let bgColor = 'var(--bg-card)'
            let borderColor = 'var(--border-card)'
            let textColor = 'var(--text-primary)'

            if (selected) {
              if (choice === currentQ.expression) {
                bgColor = 'rgba(34, 197, 94, 0.15)'
                borderColor = 'rgba(74, 222, 128, 0.4)'
                textColor = '#22c55e'
              } else if (choice === selected) {
                bgColor = 'rgba(239, 68, 68, 0.15)'
                borderColor = 'rgba(248, 113, 113, 0.4)'
                textColor = '#ef4444'
              } else {
                bgColor = 'var(--bg-secondary)'
                borderColor = 'var(--border-card)'
                textColor = 'var(--text-muted)'
              }
            }

            const circleNum = String.fromCharCode(0x2460 + i) // ①②③④

            return (
              <motion.button
                key={i}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: i * 0.06,
                  duration: 0.2,
                  ease: 'easeOut',
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelect(choice)}
                disabled={!!selected}
                className="w-full rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition-all"
                style={{
                  backgroundColor: bgColor,
                  borderColor: borderColor,
                  color: textColor,
                }}
              >
                <span
                  className="mr-2 text-xs"
                  style={{ color: selected ? textColor : 'var(--text-muted)' }}
                >
                  {circleNum}
                </span>
                {choice}
              </motion.button>
            )
          })}
        </div>

        {/* Expression info popup */}
        <AnimatePresence>
          {showPopup && (
            <ExpressionPopup
              expression={currentQ.expression}
              meaningKo={currentQ.meaningKo}
              cefr={currentQ.cefr}
              category={currentQ.category}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
