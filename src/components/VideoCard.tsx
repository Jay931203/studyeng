'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { categories, type VideoData } from '@/data/seed-videos'

interface VideoCardProps {
  video: VideoData
  onClick: () => void
}

export function VideoCard({ video, onClick }: VideoCardProps) {
  const categoryLabel =
    categories.find((category) => category.id === video.category)?.label ?? video.category
  const difficultyLabel =
    video.difficulty <= 2 ? '가볍게' : video.difficulty === 3 ? '적당히' : '집중해서'
  const metaLabel = video.seriesId
    ? video.episodeNumber
      ? `EP ${video.episodeNumber}`
      : '시리즈'
    : '클립'

  return (
    <motion.button
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="group w-full overflow-hidden rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] text-left shadow-[var(--card-shadow)] transition-all"
    >
      <div className="relative aspect-video overflow-hidden">
        <Image
          src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
          alt={video.title}
          fill
          sizes="(min-width: 1280px) 22vw, (min-width: 640px) 48vw, 46vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/18 to-transparent" />
        <div className="absolute left-3 top-3 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
          {categoryLabel}
        </div>
        <div className="absolute right-3 top-3 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
          {metaLabel}
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <p className="line-clamp-2 text-base font-semibold leading-tight text-white">
            {video.title}
          </p>
        </div>
      </div>

      <div className="p-3">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-[var(--accent-glow)] px-2.5 py-1 text-[11px] font-medium text-[var(--accent-text)]">
            {difficultyLabel}
          </span>
        </div>
      </div>
    </motion.button>
  )
}
