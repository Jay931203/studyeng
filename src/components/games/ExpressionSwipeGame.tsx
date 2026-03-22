'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
// Large JSON data loaded lazily to avoid bloating the initial bundle
// (expression-entries-v2: ~1MB, expression-index-v2: ~1MB, word-entries: ~1.8MB, word-index: ~16MB)
import { useGameProgressStore } from '@/stores/useGameProgressStore'
import { useFamiliarityStore } from '@/stores/useFamiliarityStore'
import { useLevelStore } from '@/stores/useLevelStore'
import { useOnboardingStore } from '@/stores/useOnboardingStore'
import { useUserStore } from '@/stores/useUserStore'
import { useLocaleStore, type SupportedLocale } from '@/stores/useLocaleStore'
import { getLocalizedMeaning } from '@/lib/localeUtils'
import { triggerHaptic } from '@/lib/haptic'
import { calculateSessionXP } from '@/lib/xp/sessionXp'
import { checkGameMilestones, checkStreakMilestones } from '@/stores/useMilestoneStore'
import { useReplayStore } from '@/stores/useReplayStore'

const TRANSLATIONS = {
  ko: {
    replay: '다시 하기',
    finish: '끝내기',
    loadError: '표현을 불러올 수 없습니다.',
    wordFallback: '예문이 준비된 단어만 출제됩니다.',
    exprFallback: '가장 자연스러운 뜻을 탭해 고르세요.',
    myChoice: '내가 고른 뜻',
    correctAnswer: '정답',
  },
  ja: {
    replay: 'もう一度',
    finish: '終了',
    loadError: '表現を読み込めません。',
    wordFallback: '例文が用意された単語のみ出題されます。',
    exprFallback: '最も自然な意味をタップして選んでください。',
    myChoice: '選んだ意味',
    correctAnswer: '正解',
  },
  'zh-TW': {
    replay: '重新挑戰',
    finish: '結束',
    loadError: '無法載入表達',
    wordFallback: '只出題有例句的單字',
    exprFallback: '點擊選擇最自然的意思',
    myChoice: '我選的意思',
    correctAnswer: '正確答案',
  },
  vi: {
    replay: 'Thử lại',
    finish: 'Kết thúc',
    loadError: 'Không thể tải biểu thức',
    wordFallback: 'Chỉ những từ có ví dụ',
    exprFallback: 'Nhấn để chọn nghĩa phù hợp nhất',
    myChoice: 'Nghĩa tôi chọn',
    correctAnswer: 'Đáp án đúng',
  },
} as const

function getT(locale: SupportedLocale) {
  return TRANSLATIONS[locale] ?? TRANSLATIONS.ko
}

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
  actualMeaning: string
  cefr: string
  category: string
  contextEn: string | null
  contextVideoId: string | null
  contextSentenceIdx: number | null
  choices: ChoiceData[]
}

type GamePhase = 'playing' | 'result'

const CARDS_PER_ROUND = 10
const ANSWER_REVEAL_MS = 700

// Lazily-populated data references (set via loadGameData())
let entries: Record<string, ExpressionEntry> = {}
let index: Record<string, IndexMatch[]> = {}
let wordEntries: Record<string, WordEntry> = {}
let wordIndex: Record<string, WordIndexMatch[]> = {}
let _gameDataLoaded = false
let _gameDataPromise: Promise<void> | null = null

function loadGameData(): Promise<void> {
  if (_gameDataLoaded) return Promise.resolve()
  if (_gameDataPromise) return _gameDataPromise
  _gameDataPromise = Promise.all([
    import('@/data/expression-entries-v2.json'),
    import('@/data/expression-index-v2.json'),
    import('@/data/word-entries.json'),
    import('@/data/word-index.json'),
  ]).then(([ee, ei, we, wi]) => {
    entries = ee.default as Record<string, ExpressionEntry>
    index = ei.default as Record<string, IndexMatch[]>
    wordEntries = we.default as Record<string, WordEntry>
    wordIndex = wi.default as Record<string, WordIndexMatch[]>
    _gameDataLoaded = true
    // Reset caches since data just loaded
    expressionContextCache = null
    wordContextCache = null
    Object.keys(meaningCandidateCache).forEach(k => delete meaningCandidateCache[k])
  })
  return _gameDataPromise
}

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

