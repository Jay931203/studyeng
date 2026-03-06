'use client'

import { motion } from 'framer-motion'
import { categories, type VideoData } from '@/data/seed-videos'

interface VideoCardProps {
  video: VideoData
  onClick: () => void
}

export function VideoCard({ video, onClick }: VideoCardProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="bg-[var(--bg-card)] rounded-xl overflow-hidden text-left w-full shadow-[var(--card-shadow)]"
    >
      <div className="aspect-video relative overflow-hidden">
        <img
          src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
          alt={video.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5 ml-0.5">
              <path d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" />
            </svg>
          </div>
        </div>
      </div>
      <div className="p-3">
        <p className="text-[var(--text-primary)] font-medium text-sm line-clamp-2">{video.title}</p>
        <div className="flex gap-2 mt-2">
          <span className="text-[var(--text-secondary)] text-xs bg-[var(--bg-secondary)] px-2 py-0.5 rounded-full">
            {categories.find(c => c.id === video.category)?.label ?? video.category}
          </span>
          <span className="text-yellow-400 text-xs">
            {'\u2605'.repeat(video.difficulty)}{'\u2606'.repeat(5 - video.difficulty)}
          </span>
        </div>
      </div>
    </motion.button>
  )
}
