'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { DailyMissions } from '@/components/DailyMissions'
import { SavedPhraseCard } from '@/components/SavedPhraseCard'
import { WatchHistory } from '@/components/WatchHistory'
import { GameLauncher } from '@/components/games/GameLauncher'
import { usePhraseStore } from '@/stores/usePhraseStore'
import { useUserStore } from '@/stores/useUserStore'
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore'

function ProgressStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-4 shadow-[var(--card-shadow)]">
      <p className="text-2xl font-black text-[var(--text-primary)]">{value}</p>
      <p className="mt-1 text-xs text-[var(--text-secondary)]">{label}</p>
    </div>
  )
}

export default function LearningPage() {
  const { phrases, removePhrase } = usePhraseStore()
  const streakDays = useUserStore((state) => state.streakDays)
  const totalWatched = useWatchHistoryStore((state) => state.watchedVideoIds.length)
  const totalViews = useWatchHistoryStore((state) =>
    Object.values(state.viewCounts).reduce((sum, count) => sum + count, 0),
  )
  const clearDeletedFlag = useWatchHistoryStore((state) => state.clearDeletedFlag)
  const router = useRouter()
  const [showAllPhrases, setShowAllPhrases] = useState(false)

  const isCompletelyEmpty = phrases.length === 0 && totalWatched === 0

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-20 pt-12">
      <div className="px-4">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent-text)]">
            Review
          </p>
          <h1 className="mt-2 text-2xl font-black text-[var(--text-primary)]">복습</h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
            어디까지 봤는지, 어떤 표현을 모았는지, 오늘 복습할 게 무엇인지 여기서 바로 확인하세요.
          </p>
        </div>

        {isCompletelyEmpty ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="rounded-[30px] border border-[var(--border-card)] bg-[var(--bg-card)] px-6 py-12 text-center shadow-[var(--card-shadow)]"
          >
            <p className="text-base font-semibold text-[var(--text-primary)]">아직 쌓인 복습 기록이 없어요.</p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              영상을 보기 시작하면 여기서 진행 상황과 저장한 표현이 쌓입니다.
            </p>
            <button
              onClick={() => router.push('/shorts')}
              className="mt-6 rounded-full bg-[var(--accent-primary)] px-5 py-2.5 text-sm font-semibold text-white"
            >
              영상 보러 가기
            </button>
          </motion.div>
        ) : (
          <>
            <section className="mb-8 grid grid-cols-3 gap-3">
              <ProgressStat value={totalWatched} label="본 영상" />
              <ProgressStat value={phrases.length} label="저장 표현" />
              <ProgressStat value={Math.max(streakDays, totalViews > 0 ? 1 : 0)} label="연속 학습" />
            </section>

            <DailyMissions />

            <WatchHistory />

            <GameLauncher phrases={phrases} />

            <section className="mb-8">
              <div className="mb-4 flex items-baseline justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-[var(--text-primary)]">저장한 표현</h2>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    복습할 문장을 모아두고, 다시 쇼츠로 돌아가서 장면째 확인할 수 있어요.
                  </p>
                </div>
                {phrases.length > 3 && (
                  <button
                    onClick={() => setShowAllPhrases((current) => !current)}
                    className="text-xs font-medium text-[var(--accent-text)]"
                  >
                    {showAllPhrases ? '접기' : '전체보기'}
                  </button>
                )}
              </div>

              {phrases.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--border-card)] px-5 py-8 text-center">
                  <p className="text-sm text-[var(--text-secondary)]">
                    쇼츠에서 문장을 두 번 탭하면 여기에 바로 쌓입니다.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <AnimatePresence>
                    {(showAllPhrases ? phrases : phrases.slice(0, 3)).map((phrase) => (
                      <SavedPhraseCard
                        key={phrase.id}
                        phrase={phrase}
                        onDelete={() => removePhrase(phrase.id)}
                        onPlay={() => {
                          clearDeletedFlag(phrase.videoId)
                          router.push(`/shorts?v=${phrase.videoId}`)
                        }}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  )
}
