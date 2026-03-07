'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { usePlayerStore } from '@/stores/usePlayerStore'
import { useLikeStore } from '@/stores/useLikeStore'
import { SaveToast } from './SaveToast'

const SPEEDS = [0.75, 1.0, 1.25, 1.5]
const REPEAT_CYCLE = ['off', 'x2', 'x3'] as const

interface UnifiedControlsProps {
  videoId?: string
  videoTitle?: string
}

export function UnifiedControls({ videoId, videoTitle }: UnifiedControlsProps) {
  const {
    subtitleMode,
    toggleSubtitleMode,
    playbackRate,
    setPlaybackRate,
    repeatMode,
    setRepeatMode,
    isLooping,
    clearLoop,
  } = usePlayerStore()

  const { toggleLike, isLiked } = useLikeStore()
  const liked = videoId ? isLiked(videoId) : false

  const [showToast, setShowToast] = useState(false)

  const handleShare = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation()
      if (!videoId) return
      const shareUrl = `https://studyeng-nine.vercel.app/?v=${videoId}`

      if (typeof navigator !== 'undefined' && navigator.share) {
        try {
          await navigator.share({
            title: videoTitle ?? 'StudyEng',
            text: videoTitle
              ? `${videoTitle} - StudyEng에서 영어 배우기`
              : 'StudyEng에서 영어 배우기',
            url: shareUrl,
          })
          return
        } catch {
          // User cancelled or share failed — fall through to clipboard
        }
      }

      try {
        await navigator.clipboard.writeText(shareUrl)
      } catch {
        const textarea = document.createElement('textarea')
        textarea.value = shareUrl
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      setShowToast(true)
      setTimeout(() => setShowToast(false), 2000)
    },
    [videoId, videoTitle]
  )

  const subtitleLabel =
    subtitleMode === 'none' ? 'Off' : subtitleMode === 'en' ? 'En' : 'En/Ko'

  const speedLabel = playbackRate === 1 ? '1x' : `${playbackRate}x`
  const speedActive = playbackRate !== 1.0

  const repeatActive = repeatMode !== 'off'
  const repeatLabel =
    repeatMode === 'off' ? '1x' : repeatMode === 'x2' ? '2x' : '3x'

  return (
    <>
      <div className="absolute top-3 right-3 z-10 flex items-center gap-0.5 bg-black/40 backdrop-blur-md rounded-full px-1.5 py-1">
        {/* Subtitle mode toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            toggleSubtitleMode()
          }}
          className="w-auto min-w-[32px] h-8 px-2 flex items-center justify-center rounded-full text-[11px] font-semibold text-white hover:bg-white/10 transition-colors"
          aria-label="자막 모드"
        >
          {subtitleLabel}
        </button>

        {/* Divider */}
        <div className="w-px h-4 bg-white/20 shrink-0" />

        {/* Like / Heart */}
        {videoId && (
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={(e) => {
              e.stopPropagation()
              toggleLike(videoId)
            }}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            aria-label={liked ? '좋아요 취소' : '좋아요'}
          >
            <motion.svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill={liked ? '#EF4444' : 'none'}
              stroke={liked ? '#EF4444' : 'white'}
              strokeWidth={2}
              className="w-4 h-4"
              animate={liked ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
              />
            </motion.svg>
          </motion.button>
        )}

        {/* Speed */}
        <button
          onPointerUp={(e) => {
            e.stopPropagation()
            const idx = SPEEDS.indexOf(playbackRate)
            const next = SPEEDS[(idx + 1) % SPEEDS.length]
            setPlaybackRate(next)
          }}
          className={`w-auto min-w-[32px] h-8 px-1.5 flex items-center justify-center rounded-full text-[11px] font-bold transition-colors ${
            speedActive ? 'text-blue-400' : 'text-white'
          } hover:bg-white/10`}
          aria-label="재생 속도"
        >
          {speedLabel}
        </button>

        {/* Repeat */}
        <button
          onPointerUp={(e) => {
            e.stopPropagation()
            const idx = REPEAT_CYCLE.indexOf(repeatMode)
            const next = REPEAT_CYCLE[(idx + 1) % REPEAT_CYCLE.length]
            setRepeatMode(next)
          }}
          className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
            repeatActive ? 'text-purple-400' : 'text-white'
          } hover:bg-white/10`}
          title="반복 재생"
          aria-label="반복 재생"
        >
          <div className="flex flex-col items-center leading-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-3.5 h-3.5"
            >
              <path d="M4.755 10.059a7.5 7.5 0 0112.548-3.364l1.903 1.903H14.25a.75.75 0 000 1.5h6a.75.75 0 00.75-.75v-6a.75.75 0 00-1.5 0v3.068l-1.903-1.903A9 9 0 003.306 9.67a.75.75 0 101.45.388zm14.49 3.882a7.5 7.5 0 01-12.548 3.364l-1.903-1.903H9.75a.75.75 0 000-1.5h-6a.75.75 0 00-.75.75v6a.75.75 0 001.5 0v-3.068l1.903 1.903A9 9 0 0020.694 14.33a.75.75 0 10-1.45-.388z" />
            </svg>
            <span className="text-[8px] font-bold mt-px">{repeatLabel}</span>
          </div>
        </button>

        {/* Clear loop indicator / button */}
        {isLooping && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              clearLoop()
            }}
            className="w-8 h-8 flex items-center justify-center rounded-full text-blue-400 hover:bg-white/10 transition-colors"
            aria-label="구간 반복 해제"
            title="구간 반복 해제"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="w-3.5 h-3.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Divider */}
        <div className="w-px h-4 bg-white/20 shrink-0" />

        {/* Share */}
        {videoId && (
          <button
            onClick={handleShare}
            className="w-8 h-8 flex items-center justify-center rounded-full text-white hover:bg-white/10 transition-colors"
            aria-label="공유하기"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15m0-3l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </button>
        )}
      </div>

      <SaveToast show={showToast} message="링크가 복사됐어요!" />
    </>
  )
}
