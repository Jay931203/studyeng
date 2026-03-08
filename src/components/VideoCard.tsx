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
      className="group w-full overflow-hidden rounded-[24px] border border-[var(--border-card)] bg-[var(--bg-card)] text-left shadow-[var(--card-shadow)] transition-all"
    >
      <div className="relative aspect-[0.92] overflow-hidden sm:aspect-video">
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
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/60">
              지금 추천
            </p>
            <p className="mt-1 line-clamp-2 text-base font-semibold leading-tight text-white">
              {video.title}
            </p>
          </div>
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-white/14 backdrop-blur-sm">
            <svg viewBox="0 0 24 24" fill="white" className="ml-0.5 h-5 w-5">
              <path d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="p-4">
        <p className="text-sm font-medium leading-relaxed text-[var(--text-secondary)]">
          {video.seriesId
            ? '맥락이 이어지는 장면입니다.'
            : '지금 보기 좋은 짧은 클립입니다.'}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-[var(--bg-secondary)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-secondary)]">
            {video.seriesId ? '시리즈 흐름' : '바로 보기'}
          </span>
          <span className="rounded-full bg-[var(--accent-glow)] px-2.5 py-1 text-[11px] font-medium text-[var(--accent-text)]">
            {difficultyLabel}
          </span>
        </div>
      </div>
    </motion.button>
  )
}
