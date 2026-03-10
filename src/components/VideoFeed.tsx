'use client'

import { AnimatePresence, motion, type PanInfo } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { series as allSeries, type VideoData } from '@/data/seed-videos'
import { useViewportLayout } from '@/hooks/useOrientation'
import { getCatalogVideosBySeries } from '@/lib/catalog'
import { readEmbedBlockedVideoIds, writeEmbedBlockedVideoIds } from '@/lib/embedBlocklist'
import { buildShortsUrl } from '@/lib/videoRoutes'
import { useDailyMissionStore } from '@/stores/useDailyMissionStore'
import { usePhraseStore } from '@/stores/usePhraseStore'
import { usePlayerStore } from '@/stores/usePlayerStore'
import { usePremiumStore } from '@/stores/usePremiumStore'
import { useRecommendationStore } from '@/stores/useRecommendationStore'
import { useUserStore } from '@/stores/useUserStore'
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore'
import { AdminReportButton } from './AdminReportButton'
import { FeedToggle } from './FeedToggle'
import { FloatingRemote } from './FloatingRemote'
import { PremiumModal } from './PremiumModal'
import { UnifiedControls } from './UnifiedControls'
import { VideoPlayer } from './VideoPlayer'

interface VideoFeedProps {
  videos: VideoData[]
  initialVideoId?: string
  initialSeekTime?: number
  initialReviewPhraseId?: string
  feedMode?: 'clips' | 'shorts'
  onFeedModeChange?: (mode: 'clips' | 'shorts') => void
}

interface ShuffleNavigationState {
  history: number[]
  pointer: number
}

interface SequenceNavigationTarget {
  feedIndex: number
  video: VideoData
}

