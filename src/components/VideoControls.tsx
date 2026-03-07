'use client'

import { usePlayerStore } from '@/stores/usePlayerStore'
import { SpeedSlider } from './SpeedSlider'
import { RepeatButton } from './RepeatButton'
import { BookmarkButton } from './BookmarkButton'
import { LikeButton } from './LikeButton'
import { ShareButton } from './ShareButton'

interface VideoControlsProps {
  videoId?: string
  videoTitle?: string
}

export function VideoControls({ videoId, videoTitle }: VideoControlsProps) {
  const { isLooping, clearLoop } = usePlayerStore()

  return (
    <div className="absolute bottom-[220px] right-4 flex flex-col gap-3 z-10">
      {videoId && <LikeButton videoId={videoId} />}
      {videoId && <BookmarkButton videoId={videoId} />}
      {videoId && <ShareButton videoId={videoId} videoTitle={videoTitle} />}

      <SpeedSlider />

      <RepeatButton />

      {isLooping && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            clearLoop()
          }}
          className="bg-blue-500/80 backdrop-blur-sm text-white w-10 h-10 rounded-full flex items-center justify-center text-xs"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M4.755 10.059a7.5 7.5 0 0112.548-3.364l1.903 1.903H14.25a.75.75 0 000 1.5h6a.75.75 0 00.75-.75v-6a.75.75 0 00-1.5 0v3.068l-1.903-1.903A9 9 0 003.306 9.67a.75.75 0 101.45.388zm14.49 3.882a7.5 7.5 0 01-12.548 3.364l-1.903-1.903H9.75a.75.75 0 000-1.5h-6a.75.75 0 00-.75.75v6a.75.75 0 001.5 0v-3.068l1.903 1.903A9 9 0 0020.694 14.33a.75.75 0 10-1.45-.388z" />
          </svg>
        </button>
      )}
    </div>
  )
}
