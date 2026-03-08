'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDailyMissionStore } from '@/stores/useDailyMissionStore'
import { useDiscountStore } from '@/stores/useDiscountStore'
import { usePremiumStore } from '@/stores/usePremiumStore'

const missionIcons: Record<string, React.ReactNode> = {
  'watch-videos': (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
    </svg>
  ),
  'play-game': (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M11.25 5.337c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.036 1.007-1.875 2.25-1.875S15 2.34 15 3.375c0 .369-.128.713-.349 1.003-.215.283-.401.604-.401.959 0 .332.278.598.61.578 1.91-.114 3.79-.342 5.632-.676a.75.75 0 01.878.645 49.17 49.17 0 01.376 5.452.657.657 0 01-.66.664c-.354 0-.675-.186-.958-.401a1.647 1.647 0 00-1.003-.349c-1.035 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401.31 0 .557.262.534.571a48.774 48.774 0 01-.595 4.845.75.75 0 01-.61.61c-1.82.317-3.673.533-5.555.642a.58.58 0 01-.611-.581c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.035-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959a.641.641 0 01-.658.643 49.118 49.118 0 01-4.708-.441.75.75 0 01-.645-.878c.293-1.614.504-3.257.629-4.924A.53.53 0 005.337 15c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.036 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.369 0 .713.128 1.003.349.283.215.604.401.959.401a.656.656 0 00.659-.663 47.703 47.703 0 00-.31-4.82.75.75 0 01.83-.832c1.343.155 2.703.254 4.077.294a.64.64 0 00.657-.642z" />
    </svg>
  ),
  'save-phrase': (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z" clipRule="evenodd" />
    </svg>
  ),
}

const missionColors: Record<string, { bg: string; fill: string; bar: string }> = {
  'watch-videos': {
    bg: 'bg-blue-500/10',
    fill: 'text-blue-400',
    bar: 'bg-blue-500',
  },
  'play-game': {
    bg: 'bg-purple-500/10',
    fill: 'text-purple-400',
    bar: 'bg-purple-500',
  },
  'save-phrase': {
    bg: 'bg-amber-500/10',
    fill: 'text-amber-400',
    bar: 'bg-amber-500',
  },
}

