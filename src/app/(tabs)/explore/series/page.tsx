'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { AppPage, SurfaceCard } from '@/components/ui/AppPage'
import {
  type CategoryId,
  type Series as SeriesType,
} from '@/data/seed-videos'
import {
  catalogSeries,
  getCatalogSeriesByCategory,
  getCatalogVideosBySeries,
} from '@/lib/catalog'
import { createHiddenVideoIdSet, filterHiddenVideos } from '@/lib/videoVisibility'
import { useAdminStore } from '@/stores/useAdminStore'

const categoryLabels: Record<CategoryId, string> = {
  drama: '드라마',
  movie: '영화',
  daily: '일상',
  entertainment: '예능',
  music: '음악',
  animation: '애니',
}

function isCategoryId(value: string | null): value is CategoryId {
  return typeof value === 'string' && value in categoryLabels
}

export default function ExploreSeriesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get('category')
  const [activeCategory, setActiveCategory] = useState<'all' | CategoryId>(
    isCategoryId(initialCategory) ? initialCategory : 'all',
  )
  const [query, setQuery] = useState('')
  const hiddenVideos = useAdminStore((state) => state.hiddenVideos)
  const hiddenVideoIdSet = useMemo(() => createHiddenVideoIdSet(hiddenVideos), [hiddenVideos])

  const visibleCatalogSeries = useMemo(
    () =>
      catalogSeries
        .map((seriesItem) => {
          const visibleEpisodes = filterHiddenVideos(
            getCatalogVideosBySeries(seriesItem.id),
            hiddenVideoIdSet,
          )

          if (visibleEpisodes.length === 0) return null

          return {
            ...seriesItem,
            episodeCount: visibleEpisodes.length,
          }
        })
        .filter((seriesItem): seriesItem is SeriesType => seriesItem !== null),
    [hiddenVideoIdSet],
  )

  const filteredSeries = useMemo(() => {
    const byCategory =
      activeCategory === 'all'
        ? visibleCatalogSeries
        : getCatalogSeriesByCategory(activeCategory).filter((seriesItem) =>
            visibleCatalogSeries.some((visibleSeries) => visibleSeries.id === seriesItem.id),
          )

    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return byCategory

    return byCategory.filter((seriesItem) => {
      const haystack = [
        seriesItem.title,
        seriesItem.description,
        categoryLabels[seriesItem.category],
      ]
        .join(' ')
        .toLowerCase()

      return haystack.includes(normalizedQuery)
    })
  }, [activeCategory, query, visibleCatalogSeries])

  const visibleVideoCount = useMemo(
    () => filteredSeries.reduce((total, seriesItem) => total + seriesItem.episodeCount, 0),
    [filteredSeries],
  )

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
      return
    }

    router.replace('/explore')
  }

  return (
    <AppPage>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={handleBack}
            className="text-[var(--text-secondary)] transition-transform active:scale-90"
            aria-label="Back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path
                fillRule="evenodd"
                d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">시리즈</h1>
          </div>
        </div>

        <SurfaceCard className="relative overflow-hidden border-[var(--accent-primary)]/14 p-5 sm:p-6">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-24"
              style={{
                background: 'linear-gradient(180deg, var(--accent-glow) 0%, transparent 100%)',
              }}
            />
            <div className="relative">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {filteredSeries.length}개 시리즈 · {visibleVideoCount}개 영상
                  </p>
                </div>
                <div className="relative w-full sm:max-w-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <input
                    type="text"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="시리즈 제목이나 키워드 검색"
                    className="w-full rounded-2xl border border-[var(--border-card)] bg-[var(--bg-primary)]/55 py-3 pl-11 pr-11 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[rgba(var(--accent-primary-rgb),0.18)]"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[var(--text-muted)] transition hover:bg-[var(--bg-secondary)]"
                      aria-label="Clear search"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              <div className="mb-5 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                <button
                  type="button"
                  onClick={() => setActiveCategory('all')}
                  className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm ${
                    activeCategory === 'all'
                      ? 'bg-[var(--accent-primary)] text-white'
                      : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                  }`}
                >
                  전체
                </button>
                {(Object.keys(categoryLabels) as CategoryId[]).map((categoryId) => (
                  <button
                    key={categoryId}
                    type="button"
                    onClick={() => setActiveCategory(categoryId)}
                    className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm ${
                      activeCategory === categoryId
                        ? 'bg-[var(--accent-primary)] text-white'
                        : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {categoryLabels[categoryId]}
                  </button>
                ))}
              </div>

              {filteredSeries.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-[var(--border-card)] px-5 py-16 text-center">
                  <p className="text-sm text-[var(--text-secondary)]">조건에 맞는 시리즈가 없습니다.</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredSeries.map((seriesItem) => {
                    const episodes = filterHiddenVideos(
                      getCatalogVideosBySeries(seriesItem.id),
                      hiddenVideoIdSet,
                    )
                    const thumbVideo = episodes[0]

                    return (
                      <motion.button
                        key={seriesItem.id}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => router.push(`/explore?series=${seriesItem.id}`)}
                        className="overflow-hidden rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] text-left shadow-[var(--card-shadow)]"
                      >
                        {thumbVideo && (
                          <div className="relative aspect-[2.2] overflow-hidden">
                            <Image
                              src={`https://img.youtube.com/vi/${thumbVideo.youtubeId}/hqdefault.jpg`}
                              alt={seriesItem.title}
                              fill
                              sizes="(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 100vw"
                              className="object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                              <span className="text-xs font-medium text-white/80">
                                {categoryLabels[seriesItem.category]}
                              </span>
                              <span className="rounded-full bg-black/40 px-2 py-0.5 text-[11px] text-white/80 backdrop-blur-sm">
                                {seriesItem.episodeCount}개
                              </span>
                            </div>
                          </div>
                        )}
                        <div className="p-4">
                          <p className="text-[15px] font-semibold text-[var(--text-primary)]">
                            {seriesItem.title}
                          </p>
                          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[var(--text-secondary)]">
                            {seriesItem.description}
                          </p>
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
              )}
            </div>
        </SurfaceCard>
      </div>
    </AppPage>
  )
}