function pickContextWithSource(exprId: string): { en: string; videoId: string; sentenceIdx: number } | null {
  const byExpr = getContextByExprId()[exprId]
  if (!byExpr?.length) return null

  // Find the videoId that contains this match
  for (const [videoId, matches] of Object.entries(index)) {
    for (const match of matches) {
      if (match.exprId === exprId) {
        return { en: match.en, videoId, sentenceIdx: match.sentenceIdx }
      }
    }
  }
  return null
}

function pickWordContextWithSource(wordId: string): { en: string; videoId: string; sentenceIdx: number } | null {
  for (const [videoId, matches] of Object.entries(wordIndex)) {
    for (const match of matches) {
      if (match.wordId === wordId) {
        return { en: match.en, videoId, sentenceIdx: match.sentenceIdx }
      }
    }
  }
  return null
}

function hasExpressionSupportContext(exprId: string) {
  const matches = getContextByExprId()[exprId]
  return Boolean(matches?.length)
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

const meaningCandidateCache: Record<string, { expression: MeaningCandidate[]; word: MeaningCandidate[] }> = {}

function getMeaningCandidates(locale: SupportedLocale) {
  if (meaningCandidateCache[locale]) return meaningCandidateCache[locale]

  const expression = uniqueCandidates(
    Object.values(entries).map((entry) => ({
      meaningKo: getLocalizedMeaning(entry as Record<string, unknown>, locale),
      cefr: entry.cefr ?? '',
      tag: entry.category ?? '',
    })),
  )

  const word = uniqueCandidates(
    Object.values(wordEntries).map((entry) => ({
      meaningKo: getLocalizedMeaning(entry as Record<string, unknown>, locale),
      cefr: entry.cefr ?? '',
      tag: entry.pos ?? '',
    })),
  )

  meaningCandidateCache[locale] = { expression, word }
  return meaningCandidateCache[locale]
}

function pickDecoyMeanings(params: {
  type: 'expression' | 'word'
  actualMeaning: string
  cefr: string
  category: string
  locale: SupportedLocale
}) {
  const candidates = getMeaningCandidates(params.locale)
  const source = params.type === 'word' ? candidates.word : candidates.expression
  const actual = normalizeMeaning(params.actualMeaning)
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

function buildChoices(card: Omit<CardData, 'choices'>, locale: SupportedLocale): ChoiceData[] {
  const decoys = pickDecoyMeanings({
    type: card.type,
    actualMeaning: card.actualMeaning,
    cefr: card.cefr,
    category: card.category,
    locale,
  })

  const options = [card.actualMeaning, ...decoys].slice(0, 4)

  return shuffle(options).map((text, index) => ({
    id: `${card.exprId}-${index}`,
    text,
    isCorrect: text === card.actualMeaning,
  }))
}

function selectCards(level: string, locale: SupportedLocale): CardData[] {
  const gameStore = useGameProgressStore.getState()
  const defaultExpressionCount = Math.round(CARDS_PER_ROUND * 0.7)
  const defaultWordCount = CARDS_PER_ROUND - defaultExpressionCount

  let filteredExpressionIds = getFilteredExpressionIds(level).filter((id) => hasExpressionSupportContext(id))
  if (filteredExpressionIds.length < defaultExpressionCount) {
    filteredExpressionIds = Object.keys(entries).filter((id) => hasExpressionSupportContext(id))
  }

  let filteredWordIds = getFilteredWordIds(level).filter((id) => hasWordSupportContext(id))
  if (filteredWordIds.length < defaultWordCount) {
    filteredWordIds = Object.keys(wordEntries).filter((id) => hasWordSupportContext(id))
  }

  const expressionCount = Math.min(defaultExpressionCount, filteredExpressionIds.length)
  const wordCount = Math.min(CARDS_PER_ROUND - expressionCount, filteredWordIds.length)

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
    const ctxSource = pickContextWithSource(exprId)
    const baseCard = {
      type: 'expression' as const,
      exprId,
      expression: entry?.canonical ?? exprId,
      actualMeaning: normalizeMeaning(entry ? getLocalizedMeaning(entry as Record<string, unknown>, locale) : ''),
      cefr: entry?.cefr?.toUpperCase() ?? 'B1',
      category: entry?.category ?? '',
      contextEn: ctxSource?.en ?? pickContextSentence(exprId),
      contextVideoId: ctxSource?.videoId ?? null,
      contextSentenceIdx: ctxSource?.sentenceIdx ?? null,
    }

    return {
      ...baseCard,
      choices: buildChoices(baseCard, locale),
    }
  })

  const wordCards = selectedWordIds.map((wordId) => {
    const entry = wordEntries[wordId]
    const ctxSource = pickWordContextWithSource(wordId)
    const baseCard = {
      type: 'word' as const,
      exprId: `word:${wordId}`,
      expression: entry?.canonical ?? wordId,
      actualMeaning: normalizeMeaning(entry ? getLocalizedMeaning(entry as Record<string, unknown>, locale) : ''),
      cefr: entry?.cefr?.toUpperCase() ?? 'B1',
      category: entry?.pos ?? '',
      contextEn: ctxSource?.en ?? pickWordContextSentence(wordId) ?? entry?.example_en ?? null,
      contextVideoId: ctxSource?.videoId ?? null,
      contextSentenceIdx: ctxSource?.sentenceIdx ?? null,
    }

    return {
      ...baseCard,
      choices: buildChoices(baseCard, locale),
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

/**
 * Lazily loads a transcript to find timestamps for a given sentenceIdx,
 * then plays the clip via the replay store.
 */
function GameResultReplayButton({
  videoId,
  sentenceIdx,
  expressionText,
}: {
  videoId: string
  sentenceIdx: number
  expressionText: string
}) {
  const play = useReplayStore((s) => s.play)
  const currentClip = useReplayStore((s) => s.clip)
  const isPlaying = useReplayStore((s) => s.isPlaying)
  const stop = useReplayStore((s) => s.stop)
  const [loading, setLoading] = useState(false)

  const isThisPlaying =
    isPlaying && currentClip?.videoId === videoId && currentClip?.expressionText === expressionText

  const handleClick = useCallback(async () => {
    if (isThisPlaying) {
      stop()
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/transcripts/${videoId}.json`)
      if (!res.ok) return
      const data = await res.json()
      if (!Array.isArray(data) || !data[sentenceIdx]) return

      const sub = data[sentenceIdx]
      if (sub.start != null && sub.end != null) {
        play({
          videoId,
          start: sub.start,
          end: sub.end,
          expressionText,
        })
      }
    } catch {
      // Silently fail — replay is best-effort
    } finally {
      setLoading(false)
    }
  }, [videoId, sentenceIdx, expressionText, play, stop, isThisPlaying])

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all active:scale-90 disabled:opacity-50"
      style={{
        backgroundColor: isThisPlaying
          ? 'rgba(var(--accent-primary-rgb), 0.2)'
          : 'rgba(255, 255, 255, 0.06)',
      }}
      aria-label={isThisPlaying ? 'Stop replay' : 'Play clip'}
    >
      {loading ? (
        <motion.div
          className="h-3 w-3 rounded-full border-2 border-transparent border-t-current"
          style={{ color: 'var(--text-muted)' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }}
        />
      ) : isThisPlaying ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-3 w-3"
          style={{ color: 'var(--accent-text, #5eead4)' }}
        >
          <path
            fillRule="evenodd"
            d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-3 w-3"
          style={{ color: 'var(--text-secondary, rgba(255,255,255,0.7))' }}
        >
          <path
            fillRule="evenodd"
            d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </button>
  )
}

export function ExpressionSwipeGame({ onComplete }: ExpressionSwipeGameProps) {
  const locale = useLocaleStore((s) => s.locale)
  const T = getT(locale)
  const level = useOnboardingStore((state) => state.level)
  const updateLeitner = useGameProgressStore((state) => state.updateLeitner)
  const updateBestStreak = useGameProgressStore((state) => state.updateBestStreak)
  const incrementSessionCount = useGameProgressStore((state) => state.incrementSessionCount)
  const bestStreak = useGameProgressStore((state) => state.bestStreak)
  const markFamiliar = useFamiliarityStore((state) => state.markFamiliar)
  const recalculateScore = useLevelStore((state) => state.recalculateScore)
  const checkLevelUp = useLevelStore((state) => state.checkLevelUp)

  // Lazy-load game data
  const [dataLoaded, setDataLoaded] = useState(_gameDataLoaded)
  const [cards, setCards] = useState<CardData[]>(() => _gameDataLoaded ? selectCards(level, locale) : [])
  const cardsInitialized = useRef(_gameDataLoaded)
  useEffect(() => {
    if (!cardsInitialized.current) {
      loadGameData().then(() => {
        setDataLoaded(true)
        setCards(selectCards(level, locale))
        cardsInitialized.current = true
      })
    }
  }, [level, locale])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [phase, setPhase] = useState<GamePhase>('playing')
  const [streak, setStreak] = useState(0)
  const [sessionXPAwarded, setSessionXPAwarded] = useState(0)
  const [results, setResults] = useState<
    Array<{
      exprId: string
      expression: string
      selectedMeaning: string
      actualMeaning: string
      correct: boolean
      contextVideoId: string | null
      contextSentenceIdx: number | null
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
        detail: isCorrect ? choice.text : `${T.correctAnswer}: ${currentCard.actualMeaning}`,
      })

      triggerHaptic(isCorrect ? 40 : [30, 50, 30])
      updateLeitner(exprId, isCorrect)

      // Auto-play clip via MiniReplayPlayer (fire-and-forget)
      if (currentCard.contextVideoId && currentCard.contextSentenceIdx !== null) {
        const ctxVideoId = currentCard.contextVideoId
        const ctxIdx = currentCard.contextSentenceIdx
        const ctxExpr = currentCard.expression
        fetch(`/transcripts/${ctxVideoId}.json`)
          .then((res) => res.json())
          .then((data: unknown) => {
            if (!Array.isArray(data) || !data[ctxIdx]) return
            const sub = data[ctxIdx]
            if (sub.start != null && sub.end != null) {
              useReplayStore.getState().play({
                videoId: ctxVideoId,
                start: sub.start,
                end: sub.end,
                expressionText: ctxExpr,
              })
            }
          })
          .catch(() => {})
      }

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
          selectedMeaning: choice.text,
          actualMeaning: currentCard.actualMeaning,
          correct: isCorrect,
          contextVideoId: currentCard.contextVideoId,
          contextSentenceIdx: currentCard.contextSentenceIdx,
        },
      ])

      window.setTimeout(() => {
        setFlashColor(null)
        advanceCard()
      }, ANSWER_REVEAL_MS)
    },
    [
      T,
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
    useReplayStore.getState().stop()
    onComplete(false)
  }, [onComplete])

  const handleExit = useCallback(() => {
    useReplayStore.getState().stop()
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
                  key={`${result.exprId}-${result.selectedMeaning}`}
                  className="flex items-start gap-3 rounded-xl border px-4 py-3"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-card)',
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {result.expression}
                    </p>
                    <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {T.myChoice}: {result.selectedMeaning}
                    </p>
                    <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {T.correctAnswer}: {result.actualMeaning}
                    </p>
                  </div>
                  {result.contextVideoId && result.contextSentenceIdx !== null && (
                    <GameResultReplayButton
                      videoId={result.contextVideoId}
                      sentenceIdx={result.contextSentenceIdx}
                      expressionText={result.expression}
                    />
                  )}
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
              {T.replay}
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
            {T.finish}
          </button>
        </div>
      </motion.div>
    )
  }

  if (!dataLoaded) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" style={{ color: 'var(--text-muted)' }} />
      </div>
    )
  }

  if (!currentCard) {
    return (
      <div className="flex h-full items-center justify-center">
        <p style={{ color: 'var(--text-muted)' }}>{T.loadError}</p>
      </div>
    )
  }

  const supportText =
    currentCard.contextEn ??
    (currentCard.type === 'word'
      ? T.wordFallback
      : T.exprFallback)

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
