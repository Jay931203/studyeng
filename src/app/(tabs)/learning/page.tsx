'use client'

import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { usePhraseStore } from '@/stores/usePhraseStore'
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore'
import { SavedPhraseCard } from '@/components/SavedPhraseCard'
import { GameLauncher } from '@/components/games/GameLauncher'
import { WatchHistory } from '@/components/WatchHistory'

export default function LearningPage() {
  const { phrases, removePhrase } = usePhraseStore()
  const totalWatched = useWatchHistoryStore((s) => s.watchedVideoIds.length)
  const router = useRouter()

  const isCompletelyEmpty = phrases.length === 0 && totalWatched === 0

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-20 pt-12">
      <div className="px-4">
        <h1 className="text-[var(--text-primary)] text-2xl font-bold mb-1">내 학습</h1>
        <p className="text-[var(--text-muted)] text-sm mb-6">
          {phrases.length > 0
            ? `${phrases.length}개 표현 저장됨`
            : '영상을 보고 표현을 모아보세요'}
        </p>

        {/* Full empty state for brand new users */}
        {isCompletelyEmpty ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="flex flex-col items-center justify-center py-16 px-6"
          >
            {/* Illustrated icon */}
            <div className="relative mb-6">
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} className="w-12 h-12 text-blue-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                </svg>
              </motion.div>
              {/* Decorative sparkles */}
              <motion.div
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-blue-400/60"
              />
              <motion.div
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                transition={{ duration: 2, repeat: Infinity, delay: 1.2 }}
                className="absolute -bottom-1 -left-2 w-2 h-2 rounded-full bg-purple-400/60"
              />
            </div>

            <h2 className="text-[var(--text-primary)] font-bold text-lg mb-2 text-center">
              영상을 보면 학습 기록이 여기에 나타나요!
            </h2>
            <p className="text-[var(--text-muted)] text-sm text-center leading-relaxed mb-8 max-w-[280px]">
              재미있는 영상을 보면서 자연스럽게 영어 표현을 익혀보세요. 저장한 표현으로 게임도 할 수 있어요.
            </p>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push('/')}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold px-8 py-3 rounded-xl shadow-lg shadow-blue-500/25"
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
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12 px-4"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500/15 to-purple-500/15 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 text-blue-400/70">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                  </svg>
                </div>
                <p className="text-[var(--text-secondary)] font-medium mb-1">
                  아직 저장한 표현이 없어요
                </p>
                <p className="text-[var(--text-muted)] text-sm leading-relaxed">
                  영상을 보면서 마음에 드는 표현을 탭해서 저장해보세요
                </p>
              </motion.div>
            ) : (
              <>
                <h2 className="text-[var(--text-primary)] font-bold text-lg mb-3">저장한 표현</h2>
                <div className="flex flex-col gap-3">
                  <AnimatePresence>
                    {phrases.map((phrase) => (
                      <SavedPhraseCard
                        key={phrase.id}
                        phrase={phrase}
                        onDelete={() => removePhrase(phrase.id)}
                        onPlay={() => router.push(`/?v=${phrase.videoId}`)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
