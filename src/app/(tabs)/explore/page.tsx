'use client'

import Image from 'next/image'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  type CategoryId,
  type Series as SeriesType,
  type VideoData,
} from '@/data/seed-videos'
import { LogoFull } from '@/components/Logo'
import { SearchBar } from '@/components/SearchBar'
import { VideoCard } from '@/components/VideoCard'
import { AppPage, SectionHeader, SurfaceCard } from '@/components/ui/AppPage'
import { useAuth } from '@/hooks/useAuth'
import {
  catalogSeries,
  catalogShorts,
  catalogVideos,
  getCatalogSeriesByCategory,
  getCatalogVideosBySeries,
} from '@/lib/catalog'
import { getLevelAwareCandidateVideos, recommendVideos } from '@/lib/recommend'
import { createHiddenVideoIdSet, filterHiddenVideos } from '@/lib/videoVisibility'
import { buildShortsUrl } from '@/lib/videoRoutes'
import { useAdminStore } from '@/stores/useAdminStore'
import { useLikeStore } from '@/stores/useLikeStore'
import { useLocaleStore } from '@/stores/useLocaleStore'
import { useOnboardingStore } from '@/stores/useOnboardingStore'
import { usePhraseStore } from '@/stores/usePhraseStore'
import { useRecommendationStore } from '@/stores/useRecommendationStore'
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore'
import {
  t,
  getCategoryLabels,
  formatSeriesDescription,
  formatShortsCount,
  formatEpisodeCount,
} from '@/lib/uiTranslations'

interface ContinueSeriesCard {
  seriesItem: SeriesType
  nextVideo: VideoData
  lastVideo: VideoData | null
  progress: number
  watchedCount: number
  episodeCount: number
  lastWatchedAt: number
}

const HOME_THUMBNAIL_BLOCKLIST = new Set(['shorts-HeKbP9BCZXQ'])

