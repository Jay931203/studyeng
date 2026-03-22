'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { selectChallengeCards, type ChallengeCard } from '@/lib/levelChallenge/selectChallengeCards'
import { useGameProgressStore } from '@/stores/useGameProgressStore'
import { useFamiliarityStore } from '@/stores/useFamiliarityStore'
import { useLevelStore, computeXpForSwipe } from '@/stores/useLevelStore'
import { useLevelChallengeStore } from '@/stores/useLevelChallengeStore'
import { useOnboardingStore } from '@/stores/useOnboardingStore'
import { useLocaleStore } from '@/stores/useLocaleStore'
import { triggerHaptic } from '@/lib/haptic'
import type { CefrLevel, ChallengeTransition } from '@/types/level'
import { getLevelLabel } from '@/types/level'

const TRANSLATIONS = {
  ko: {
    startChallenge: '도전 시작',
    expressionCards: (n: number) => `${n}장의 표현 카드`,
    passRequirement: (n: number) => `${n}장 이상 알고 있으면 다음 레벨에 도전합니다. (80%)`,
    retryAnytime: '실패해도 바로 다시 도전 가능',
    dontKnow: '몰라요',
    know: '알아요',
    loadError: '표현을 불러올 수 없습니다',
    earnedXp: '획득 XP',
    missedExpressions: '몰랐던 표현',
    needMore: (n: number) => `${n}장 이상 필요 (80%)`,
    retryNow: '바로 다시 도전',
    goBack: '돌아가기',
    later: '나중에 다시',
  },
  ja: {
    startChallenge: 'チャレンジ開始',
    expressionCards: (n: number) => `${n}枚の表現カード`,
    passRequirement: (n: number) => `${n}枚以上知っていれば次のレベルに挑戦します。(80%)`,
    retryAnytime: '失敗してもすぐ再挑戦可能',
    dontKnow: '分からない',
    know: '知ってる',
    loadError: '表現を読み込めません',
    earnedXp: '獲得 XP',
    missedExpressions: '知らなかった表現',
    needMore: (n: number) => `${n}枚以上必要 (80%)`,
    retryNow: 'すぐ再挑戦',
    goBack: '戻る',
    later: 'あとで再挑戦',
  },
  'zh-TW': {
    startChallenge: '開始挑戰',
    expressionCards: (n: number) => `${n}張表達卡`,
    passRequirement: (n: number) => `認識${n}張以上即可進入下一級 (80%)`,
    retryAnytime: '失敗也能立即再挑戰',
    dontKnow: '不知道',
    know: '知道',
    loadError: '無法載入表達',
    earnedXp: '獲得 XP',
    missedExpressions: '不認識的表達',
    needMore: (n: number) => `需要${n}張以上 (80%)`,
    retryNow: '立即再挑戰',
    goBack: '返回',
    later: '稍後再試',
  },
  vi: {
    startChallenge: 'Bắt đầu thử thách',
    expressionCards: (n: number) => `${n} thẻ biểu thức`,
    passRequirement: (n: number) => `Biết ${n} thẻ trở lên sẽ lên cấp (80%)`,
    retryAnytime: 'Thất bại vẫn có thể thử lại ngay',
    dontKnow: 'Không biết',
    know: 'Biết',
    loadError: 'Không thể tải biểu thức',
    earnedXp: 'XP nhận được',
    missedExpressions: 'Biểu thức chưa biết',
    needMore: (n: number) => `Cần biết ${n} thẻ trở lên (80%)`,
    retryNow: 'Thử lại ngay',
    goBack: 'Quay lại',
    later: 'Thử lại sau',
  },
} as const

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PASS_THRESHOLD = 16 // 80% of 20
const CARDS_TOTAL = 20

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
// Types
// ---------------------------------------------------------------------------

type GamePhase = 'intro' | 'playing' | 'result'

interface LevelChallengeGameProps {
  targetLevel: ChallengeTransition
  onClose: () => void
}

// ---------------------------------------------------------------------------
// FloatingXP
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
// Main Component
// ---------------------------------------------------------------------------

