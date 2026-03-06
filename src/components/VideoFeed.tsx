'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence, type PanInfo } from 'framer-motion'
import { VideoPlayer } from './VideoPlayer'
import { VideoControls } from './VideoControls'
import { SaveToast } from './SaveToast'
import { ProgressBar } from './ProgressBar'
import { usePhraseStore } from '@/stores/usePhraseStore'
import { categories, type VideoData } from '@/data/seed-videos'

interface VideoFeedProps {
  videos: VideoData[]
}

export function VideoFeed({ videos }: VideoFeedProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const [showToast, setShowToast] = useState(false)
  const constraintsRef = useRef(null)
  const savePhrase = usePhraseStore((s) => s.savePhrase)

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

  const categoryLabel = categories.find(c => c.id === currentVideo.category)?.label ?? currentVideo.category

  return (
    <div ref={constraintsRef} className="relative w-full h-full overflow-hidden">
      <AnimatePresence custom={direction}>
        <motion.div
          key={currentVideo.id}
          custom={direction}
          initial={direction === 0 ? false : { y: direction > 0 ? '100%' : '-100%', opacity: 0 }}
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
            onSavePhrase={(phrase) => {
              savePhrase({
                videoId: currentVideo.id,
                videoTitle: currentVideo.title,
                en: phrase.en,
                ko: phrase.ko,
                timestampStart: phrase.start,
                timestampEnd: phrase.end,
              })
              setShowToast(true)
              setTimeout(() => setShowToast(false), 2000)
            }}
          />
          <VideoControls videoId={currentVideo.id} />

          {/* Video info - positioned above subtitle area */}
          <div className="absolute bottom-[100px] left-4 right-20 z-10 pointer-events-none">
            <p className="text-white font-bold text-base drop-shadow-lg">
              {currentVideo.title}
            </p>
            <div className="flex gap-2 mt-1">
              <span className="text-white/70 text-xs bg-white/10 px-2 py-0.5 rounded-full">
                {categoryLabel}
              </span>
              <span className="text-white/70 text-xs bg-white/10 px-2 py-0.5 rounded-full">
                {'★'.repeat(currentVideo.difficulty)}
              </span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Progress bar - YouTube Shorts style */}
      <ProgressBar />

      {/* Counter + time */}
      <div className="absolute top-4 left-4 z-10">
        <span className="text-white/50 text-xs">
          {currentIndex + 1} / {videos.length}
        </span>
      </div>

      <SaveToast show={showToast} message="표현이 저장됐어요!" />
    </div>
  )
}
