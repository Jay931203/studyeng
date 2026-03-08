'use client'

import { AnimatePresence, motion, type PanInfo } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { series as allSeries, type VideoData } from '@/data/seed-videos'
import { useOrientation } from '@/hooks/useOrientation'
import { useDailyMissionStore } from '@/stores/useDailyMissionStore'
import { usePhraseStore } from '@/stores/usePhraseStore'
import { usePlayerStore } from '@/stores/usePlayerStore'
import { usePremiumStore } from '@/stores/usePremiumStore'
import { useUserStore } from '@/stores/useUserStore'
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore'
import { AdminReportButton } from './AdminReportButton'
import { PremiumModal } from './PremiumModal'
import { ProgressBar } from './ProgressBar'
import { SaveToast } from './SaveToast'
import { UnifiedControls } from './UnifiedControls'
import { VideoPlayer } from './VideoPlayer'

interface VideoFeedProps {
  videos: VideoData[]
  initialVideoId?: string
  navigationKey?: string
}

function buildExploreSeriesUrl(video: VideoData) {
  const params = new URLSearchParams()

  if (video.seriesId) {
    params.set('series', video.seriesId)
    params.set('returnSeriesId', video.seriesId)
  }

  params.set('source', 'shorts')
  params.set('returnVideoId', video.id)

  return `/explore?${params.toString()}`
}

