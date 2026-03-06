'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence, type PanInfo } from 'framer-motion'
import { VideoPlayer } from './VideoPlayer'
import { VideoControls } from './VideoControls'
import type { VideoData } from '@/data/seed-videos'

interface VideoFeedProps {
  videos: VideoData[]
}

export function VideoFeed({ videos }: VideoFeedProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const constraintsRef = useRef(null)

  const swipeThreshold = 50

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const { offset, velocity } = info

      if (offset.y < -swipeThreshold || velocity.y < -500) {
        if (currentIndex < videos.length - 1) {
          setDirection(1)
          setCurrentIndex((prev) => prev + 1)
        }
      } else if (offset.y > swipeThreshold || velocity.y > 500) {
        if (currentIndex > 0) {
          setDirection(-1)
          setCurrentIndex((prev) => prev - 1)
        }
      }
    },
    [currentIndex, videos.length]
  )

  const currentVideo = videos[currentIndex]
  if (!currentVideo) return null

  return (
    <div ref={constraintsRef} className="relative w-full h-full overflow-hidden">
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentVideo.id}
          custom={direction}
          initial={{ y: direction > 0 ? '100%' : '-100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: direction > 0 ? '-100%' : '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          className="absolute inset-0"
        >
          <VideoPlayer
            youtubeId={currentVideo.youtubeId}
            subtitles={currentVideo.subtitles}
          />
          <VideoControls />

          <div className="absolute bottom-24 left-4 z-10 pointer-events-none">
            <p className="text-white font-bold text-base drop-shadow-lg">
              {currentVideo.title}
            </p>
            <div className="flex gap-2 mt-1">
              <span className="text-white/70 text-xs bg-white/10 px-2 py-0.5 rounded-full">
                {currentVideo.category}
              </span>
              <span className="text-white/70 text-xs bg-white/10 px-2 py-0.5 rounded-full">
                {'★'.repeat(currentVideo.difficulty)}
              </span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="absolute top-4 left-4 z-10">
        <span className="text-white/50 text-xs">
          {currentIndex + 1} / {videos.length}
        </span>
      </div>
    </div>
  )
}
