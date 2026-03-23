'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import { type VideoData } from '@/data/seed-videos'
import { ComprehensionBadge } from '@/components/ComprehensionBadge'
import { getCatalogSeriesById } from '@/lib/catalog'
import { getCategoryLabels } from '@/lib/uiTranslations'
import { useLocaleStore } from '@/stores/useLocaleStore'
import { YouTubeThumbnail } from '@/components/YouTubeThumbnail'

interface VideoCardProps {
  video: VideoData
  onClick: () => void
}

function VideoCardInner({ video, onClick }: VideoCardProps) {
  const locale = useLocaleStore((state) => state.locale)
  const categoryLabelsMap = getCategoryLabels(locale)
  const categoryLabel = categoryLabelsMap[video.category] ?? video.category
  const seriesTitle = video.seriesId ? getCatalogSeriesById(video.seriesId)?.title : null
  const metaLabel = video.seriesId
    ? video.episodeNumber
      ? `EP ${video.episodeNumber}`
      : 'SERIES'
    : 'SINGLE'

  return (
    <motion.button
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="group w-full overflow-hidden rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] text-left shadow-[var(--card-shadow)] transition-all"
    >
      <div className="relative aspect-video overflow-hidden">
        <YouTubeThumbnail
          youtubeId={video.youtubeId}
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
          {seriesTitle && (
            <p className="mb-1 truncate text-[11px] font-medium uppercase tracking-[0.08em] text-white/72">
              {seriesTitle}
            </p>
          )}
          <div className="flex items-end justify-between gap-2">
            <p className="line-clamp-2 min-w-0 flex-1 text-base font-semibold leading-tight text-white">
              {video.title}
            </p>
            <ComprehensionBadge videoId={video.id} compact className="shrink-0 rounded-full bg-black/45 px-1.5 py-0.5 backdrop-blur-sm" />
          </div>
        </div>
      </div>
    </motion.button>
  )
}

export const VideoCard = memo(VideoCardInner)
