'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence, type PanInfo } from 'framer-motion'
import { VideoPlayer } from './VideoPlayer'
import { UnifiedControls } from './UnifiedControls'
import { SaveToast } from './SaveToast'
import { ProgressBar } from './ProgressBar'
import { usePhraseStore } from '@/stores/usePhraseStore'
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore'
import { usePremiumStore, FREE_DAILY_VIEW_LIMIT } from '@/stores/usePremiumStore'
import { usePlayerStore } from '@/stores/usePlayerStore'
import { useUserStore } from '@/stores/useUserStore'
import { useDailyMissionStore } from '@/stores/useDailyMissionStore'
import { PremiumModal } from './PremiumModal'
import { AdminReportButton } from './AdminReportButton'
import { useRouter } from 'next/navigation'
import { categories, series as allSeries, type VideoData } from '@/data/seed-videos'

interface VideoFeedProps {
  videos: VideoData[]
}

export function VideoFeed({ videos }: VideoFeedProps) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const [showToast, setShowToast] = useState(false)
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [premiumTrigger, setPremiumTrigger] = useState<'video-limit' | 'phrase-limit'>('video-limit')
  const [showOverlay, setShowOverlay] = useState(true)
  const overlayTimerRef = useRef<number | null>(null)
  const constraintsRef = useRef(null)
  const savePhrase = usePhraseStore((s) => s.savePhrase)
  const markWatched = useWatchHistoryStore((s) => s.markWatched)
  const incrementViewCount = useWatchHistoryStore((s) => s.incrementViewCount)
  const getViewCount = useWatchHistoryStore((s) => s.getViewCount)
  const isPremium = usePremiumStore((s) => s.isPremium)
  const incrementDailyView = usePremiumStore((s) => s.incrementDailyView)
  const getDailyViewsRemaining = usePremiumStore((s) => s.getDailyViewsRemaining)
  const canSaveMorePhrases = usePremiumStore((s) => s.canSaveMorePhrases)
  const incrementSavedPhrases = usePremiumStore((s) => s.incrementSavedPhrases)
  const checkAndUpdateStreak = useUserStore((s) => s.checkAndUpdateStreak)
  const incrementMission = useDailyMissionStore((s) => s.incrementMission)
  const repeatMode = usePlayerStore((s) => s.repeatMode)
  const currentRepeatCount = usePlayerStore((s) => s.currentRepeatCount)
  const incrementRepeatCount = usePlayerStore((s) => s.incrementRepeatCount)
  const resetRepeatCount = usePlayerStore((s) => s.resetRepeatCount)
  const setIsSwiping = usePlayerStore((s) => s.setIsSwiping)

  // Track which videos have already counted streak/missions this session
  const awardedRef = useRef<Set<string>>(new Set())

  // Brief overlay indicator for repeat progress
  const [repeatIndicator, setRepeatIndicator] = useState<string | null>(null)
  const repeatIndicatorTimerRef = useRef<number | null>(null)

  // Auto-hide top overlay after 3 seconds, re-show on video change
  useEffect(() => {
    setShowOverlay(true)
    if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current)
    overlayTimerRef.current = window.setTimeout(() => {
      setShowOverlay(false)
    }, 3000)
    return () => {
      if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current)
    }
  }, [currentIndex])

  // Mark episode as watched and count views
  useEffect(() => {
    const video = videos[currentIndex]
    if (video) {
      incrementViewCount(video.id)
      if (video.seriesId) {
        markWatched(video.seriesId, video.id)
      }
    }
  }, [currentIndex, videos, markWatched, incrementViewCount])

  // Handle clip completion for repeat mode auto-advance + streak rewards
  const handleClipComplete = useCallback(() => {
    // Update streak and missions on first completion of each video this session
    const currentVideo = videos[currentIndex]
    if (currentVideo && !awardedRef.current.has(currentVideo.id)) {
      awardedRef.current.add(currentVideo.id)
      checkAndUpdateStreak()
      incrementMission('watch-videos')
    }

    if (repeatMode === 'off') return // Normal loop, do nothing

    const targetCount = repeatMode === 'x2' ? 2 : 3
    const newCount = currentRepeatCount + 1
    incrementRepeatCount()

    if (newCount >= targetCount) {
      // All repetitions done — auto-advance to next video
      if (currentIndex < videos.length - 1) {
        const nextVideo = videos[currentIndex + 1]
        const alreadyWatched = nextVideo && getViewCount(nextVideo.id) > 0
        if (!alreadyWatched) {
          const allowed = incrementDailyView()
          if (!allowed) {
            setPremiumTrigger('video-limit')
            setShowPremiumModal(true)
            resetRepeatCount()
            return
          }
        }
        resetRepeatCount()
        setDirection(1)
        setCurrentIndex((prev) => prev + 1)
      } else {
        // Already at the last video, just reset count and keep looping
        resetRepeatCount()
      }
    } else {
      // Show repeat progress indicator briefly
      const label = `${newCount}/${targetCount} 반복 중`
      setRepeatIndicator(label)
      if (repeatIndicatorTimerRef.current) clearTimeout(repeatIndicatorTimerRef.current)
      repeatIndicatorTimerRef.current = window.setTimeout(() => {
        setRepeatIndicator(null)
      }, 1500)
    }
  }, [repeatMode, currentRepeatCount, currentIndex, videos, checkAndUpdateStreak, incrementMission, incrementRepeatCount, resetRepeatCount, incrementDailyView])

  const handleNextVideo = useCallback(() => {
    if (currentIndex >= videos.length - 1) return
    // Already-watched videos don't consume daily limit
    const nextVideo = videos[currentIndex + 1]
    const alreadyWatched = nextVideo && getViewCount(nextVideo.id) > 0
    if (!alreadyWatched) {
      const allowed = incrementDailyView()
      if (!allowed) {
        setPremiumTrigger('video-limit')
        setShowPremiumModal(true)
        return
      }
    }
    resetRepeatCount()
    setDirection(1)
    setCurrentIndex((prev) => prev + 1)
  }, [currentIndex, videos, getViewCount, incrementDailyView, resetRepeatCount])

  const handlePrevVideo = useCallback(() => {
    if (currentIndex <= 0) return
    resetRepeatCount()
    setDirection(-1)
    setCurrentIndex((prev) => prev - 1)
  }, [currentIndex, resetRepeatCount])

  const swipeThreshold = 50

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const { offset, velocity } = info

      if (offset.y < -swipeThreshold || velocity.y < -500) {
        handleNextVideo()
      } else if (offset.y > swipeThreshold || velocity.y > 500) {
        handlePrevVideo()
      }
    },
    [handleNextVideo, handlePrevVideo]
  )

  const currentVideo = videos[currentIndex]
  if (!currentVideo) return null

  const seriesInfo = currentVideo.seriesId
    ? allSeries.find(s => s.id === currentVideo.seriesId)
    : null
  const categoryLabel = categories.find(c => c.id === currentVideo.category)?.label ?? currentVideo.category

  return (
    <div ref={constraintsRef} className="relative w-full h-full overflow-hidden bg-black">
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
          onDragEnd={(...args) => { setIsSwiping(false); handleDragEnd(...args) }}
          className="absolute inset-0"
        >
          <VideoPlayer
            youtubeId={currentVideo.youtubeId}
            subtitles={currentVideo.subtitles}
            clipStart={currentVideo.clipStart}
            clipEnd={currentVideo.clipEnd}
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
              setTimeout(() => setShowToast(false), 2000)
            }}
          />
          <UnifiedControls videoId={currentVideo.id} videoTitle={currentVideo.title} />

          {/* Top gradient for text readability — subtle, barely visible */}
          <div className="absolute top-0 left-0 right-0 h-[100px] bg-gradient-to-b from-black/50 via-black/20 to-transparent pointer-events-none z-[5]" />
        </motion.div>
      </AnimatePresence>

      {/* Progress bar */}
      <ProgressBar />

      {/* Repeat progress indicator overlay */}
      {repeatIndicator && (
        <div className="absolute top-14 left-0 right-0 flex justify-center z-20 pointer-events-none">
          <div className="bg-white/10 backdrop-blur-md rounded-full px-4 py-1.5">
            <span className="text-white/80 text-xs font-medium">{repeatIndicator}</span>
          </div>
        </div>
      )}

      {/* Top overlay: video info — auto-hides after 3s */}
      <div
        className="absolute top-0 left-0 right-16 z-10 pointer-events-none pt-4 pl-4 pr-4 transition-opacity duration-700 ease-out"
        style={{ opacity: showOverlay ? 1 : 0 }}
      >
        {/* Video title */}
        <p className="text-white/90 font-semibold text-sm drop-shadow-md leading-snug line-clamp-1">
          {currentVideo.title}
        </p>

        {/* Series name + episode indicator */}
        {seriesInfo && (
          <p className="text-white/50 text-[11px] mt-0.5 leading-snug">
            {seriesInfo.title}
            {currentVideo.episodeNumber && (
              <span className="text-white/35 ml-1.5">
                {currentVideo.episodeNumber}/{seriesInfo.episodeCount}
              </span>
            )}
          </p>
        )}

        {/* Minimal metadata row */}
        <div className="flex gap-1.5 mt-1.5 items-center">
          <span className="text-white/40 text-[10px]">
            {categoryLabel}
          </span>
          <span className="text-white/20 text-[10px]">
            ·
          </span>
          <span className="text-white/40 text-[10px]">
            {currentVideo.clipEnd - currentVideo.clipStart}s
          </span>
          {!isPremium && (
            <>
              <span className="text-white/20 text-[10px]">·</span>
              <span className="text-white/30 text-[10px]">
                {FREE_DAILY_VIEW_LIMIT - getDailyViewsRemaining()}/{FREE_DAILY_VIEW_LIMIT}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Dot position indicators — always visible, very subtle */}
      {videos.length > 1 && videos.length <= 20 && (
        <div className="absolute top-5 right-3 z-10 pointer-events-none flex flex-col gap-[3px]">
          {videos.slice(0, Math.min(videos.length, 12)).map((_, idx) => (
            <div
              key={idx}
              className={`rounded-full transition-all duration-300 ${
                idx === currentIndex
                  ? 'w-[4px] h-[4px] bg-white/80'
                  : 'w-[3px] h-[3px] bg-white/20'
              }`}
            />
          ))}
          {videos.length > 12 && (
            <div className="w-[3px] h-[3px] bg-white/10 rounded-full" />
          )}
        </div>
      )}

      {/* Previous / Next video navigation buttons — right side */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-3">
        {currentIndex > 0 && (
          <button
            onClick={handlePrevVideo}
            className="w-9 h-9 flex items-center justify-center bg-white/10 backdrop-blur-sm rounded-full active:bg-white/20 transition-colors"
            aria-label="이전 영상"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-white/80">
              <path fillRule="evenodd" d="M9.47 6.47a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 1 1-1.06 1.06L10 8.06l-3.72 3.72a.75.75 0 0 1-1.06-1.06l4.25-4.25Z" clipRule="evenodd" />
            </svg>
          </button>
        )}
        {currentIndex < videos.length - 1 && (
          <button
            onClick={handleNextVideo}
            className="w-9 h-9 flex items-center justify-center bg-white/10 backdrop-blur-sm rounded-full active:bg-white/20 transition-colors"
            aria-label="다음 영상"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-white/80">
              <path fillRule="evenodd" d="M10.53 13.53a.75.75 0 0 1-1.06 0l-4.25-4.25a.75.75 0 0 1 1.06-1.06L10 11.94l3.72-3.72a.75.75 0 0 1 1.06 1.06l-4.25 4.25Z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>

      <SaveToast show={showToast} message="표현 저장됨" />

      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        trigger={premiumTrigger}
      />

      <AdminReportButton videoId={currentVideo.id} youtubeId={currentVideo.youtubeId} />
    </div>
  )
}
