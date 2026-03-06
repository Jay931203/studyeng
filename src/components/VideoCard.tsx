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
      className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl overflow-hidden text-left w-full"
    >
      <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
        <span className="text-4xl">&#9654;</span>
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