export default function ExplorePage() {
  const [activeCategory, setActiveCategory] = useState<'all' | CategoryId>('all')
  const router = useRouter()
  const searchParams = useSearchParams()
  const seriesSectionRef = useRef<HTMLElement | null>(null)
  const hiddenVideos = useAdminStore((state) => state.hiddenVideos)
  const { user } = useAuth()
  const likes = useLikeStore((state) => state.likes)
  const phrases = usePhraseStore((state) => state.phrases)
  const interests = useOnboardingStore((state) => state.interests)
  const level = useOnboardingStore((state) => state.level)
  const recentVideoIds = useRecommendationStore((state) => state.recentVideoIds)
  const videoSignals = useRecommendationStore((state) => state.videoSignals)
  const locale = useLocaleStore((state) => state.locale)
  const categoryLabels = getCategoryLabels(locale)
  const {
    watchedEpisodes,
    completionCounts,
    viewCounts,
    watchRecords,
    getSeriesProgress,
    getNextEpisode,
    getViewCount,
    clearDeletedFlag,
  } = useWatchHistoryStore()

  const selectedSeriesId = searchParams.get('series')
  const source = searchParams.get('source')
  const returnVideoId = searchParams.get('returnVideoId')
  const returnSeriesId = searchParams.get('returnSeriesId')
  const cameFromVideo = Boolean(returnVideoId) && (source === 'video' || source === 'shorts')
  const hiddenVideoIdSet = useMemo(() => createHiddenVideoIdSet(hiddenVideos), [hiddenVideos])
  const visibleCatalogVideos = useMemo(
    () => filterHiddenVideos(catalogVideos, hiddenVideoIdSet),
    [hiddenVideoIdSet],
  )
  const visibleCatalogShorts = useMemo(
    () =>
      filterHiddenVideos(catalogShorts, hiddenVideoIdSet).filter(
        (video) => !HOME_THUMBNAIL_BLOCKLIST.has(video.id),
      ),
    [hiddenVideoIdSet],
  )
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
  const selectedSeries = selectedSeriesId
    ? visibleCatalogSeries.find((item) => item.id === selectedSeriesId) ?? null
    : null
  const seriesEpisodes = selectedSeries
    ? filterHiddenVideos(getCatalogVideosBySeries(selectedSeries.id), hiddenVideoIdSet)
    : []
  const profileName =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email?.split('@')[0] ??
    'PROFILE'

  const filteredSeries = useMemo(
    () =>
      activeCategory === 'all'
        ? visibleCatalogSeries
        : getCatalogSeriesByCategory(activeCategory).filter((seriesItem) =>
            visibleCatalogSeries.some((visibleSeries) => visibleSeries.id === seriesItem.id),
          ),
    [activeCategory, visibleCatalogSeries],
  )
  const filteredSeriesVideoCount = useMemo(
    () => filteredSeries.reduce((total, seriesItem) => total + seriesItem.episodeCount, 0),
    [filteredSeries],
  )
  const seriesSectionDescription = formatSeriesDescription(filteredSeries.length, filteredSeriesVideoCount, locale)

  const buildExploreUrl = useCallback(
    (seriesId: string | null) => {
      const params = new URLSearchParams()
      if (seriesId) params.set('series', seriesId)
      if (cameFromVideo && returnVideoId) {
        params.set('source', source === 'shorts' ? 'shorts' : 'video')
        params.set('returnVideoId', returnVideoId)
        if (returnSeriesId) params.set('returnSeriesId', returnSeriesId)
      }
      const query = params.toString()
      return query ? `/explore?${query}` : '/explore'
    },
    [cameFromVideo, returnSeriesId, returnVideoId, source],
  )

  const openShorts = useCallback(
    (videoId?: string | null, seriesId?: string | null) => {
      if (!videoId) return
      clearDeletedFlag(videoId)
      router.push(buildShortsUrl(videoId, seriesId), { scroll: false })
    },
    [clearDeletedFlag, router],
  )

  const openSeriesShorts = useCallback(
    (videoId?: string | null, seriesId?: string | null) => {
      if (!videoId) return
      clearDeletedFlag(videoId)
      router.push(buildShortsUrl(videoId, seriesId, { seriesPlayback: true }), {
        scroll: false,
      })
    },
    [clearDeletedFlag, router],
  )

  const scrollToSeriesSection = useCallback(() => {
    seriesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const continueSeries = useMemo<ContinueSeriesCard[]>(() => {
    const latestByVideo = new Map<string, number>()
    for (const record of watchRecords) {
      if (!latestByVideo.has(record.videoId)) {
        latestByVideo.set(record.videoId, record.watchedAt)
      }
    }

    return Object.entries(watchedEpisodes)
      .map(([seriesId, watchedIds]) => {
        const seriesItem = visibleCatalogSeries.find((item) => item.id === seriesId)
        const visibleWatchedIds = watchedIds.filter((videoId) => !hiddenVideoIdSet.has(videoId))
        if (!seriesItem || visibleWatchedIds.length === 0) return null

        const episodes = filterHiddenVideos(getCatalogVideosBySeries(seriesId), hiddenVideoIdSet)
        if (episodes.length === 0) return null

        const nextVideoId =
          getNextEpisode(
            seriesId,
            episodes.map((video) => video.id),
          ) ?? episodes[0]?.id
        const nextVideo = episodes.find((video) => video.id === nextVideoId)
        if (!nextVideo) return null

        const lastVideoId = [...visibleWatchedIds].sort(
          (left, right) => (latestByVideo.get(right) ?? 0) - (latestByVideo.get(left) ?? 0),
        )[0]
        const lastVideo = episodes.find((video) => video.id === lastVideoId) ?? null

        return {
          seriesItem,
          nextVideo,
          lastVideo,
          progress: getSeriesProgress(seriesId, episodes.length),
          watchedCount: visibleWatchedIds.length,
          episodeCount: episodes.length,
          lastWatchedAt: latestByVideo.get(lastVideoId) ?? 0,
        }
      })
      .filter((item): item is ContinueSeriesCard => item !== null)
      .sort((left, right) => right.lastWatchedAt - left.lastWatchedAt)
      .slice(0, 4)
  }, [
    getNextEpisode,
    getSeriesProgress,
    hiddenVideoIdSet,
    visibleCatalogSeries,
    watchRecords,
    watchedEpisodes,
  ])

  const shuffledShorts = useMemo(() => {
    const candidateShorts = getLevelAwareCandidateVideos(visibleCatalogShorts, level, {
      minimumPoolSize: 18,
      nearbyPoolRatio: 0.2,
      minimumNearbyCount: 4,
    })

    if (candidateShorts.length === 0) return []
    const today = new Date()
    let seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
    const nextSeed = () => {
      seed = (seed * 9301 + 49297) % 233280
      return seed / 233280
    }
    const arr = [...candidateShorts]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(nextSeed() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  }, [level, visibleCatalogShorts])

  const homeCatalogVideos = useMemo(() => {
    const visibleVideos = visibleCatalogVideos.filter(
      (video) => !HOME_THUMBNAIL_BLOCKLIST.has(video.id),
    )

    return getLevelAwareCandidateVideos(visibleVideos, level, {
      minimumPoolSize: 28,
      nearbyPoolRatio: 0.2,
      minimumNearbyCount: 6,
    })
  }, [level, visibleCatalogVideos])

  const rankedRecommendations = useMemo(() => {
    return recommendVideos(homeCatalogVideos, {
      watchedEpisodes,
      completionCounts,
      watchRecords,
      viewCounts,
      likes,
      interests,
      level,
      phrases,
      recentVideoIds,
      videoSignals,
    })
  }, [
    completionCounts,
    interests,
    level,
    likes,
    phrases,
    recentVideoIds,
    videoSignals,
    homeCatalogVideos,
    viewCounts,
    watchRecords,
    watchedEpisodes,
  ])

  const spotlightVideo = rankedRecommendations[0] ?? homeCatalogVideos[0]
  const spotlightSeries = spotlightVideo?.seriesId
    ? visibleCatalogSeries.find((item) => item.id === spotlightVideo.seriesId) ?? null
    : null
  const recommended = useMemo(() => {
    if (!spotlightVideo) return []

    const seen = new Set([spotlightVideo.id])
    const cards = rankedRecommendations.filter((video) => {
      if (seen.has(video.id)) return false
      seen.add(video.id)
      return true
    })

    if (cards.length >= 4) return cards.slice(0, 4)

    for (const video of homeCatalogVideos) {
      if (seen.has(video.id)) continue
      seen.add(video.id)
      cards.push(video)
      if (cards.length === 4) break
    }

    return cards
  }, [homeCatalogVideos, rankedRecommendations, spotlightVideo])

  const rotatingSeries = useMemo(() => {
    const continueSeriesIds = new Set(continueSeries.map((item) => item.seriesItem.id))
    const spotlightSeriesId = spotlightSeries?.id ?? null
    const primarySeries = filteredSeries.filter(
      (seriesItem) => !continueSeriesIds.has(seriesItem.id) && seriesItem.id !== spotlightSeriesId,
    )
    const fallbackSeries = filteredSeries.filter(
      (seriesItem) => continueSeriesIds.has(seriesItem.id) || seriesItem.id === spotlightSeriesId,
    )
    const today = new Date()
    const daySeed =
      today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
    const userSeedSource = user?.id ?? user?.email ?? 'guest'
    const categorySeed = activeCategory === 'all' ? 'all' : activeCategory

    const stableScore = (seriesId: string) => {
      const input = `${daySeed}:${categorySeed}:${userSeedSource}:${seriesId}`
      let hash = 0
      for (let index = 0; index < input.length; index += 1) {
        hash = (hash * 31 + input.charCodeAt(index)) >>> 0
      }
      return hash
    }

    const sortBySeed = (items: SeriesType[]) =>
      [...items].sort((left, right) => stableScore(left.id) - stableScore(right.id))

    return [...sortBySeed(primarySeries), ...sortBySeed(fallbackSeries)]
  }, [activeCategory, continueSeries, filteredSeries, spotlightSeries?.id, user?.email, user?.id])

  const visibleSeries = useMemo(() => rotatingSeries.slice(0, 6), [rotatingSeries])

  if (!spotlightVideo) return null

  if (selectedSeries) {
    const progressPct = getSeriesProgress(selectedSeries.id, selectedSeries.episodeCount)
    const radius = 40
    const circumference = 2 * Math.PI * radius
    const dashOffset = circumference - (progressPct / 100) * circumference
    const handleCloseSeries = () => {
      if (typeof window !== 'undefined' && window.history.length > 1) {
        router.back()
        return
      }

      router.replace(buildExploreUrl(null), { scroll: false })
    }

    return (
      <AppPage>
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={handleCloseSeries}
            className="text-[var(--text-secondary)] transition-transform active:scale-90"
            aria-label="Back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path
                fillRule="evenodd"
                d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-text)]">
            SERIES
          </p>
        </div>

        <section className="grid min-w-0 items-start gap-6 xl:grid-cols-[0.92fr_1.08fr]">
            <div className="relative min-w-0 overflow-hidden rounded-[28px] border border-[var(--accent-primary)]/14 bg-[var(--bg-card)] shadow-[var(--card-shadow)]">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-24"
                style={{
                  background:
                    'linear-gradient(180deg, var(--accent-glow) 0%, transparent 100%)',
                }}
              />
              <div className="relative p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
                  <svg width="100" height="100" viewBox="0 0 100 100" className="shrink-0">
                    <circle
                      cx="50"
                      cy="50"
                      r={radius}
                      fill="none"
                      stroke="var(--bg-secondary)"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r={radius}
                      fill="none"
                      stroke="var(--accent-primary)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={dashOffset}
                      transform="rotate(-90 50 50)"
                      style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                    />
                    <text
                      x="50"
                      y="50"
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="var(--text-primary)"
                      fontSize="18"
                      fontWeight="700"
                    >
                      {progressPct}%
                    </text>
                  </svg>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-text)]">
                      {categoryLabels[selectedSeries.category]}
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-[var(--text-primary)]">
                      {selectedSeries.title}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                      {selectedSeries.description}
                    </p>
                    <p className="mt-3 text-xs text-[var(--text-muted)]">
                      {selectedSeries.episodeCount} EPISODES
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const nextId =
                      getNextEpisode(
                        selectedSeries.id,
                        seriesEpisodes.map((video) => video.id),
                      ) ?? seriesEpisodes[0]?.id
                    openSeriesShorts(nextId, selectedSeries.id)
                  }}
                  className="mt-6 w-full rounded-2xl bg-[var(--accent-primary)] py-3.5 text-sm font-semibold text-white"
                >
                  WATCH NEXT
                </button>
              </div>
            </div>

            <div className="min-w-0 space-y-3">
              {seriesEpisodes.map((video) => {
                const views = getViewCount(video.id)
                return (
                  <motion.button
                    key={video.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => openSeriesShorts(video.id, selectedSeries.id)}
                    className="flex w-full items-center gap-3 rounded-[20px] border border-[var(--border-card)] bg-[var(--bg-card)] p-3 text-left shadow-[var(--card-shadow)]"
                  >
                    <div className="relative h-[56px] w-[100px] shrink-0 overflow-hidden rounded-xl">
                      <Image
                        src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                        alt={video.title}
                        fill
                        sizes="100px"
                        className="object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                        {video.episodeNumber}. {video.title}
                      </p>
                      <p className="mt-1 flex items-center gap-2 text-xs text-[var(--text-muted)]">
                        <span>Lv.{video.difficulty}</span>
                        <span className="font-mono text-[var(--text-secondary)]">&times;{views}</span>
                      </p>
                    </div>
                  </motion.button>
                )
              })}
            </div>
        </section>
      </AppPage>
    )
  }

  return (
    <AppPage>
      <div className="mb-6 flex items-center justify-between gap-4">
        <LogoFull className="h-10 sm:h-11 text-[var(--text-primary)]" />
        {cameFromVideo && returnVideoId && (
          <button
            onClick={() => openShorts(returnVideoId, returnSeriesId)}
            className="rounded-full border border-[var(--border-card)] bg-[var(--bg-card)] px-4 py-2 text-sm text-[var(--text-secondary)]"
          >
            Back
          </button>
        )}
        {!cameFromVideo && (
          <button
            onClick={() => router.push('/profile')}
            className="flex min-w-0 items-center gap-2 rounded-full border border-[var(--border-card)] bg-[var(--bg-card)] px-2.5 py-1.5 text-left"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] text-xs font-bold text-white">
              {user?.user_metadata?.avatar_url ? (
                <span className="relative block h-full w-full">
                  <Image
                    src={user.user_metadata.avatar_url}
                    alt={profileName}
                    fill
                    sizes="32px"
                    className="object-cover"
                  />
                </span>
              ) : (
                <span>{profileName.slice(0, 1).toUpperCase()}</span>
              )}
            </div>
            <span className="truncate text-xs font-medium text-[var(--text-primary)]">
              {user ? profileName : 'PROFILE'}
            </span>
          </button>
        )}
      </div>

      <section className="mb-8 grid gap-4 xl:grid-cols-[1fr_0.74fr]">
        <SurfaceCard className="overflow-hidden">
          <div className="grid min-h-[212px] lg:grid-cols-[1.02fr_0.98fr]">
            <div className="order-2 flex flex-col justify-between p-5 sm:p-6 lg:order-1 lg:p-7">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[var(--accent-glow)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--accent-text)]">
                    {t('recommendedBadge', locale)}
                  </span>
                  <span className="rounded-full border border-[var(--border-card)] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--text-secondary)]">
                    {categoryLabels[spotlightVideo.category]}
                  </span>
                </div>
                <h2 className="mt-3 line-clamp-2 text-2xl font-bold leading-tight text-[var(--text-primary)] sm:text-[1.75rem]">
                  {spotlightVideo.title}
                </h2>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  onClick={() => openShorts(spotlightVideo.id, spotlightVideo.seriesId)}
                  className="rounded-full border border-[var(--accent-primary)]/24 bg-[var(--accent-glow)] px-5 py-2.5 text-sm font-semibold text-[var(--text-primary)]"
                >
                  {t('watchNow', locale)}
                </button>
                <button
                  onClick={scrollToSeriesSection}
                  className="rounded-full border border-[var(--border-card)] bg-[var(--bg-card)]/65 px-5 py-2.5 text-sm font-medium text-[var(--text-secondary)]"
                >
                  {t('viewSeries', locale)}
                </button>
              </div>
            </div>

            <div className="order-1 relative min-h-[168px] overflow-hidden lg:order-2 lg:min-h-full">
              <Image
                src={`https://img.youtube.com/vi/${spotlightVideo.youtubeId}/hqdefault.jpg`}
                alt={spotlightVideo.title}
                fill
                sizes="(min-width: 1280px) 34vw, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'var(--accent-rainbow-soft, linear-gradient(135deg, rgba(var(--accent-primary-rgb), 0.24), transparent 55%))',
                }}
              />
              <div className="absolute inset-x-0 bottom-0 p-5">
                {spotlightSeries ? (
                  <p className="truncate text-xs font-semibold uppercase tracking-[0.16em] text-white/80">
                    {spotlightSeries.title}
                  </p>
                ) : (
                  <p className="truncate text-xs font-semibold uppercase tracking-[0.16em] text-white/80">
                    {categoryLabels[spotlightVideo.category]}
                  </p>
                )}
              </div>
            </div>
          </div>
        </SurfaceCard>

        <div className="flex flex-col gap-4">
          <SearchBar />
        </div>
      </section>

      {continueSeries.length > 0 && (
        <section className="mb-8 overflow-hidden">
          <SectionHeader title={t('continueWatching', locale)} />

          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {continueSeries.map((item) => (
              <motion.button
                key={item.seriesItem.id}
                whileTap={{ scale: 0.99 }}
                onClick={() => openSeriesShorts(item.nextVideo.id, item.seriesItem.id)}
                className="w-[260px] shrink-0 overflow-hidden rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] text-left shadow-[var(--card-shadow)]"
              >
                <div className="relative aspect-[2] overflow-hidden">
                  <Image
                    src={`https://img.youtube.com/vi/${item.nextVideo.youtubeId}/hqdefault.jpg`}
                    alt={item.nextVideo.title}
                    fill
                    sizes="260px"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <p className="text-sm font-bold text-white">{item.seriesItem.title}</p>
                    <p className="mt-1 text-[11px] text-white/70">
                      {item.progress}% · {item.watchedCount}/{item.seriesItem.episodeCount}
                    </p>
                  </div>
                </div>
                <div className="px-3 py-2.5">
                  <p className="truncate text-xs font-medium text-[var(--text-primary)]">
                    {t('next', locale)}: {item.nextVideo.title}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        </section>
      )}

      {shuffledShorts.length > 0 && (
        <section className="mb-8 overflow-hidden">
          <SectionHeader title={t('shorts', locale)} description={formatShortsCount(shuffledShorts.length, locale)} />

          <div className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar">
            {shuffledShorts.map((video) => (
              <motion.button
                key={video.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push(`/shorts?feed=shorts&v=${video.id}`)}
                className="w-[108px] shrink-0 overflow-hidden rounded-xl text-left"
              >
                <div className="relative aspect-[3/5] overflow-hidden rounded-xl">
                  <Image
                    src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                    alt={video.title}
                    fill
                    sizes="108px"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-2">
                    <p className="line-clamp-2 text-[11px] font-medium leading-tight text-white">
                      {video.title}
                    </p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </section>
      )}

      <section className="mb-8">
        <SectionHeader title={t('recommended', locale)} />
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {recommended.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onClick={() => openShorts(video.id, video.seriesId)}
            />
          ))}
        </div>
      </section>

      <section ref={seriesSectionRef} className="mb-8">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">{t('series', locale)}</h2>
          <div className="mt-1 flex items-center justify-between gap-3">
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              {seriesSectionDescription}
            </p>
            <button
              type="button"
              onClick={() => {
                const query =
                  activeCategory === 'all' ? '' : `?category=${encodeURIComponent(activeCategory)}`
                router.push(`/explore/series${query}`)
              }}
              className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--accent-text)]"
            >
              {t('seeAll', locale)}
            </button>
          </div>
        </div>

        <div className="mb-4 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setActiveCategory('all')}
            className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm ${
              activeCategory === 'all'
                ? 'bg-[var(--accent-primary)] text-white'
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
            }`}
          >
            {t('all', locale)}
          </button>
          {(Object.keys(categoryLabels) as CategoryId[]).map((categoryId) => (
            <button
              key={categoryId}
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

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visibleSeries.map((seriesItem) => {
            const episodes = filterHiddenVideos(
              getCatalogVideosBySeries(seriesItem.id),
              hiddenVideoIdSet,
            )
            const thumbVideo = episodes[0]

            return (
              <motion.button
                key={seriesItem.id}
                whileTap={{ scale: 0.99 }}
                onClick={() => router.push(buildExploreUrl(seriesItem.id), { scroll: false })}
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
                        {formatEpisodeCount(seriesItem.episodeCount, locale)}
                      </span>
                    </div>
                  </div>
                )}
                <div className="p-4">
                  <p className="text-[15px] font-semibold text-[var(--text-primary)]">
                    {seriesItem.title}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                    <span>{t('progress', locale)} {getSeriesProgress(seriesItem.id, seriesItem.episodeCount)}%</span>
                  </div>
                </div>
              </motion.button>
            )
          })}
        </div>
      </section>
    </AppPage>
  )
}
