'use client'

import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { buildShortsUrl } from '@/lib/videoRoutes'
import { SaveToast } from './SaveToast'

interface ShareButtonProps {
  videoId: string
  videoTitle?: string
}

export function ShareButton({ videoId, videoTitle }: ShareButtonProps) {
  const [showToast, setShowToast] = useState(false)

  const handleShare = useCallback(
    async (event: React.MouseEvent) => {
      event.stopPropagation()

      const shareUrl = `${window.location.origin}${buildShortsUrl(videoId)}`
      const shareText = videoTitle
        ? `${videoTitle} - StudyEng에서 영어 배우기`
        : 'StudyEng에서 영어 배우기'

      if (typeof navigator !== 'undefined' && navigator.share) {
        try {
          await navigator.share({
            title: videoTitle ?? 'StudyEng',
            text: shareText,
            url: shareUrl,
          })
          return
        } catch {
          // Fall through to clipboard copy.
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
      window.setTimeout(() => setShowToast(false), 2000)
    },
    [videoId, videoTitle],
  )

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.8 }}
        onClick={handleShare}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm"
        aria-label="공유하기"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth={2}
          className="h-5 w-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15m0-3l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
      </motion.button>
      <SaveToast show={showToast} message="링크를 복사했어요" />
    </>
  )
}
