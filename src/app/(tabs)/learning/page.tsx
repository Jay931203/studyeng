'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { usePhraseStore } from '@/stores/usePhraseStore'
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore'
import { SavedPhraseCard } from '@/components/SavedPhraseCard'
import { DailyMissions } from '@/components/DailyMissions'
import { GameLauncher } from '@/components/games/GameLauncher'
import { WatchHistory } from '@/components/WatchHistory'

export default function LearningPage() {
  const { phrases, removePhrase } = usePhraseStore()
  const totalWatched = useWatchHistoryStore((s) => s.watchedVideoIds.length)
  const router = useRouter()
  const [showAllPhrases, setShowAllPhrases] = useState(false)

  const isCompletelyEmpty = phrases.length === 0 && totalWatched === 0

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-20 pt-12">
      <div className="px-4">
        {/* Page header — minimal */}
        <div className="mb-8">
          <h1 className="text-[var(--text-primary)] text-xl font-semibold">내 학습</h1>
          {phrases.length > 0 && (
            <p className="text-[var(--text-muted)] text-xs mt-1">
              {phrases.length}개 표현 저장됨
            </p>
          )}
        </div>

        <DailyMissions />

        {/* Full empty state for brand new users */}
        {isCompletelyEmpty ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="flex flex-col items-center justify-center py-20 px-6"
          >
            <p className="text-[var(--text-secondary)] text-sm text-center mb-1">
              아직 아무것도 없네
            </p>
            <p className="text-[var(--text-muted)] text-xs text-center mb-8">
              영상 보고, 표현 모으고, 게임하고.
            </p>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push('/')}
              className="bg-[var(--text-primary)] text-[var(--bg-primary)] font-medium px-6 py-2.5 rounded-xl text-sm"
            >
              영상 보러 가기
            </motion.button>
          </motion.div>
        ) : (
          <>
            <WatchHistory />

            <GameLauncher phrases={phrases} />

            {phrases.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="text-center py-12 px-4"
              >
                <p className="text-[var(--text-muted)] text-sm">
                  영상에서 표현을 탭해서 저장해봐
                </p>
              </motion.div>
            ) : (
              <div className="mb-8">
                <div className="flex items-baseline justify-between mb-4">
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-[var(--text-primary)] font-semibold text-base">
                      저장한 표현
                    </h2>
                    <span className="text-[var(--text-muted)] text-xs">
                      {phrases.length}개
                    </span>
                  </div>
                  {phrases.length > 3 && (
                    <button
                      onClick={() => setShowAllPhrases(!showAllPhrases)}
                      className="text-[var(--text-secondary)] text-xs"
                    >
                      {showAllPhrases ? '접기' : '전체보기'}
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-3">
                  <AnimatePresence>
                    {(showAllPhrases ? phrases : phrases.slice(0, 3)).map((phrase) => (
                      <SavedPhraseCard
                        key={phrase.id}
                        phrase={phrase}
                        onDelete={() => removePhrase(phrase.id)}
                        onPlay={() => router.push(`/?v=${phrase.videoId}`)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
