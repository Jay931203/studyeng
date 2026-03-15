'use client'

import { motion } from 'framer-motion'
import { useLikeStore } from '@/stores/useLikeStore'
import { useLocaleStore } from '@/stores/useLocaleStore'

const T = {
  unlike: { ko: '좋아요 취소', ja: 'いいね取消', 'zh-TW': '取消喜歡', vi: 'Bo thich' },
  like: { ko: '좋아요', ja: 'いいね', 'zh-TW': '喜歡', vi: 'Thich' },
} as const

interface LikeButtonProps {
  videoId: string
}

export function LikeButton({ videoId }: LikeButtonProps) {
  const { toggleLike, isLiked } = useLikeStore()
  const locale = useLocaleStore((s) => s.locale)
  const liked = isLiked(videoId)

  return (
    <motion.button
      whileTap={{ scale: 0.8 }}
      onClick={(e) => {
        e.stopPropagation()
        toggleLike(videoId)
      }}
      className="bg-black/50 backdrop-blur-sm w-10 h-10 rounded-full flex items-center justify-center"
      aria-label={liked ? T.unlike[locale] : T.like[locale]}
    >
      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill={liked ? '#EF4444' : 'none'}
        stroke={liked ? '#EF4444' : 'white'}
        strokeWidth={2}
        className="w-5 h-5"
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
  )
}
