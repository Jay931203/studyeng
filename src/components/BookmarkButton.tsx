'use client'

import { motion } from 'framer-motion'
import { useBookmarkStore } from '@/stores/useBookmarkStore'

interface BookmarkButtonProps {
  videoId: string
}

export function BookmarkButton({ videoId }: BookmarkButtonProps) {
  const { toggleBookmark, isBookmarked } = useBookmarkStore()
  const bookmarked = isBookmarked(videoId)

  return (
    <motion.button
      whileTap={{ scale: 0.8 }}
      onClick={(e) => {
        e.stopPropagation()
        toggleBookmark(videoId)
      }}
      className="bg-black/50 backdrop-blur-sm w-10 h-10 rounded-full flex items-center justify-center"
      aria-label={bookmarked ? '북마크 해제' : '북마크'}
    >
      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill={bookmarked ? '#3B82F6' : 'none'}
        stroke={bookmarked ? '#3B82F6' : 'white'}
        strokeWidth={2}
        className="w-5 h-5"
        animate={bookmarked ? { scale: [1, 1.3, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
      </motion.svg>
    </motion.button>
  )
}
