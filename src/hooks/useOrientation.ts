'use client'

import { useSyncExternalStore } from 'react'

const LANDSCAPE_MEDIA_QUERY = '(orientation: landscape)'
const EMPTY_SNAPSHOT = '0:0:0:0'
const COMPACT_VIEWPORT_MAX_WIDTH = 1180
const COMPACT_VIEWPORT_MAX_HEIGHT = 900
const SHORT_LANDSCAPE_MAX_HEIGHT = 560
const COMPACT_LANDSCAPE_VIDEO_PANE_WIDTH = 62
const WIDE_LANDSCAPE_VIDEO_PANE_WIDTH = 66
const LANDSCAPE_BOTTOM_SUBTITLE_HEIGHT = 208
const PLAYER_PROGRESS_AREA_HEIGHT = 52
const SPLIT_DIVIDER_WIDTH = 1
const MIN_SPLIT_SUBTITLE_WIDTH = 360
const MIN_SPLIT_VIDEO_GAIN_RATIO = 1.15
const YOUTUBE_VIDEO_ASPECT_RATIO = 16 / 9

function subscribe(listener: () => void) {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => {}
  }

  const mediaQuery = window.matchMedia(LANDSCAPE_MEDIA_QUERY)
  const handleChange = () => listener()
  const handleResize = () => listener()

  window.addEventListener('resize', handleResize)

  if (typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', handleChange)
    return () => {
      mediaQuery.removeEventListener('change', handleChange)
      window.removeEventListener('resize', handleResize)
    }
  }

  mediaQuery.addListener(handleChange)
  return () => {
    mediaQuery.removeListener(handleChange)
    window.removeEventListener('resize', handleResize)
  }
}

function getSnapshot() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return EMPTY_SNAPSHOT
  }

  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const isLandscapeViewport = window.matchMedia(LANDSCAPE_MEDIA_QUERY).matches
  const isCompactViewport =
    viewportWidth <= COMPACT_VIEWPORT_MAX_WIDTH ||
    viewportHeight <= COMPACT_VIEWPORT_MAX_HEIGHT

  return `${isLandscapeViewport ? 1 : 0}:${isCompactViewport ? 1 : 0}:${viewportWidth}:${viewportHeight}`
}

function getContainedVideoArea(containerWidth: number, containerHeight: number) {
  if (containerWidth <= 0 || containerHeight <= 0) {
    return 0
  }

  const widthFromHeight = containerHeight * YOUTUBE_VIDEO_ASPECT_RATIO
  if (widthFromHeight <= containerWidth) {
    return widthFromHeight * containerHeight
  }

  const heightFromWidth = containerWidth / YOUTUBE_VIDEO_ASPECT_RATIO
  return containerWidth * heightFromWidth
}

/**
 * Distinguishes raw viewport orientation from layout decisions.
 *
 * On SSR, defaults to portrait because the server cannot know
 * the client's current orientation.
 */
export function useViewportLayout() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY_SNAPSHOT)
  const [
    isLandscapeViewportValue = '0',
    isCompactViewportValue = '0',
    viewportWidthValue = '0',
    viewportHeightValue = '0',
  ] = snapshot.split(':')
  const isLandscapeViewport = isLandscapeViewportValue === '1'
  const isCompactViewport = isCompactViewportValue === '1'
  const viewportWidth = Number(viewportWidthValue) || 0
  const viewportHeight = Number(viewportHeightValue) || 0
  const isShortLandscapeViewport =
    isLandscapeViewport && viewportHeight > 0 && viewportHeight <= SHORT_LANDSCAPE_MAX_HEIGHT
  const landscapeVideoPaneWidthPercent = isShortLandscapeViewport
    ? COMPACT_LANDSCAPE_VIDEO_PANE_WIDTH
    : WIDE_LANDSCAPE_VIDEO_PANE_WIDTH
  const splitVideoPaneWidth = viewportWidth * (landscapeVideoPaneWidthPercent / 100)
  const splitSubtitlePaneWidth = Math.max(
    viewportWidth - splitVideoPaneWidth - SPLIT_DIVIDER_WIDTH,
    0,
  )
  const splitVideoArea = getContainedVideoArea(splitVideoPaneWidth, viewportHeight)
  const stackedVideoHeight = Math.max(
    viewportHeight - LANDSCAPE_BOTTOM_SUBTITLE_HEIGHT - PLAYER_PROGRESS_AREA_HEIGHT,
    0,
  )
  const stackedVideoArea = getContainedVideoArea(viewportWidth, stackedVideoHeight)
  const useLandscapeSplitPlayer =
    isShortLandscapeViewport ||
    (isLandscapeViewport &&
      splitSubtitlePaneWidth >= MIN_SPLIT_SUBTITLE_WIDTH &&
      splitVideoArea >= stackedVideoArea * MIN_SPLIT_VIDEO_GAIN_RATIO)

  return {
    isLandscapeViewport,
    isCompactViewport,
    useLandscapeSplitPlayer,
    showLandscapeRail: isShortLandscapeViewport && isCompactViewport,
    landscapeVideoPaneWidthPercent,
  }
}