export function VideoFeed({ videos, initialVideoId, navigationKey }: VideoFeedProps) {
  const router = useRouter()
  const { isLandscape } = useOrientation()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const [showToast, setShowToast] = useState(false)
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [premiumTrigger, setPremiumTrigger] = useState<'video-limit' | 'phrase-limit'>(
    'video-limit',
  )
  const [repeatIndicator, setRepeatIndicator] = useState<string | null>(null)

  const saveToastTimerRef = useRef<number | null>(null)
  const repeatIndicatorTimerRef = useRef<number | null>(null)
  const awardedRef = useRef<Set<string>>(new Set())

  const savePhrase = usePhraseStore((state) => state.savePhrase)
  const markWatched = useWatchHistoryStore((state) => state.markWatched)
  const incrementViewCount = useWatchHistoryStore((state) => state.incrementViewCount)
  const getViewCount = useWatchHistoryStore((state) => state.getViewCount)
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

  useEffect(() => {
    if (videos.length === 0) {
      setCurrentIndex(0)
      setDirection(0)
      resetRepeatCount()
      return
    }

    const targetIndex = initialVideoId
      ? videos.findIndex((video) => video.id === initialVideoId)
      : 0

    setCurrentIndex(targetIndex >= 0 ? targetIndex : 0)
    setDirection(0)
    resetRepeatCount()
  }, [initialVideoId, navigationKey, resetRepeatCount, videos.length])

  useEffect(() => {
    if (currentIndex <= videos.length - 1) return
    setCurrentIndex(Math.max(videos.length - 1, 0))
  }, [currentIndex, videos.length])

  useEffect(() => {
    const video = videos[currentIndex]
    if (!video) return

    incrementViewCount(video.id)
    if (video.seriesId) {
      markWatched(video.seriesId, video.id)
    }
  }, [currentIndex, incrementViewCount, markWatched, videos])

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
    if (currentIndex >= videos.length - 1) {
      resetRepeatCount()
      return false
    }

    const nextVideo = videos[currentIndex + 1]
    const alreadyWatched = nextVideo ? getViewCount(nextVideo.id) > 0 : false

    if (!alreadyWatched) {
      const allowed = incrementDailyView()
      if (!allowed) {
        setPremiumTrigger('video-limit')
        setShowPremiumModal(true)
        return false
      }
    }

    resetRepeatCount()
    setDirection(1)
    setCurrentIndex((prev) => prev + 1)
    return true
  }, [currentIndex, getViewCount, incrementDailyView, resetRepeatCount, videos])

  const handleClipComplete = useCallback(() => {
    const currentVideo = videos[currentIndex]

    if (currentVideo && !awardedRef.current.has(currentVideo.id)) {
      awardedRef.current.add(currentVideo.id)
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
    currentIndex,
    currentRepeatCount,
    incrementMission,
    incrementRepeatCount,
    moveToNextVideo,
    repeatMode,
    showRepeatProgress,
    videos,
  ])

  const handleNextVideo = useCallback(() => {
    moveToNextVideo()
  }, [moveToNextVideo])

  const handlePrevVideo = useCallback(() => {
    if (currentIndex <= 0) return

    resetRepeatCount()
    setDirection(-1)
    setCurrentIndex((prev) => prev - 1)
  }, [currentIndex, resetRepeatCount])

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

  const currentVideo = videos[currentIndex]
  if (!currentVideo) return null

  const seriesInfo = currentVideo.seriesId
    ? allSeries.find((series) => series.id === currentVideo.seriesId)
    : null

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
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
            youtubeId={currentVideo.youtubeId}
            subtitles={currentVideo.subtitles}
            clipStart={currentVideo.clipStart}
            clipEnd={currentVideo.clipEnd}
            isLandscape={isLandscape}
            onClipComplete={handleClipComplete}
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
            <ProgressBar className="bottom-2 left-3 right-[4.75rem]" />

            <div
              className="absolute bottom-3 right-3 z-20 flex flex-col gap-3"
              onPointerDownCapture={(event) => event.stopPropagation()}
              onClick={(event) => event.stopPropagation()}
            >
              {currentIndex > 0 && (
                <button
                  onClick={handlePrevVideo}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-colors active:bg-white/20"
                  aria-label="이전 영상"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-white/80">
                    <path
                      fillRule="evenodd"
                      d="M9.47 6.47a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 1 1-1.06 1.06L10 8.06l-3.72 3.72a.75.75 0 0 1-1.06-1.06l4.25-4.25Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}

              {currentIndex < videos.length - 1 && (
                <button
                  onClick={handleNextVideo}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-colors active:bg-white/20"
                  aria-label="다음 영상"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-white/80">
                    <path
                      fillRule="evenodd"
                      d="M10.53 13.53a.75.75 0 0 1-1.06 0l-4.25-4.25a.75.75 0 0 1 1.06-1.06L10 11.94l3.72-3.72a.75.75 0 0 1 1.06 1.06l-4.25 4.25Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
            </div>
          </VideoPlayer>

          {/* UnifiedControls: in landscape, constrain to the video area (left 62%) */}
          <div className={isLandscape ? 'absolute top-0 left-0 z-10' : 'contents'} style={isLandscape ? { width: '62%' } : undefined}>
            <UnifiedControls videoId={currentVideo.id} videoTitle={currentVideo.title} />
          </div>
          <div
            className={`pointer-events-none absolute top-0 z-[5] h-[100px] bg-gradient-to-b from-black/50 via-black/20 to-transparent ${
              isLandscape ? 'left-0' : 'left-0 right-0'
            }`}
            style={isLandscape ? { width: '62%' } : undefined}
          />
        </motion.div>
      </AnimatePresence>

      {repeatIndicator && (
        <div className="pointer-events-none absolute left-0 right-0 top-14 z-20 flex justify-center">
          <div className="rounded-full bg-white/10 px-4 py-1.5 backdrop-blur-md">
            <span className="text-xs font-medium text-white/80">{repeatIndicator}</span>
          </div>
        </div>
      )}

      <div className={`absolute left-3 top-3 z-10 ${isLandscape ? 'max-w-[40%]' : 'max-w-[65%]'}`}>
        {seriesInfo ? (
          <button
            onClick={() => router.push(buildExploreSeriesUrl(currentVideo), { scroll: false })}
            className="block max-w-full truncate rounded-lg bg-black/40 px-2.5 py-1.5 text-left text-xs font-medium text-white backdrop-blur-sm"
          >
            {seriesInfo.title}
            {currentVideo.episodeNumber != null && ` Ep.${currentVideo.episodeNumber}`}
          </button>
        ) : (
          <span className="block max-w-full truncate rounded-lg bg-black/40 px-2.5 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
            {currentVideo.title}
          </span>
        )}
      </div>

      {videos.length > 1 && videos.length <= 20 && (
        <div
          className="pointer-events-none absolute top-5 z-10 flex flex-col gap-[3px]"
          style={isLandscape ? { left: 'calc(62% - 16px)' } : { right: '12px' }}
        >
          {videos.slice(0, Math.min(videos.length, 12)).map((_, index) => (
            <div
              key={index}
              className={`rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'h-[4px] w-[4px] bg-white/80'
                  : 'h-[3px] w-[3px] bg-white/20'
              }`}
            />
          ))}
          {videos.length > 12 && <div className="h-[3px] w-[3px] rounded-full bg-white/10" />}
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
