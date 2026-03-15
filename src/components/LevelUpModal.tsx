'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useUserStore } from '@/stores/useUserStore'
import { useLocaleStore, SupportedLocale } from '@/stores/useLocaleStore'

const t: Record<string, Record<SupportedLocale, string>> = {
  levelUp: {
    ko: '레벨 업',
    ja: 'レベルアップ',
    'zh-TW': '升級',
    vi: 'Len cap',
  },
  tapToContinue: {
    ko: '탭해서 계속',
    ja: 'タップして続ける',
    'zh-TW': '點擊繼續',
    vi: 'Cham de tiep tuc',
  },
}

export function LevelUpModal() {
  const { level, showLevelUp, dismissLevelUp } = useUserStore()
  const locale = useLocaleStore((s) => s.locale)

  return (
    <AnimatePresence>
      {showLevelUp && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={dismissLevelUp}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="text-center"
          >
            {/* Clean level badge instead of emoji */}
            <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-10 h-10 text-[var(--accent-text)]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
              </svg>
            </div>
            <p className="text-white text-2xl font-bold mb-3">{t.levelUp[locale]}</p>
            <p className="text-[var(--accent-text)] text-5xl font-black">{level}</p>
            <p className="text-gray-500 text-sm mt-6">{t.tapToContinue[locale]}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