export function VideoFeed({
  videos,
  initialVideoId,
  initialSeekTime,
  initialReviewPhraseId,
  feedMode,
  onFeedModeChange,
}: VideoFeedProps) {
  const router = useRouter()
  const {
    isLandscapeViewport,
    isCompactViewport,
    useLandscapeSplitPlayer: autoLandscapeSplitPlayer,
    landscapeVideoPaneWidthPercent,
    landscapeBottomSubtitleHeight,
  } = useViewportLayout()
  const landscapeSubtitleLayout = usePlayerStore((state) => state.landscapeSubtitleLayout)
  const useLandscapeSplitPlayer =
    landscapeSubtitleLayout === 'side'
      ? isLandscapeViewport
      : landscapeSubtitleLayout === 'bottom'
        ? false
        : autoLandscapeSplitPlayer
  const landscapeVideoPaneWidth = `${landscapeVideoPaneWidthPercent}%`
  const landscapeOverlayWidth = `calc(${landscapeVideoPaneWidth} - 24px)`
  const landscapeProgressMarkerOffset = `calc(${landscapeVideoPaneWidth} - 16px)`
  const overlayInsetLeft = 'max(12px, calc(env(safe-area-inset-left, 0px) + 8px))'
  const overlayInsetRight = 'max(12px, calc(env(safe-area-inset-right, 0px) + 8px))'
  const overlayInsetTop = 'max(12px, calc(env(safe-area-inset-top, 0px) + 8px))'
  const repeatIndicatorTop = `calc(${overlayInsetTop} + 44px)`
  const seriesPanelTop = `calc(${overlayInsetTop} + 56px)`
  const feedToggleBottom = isLandscapeViewport
    ? 'max(16px, calc(env(safe-area-inset-bottom, 0px) + 12px))'
    : 'max(88px, calc(env(safe-area-inset-bottom, 0px) + 78px))'
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
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [showSeriesEpisodes, setShowSeriesEpisodes] = useState(false)
  const [premiumTrigger, setPremiumTrigger] = useState<'video-limit' | 'phrase-limit'>(
    'video-limit',
  )
  const [repeatIndicator, setRepeatIndicator] = useState<string | null>(null)
  const [shuffleNavigation, setShuffleNavigation] = useState<ShuffleNavigationState>(() => ({
    history: [currentIndex],
    pointer: 0,
  }))

  const repeatIndicatorTimerRef = useRef<number | null>(null)
  const initialReviewMarkedRef = useRef(false)
  const awardedRef = useRef<Set<string>>(new Set())
  const playbackMetricsRef = useRef({ currentTime: 0, clipStart: 0, clipEnd: 0 })
  const engagementRef = useRef<{ finalized: boolean; videoId: string | null }>({
    finalized: false,
    videoId: null,
  })
  const currentVideoId = videos[currentIndex]?.id

  const savePhrase = usePhraseStore((state) => state.savePhrase)
  const incrementReview = usePhraseStore((state) => state.incrementReview)
  const markWatched = useWatchHistoryStore((state) => state.markWatched)
  const recordCompletion = useWatchHistoryStore((state) => state.recordCompletion)
  const incrementViewCount = useWatchHistoryStore((state) => state.incrementViewCount)
  const getViewCount = useWatchHistoryStore((state) => state.getViewCount)
  const currentVideoViewCount = useWatchHistoryStore((state) =>
    currentVideoId ? (state.viewCounts[currentVideoId] ?? 0) : 0,
  )
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
  const playbackOrderMode = usePlayerStore((state) => state.playbackOrderMode)
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

  const getRandomPlayableIndex = useCallback(
    (excludeIndex: number) => {
      const candidates: number[] = []

      for (let index = 0; index < videos.length; index += 1) {
        if (index === excludeIndex) continue
        if (embedBlockedIdSet.has(videos[index].id)) continue
        candidates.push(index)
      }

      if (candidates.length === 0) {
        return -1
      }

      return candidates[Math.floor(Math.random() * candidates.length)]
    },
    [embedBlockedIdSet, videos],
  )

  const activeShuffleNavigation = useMemo<ShuffleNavigationState>(() => {
    if (shuffleNavigation.history.length === 0) {
      return { history: [currentIndex], pointer: 0 }
    }

    if (shuffleNavigation.history[shuffleNavigation.pointer] === currentIndex) {
      return shuffleNavigation
    }

    const history = shuffleNavigation.history.slice(0, shuffleNavigation.pointer + 1)
    history.push(currentIndex)
    return {
      history,
      pointer: history.length - 1,
    }
  }, [currentIndex, shuffleNavigation])

  const findPlayableHistoryEntry = useCallback(
    (startPointer: number, step: 1 | -1) => {
      for (
        let pointer = startPointer;
        pointer >= 0 && pointer < activeShuffleNavigation.history.length;
        pointer += step
      ) {
        const index = activeShuffleNavigation.history[pointer]
        const video = videos[index]
        if (video && !embedBlockedIdSet.has(video.id)) {
          return { historyPointer: pointer, videoIndex: index }
        }
      }

      return null
    },
    [activeShuffleNavigation.history, embedBlockedIdSet, videos],
  )

  const canOpenVideo = useCallback(
    (nextVideo: VideoData | undefined) => {
      if (!nextVideo) return false

      const alreadyWatched = getViewCount(nextVideo.id) > 0
      if (alreadyWatched) return true

      const allowed = incrementDailyView()
      if (!allowed) {
        setPremiumTrigger('video-limit')
        setShowPremiumModal(true)
        return false
      }

      return true
    },
    [getViewCount, incrementDailyView],
  )

  const findSeriesNavigationTarget = useCallback(
    (step: 1 | -1): SequenceNavigationTarget | null => {
      if (!currentVideo?.seriesId) return null

      const currentSeriesIndex = seriesEpisodes.findIndex((video) => video.id === currentVideo.id)
      if (currentSeriesIndex < 0) return null

      for (
        let seriesIndex = currentSeriesIndex + step;
        seriesIndex >= 0 && seriesIndex < seriesEpisodes.length;
        seriesIndex += step
      ) {
        const candidate = seriesEpisodes[seriesIndex]
        if (embedBlockedIdSet.has(candidate.id)) continue

        return {
          feedIndex: videos.findIndex((video) => video.id === candidate.id),
          video: candidate,
        }
      }

      return null
    },
    [currentVideo, embedBlockedIdSet, seriesEpisodes, videos],
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
        if (playbackOrderMode === 'shuffle') {
          const nextHistory = activeShuffleNavigation.history.slice(
            0,
            activeShuffleNavigation.pointer + 1,
          )
          nextHistory.push(forwardIndex)
          setShuffleNavigation({
            history: nextHistory,
            pointer: nextHistory.length - 1,
          })
        }
        setDirection(1)
        setCurrentIndex(forwardIndex)
      }, 0)
      return () => clearTimeout(timer)
    }

    const backwardIndex = findPlayableIndex(currentIndex - 1, -1)
    if (backwardIndex >= 0) {
      const timer = window.setTimeout(() => {
        if (playbackOrderMode === 'shuffle') {
          const nextHistory = activeShuffleNavigation.history.slice(
            0,
            activeShuffleNavigation.pointer + 1,
          )
          nextHistory.push(backwardIndex)
          setShuffleNavigation({
            history: nextHistory,
            pointer: nextHistory.length - 1,
          })
        }
        setDirection(-1)
        setCurrentIndex(backwardIndex)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [
    activeShuffleNavigation.history,
    activeShuffleNavigation.pointer,
    currentIndex,
    currentVideo,
    embedBlockedIdSet,
    findPlayableIndex,
    playbackOrderMode,
  ])

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
      if (repeatIndicatorTimerRef.current) {
        clearTimeout(repeatIndicatorTimerRef.current)
      }
    }
  }, [])

  const showRepeatProgress = useCallback((count: number, targetCount: number) => {
    setRepeatIndicator(`REPEAT ${count}/${targetCount}`)

    if (repeatIndicatorTimerRef.current) {
      clearTimeout(repeatIndicatorTimerRef.current)
    }

    repeatIndicatorTimerRef.current = window.setTimeout(() => {
      setRepeatIndicator(null)
    }, 1500)
  }, [])

  const moveToNextVideo = useCallback(() => {
    let nextPlayableIndex = -1
    let nextHistoryPointer: number | null = null
    let nextRouteVideo: VideoData | null = null
    let shouldCheckViewLimit = true

    if (playbackOrderMode === 'shuffle') {
      const forwardHistoryEntry = findPlayableHistoryEntry(activeShuffleNavigation.pointer + 1, 1)
      if (forwardHistoryEntry) {
        nextPlayableIndex = forwardHistoryEntry.videoIndex
        nextHistoryPointer = forwardHistoryEntry.historyPointer
        shouldCheckViewLimit = false
      } else {
        nextPlayableIndex = getRandomPlayableIndex(currentIndex)
      }
    } else {
      const seriesTarget = findSeriesNavigationTarget(1)
      if (seriesTarget) {
        nextPlayableIndex = seriesTarget.feedIndex
        nextRouteVideo = seriesTarget.feedIndex >= 0 ? null : seriesTarget.video
      } else {
        nextPlayableIndex = findPlayableIndex(currentIndex + 1, 1)
      }
    }

    if (nextPlayableIndex < 0 && !nextRouteVideo) {
      resetRepeatCount()
      return false
    }

    if (shouldCheckViewLimit && !canOpenVideo(nextRouteVideo ?? videos[nextPlayableIndex])) {
      return false
    }

    if (currentVideo) {
      finalizeVideoSession(currentVideo.id, false)
    }

    if (playbackOrderMode === 'shuffle') {
      if (typeof nextHistoryPointer === 'number') {
        setShuffleNavigation({
          history: activeShuffleNavigation.history,
          pointer: nextHistoryPointer,
        })
      } else {
        const nextHistory = activeShuffleNavigation.history.slice(
          0,
          activeShuffleNavigation.pointer + 1,
        )
        nextHistory.push(nextPlayableIndex)
        setShuffleNavigation({
          history: nextHistory,
          pointer: nextHistory.length - 1,
        })
      }
    }

    resetRepeatCount()

    if (nextRouteVideo) {
      router.push(buildShortsUrl(nextRouteVideo.id, nextRouteVideo.seriesId), { scroll: false })
      return true
    }

    setDirection(1)
    setCurrentIndex(nextPlayableIndex)
    return true
  }, [
    activeShuffleNavigation.history,
    activeShuffleNavigation.pointer,
    canOpenVideo,
    currentIndex,
    currentVideo,
    findPlayableHistoryEntry,
    findPlayableIndex,
    findSeriesNavigationTarget,
    finalizeVideoSession,
    getRandomPlayableIndex,
    playbackOrderMode,
    resetRepeatCount,
    router,
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
    let previousPlayableIndex = -1
    let previousHistoryPointer: number | null = null
    let previousRouteVideo: VideoData | null = null

    if (playbackOrderMode === 'shuffle') {
      const previousHistoryEntry = findPlayableHistoryEntry(activeShuffleNavigation.pointer - 1, -1)
      if (!previousHistoryEntry) return
      previousPlayableIndex = previousHistoryEntry.videoIndex
      previousHistoryPointer = previousHistoryEntry.historyPointer
    } else {
      const seriesTarget = findSeriesNavigationTarget(-1)
      if (seriesTarget) {
        previousPlayableIndex = seriesTarget.feedIndex
        previousRouteVideo = seriesTarget.feedIndex >= 0 ? null : seriesTarget.video
      } else {
        previousPlayableIndex = findPlayableIndex(currentIndex - 1, -1)
        if (previousPlayableIndex < 0) return
      }
    }

    if (currentVideo) {
      finalizeVideoSession(currentVideo.id, false)
    }

    if (typeof previousHistoryPointer === 'number') {
      setShuffleNavigation({
        history: activeShuffleNavigation.history,
        pointer: previousHistoryPointer,
      })
    }

    resetRepeatCount()

    if (previousRouteVideo) {
      router.push(buildShortsUrl(previousRouteVideo.id, previousRouteVideo.seriesId), {
        scroll: false,
      })
      return
    }

    setDirection(-1)
    setCurrentIndex(previousPlayableIndex)
  }, [
    activeShuffleNavigation.history,
    activeShuffleNavigation.pointer,
    currentIndex,
    currentVideo,
    findPlayableHistoryEntry,
    finalizeVideoSession,
    findPlayableIndex,
    findSeriesNavigationTarget,
    playbackOrderMode,
    resetRepeatCount,
    router,
  ])

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

  const hasAlternativePlayableVideo = videos.some(
    (video, index) => index !== currentIndex && !embedBlockedIdSet.has(video.id),
  )
  const canGoPrev =
    playbackOrderMode === 'shuffle'
      ? findPlayableHistoryEntry(activeShuffleNavigation.pointer - 1, -1) !== null
      : findSeriesNavigationTarget(-1) !== null || findPlayableIndex(currentIndex - 1, -1) >= 0
  const canGoNext =
    playbackOrderMode === 'shuffle'
      ? findPlayableHistoryEntry(activeShuffleNavigation.pointer + 1, 1) !== null ||
        hasAlternativePlayableVideo
      : findSeriesNavigationTarget(1) !== null || findPlayableIndex(currentIndex + 1, 1) >= 0
  const showHeaderHomeButton = isLandscapeViewport

  const seriesInfo = currentVideo.seriesId
    ? allSeries.find((series) => series.id === currentVideo.seriesId)
    : null
  const currentVideoMetaLabel =
    seriesInfo && currentVideo.episodeNumber != null
      ? `EPISODE ${currentVideo.episodeNumber}`
      : 'NOW PLAYING'

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
          {showSeriesEpisodes && (
            <button
              type="button"
              aria-label="Close series list"
              onClick={() => setShowSeriesEpisodes(false)}
              className="absolute inset-0 z-[9] cursor-default"
            />
          )}

          <VideoPlayer
            videoId={currentVideo.id}
            youtubeId={currentVideo.youtubeId}
            subtitles={currentVideo.subtitles}
            clipStart={currentVideo.clipStart}
            clipEnd={currentVideo.clipEnd}
            format={currentVideo.format}
            isLandscapeViewport={isLandscapeViewport}
            useLandscapeSplitLayout={useLandscapeSplitPlayer}
            landscapeVideoPaneWidth={landscapeVideoPaneWidth}
            landscapeBottomSubtitleHeight={landscapeBottomSubtitleHeight}
            onClipComplete={handleClipComplete}
            onVideoErrorSkip={canGoNext ? handleNextVideo : undefined}
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
            }}
          />

          <div
            className="absolute z-10 flex min-w-0 items-center gap-2 rounded-[22px] border px-2.5 py-2 backdrop-blur-md sm:gap-3 sm:px-3"
            style={{
              backgroundColor: 'var(--player-control-bg)',
              borderColor: 'var(--player-control-border)',
              left: overlayInsetLeft,
              right: overlayInsetRight,
              top: overlayInsetTop,
              ...(useLandscapeSplitPlayer
                ? {
                    right: 'auto',
                    width: landscapeOverlayWidth,
                  }
                : {}),
            }}
          >
            {showHeaderHomeButton && (
              <>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    router.push('/explore')
                  }}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors sm:h-9 sm:w-9"
                  style={{
                    backgroundColor: 'var(--player-panel)',
                    color: 'var(--player-text)',
                  }}
                  aria-label="Go home"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                  >
                    <path d="M12 3.845a1.5 1.5 0 0 1 2.121 0l6.034 6.034a1.5 1.5 0 0 1-2.121 2.121l-.534-.533V18.75A2.25 2.25 0 0 1 15.25 21h-6.5A2.25 2.25 0 0 1 6.5 18.75v-7.283l-.533.533A1.5 1.5 0 0 1 3.845 9.88l6.034-6.034A1.5 1.5 0 0 1 12 3.845Z" />
                  </svg>
                </button>
                <div
                  className="h-3.5 w-px shrink-0 sm:h-4"
                  style={{ backgroundColor: 'var(--player-divider)' }}
                />
              </>
            )}

            <div className="min-w-0 flex-1">
              {seriesInfo ? (
                <button
                  onClick={() => setShowSeriesEpisodes((current) => !current)}
                  className="block w-full truncate text-left text-[13px] font-semibold sm:text-sm"
                  style={{ color: 'var(--player-text)' }}
                >
                  {seriesInfo.title}
                </button>
              ) : (
                <span
                  className="block w-full truncate text-[13px] font-semibold sm:text-sm"
                  style={{ color: 'var(--player-text)' }}
                >
                  {currentVideo.title}
                </span>
              )}
              <div
                className="mt-0.5 flex min-w-0 items-center gap-1 text-[10px] sm:text-[11px]"
                style={{ color: 'var(--player-muted)' }}
              >
                <span className="truncate">{currentVideoMetaLabel}</span>
                {currentVideoViewCount > 0 && (
                  <span
                    className="shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold leading-none sm:text-[10px]"
                    style={{
                      backgroundColor: 'var(--player-panel)',
                      borderColor: 'var(--player-control-border)',
                      color: 'var(--player-text)',
                    }}
                  >
                    x{currentVideoViewCount}
                  </span>
                )}
              </div>
            </div>

            <div
              className="h-3.5 w-px shrink-0 sm:h-4"
              style={{ backgroundColor: 'var(--player-divider)' }}
            />

            <div className="min-w-0 max-w-full flex-shrink overflow-x-auto overflow-y-visible no-scrollbar">
              <UnifiedControls
                videoId={currentVideo.id}
                youtubeId={currentVideo.youtubeId}
                videoTitle={currentVideo.title}
                compact={isCompactViewport}
                className="inline-flex min-w-max items-center gap-0.5"
              />
            </div>
          </div>
          {seriesInfo && showSeriesEpisodes && seriesEpisodes.length > 0 && (
            <div
              className="absolute z-10 overflow-x-auto rounded-[22px] border px-3 py-3 backdrop-blur-md"
              style={{
                backgroundColor: 'var(--player-control-bg)',
                borderColor: 'var(--player-control-border)',
                left: overlayInsetLeft,
                right: overlayInsetRight,
                top: seriesPanelTop,
                ...(useLandscapeSplitPlayer
                  ? {
                      right: 'auto',
                      width: landscapeOverlayWidth,
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
                        setShowSeriesEpisodes(false)
                        const nextIndex = videos.findIndex((video) => video.id === episode.id)
                        if (nextIndex >= 0) {
                          if (playbackOrderMode === 'shuffle') {
                            const nextHistory = activeShuffleNavigation.history.slice(
                              0,
                              activeShuffleNavigation.pointer + 1,
                            )
                            nextHistory.push(nextIndex)
                            setShuffleNavigation({
                              history: nextHistory,
                              pointer: nextHistory.length - 1,
                            })
                          }
                          setDirection(nextIndex > currentIndex ? 1 : -1)
                          setCurrentIndex(nextIndex)
                        } else {
                          router.push(buildShortsUrl(episode.id, seriesInfo.id), { scroll: false })
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
              useLandscapeSplitPlayer ? 'left-0' : 'left-0 right-0'
            }`}
            style={{
              ...(useLandscapeSplitPlayer ? { width: landscapeVideoPaneWidth } : {}),
              background:
                'linear-gradient(to bottom, var(--player-gradient-strong), var(--player-gradient-soft), transparent)',
            }}
          />
        </motion.div>
      </AnimatePresence>

      {feedMode && onFeedModeChange && (
        <FeedToggle
          mode={feedMode}
          onChange={onFeedModeChange}
          bottomOffset={feedToggleBottom}
        />
      )}

      <FloatingRemote
        onPrevVideo={canGoPrev ? handlePrevVideo : undefined}
        onNextVideo={canGoNext ? handleNextVideo : undefined}
        onToggleFreeze={onToggleFreeze}
      />

      {repeatIndicator && (
        <div
          className="pointer-events-none absolute left-0 right-0 z-20 flex justify-center"
          style={{ top: repeatIndicatorTop }}
        >
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
          className="pointer-events-none absolute z-10 flex flex-col gap-[3px]"
          style={
            useLandscapeSplitPlayer
              ? {
                  left: landscapeProgressMarkerOffset,
                  top: `calc(${overlayInsetTop} + 8px)`,
                }
              : {
                  right: overlayInsetRight,
                  top: `calc(${overlayInsetTop} + 8px)`,
                }
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

      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        trigger={premiumTrigger}
      />

      <AdminReportButton videoId={currentVideo.id} youtubeId={currentVideo.youtubeId} />
    </div>
  )
}