export function LevelChallengeGame({ targetLevel, onClose }: LevelChallengeGameProps) {
  const locale = useLocaleStore((s) => s.locale)
  const T = TRANSLATIONS[locale] ?? TRANSLATIONS.ko
  const currentLevel = useOnboardingStore((s) => s.level)
  const setLevel = useOnboardingStore((s) => s.setLevel)
  const updateLeitner = useGameProgressStore((s) => s.updateLeitner)
  const incrementSessionCount = useGameProgressStore((s) => s.incrementSessionCount)
  const markFamiliar = useFamiliarityStore((s) => s.markFamiliar)
  const getFamiliarCount = useFamiliarityStore((s) => s.getFamiliarCount)
  const recalculateScore = useLevelStore((s) => s.recalculateScore)
  const addManualLevelChange = useLevelStore((s) => s.addManualLevelChange)
  const rawScore = useLevelStore((s) => s.rawScore)
  const recordAttempt = useLevelChallengeStore((s) => s.recordAttempt)

  const [phase, setPhase] = useState<GamePhase>('intro')
  const [cards] = useState<ChallengeCard[]>(() => selectChallengeCards(targetLevel, locale))
  const [currentIdx, setCurrentIdx] = useState(0)
  const [knownCount, setKnownCount] = useState(0)
  const [roundXP, setRoundXP] = useState(0)
  const [results, setResults] = useState<Array<{ exprId: string; expression: string; meaning: string; correct: boolean }>>([])

  // Feedback states
  const [flashColor, setFlashColor] = useState<'green' | 'red' | null>(null)
  const [floatingXP, setFloatingXP] = useState<number | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [slideDir, setSlideDir] = useState<'left' | 'right' | null>(null)
  const [showCelebration, setShowCelebration] = useState(false)
  // Capture the level the user started at. currentLevel from the store updates
  // immediately on setLevel(), so we need a snapshot taken before the level change.
  const [levelBeforeChallenge] = useState<CefrLevel>(() => currentLevel)

  const currentCard = cards[currentIdx] ?? null
  const fromLabel = getLevelLabel(levelBeforeChallenge, locale)
  const toLabel = getLevelLabel(targetLevel, locale)

  // ---------------------------------------------------------------------------
  // Start game
  // ---------------------------------------------------------------------------

  const handleStart = useCallback(() => {
    setPhase('playing')
  }, [])

  // ---------------------------------------------------------------------------
  // Finish round
  // ---------------------------------------------------------------------------

  const finishRound = useCallback(() => {
    incrementSessionCount('expressionSwipe')

    // Award challenge completion XP.
    const sessionXP = useGameProgressStore.getState().addGameXP(10)
    setRoundXP((prev) => prev + sessionXP)

    const passed = knownCount >= PASS_THRESHOLD

    // Record attempt
    recordAttempt({
      targetLevel,
      score: knownCount,
      passed,
    })

    if (passed) {
      // Trigger level up
      const familiarEntries = useFamiliarityStore.getState().entries
      const familiarCount = Object.values(familiarEntries).filter((e) => e.count >= 3).length
      addManualLevelChange(levelBeforeChallenge, targetLevel, rawScore, familiarCount)
      setLevel(targetLevel)
      setShowCelebration(true)

      // Show celebration briefly, then result
      setTimeout(() => {
        setShowCelebration(false)
        setPhase('result')
      }, 3000)
    } else {
      setPhase('result')
    }
  }, [incrementSessionCount, knownCount, recordAttempt, targetLevel, addManualLevelChange, levelBeforeChallenge, rawScore, setLevel])

  // ---------------------------------------------------------------------------
  // Advance card
  // ---------------------------------------------------------------------------

  const advanceCard = useCallback(() => {
    if (currentIdx + 1 >= cards.length) {
      finishRound()
    } else {
      setCurrentIdx((prev) => prev + 1)
      setSlideDir(null)
    }
    setIsAnimating(false)
  }, [currentIdx, cards.length, finishRound])

  // ---------------------------------------------------------------------------
  // Handle answer
  // ---------------------------------------------------------------------------

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

      // Store updates (same as ExpressionSwipeGame)
      updateLeitner(exprId, known)

      let xpGained = 0
      if (known) {
        setKnownCount((prev) => prev + 1)
        markFamiliar(exprId)
        const newCount = getFamiliarCount(exprId) + 1
        const rawXP = computeXpForSwipe(exprId, newCount)
        xpGained = useGameProgressStore.getState().addGameXP(rawXP)
        setRoundXP((prev) => prev + xpGained)
        if (xpGained > 0) setFloatingXP(xpGained)

        // Recalculate score
        setTimeout(() => {
          const updatedEntries = useFamiliarityStore.getState().entries
          recalculateScore(updatedEntries)
        }, 50)
      }

      // Record result
      setResults((prev) => [
        ...prev,
        {
          exprId,
          expression: currentCard.expression,
          meaning: currentCard.meaning,
          correct: known,
        },
      ])

      // Advance after animation
      setTimeout(() => {
        setFlashColor(null)
        setFloatingXP(null)
        advanceCard()
      }, 300)
    },
    [currentCard, isAnimating, updateLeitner, markFamiliar, getFamiliarCount, recalculateScore, advanceCard],
  )

  // ---------------------------------------------------------------------------
  // Retry
  // ---------------------------------------------------------------------------

  const handleRetry = useCallback(() => {
    // Reset everything and re-select cards
    setPhase('intro')
    setCurrentIdx(0)
    setKnownCount(0)
    setRoundXP(0)
    setResults([])
    setFlashColor(null)
    setFloatingXP(null)
    setIsAnimating(false)
    setSlideDir(null)
  }, [])

  // ---------------------------------------------------------------------------
  // Celebration screen
  // ---------------------------------------------------------------------------

  if (showCelebration) {
    return (
      <motion.div
        className="fixed inset-0 z-[200] flex flex-col items-center justify-center px-6"
        style={{
          background: 'linear-gradient(135deg, var(--bg-primary) 0%, var(--accent-glow) 50%, var(--bg-primary) 100%)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.p
          className="text-sm font-medium tracking-widest uppercase"
          style={{ color: 'var(--accent-text)' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          Level Up!
        </motion.p>

        <motion.div
          className="mt-8 flex items-center gap-4"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 280, damping: 22 }}
        >
          <span className="text-2xl font-bold" style={{ color: 'var(--text-secondary)' }}>
            {fromLabel}
          </span>
          <motion.span
            className="text-xl"
            style={{ color: 'var(--accent-text)' }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.8, duration: 0.4 }}
          >
            {'\u2192'}
          </motion.span>
          <motion.span
            className="text-2xl font-bold"
            style={{ color: 'var(--accent-text)' }}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9, type: 'spring', stiffness: 300, damping: 24 }}
          >
            {toLabel}
          </motion.span>
        </motion.div>

        <motion.p
          className="mt-5 text-base font-medium"
          style={{ color: 'var(--text-primary)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
        >
          Challenge Clear!
        </motion.p>

        <motion.div
          className="mt-6 h-[3px] w-full max-w-[300px] overflow-hidden rounded-full"
          style={{ backgroundColor: 'var(--border-card)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: 'var(--accent-primary)' }}
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ delay: 1.6, duration: 0.8, ease: 'easeOut' }}
          />
        </motion.div>
      </motion.div>
    )
  }

  // ---------------------------------------------------------------------------
  // Intro screen
  // ---------------------------------------------------------------------------

  if (phase === 'intro') {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6">
        <div className="w-full max-w-sm text-center">
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-6"
            style={{ color: 'var(--accent-text)' }}
          >
            LEVEL CHALLENGE
          </p>

          {/* Level transition */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="text-lg font-bold" style={{ color: 'var(--text-secondary)' }}>
              {fromLabel}
            </span>
            <span className="text-base" style={{ color: 'var(--accent-text)' }}>
              {'\u2192'}
            </span>
            <span className="text-lg font-bold" style={{ color: 'var(--accent-text)' }}>
              {toLabel}
            </span>
          </div>

          {/* Info card */}
          <div
            className="rounded-2xl border p-5 mb-8 text-left"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-card)',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <div className="space-y-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <div className="flex items-start gap-3">
                <span className="shrink-0 text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
                  01
                </span>
                <span>{T.expressionCards(CARDS_TOTAL)}</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="shrink-0 text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
                  02
                </span>
                <span>{T.passRequirement(PASS_THRESHOLD)}</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="shrink-0 text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
                  03
                </span>
                <span>{T.retryAnytime}</span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleStart}
            className="w-full rounded-2xl py-4 text-sm font-semibold text-white"
            style={{
              backgroundColor: 'var(--accent-primary)',
              boxShadow: '0 4px 24px var(--accent-glow)',
            }}
          >
            {T.startChallenge}
          </motion.button>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Result screen
  // ---------------------------------------------------------------------------

  if (phase === 'result') {
    const passed = knownCount >= PASS_THRESHOLD
    const missedResults = results.filter((r) => !r.correct).slice(0, 5)

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center h-full px-5 py-8 overflow-y-auto"
      >
        {/* Result header */}
        <div className="mb-2">
          <p
            className="text-xs font-semibold uppercase tracking-widest text-center"
            style={{ color: passed ? 'var(--accent-text)' : 'var(--text-muted)' }}
          >
            {passed ? 'CHALLENGE CLEAR' : 'NOT YET'}
          </p>
        </div>

        {/* Score */}
        <div className="mb-6 text-center">
          <p className="text-5xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {knownCount}
            <span className="text-2xl font-normal" style={{ color: 'var(--text-muted)' }}>
              {' '}
              / {CARDS_TOTAL}
            </span>
          </p>
          {!passed && (
            <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
              {T.needMore(PASS_THRESHOLD)}
            </p>
          )}
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
              {T.earnedXp}
            </p>
            <p className="text-xl font-bold" style={{ color: 'var(--accent-text)' }}>
              +{Math.round(roundXP * 10) / 10}
            </p>
          </div>
        </div>

        {/* Missed expressions (max 5) */}
        {!passed && missedResults.length > 0 && (
          <div className="w-full max-w-sm mb-6">
            <p className="text-xs uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
              {T.missedExpressions}
            </p>
            <div className="space-y-2">
              {missedResults.map(({ exprId, expression, meaning }) => (
                <div
                  key={exprId}
                  className="rounded-xl border px-4 py-3 flex items-center justify-between"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-card)',
                  }}
                >
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {expression}
                  </span>
                  <span className="text-sm ml-2 text-right" style={{ color: 'var(--text-secondary)' }}>
                    {meaning}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="w-full max-w-sm flex flex-col gap-3 mt-auto">
          {!passed && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleRetry}
              className="w-full rounded-xl py-3.5 font-medium text-sm text-white"
              style={{
                backgroundColor: 'var(--accent-primary)',
              }}
            >
              {T.retryNow}
            </motion.button>
          )}
          <button
            onClick={onClose}
            className="w-full rounded-xl py-3.5 font-medium text-sm border transition-colors active:scale-[0.98]"
            style={{
              backgroundColor: passed ? 'var(--accent-primary)' : 'var(--bg-secondary)',
              borderColor: passed ? 'transparent' : 'var(--border-card)',
              color: passed ? '#fff' : 'var(--text-primary)',
            }}
          >
            {passed ? T.goBack : T.later}
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
        <p style={{ color: 'var(--text-muted)' }}>{T.loadError}</p>
      </div>
    )
  }

  return (
    <div className="relative flex flex-col h-full px-5 py-4">
      {/* Header: progress — pr-10 avoids overlap with the parent's absolute X close button */}
      <div className="flex items-center justify-between mb-4 pr-10">
        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          {currentIdx + 1} / {cards.length}
        </p>
        <p className="text-xs font-medium" style={{ color: 'var(--accent-text)' }}>
          {knownCount} correct
        </p>
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
          animate={{ width: `${(currentIdx / cards.length) * 100}%` }}
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
              {currentCard.meaning}
            </p>

            {/* Context sentence (shown for A2/B1/B2 challenges) */}
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
                {T.dontKnow}
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
                {T.know}
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
