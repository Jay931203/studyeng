'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { SaveToast } from './SaveToast'

interface ShareButtonProps {
  videoId: string
  videoTitle?: string
}

export function ShareButton({ videoId, videoTitle }: ShareButtonProps) {
  const [showToast, setShowToast] = useState(false)

  const handleShare = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation()
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

      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl)
      } catch {
        // Fallback for older browsers
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

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.8 }}
        onClick={handleShare}
        className="bg-black/50 backdrop-blur-sm w-10 h-10 rounded-full flex items-center justify-center"
        aria-label="공유하기"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth={2}
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15m0-3l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
      </motion.button>
      <SaveToast show={showToast} message="링크가 복사됐어요!" />
    </>
  )
}