export function DailyMissions() {
  const missions = useDailyMissionStore((s) => s.missions)
  const allCompleteBonus = useDailyMissionStore((s) => s.allCompleteBonus)
  const checkAndResetDaily = useDailyMissionStore((s) => s.checkAndResetDaily)

  const [celebratingId, setCelebratingId] = useState<string | null>(null)
  const [prevCompleted, setPrevCompleted] = useState<Set<string>>(new Set())

  // Reset on mount if new day
  useEffect(() => {
    checkAndResetDaily()
  }, [checkAndResetDaily])

  // Detect newly completed missions for celebration animation
  useEffect(() => {
    const currentCompleted = new Set(missions.filter((m) => m.completed).map((m) => m.id))
    let newId: string | null = null
    for (const id of currentCompleted) {
      if (!prevCompleted.has(id)) {
        newId = id
        break
      }
    }
    // Always update prevCompleted to avoid re-triggering
    setPrevCompleted(currentCompleted)
    if (newId) {
      setCelebratingId(newId)
      const timer = setTimeout(() => setCelebratingId(null), 1200)
      return () => clearTimeout(timer)
    }
  }, [missions]) // eslint-disable-line react-hooks/exhaustive-deps

  const allDone = missions.every((m) => m.completed)
  const totalXpEarned = missions
    .filter((m) => m.completed)
    .reduce((sum, m) => sum + m.xpReward, 0) + (allCompleteBonus ? 20 : 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="mb-8"
    >
      <div className="bg-[var(--bg-card)] shadow-[var(--card-shadow)] rounded-2xl overflow-hidden border border-white/[0.04]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <span className="text-[var(--text-secondary)] text-xs font-medium tracking-wide uppercase">
            오늘의 미션
          </span>
          {totalXpEarned > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full"
            >
              +{totalXpEarned} XP
            </motion.span>
          )}
        </div>

        {/* Mission rows */}
        <div className="px-4 pb-2">
          {missions.map((mission, index) => {
            const colors = missionColors[mission.id] ?? missionColors['watch-videos']
            const icon = missionIcons[mission.id]
            const progress = mission.target > 0 ? mission.current / mission.target : 0
            const isCelebrating = celebratingId === mission.id

            return (
              <motion.div
                key={mission.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08, duration: 0.25, ease: 'easeOut' }}
                className="py-3 relative"
              >
                {/* Celebration flash */}
                <AnimatePresence>
                  {isCelebrating && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 rounded-lg bg-green-500/5 -mx-2 -my-1 pointer-events-none"
                    />
                  )}
                </AnimatePresence>

                <div className="flex items-center gap-3">
                  {/* Icon */}
                  <div
                    className={`w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center flex-shrink-0 ${
                      mission.completed ? 'opacity-50' : ''
                    }`}
                  >
                    <span className={colors.fill}>{icon}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`text-sm ${
                          mission.completed
                            ? 'text-[var(--text-muted)] line-through'
                            : 'text-[var(--text-primary)] font-medium'
                        }`}
                      >
                        {mission.title}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--text-muted)]">
                          {mission.current}/{mission.target}
                        </span>
                        {mission.completed ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              className="w-4 h-4 text-green-400"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </motion.div>
                        ) : (
                          <span className="text-xs text-[var(--text-muted)]">
                            +{mission.xpReward} XP
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress bar — thinner, cleaner */}
                    <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${
                          mission.completed ? 'bg-green-500/80' : colors.bar
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(progress * 100, 100)}%` }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Separator */}
                {index < missions.length - 1 && (
                  <div className="absolute bottom-0 left-11 right-0 h-px bg-white/[0.04]" />
                )}
              </motion.div>
            )
          })}
        </div>

        {/* All-clear bonus row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.25 }}
          className={`mx-4 mb-4 rounded-xl px-3 py-2.5 flex items-center justify-between ${
            allDone
              ? 'bg-yellow-500/10 border border-yellow-400/10'
              : 'bg-white/[0.02] border border-white/[0.03]'
          }`}
        >
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-4 h-4 ${allDone ? 'text-yellow-400' : 'text-[var(--text-muted)] opacity-40'}`}>
              <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
            </svg>
            <span
              className={`text-sm ${
                allDone ? 'text-yellow-300 font-medium' : 'text-[var(--text-muted)]'
              }`}
            >
              올클리어 보너스
            </span>
          </div>
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              allDone
                ? 'text-yellow-300 bg-yellow-500/15'
                : 'text-[var(--text-muted)] bg-white/[0.03]'
            }`}
          >
            {allCompleteBonus ? '획득 완료' : '+20 XP'}
          </span>
        </motion.div>

        {/* All-clear message */}
        <AnimatePresence>
          {allCompleteBonus && celebratingId === null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="px-4 pb-4"
            >
              <p className="text-center text-xs text-green-400/80">
                오늘 미션 끝. 내일 또 보자
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 이번 달 할인 진행률 */}
        <DiscountProgress />
      </div>
    </motion.div>
  )
}

function DiscountProgress() {
  const isPremium = usePremiumStore((s) => s.isPremium)
  const checkAndResetMonthly = useDiscountStore((s) => s.checkAndResetMonthly)
  const completedDays = useDiscountStore((s) => s.completedDays)
  const getCompletionRate = useDiscountStore((s) => s.getCompletionRate)
  const getDiscountRate = useDiscountStore((s) => s.getDiscountRate)
  const getNextTierInfo = useDiscountStore((s) => s.getNextTierInfo)
  const getDaysInCurrentMonth = useDiscountStore((s) => s.getDaysInCurrentMonth)

  useEffect(() => {
    checkAndResetMonthly()
  }, [checkAndResetMonthly])

  const completionRate = getCompletionRate()
  const discountRate = getDiscountRate()
  const nextTier = getNextTierInfo()
  const totalDays = getDaysInCurrentMonth()
  const completedCount = completedDays.length

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.35, duration: 0.25 }}
      className="mx-4 mb-4"
    >
      <div className="bg-white/[0.02] border border-white/[0.03] rounded-xl px-3 py-3">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-emerald-400">
              <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
            </svg>
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              이번 달 구독 할인
            </span>
          </div>
          {discountRate > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full"
            >
              {discountRate}% 할인
            </motion.span>
          )}
        </div>

        {/* 프로그레스바 — thinner */}
        <div className="relative h-1.5 bg-white/[0.04] rounded-full overflow-hidden mb-2">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(completionRate, 100)}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
          {/* 티어 마커 */}
          {[30, 50, 70, 90].map((mark) => (
            <div
              key={mark}
              className="absolute top-0 bottom-0 w-px bg-white/10"
              style={{ left: `${mark}%` }}
            />
          ))}
        </div>

        {/* 달성 정보 */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[var(--text-muted)]">
            {completedCount}/{totalDays}일 완료 ({Math.round(completionRate)}%)
          </span>
          {isPremium ? (
            nextTier ? (
              <span className="text-[10px] font-medium text-emerald-400">
                {nextTier.daysNeeded}일 더 하면 {nextTier.nextDiscount}% 할인
              </span>
            ) : discountRate >= 50 ? (
              <span className="text-[10px] font-medium text-yellow-400">
                최대 할인 달성
              </span>
            ) : null
          ) : (
            <span className="text-[10px] text-[var(--text-muted)]">
              구독하면 할인 적용
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}
