'use client'

import { AnimatePresence, motion, type PanInfo } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { series as allSeries, type VideoData } from '@/data/seed-videos'
import { useOrientation } from '@/hooks/useOrientation'
import { getCatalogVideosBySeries } from '@/lib/catalog'
import { readEmbedBlockedVideoIds, writeEmbedBlockedVideoIds } from '@/lib/embedBlocklist'
import { useDailyMissionStore } from '@/stores/useDailyMissionStore'
import { usePhraseStore } from '@/stores/usePhraseStore'
import { usePlayerStore } from '@/stores/usePlayerStore'
import { usePremiumStore } from '@/stores/usePremiumStore'
import { useRecommendationStore } from '@/stores/useRecommendationStore'
import { useUserStore } from '@/stores/useUserStore'
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore'
import { AdminReportButton } from './AdminReportButton'
import { FloatingRemote } from './FloatingRemote'
import { PremiumModal } from './PremiumModal'
import { SaveToast } from './SaveToast'
import { UnifiedControls } from './UnifiedControls'
import { VideoPlayer } from './VideoPlayer'

interface VideoFeedProps {
  videos: VideoData[]
  initialVideoId?: string
  initialSeekTime?: number
  initialReviewPhraseId?: string
}

export function VideoFeed({
  videos,
  initialVideoId,
  initialSeekTime,
  initialReviewPhraseId,
}: VideoFeedProps) {
  const router = useRouter()
  const { isLandscape } = useOrientation()
  const [embedBlockedVideoIds, setEmbedBlockedVideoIds] = useState<string[]>(() => {
    return readEmbedBlockedVideoIds()
  })
  const embedBlockedIdSet = useMemo(() => new Set(embedBlockedVideoIds), [embedBlockedVideoIds])
  const [currentIndex, setCurrentIndex] = useState(() => {
    if (videos.length === 0) return 0
    const targetIndex = initialVideoId
      ? videos.findIndex((video) => video.id === initialVideoId)
      : 0
    return targetIndex >= 0 ? targetIndex : 0
  })
  const [direction, setDirection] = useState(0)
  const [showToast, setShowToast] = useState(false)
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [showSeriesEpisodes, setShowSeriesEpisodes] = useState(false)
  const [premiumTrigger, setPremiumTrigger] = useState<'video-limit' | 'phrase-limit'>(
    'video-limit',
  )
  const [repeatIndicator, setRepeatIndicator] = useState<string | null>(null)

  const saveToastTimerRef = useRef<number | null>(null)
  const repeatIndicatorTimerRef = useRef<number | null>(null)
  const initialReviewMarkedRef = useRef(false)
  const awardedRef = useRef<Set<string>>(new Set())
  const playbackMetricsRef = useRef({ currentTime: 0, clipStart: 0, clipEnd: 0 })
  const engagementRef = useRef<{ finalized: boolean; videoId: string | null }>({
    finalized: false,
    videoId: null,
  })

  const savePhrase = usePhraseStore((state) => state.savePhrase)
  const incrementReview = usePhraseStore((state) => state.incrementReview)
  const markWatched = useWatchHistoryStore((state) => state.markWatched)
  const recordCompletion = useWatchHistoryStore((state) => state.recordCompletion)
  const incrementViewCount = useWatchHistoryStore((state) => state.incrementViewCount)
  const getViewCount = useWatchHistoryStore((state) => state.getViewCount)
  const registerImpression = useRecommendationStore((state) => state.registerImpression)
  const recordBehaviorCompletion = useRecommendationStore((state) => state.recordCompletion)
  const recordSkip = useRecommendationStore((state) => state.recordSkip)
  const incrementDailyView = usePremiumStore((state) => state.incrementDailyView)
  const canSaveMorePhrases = usePremiumStore((state) => state.canSaveMorePhrases)
  const incrementSavedPhrases = usePremiumStore((state) => state.incrementSavedPhrases)
  const checkAndUpdateStreak = useUserStore((state) => state.checkAndUpdateStreak)
  const incrementMission = useDailyMissionStore((state) => state.incrementMission)
  const repeatMode = usePlayerStore((state) => state.repeatMode)
  const currentRepeatCount = usePlayerStore((state) => state.currentRepeatCount)
  const incrementRepeatCount = usePlayerStore((state) => state.incrementRepeatCount)
  const resetRepeatCount = usePlayerStore((state) => state.resetRepeatCount)
  const setIsSwiping = usePlayerStore((state) => state.setIsSwiping)
  const currentTime = usePlayerStore((state) => state.currentTime)
  const clipStart = usePlayerStore((state) => state.clipStart)
  const clipEnd = usePlayerStore((state) => state.clipEnd)
  const currentVideo = videos[currentIndex]
  const seriesEpisodes = useMemo(
    () => (currentVideo?.seriesId ? getCatalogVideosBySeries(currentVideo.seriesId) : []),
    [currentVideo],
  )

  useEffect(() => {
    writeEmbedBlockedVideoIds(embedBlockedVideoIds)
  }, [embedBlockedVideoIds])

  const findPlayableIndex = useCallback(
    (startIndex: number, step: 1 | -1) => {
      for (
        let index = startIndex;
        index >= 0 && index < videos.length;
        index += step
      ) {
        if (!embedBlockedIdSet.has(videos[index].id)) {
          return index
        }
      }

      return -1
    },
    [embedBlockedIdSet, videos],
  )

  useEffect(() => {
    playbackMetricsRef.current = { currentTime, clipStart, clipEnd }
  }, [clipEnd, clipStart, currentTime])

  useEffect(() => {
    if (!currentVideo) return
    if (!embedBlockedIdSet.has(currentVideo.id)) return

    const forwardIndex = findPlayableIndex(currentIndex + 1, 1)
    if (forwardIndex >= 0) {
      const timer = window.setTimeout(() => {
        setDirection(1)
        setCurrentIndex(forwardIndex)
      }, 0)
      return () => clearTimeout(timer)
    }

    const backwardIndex = findPlayableIndex(currentIndex - 1, -1)
    if (backwardIndex >= 0) {
      const timer = window.setTimeout(() => {
        setDirection(-1)
        setCurrentIndex(backwardIndex)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [currentIndex, currentVideo, embedBlockedIdSet, findPlayableIndex])

  const finalizeVideoSession = useCallback(
    (videoId: string, completed: boolean) => {
      if (engagementRef.current.videoId !== videoId || engagementRef.current.finalized) {
        return
      }

      engagementRef.current.finalized = true

      if (completed) {
        recordBehaviorCompletion(videoId)
        return
      }

      const metrics = playbackMetricsRef.current
      const clipDuration = Math.max(metrics.clipEnd - metrics.clipStart, 1)
      const completionRatio = Math.min(
        1,
        Math.max(0, (metrics.currentTime - metrics.clipStart) / clipDuration),
      )
      recordSkip(videoId, completionRatio)
    },
    [recordBehaviorCompletion, recordSkip],
  )

  useEffect(() => {
    if (!currentVideo) return

    engagementRef.current = {
      finalized: false,
      videoId: currentVideo.id,
    }

    registerImpression(currentVideo.id)
    incrementViewCount(currentVideo.id)
    if (currentVideo.seriesId) {
      markWatched(currentVideo.seriesId, currentVideo.id)
    }

    return () => {
      finalizeVideoSession(currentVideo.id, false)
    }
  }, [
    currentIndex,
    currentVideo,
    currentVideo?.id,
    currentVideo?.seriesId,
    finalizeVideoSession,
    incrementViewCount,
    markWatched,
    registerImpression,
  ])

  useEffect(() => {
    return () => {
      if (saveToastTimerRef.current) {
        clearTimeout(saveToastTimerRef.current)
      }
      if (repeatIndicatorTimerRef.current) {
        clearTimeout(repeatIndicatorTimerRef.current)
      }
    }
  }, [])

  const showRepeatProgress = useCallback((count: number, targetCount: number) => {
    setRepeatIndicator(`반복 ${count}/${targetCount}`)

    if (repeatIndicatorTimerRef.current) {
      clearTimeout(repeatIndicatorTimerRef.current)
    }

    repeatIndicatorTimerRef.current = window.setTimeout(() => {
      setRepeatIndicator(null)
    }, 1500)
  }, [])

  const moveToNextVideo = useCallback(() => {
    const nextPlayableIndex = findPlayableIndex(currentIndex + 1, 1)
    if (nextPlayableIndex < 0) {
      resetRepeatCount()
      return false
    }

    const nextVideo = videos[nextPlayableIndex]
    const alreadyWatched = nextVideo ? getViewCount(nextVideo.id) > 0 : false

    if (!alreadyWatched) {
      const allowed = incrementDailyView()
      if (!allowed) {
        setPremiumTrigger('video-limit')
        setShowPremiumModal(true)
        return false
      }
    }

    if (currentVideo) {
      finalizeVideoSession(currentVideo.id, false)
    }

    resetRepeatCount()
    setDirection(1)
    setCurrentIndex(nextPlayableIndex)
    return true
  }, [
    currentIndex,
    currentVideo,
    findPlayableIndex,
    finalizeVideoSession,
    getViewCount,
    incrementDailyView,
    resetRepeatCount,
    videos,
  ])

  const handleClipComplete = useCallback(() => {
    if (currentVideo && !awardedRef.current.has(currentVideo.id)) {
      awardedRef.current.add(currentVideo.id)
      finalizeVideoSession(currentVideo.id, true)
      recordCompletion(currentVideo.id)
      checkAndUpdateStreak()
      incrementMission('watch-videos')
    }

    if (repeatMode === 'off') return

    const targetCount = repeatMode === 'x2' ? 2 : 3
    const newCount = currentRepeatCount + 1
    incrementRepeatCount()

    if (newCount >= targetCount) {
      moveToNextVideo()
      return
    }

    showRepeatProgress(newCount, targetCount)
  }, [
    checkAndUpdateStreak,
    currentRepeatCount,
    currentVideo,
    incrementMission,
    incrementRepeatCount,
    moveToNextVideo,
    finalizeVideoSession,
    recordCompletion,
    repeatMode,
    showRepeatProgress,
  ])

  const handleNextVideo = useCallback(() => {
    moveToNextVideo()
  }, [moveToNextVideo])

  const handlePrevVideo = useCallback(() => {
    const previousPlayableIndex = findPlayableIndex(currentIndex - 1, -1)
    if (previousPlayableIndex < 0) return

    if (currentVideo) {
      finalizeVideoSession(currentVideo.id, false)
    }

    resetRepeatCount()
    setDirection(-1)
    setCurrentIndex(previousPlayableIndex)
  }, [currentIndex, currentVideo, finalizeVideoSession, findPlayableIndex, resetRepeatCount])

  const onToggleFreeze = useCallback(() => {
    const store = usePlayerStore.getState()
    if (store.freezeSubIndex !== null) {
      store.setFreezeSubIndex(null)
    } else if (store.activeSubIndex >= 0) {
      store.setFreezeSubIndex(store.activeSubIndex)
    }
  }, [])

  const handleEmbedBlocked = useCallback(() => {
    if (!currentVideo) return

    setEmbedBlockedVideoIds((state) => {
      if (state.includes(currentVideo.id)) return state
      return [...state, currentVideo.id]
    })

    moveToNextVideo()
  }, [currentVideo, moveToNextVideo])

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const swipeThreshold = 50
      const { offset, velocity } = info

      if (offset.y < -swipeThreshold || velocity.y < -500) {
        handleNextVideo()
      } else if (offset.y > swipeThreshold || velocity.y > 500) {
        handlePrevVideo()
      }
    },
    [handleNextVideo, handlePrevVideo],
  )

  if (!currentVideo) return null

  const seriesInfo = currentVideo.seriesId
    ? allSeries.find((series) => series.id === currentVideo.seriesId)
    : null

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{ backgroundColor: 'var(--player-surface)' }}
    >
      <AnimatePresence custom={direction}>
        <motion.div
          key={currentVideo.id}
          custom={direction}
          initial={direction === 0 ? false : { y: direction > 0 ? '100%' : '-100%' }}
          animate={{ y: 0 }}
          exit={{ y: direction > 0 ? '-100%' : '100%' }}
          transition={{ type: 'tween', duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.15}
          onDragStart={() => setIsSwiping(true)}
          onDragEnd={(...args) => {
            setIsSwiping(false)
            handleDragEnd(...args)
          }}
          className="absolute inset-0"
        >
          <VideoPlayer
            videoId={currentVideo.id}
            youtubeId={currentVideo.youtubeId}
            subtitles={currentVideo.subtitles}
            clipStart={currentVideo.clipStart}
            clipEnd={currentVideo.clipEnd}
            isLandscape={isLandscape}
            onClipComplete={handleClipComplete}
            onVideoErrorSkip={currentIndex < videos.length - 1 ? handleNextVideo : undefined}
            onEmbedBlocked={handleEmbedBlocked}
            initialSeekTime={currentIndex === 0 ? initialSeekTime : undefined}
            onPlaybackStarted={() => {
              if (
                initialReviewMarkedRef.current ||
                !initialReviewPhraseId ||
                currentIndex !== 0 ||
                currentVideo.id !== initialVideoId
              ) {
                return
              }

              initialReviewMarkedRef.current = true
              incrementReview(initialReviewPhraseId)
            }}
            onSavePhrase={(phrase) => {
              if (!canSaveMorePhrases()) {
                setPremiumTrigger('phrase-limit')
                setShowPremiumModal(true)
                return
              }

              savePhrase({
                videoId: currentVideo.id,
                videoTitle: currentVideo.title,
                en: phrase.en,
                ko: phrase.ko,
                timestampStart: phrase.start,
                timestampEnd: phrase.end,
              })

              incrementSavedPhrases()
              incrementMission('save-phrase')
              setShowToast(true)

              if (saveToastTimerRef.current) {
                clearTimeout(saveToastTimerRef.current)
              }

              saveToastTimerRef.current = window.setTimeout(() => {
                setShowToast(false)
              }, 2000)
            }}
          >
            <FloatingRemote
              onPrevVideo={currentIndex > 0 ? handlePrevVideo : undefined}
              onNextVideo={currentIndex < videos.length - 1 ? handleNextVideo : undefined}
              onToggleFreeze={onToggleFreeze}
              isLandscape={isLandscape}
            />
          </VideoPlayer>

          <div
            className="absolute left-3 right-3 top-3 z-10 flex items-center gap-3 rounded-[22px] border px-3 py-2 backdrop-blur-md"
            style={{
              backgroundColor: 'var(--player-control-bg)',
              borderColor: 'var(--player-control-border)',
              ...(isLandscape
                ? {
                    left: 'max(12px, env(safe-area-inset-left, 0px))',
                    top: 'max(12px, env(safe-area-inset-top, 0px))',
                    right: 'auto',
                    width: 'calc(62% - 24px)',
                  }
                : {}),
            }}
          >
            <button
              onClick={() => router.push('/explore')}
              className="flex h-10 w-10 items-center justify-center rounded-2xl"
              style={{
                backgroundColor: 'var(--player-panel)',
                color: 'var(--accent-text)',
              }}
              aria-label="홈으로"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M11.47 3.84a.75.75 0 0 1 1.06 0l7 7a.75.75 0 1 1-1.06 1.06L18 11.44V19.5a.75.75 0 0 1-.75.75h-3.5a.75.75 0 0 1-.75-.75v-4h-2v4a.75.75 0 0 1-.75.75h-3.5A.75.75 0 0 1 6 19.5v-8.06l-.47.46a.75.75 0 0 1-1.06-1.06l7-7Z" />
              </svg>
            </button>

            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--player-muted)' }}>
                피드
              </p>
              {seriesInfo ? (
                <button
                  onClick={() => setShowSeriesEpisodes((current) => !current)}
                  className="mt-1 block w-full truncate text-left text-sm font-semibold"
                  style={{ color: 'var(--player-text)' }}
                >
                  {seriesInfo.title}
                </button>
              ) : (
                <span
                  className="mt-1 block w-full truncate text-sm font-semibold"
                  style={{ color: 'var(--player-text)' }}
                >
                  {currentVideo.title}
                </span>
              )}
              <p className="mt-0.5 truncate text-[11px]" style={{ color: 'var(--player-muted)' }}>
                {seriesInfo && currentVideo.episodeNumber != null
                  ? `에피소드 ${currentVideo.episodeNumber}`
                  : '지금 재생 중'}
              </p>
            </div>

            <div className="h-4 w-px shrink-0" style={{ backgroundColor: 'var(--player-divider)' }} />

            <UnifiedControls
              videoId={currentVideo.id}
              videoTitle={currentVideo.title}
              className="inline-flex shrink-0 items-center gap-0.5"
            />
          </div>
          {seriesInfo && showSeriesEpisodes && seriesEpisodes.length > 0 && (
            <div
              className="absolute left-3 right-3 top-[68px] z-10 overflow-x-auto rounded-[22px] border px-3 py-3 backdrop-blur-md"
              style={{
                backgroundColor: 'var(--player-control-bg)',
                borderColor: 'var(--player-control-border)',
                ...(isLandscape
                  ? {
                      left: 'max(12px, env(safe-area-inset-left, 0px))',
                      right: 'auto',
                      width: 'calc(62% - 24px)',
                    }
                  : {}),
              }}
            >
              <div className="flex gap-2">
                {seriesEpisodes.map((episode) => {
                  const active = episode.id === currentVideo.id
                  return (
                    <button
                      key={episode.id}
                      onClick={() => {
                        const nextIndex = videos.findIndex((video) => video.id === episode.id)
                        if (nextIndex >= 0) {
                          setDirection(nextIndex > currentIndex ? 1 : -1)
                          setCurrentIndex(nextIndex)
                        } else {
                          router.push(`/shorts?v=${episode.id}&series=${seriesInfo.id}`, {
                            scroll: false,
                          })
                        }
                      }}
                      className={`min-w-[88px] rounded-2xl px-3 py-2 text-left ${
                        active ? 'bg-[var(--accent-glow)]' : 'bg-[var(--player-panel)]'
                      }`}
                    >
                      <p
                        className="text-[10px] font-semibold uppercase"
                        style={{ color: active ? 'var(--accent-text)' : 'var(--player-muted)' }}
                      >
                        Ep.{episode.episodeNumber ?? 0}
                      </p>
                      <p
                        className="mt-1 truncate text-xs font-medium"
                        style={{ color: 'var(--player-text)' }}
                      >
                        {episode.title}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          <div
            className={`pointer-events-none absolute top-0 z-[5] h-[100px] ${
              isLandscape ? 'left-0' : 'left-0 right-0'
            }`}
            style={{
              ...(isLandscape ? { width: '62%' } : {}),
              background:
                'linear-gradient(to bottom, var(--player-gradient-strong), var(--player-gradient-soft), transparent)',
            }}
          />
        </motion.div>
      </AnimatePresence>

      {repeatIndicator && (
        <div className="pointer-events-none absolute left-0 right-0 top-14 z-20 flex justify-center">
          <div
            className="rounded-full border px-4 py-1.5 backdrop-blur-md"
            style={{
              backgroundColor: 'var(--player-chip-bg)',
              borderColor: 'var(--player-chip-border)',
            }}
          >
            <span className="text-xs font-medium" style={{ color: 'var(--player-text)' }}>
              {repeatIndicator}
            </span>
          </div>
        </div>
      )}

      {videos.length > 1 && videos.length <= 20 && (
        <div
          className="pointer-events-none absolute top-5 z-10 flex flex-col gap-[3px]"
          style={
            isLandscape
              ? {
                  left: 'calc(62% - 16px)',
                  top: 'max(20px, env(safe-area-inset-top, 0px))',
                }
              : { right: '12px' }
          }
        >
          {videos.slice(0, Math.min(videos.length, 12)).map((_, index) => (
            <div
              key={index}
              className={`rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'h-[4px] w-[4px]'
                  : 'h-[3px] w-[3px]'
              }`}
              style={{
                backgroundColor:
                  index === currentIndex ? 'var(--player-text)' : 'var(--player-faint)',
              }}
            />
          ))}
          {videos.length > 12 && (
            <div
              className="h-[3px] w-[3px] rounded-full"
              style={{ backgroundColor: 'var(--player-faint)' }}
            />
          )}
        </div>
      )}

      <SaveToast show={showToast} message="표현을 저장했어요" />

      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        trigger={premiumTrigger}
      />

      <AdminReportButton videoId={currentVideo.id} youtubeId={currentVideo.youtubeId} />
    </div>
  )
}
