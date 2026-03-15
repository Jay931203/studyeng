'use client'

import { motion } from 'framer-motion'
import { useLocaleStore, SupportedLocale } from '@/stores/useLocaleStore'

const t: Record<string, Record<SupportedLocale, string>> = {
  correct: {
    ko: '맞았어',
    ja: '正解',
    'zh-TW': '答對了',
    vi: 'Chinh xac',
  },
  wrong: {
    ko: '틀렸어',
    ja: '不正解',
    'zh-TW': '答錯了',
    vi: 'Sai roi',
  },
  tapToContinue: {
    ko: '탭해서 계속',
    ja: 'タップして続ける',
    'zh-TW': '點擊繼續',
    vi: 'Cham de tiep tuc',
  },
}

interface GameResultProps {
  correct: boolean
  xpEarned: number
  onContinue: () => void
}

export function GameResult({ correct, xpEarned, onContinue }: GameResultProps) {
  const locale = useLocaleStore((s) => s.locale)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[130] flex items-center justify-center backdrop-blur-sm"
      style={{ backgroundColor: 'var(--game-overlay)' }}
      onClick={onContinue}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] px-8 py-7 text-center shadow-[var(--card-shadow)]"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Clean icon instead of emoji */}
        <div className="mb-5">
          {correct ? (
            <div className="w-16 h-16 mx-auto rounded-full bg-green-500/15 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-8 h-8 text-green-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
          ) : (
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-8 w-8" style={{ color: 'var(--text-secondary)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
        </div>
        <p className="mb-2 text-2xl font-bold text-[var(--text-primary)]">
          {correct ? t.correct[locale] : t.wrong[locale]}
        </p>
        {correct && xpEarned > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.2 }}
            className="text-[var(--accent-text)] font-bold text-lg"
          >
            +{xpEarned} XP
          </motion.p>
        )}
        <p className="mt-6 text-sm text-[var(--text-muted)]">{t.tapToContinue[locale]}</p>
      </motion.div>
    </motion.div>
  )
}
