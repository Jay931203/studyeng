'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLevelStore } from '@/stores/useLevelStore'
import { useOnboardingStore } from '@/stores/useOnboardingStore'
import { useFamiliarityStore } from '@/stores/useFamiliarityStore'
import { useLocaleStore, SupportedLocale } from '@/stores/useLocaleStore'
import { displayLevelName } from '@/types/level'

const t = {
  somethingsChanging: {
    ko: "Something's changing...",
    ja: "Something's changing...",
    'zh-TW': "Something's changing...",
    vi: "Something's changing...",
  },
  absorbedNaturally: {
    ko: '어느새 흡수하고 있었네요.',
    ja: 'いつの間にか吸収していましたね。',
    'zh-TW': '不知不覺中已經吸收了。',
    vi: 'Ban da tiep thu mot cach tu nhien.',
  },
  expressionsLearned: (count: number, locale: SupportedLocale) => {
    const templates: Record<SupportedLocale, (n: number) => string> = {
      ko: (n) => `${n}개 표현을 자연스럽게 익혔어요`,
      ja: (n) => `${n}個の表現を自然に身につけました`,
      'zh-TW': (n) => `自然學會了 ${n} 個表達`,
      vi: (n) => `Da hoc duoc ${n} cau mot cach tu nhien`,
    }
    return templates[locale](count)
  },
  fullyMastered: (count: number, locale: SupportedLocale) => {
    const templates: Record<SupportedLocale, (n: number) => string> = {
      ko: (n) => `그 중 ${n}개는 완전히 내 것이 됐어요`,
      ja: (n) => `そのうち${n}個は完全に自分のものになりました`,
      'zh-TW': (n) => `其中 ${n} 個已經完全掌握了`,
      vi: (n) => `Trong do ${n} cau da thanh thao hoan toan`,
    }
    return templates[locale](count)
  },
  keepIt: {
    ko: 'Keep it',
    ja: 'Keep it',
    'zh-TW': 'Keep it',
    vi: 'Keep it',
  },
  stayAt: (label: string, locale: SupportedLocale) => {
    const templates: Record<SupportedLocale, (l: string) => string> = {
      ko: (l) => `Stay at ${l}`,
      ja: (l) => `Stay at ${l}`,
      'zh-TW': (l) => `Stay at ${l}`,
      vi: (l) => `Stay at ${l}`,
    }
    return templates[locale](label)
  },
} as const

export function LevelUpCelebration() {
  const pendingLevelUp = useLevelStore((s) => s.pendingLevelUp)
  const acceptLevelUp = useLevelStore((s) => s.acceptLevelUp)
  const declineLevelUp = useLevelStore((s) => s.declineLevelUp)
  const rawScore = useLevelStore((s) => s.rawScore)
  const setLevel = useOnboardingStore((s) => s.setLevel)
  const currentLevel = useOnboardingStore((s) => s.level)
  const familiarEntries = useFamiliarityStore((s) => s.entries)
  const locale = useLocaleStore((s) => s.locale)

  const familiarCount = Object.values(familiarEntries).filter((e) => e.count >= 3).length
  const totalSwipedCount = Object.keys(familiarEntries).length

  const handleAccept = () => {
    if (!pendingLevelUp) return
    acceptLevelUp(currentLevel)
    setLevel(pendingLevelUp.to)
  }

  const handleDecline = () => {
    declineLevelUp()
  }

  if (!pendingLevelUp) return null

  const fromLabel = displayLevelName(pendingLevelUp.from)
  const toLabel = displayLevelName(pendingLevelUp.to)

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[200] flex flex-col items-center justify-center px-6"
        style={{
          background: 'linear-gradient(135deg, var(--bg-primary) 0%, var(--accent-glow) 50%, var(--bg-primary) 100%)',
          backdropFilter: 'blur(20px)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex w-full max-w-[360px] flex-col items-center text-center">
          {/* "Something's changing..." */}
          <motion.p
            className="text-sm font-medium tracking-widest uppercase"
            style={{ color: 'var(--accent-text)' }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {t.somethingsChanging[locale]}
          </motion.p>

          {/* Level transition */}
          <motion.div
            className="mt-8 flex items-center gap-4"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, type: 'spring', stiffness: 280, damping: 22 }}
          >
            <span
              className="text-2xl font-bold"
              style={{ color: 'var(--text-secondary)' }}
            >
              {fromLabel}
            </span>
            <motion.span
              className="text-xl"
              style={{ color: 'var(--accent-text)' }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 1.0, duration: 0.4 }}
            >
              →
            </motion.span>
            <motion.span
              className="text-2xl font-bold"
              style={{ color: 'var(--accent-text)' }}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.1, type: 'spring', stiffness: 300, damping: 24 }}
            >
              {toLabel}
            </motion.span>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            className="mt-5 text-base font-medium"
            style={{ color: 'var(--text-primary)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.5 }}
          >
            {t.absorbedNaturally[locale]}
          </motion.p>

          {/* Stats */}
          <motion.div
            className="mt-8 w-full rounded-2xl border px-5 py-4"
            style={{
              borderColor: 'var(--border-card)',
              backgroundColor: 'var(--bg-card)',
            }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.7, duration: 0.4 }}
          >
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              <span
                className="text-lg font-bold"
                style={{ color: 'var(--text-primary)' }}
              >
                {totalSwipedCount}
              </span>
              {' '}{t.expressionsLearned(totalSwipedCount, locale)}
            </p>
            {familiarCount > 0 && (
              <p
                className="mt-1 text-xs"
                style={{ color: 'var(--text-muted)' }}
              >
                {t.fullyMastered(familiarCount, locale)}
              </p>
            )}
          </motion.div>

          {/* Gauge fill animation */}
          <motion.div
            className="mt-6 h-[3px] w-full overflow-hidden rounded-full"
            style={{ backgroundColor: 'var(--border-card)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.9 }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: 'var(--accent-primary)' }}
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ delay: 2.0, duration: 0.8, ease: 'easeOut' }}
            />
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            className="mt-8 flex w-full flex-col gap-3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.3, duration: 0.4 }}
          >
            <motion.button
              type="button"
              onClick={handleAccept}
              className="w-full rounded-2xl py-4 text-sm font-semibold text-white shadow-lg"
              style={{
                backgroundColor: 'var(--accent-primary)',
                boxShadow: '0 4px 24px var(--accent-glow)',
              }}
              whileTap={{ scale: 0.97 }}
            >
              {t.keepIt[locale]}
            </motion.button>
            <button
              type="button"
              onClick={handleDecline}
              className="w-full rounded-2xl py-3 text-xs font-medium"
              style={{ color: 'var(--text-muted)' }}
            >
              {t.stayAt(fromLabel, locale)}
            </button>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
