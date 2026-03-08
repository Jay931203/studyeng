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
import { categories, type VideoData } from '@/data/seed-videos'

interface VideoFeedProps {
  videos: VideoData[]
}

export function VideoFeed({ videos }: VideoFeedProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const [showToast, setShowToast] = useState(false)
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [premiumTrigger, setPremiumTrigger] = useState<'video-limit' | 'subtitle' | 'phrase-limit'>('video-limit')
  const constraintsRef = useRef(null)
  const savePhrase = usePhraseStore((s) => s.savePhrase)
  const markWatched = useWatchHistoryStore((s) => s.markWatched)
  const incrementViewCount = useWatchHistoryStore((s) => s.incrementViewCount)
  const getViewCount = useWatchHistoryStore((s) => s.getViewCount)
  const isWatchedFn = useWatchHistoryStore((s) => s.isWatched)
  const isPremium = usePremiumStore((s) => s.isPremium)
  const incrementDailyView = usePremiumStore((s) => s.incrementDailyView)
  const getDailyViewsRemaining = usePremiumStore((s) => s.getDailyViewsRemaining)
  const canSaveMorePhrases = usePremiumStore((s) => s.canSaveMorePhrases)
  const incrementSavedPhrases = usePremiumStore((s) => s.incrementSavedPhrases)
  const gainXp = useUserStore((s) => s.gainXp)
  const checkAndUpdateStreak = useUserStore((s) => s.checkAndUpdateStreak)
  const incrementMission = useDailyMissionStore((s) => s.incrementMission)
  const repeatMode = usePlayerStore((s) => s.repeatMode)
  const currentRepeatCount = usePlayerStore((s) => s.currentRepeatCount)
  const incrementRepeatCount = usePlayerStore((s) => s.incrementRepeatCount)
  const resetRepeatCount = usePlayerStore((s) => s.resetRepeatCount)
  const setIsSwiping = usePlayerStore((s) => s.setIsSwiping)

  // Track which videos have already awarded XP this session (prevents re-awarding on re-watch)
  const xpAwardedRef = useRef<Set<string>>(new Set())

  // Brief overlay indicator for repeat progress
  const [repeatIndicator, setRepeatIndicator] = useState<string | null>(null)
  const repeatIndicatorTimerRef = useRef<number | null>(null)

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

  // Handle clip completion for repeat mode auto-advance + XP/streak rewards
  const handleClipComplete = useCallback(() => {
    // Award XP and update streak on first completion of each video this session
    const currentVideo = videos[currentIndex]
    if (currentVideo && !xpAwardedRef.current.has(currentVideo.id)) {
      xpAwardedRef.current.add(currentVideo.id)
      gainXp(5)
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
  }, [repeatMode, currentRepeatCount, currentIndex, videos, gainXp, checkAndUpdateStreak, incrementMission, incrementRepeatCount, resetRepeatCount, incrementDailyView])

  const swipeThreshold = 50

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const { offset, velocity } = info

      if (offset.y < -swipeThreshold || velocity.y < -500) {
        if (currentIndex < videos.length - 1) {
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
        }
      } else if (offset.y > swipeThreshold || velocity.y > 500) {
        if (currentIndex > 0) {
          resetRepeatCount()
          setDirection(-1)
          setCurrentIndex((prev) => prev - 1)
        }
      }
    },
    [currentIndex, videos.length, incrementDailyView, resetRepeatCount]
  )

  const currentVideo = videos[currentIndex]
  if (!currentVideo) return null

  const categoryLabel = categories.find(c => c.id === currentVideo.category)?.label ?? currentVideo.category

  return (
    <div ref={constraintsRef} className="relative w-full h-full overflow-hidden">
      <AnimatePresence custom={direction}>
        <motion.div
          key={currentVideo.id}
          custom={direction}
          initial={direction === 0 ? false : { y: direction > 0 ? '100%' : '-100%' }}
          animate={{ y: 0 }}
          exit={{ y: direction > 0 ? '-100%' : '100%' }}
          transition={{ type: 'tween', duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.2}
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

          {/* Gradient overlay for top text readability */}
          <div className="absolute top-0 left-0 right-0 h-[120px] bg-gradient-to-b from-black/60 to-transparent pointer-events-none z-[5]" />
        </motion.div>
      </AnimatePresence>

      {/* Progress bar - YouTube Shorts style */}
      <ProgressBar />

      {/* Repeat progress indicator overlay */}
      {repeatIndicator && (
        <div className="absolute top-16 left-0 right-0 flex justify-center z-20 pointer-events-none">
          <div className="bg-purple-500/80 backdrop-blur-sm rounded-full px-4 py-1.5 animate-pulse">
            <span className="text-white text-sm font-medium">{repeatIndicator}</span>
          </div>
        </div>
      )}

      {/* Top area: counter + video info */}
      <div className="absolute top-4 left-4 right-4 z-10 pointer-events-none">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/50 text-xs">
            {currentIndex + 1} / {videos.length}
            {!isPremium && (
              <span className="text-white/40 text-xs ml-2 bg-white/10 px-2 py-0.5 rounded-full">
                오늘 {FREE_DAILY_VIEW_LIMIT - getDailyViewsRemaining()}/{FREE_DAILY_VIEW_LIMIT} 영상
              </span>
            )}
          </span>
          {currentIndex === 0 && currentVideo.seriesId && !isWatchedFn(currentVideo.seriesId, currentVideo.id) && (
            <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-medium px-3 py-1 rounded-full shadow-lg">
              오늘의 추천
            </span>
          )}
        </div>
        <p className="text-white font-bold text-base drop-shadow-lg">
          {currentVideo.title}
        </p>
        <div className="flex gap-2 mt-1 items-center">
          <span className="text-white/70 text-xs bg-white/10 px-2 py-0.5 rounded-full">
            {categoryLabel}
          </span>
          <span className="text-white/70 text-xs bg-white/10 px-2 py-0.5 rounded-full">
            {'★'.repeat(currentVideo.difficulty)}
          </span>
          <span className="text-white/70 text-xs bg-white/10 px-2 py-0.5 rounded-full">
            {currentVideo.clipEnd - currentVideo.clipStart}초
          </span>
          {getViewCount(currentVideo.id) > 1 && (
            <span className="text-white/70 text-xs bg-white/10 px-2 py-0.5 rounded-full">
              x{getViewCount(currentVideo.id)}
            </span>
          )}
        </div>
      </div>

      <SaveToast show={showToast} message="표현이 저장됐어요!" />

      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        trigger={premiumTrigger}
      />
    </div>
  )
}
