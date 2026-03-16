'use client'

import { useCallback, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { AppPage, SurfaceCard } from '@/components/ui/AppPage'
import { buildShortsUrl } from '@/lib/videoRoutes'
import { getCatalogVideoByYoutubeId } from '@/lib/catalog'
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore'
import expressionClasses from '@/data/expression-classes.json'

type ExpressionClass = (typeof expressionClasses)[number]

const LEVEL_COLORS: Record<string, string> = {
  A1: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/20',
  A2: 'bg-teal-500/15 text-teal-600 border-teal-500/20',
  B1: 'bg-sky-500/15 text-sky-600 border-sky-500/20',
  B2: 'bg-violet-500/15 text-violet-600 border-violet-500/20',
  C1: 'bg-rose-500/15 text-rose-600 border-rose-500/20',
}

const CATEGORY_LABELS: Record<string, string> = {
  function: '기능',
  grammar: '문법',
  situation: '상황',
  level: '레벨',
}

interface VideoInfo {
  videoId: string // seed-video id (for routing/history)
  youtubeId: string
  title: string
}

export default function ClassDetailPage() {
  const params = useParams()
  const router = useRouter()
  const clearDeletedFlag = useWatchHistoryStore((state) => state.clearDeletedFlag)
  const isVideoEverWatched = useWatchHistoryStore((state) => state.isVideoEverWatched)
  const classId = params.classId as string

  const cls: ExpressionClass | undefined = useMemo(
    () => expressionClasses.find((c) => c.id === classId),
    [classId],
  )

  // Fix: videoIds in expression-classes.json are YouTube IDs, not seed-video IDs
  // Use getCatalogVideoByYoutubeId to look them up correctly
  const videos = useMemo<VideoInfo[]>(() => {
    if (!cls) return []
    return cls.videoIds
      .map((ytId) => {
        const catalogVideo = getCatalogVideoByYoutubeId(ytId)
        if (!catalogVideo) return null
        return {
          videoId: catalogVideo.id, // seed-video id for routing
          youtubeId: ytId,
          title: catalogVideo.title,
        }
      })
      .filter((v): v is VideoInfo => v !== null)
  }, [cls])

  // Track watched status per video
  const watchedCount = useMemo(() => {
    return videos.filter((v) => isVideoEverWatched(v.videoId)).length
  }, [videos, isVideoEverWatched])

  const progressPercent = videos.length > 0 ? Math.round((watchedCount / videos.length) * 100) : 0
  const isCompleted = watchedCount > 0 && watchedCount === videos.length

  // Find the next unwatched video in sequence
  const nextVideoIndex = useMemo(() => {
    const idx = videos.findIndex((v) => !isVideoEverWatched(v.videoId))
    return idx === -1 ? 0 : idx
  }, [videos, isVideoEverWatched])

  // Expression mastery: track how many videos each expression appears in that the user has watched
  // For now we use a simple heuristic: expressions become "discovered" proportionally with video progress
  const expressionMastery = useMemo(() => {
    if (!cls) return new Map<string, 'locked' | 'discovered' | 'mastered'>()
    const total = videos.length
    const watched = watchedCount
    const expressions = cls.expressions
    const map = new Map<string, 'locked' | 'discovered' | 'mastered'>()

    expressions.forEach((expr, i) => {
      if (total === 0) {
        map.set(expr, 'locked')
        return
      }
      // Expressions are "discovered" proportionally as you watch videos
      const threshold = Math.floor((i / expressions.length) * total)
      if (watched > threshold + Math.ceil(total * 0.3)) {
        map.set(expr, 'mastered')
      } else if (watched > threshold) {
        map.set(expr, 'discovered')
      } else {
        map.set(expr, 'locked')
      }
    })
    return map
  }, [cls, videos.length, watchedCount])

  const masteredCount = useMemo(() => {
    let count = 0
    expressionMastery.forEach((v) => { if (v === 'mastered') count++ })
    return count
  }, [expressionMastery])

  const discoveredCount = useMemo(() => {
    let count = 0
    expressionMastery.forEach((v) => { if (v === 'discovered' || v === 'mastered') count++ })
    return count
  }, [expressionMastery])

  const handleBack = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
      return
    }
    router.replace('/explore/learn', { scroll: false })
  }, [router])

  const handlePlayVideo = useCallback(
    (videoId: string) => {
      clearDeletedFlag(videoId)
      router.push(buildShortsUrl(videoId), { scroll: false })
    },
    [clearDeletedFlag, router],
  )

  const handleContinue = useCallback(() => {
    if (videos.length === 0) return
    const video = videos[nextVideoIndex]
    clearDeletedFlag(video.videoId)
    router.push(buildShortsUrl(video.videoId), { scroll: false })
  }, [clearDeletedFlag, nextVideoIndex, router, videos])

  if (!cls) {
    return (
      <AppPage>
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="text-[var(--text-secondary)] transition-transform active:scale-90"
            aria-label="Back"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-5 w-5"
            >
              <path
                fillRule="evenodd"
                d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-text)]">
            LEARN
          </p>
        </div>
        <div className="mt-10 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] px-6 py-10 text-center shadow-[var(--card-shadow)]">
          <p className="text-sm font-medium text-[var(--text-primary)]">
            클래스를 찾을 수 없습니다
          </p>
        </div>
      </AppPage>
    )
  }

  return (
    <AppPage>
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={handleBack}
          className="text-[var(--text-secondary)] transition-transform active:scale-90"
          aria-label="Back"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-5 w-5"
          >
            <path
              fillRule="evenodd"
              d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-text)]">
          LEARN
        </p>
      </div>

      {/* Class info card with progress */}
      <SurfaceCard className="mb-6 overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none h-1.5"
          style={{
            background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
          }}
        />
        <div className="p-6">
          <div className="mb-3 flex items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                LEVEL_COLORS[cls.level] ?? 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
              }`}
            >
              {cls.level}
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
              {CATEGORY_LABELS[cls.category] ?? cls.category}
            </span>
          </div>

          <h2 className="text-2xl font-bold text-[var(--text-primary)]">{cls.titleKo}</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{cls.title}</p>
          <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
            {cls.descriptionKo}
          </p>

          {/* Progress bar */}
          {videos.length > 0 && (
            <div className="mt-5">
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-xs font-semibold text-[var(--text-primary)]">
                  {watchedCount}/{videos.length} 영상 완료
                </span>
                <span className="text-xs font-medium text-[var(--text-muted)]">
                  {progressPercent}%
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-[var(--bg-secondary)]">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: isCompleted
                      ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                      : 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </div>
          )}

          {/* Stats row */}
          <div className="mt-4 flex items-center gap-4 text-xs text-[var(--text-muted)]">
            <span>{cls.expressions.length}개 표현</span>
            <span>{videos.length}개 영상</span>
            {discoveredCount > 0 && (
              <span>{masteredCount}/{cls.expressions.length} 표현 습득</span>
            )}
          </div>

          {/* CTA button */}
          <button
            onClick={handleContinue}
            disabled={videos.length === 0}
            className="mt-5 w-full rounded-2xl bg-[var(--accent-primary)] py-3.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isCompleted
              ? '다시 학습하기'
              : watchedCount > 0
                ? `이어서 보기 (${nextVideoIndex + 1}/${videos.length})`
                : 'START'}
          </button>
        </div>
      </SurfaceCard>

      {/* Expression mastery */}
      <section className="mb-8">
        <h3 className="mb-3 text-lg font-bold text-[var(--text-primary)]">
          표현 목록
        </h3>
        <div className="flex flex-wrap gap-2">
          {cls.expressions.map((expr) => {
            const status = expressionMastery.get(expr) ?? 'locked'
            return (
              <span
                key={expr}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium shadow-[var(--card-shadow)] transition-all duration-300 ${
                  status === 'mastered'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600'
                    : status === 'discovered'
                      ? 'border-[var(--accent-primary)]/25 bg-[var(--accent-glow)] text-[var(--accent-text)]'
                      : 'border-[var(--border-card)] bg-[var(--bg-card)] text-[var(--text-muted)]'
                }`}
              >
                {status === 'mastered' && (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="-ml-0.5 mr-1 inline-block h-3 w-3">
                    <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                  </svg>
                )}
                {expr}
              </span>
            )
          })}
        </div>
        {watchedCount === 0 && (
          <p className="mt-3 text-xs text-[var(--text-muted)]">
            영상을 시청하면 표현이 하나씩 활성화됩니다
          </p>
        )}
      </section>

      {/* Sequential video path */}
      {videos.length > 0 && (
        <section className="mb-8">
          <h3 className="mb-4 text-lg font-bold text-[var(--text-primary)]">
            학습 경로
          </h3>
          <div className="relative">
            {/* Vertical line connecting the nodes */}
            <div
              className="absolute left-5 top-0 w-0.5 bg-[var(--border-card)]"
              style={{ height: `calc(100% - 1.5rem)` }}
            />
            {/* Progress overlay on the line */}
            {watchedCount > 0 && (
              <motion.div
                className="absolute left-5 top-0 w-0.5"
                style={{
                  background: 'linear-gradient(180deg, var(--accent-primary), var(--accent-secondary))',
                }}
                initial={{ height: 0 }}
                animate={{
                  height: `calc(${Math.min((watchedCount / videos.length) * 100, 100)}% - 1.5rem)`,
                }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              />
            )}

            <div className="space-y-1">
              {videos.map((video, index) => {
                const watched = isVideoEverWatched(video.videoId)
                const isCurrent = index === nextVideoIndex && !isCompleted
                const isFuture = index > nextVideoIndex && !isCompleted

                return (
                  <motion.div
                    key={video.videoId}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{
                      opacity: 1,
                      x: 0,
                      transition: {
                        delay: Math.min(index * 0.05, 0.5),
                        duration: 0.35,
                        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
                      },
                    }}
                    className="relative flex items-start gap-4"
                  >
                    {/* Node indicator */}
                    <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center">
                      {watched ? (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-primary)] text-white">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
                            <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                          </svg>
                        </div>
                      ) : isCurrent ? (
                        <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-[var(--accent-primary)] bg-[var(--bg-card)]">
                          <div className="h-3 w-3 rounded-full bg-[var(--accent-primary)]" />
                          <div className="absolute inset-0 animate-ping rounded-full border border-[var(--accent-primary)] opacity-20" />
                        </div>
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-card)] bg-[var(--bg-secondary)]">
                          <span className="text-[11px] font-semibold text-[var(--text-muted)]">
                            {index + 1}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Video card */}
                    <button
                      onClick={() => handlePlayVideo(video.videoId)}
                      className={`flex flex-1 gap-3 overflow-hidden rounded-xl border p-2 text-left transition-all ${
                        isCurrent
                          ? 'border-[var(--accent-primary)]/30 bg-[var(--accent-glow)] shadow-sm'
                          : watched
                            ? 'border-[var(--border-card)] bg-[var(--bg-card)] shadow-[var(--card-shadow)]'
                            : isFuture
                              ? 'border-[var(--border-card)] bg-[var(--bg-card)] opacity-60'
                              : 'border-[var(--border-card)] bg-[var(--bg-card)] shadow-[var(--card-shadow)]'
                      }`}
                    >
                      <div className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-lg sm:w-28">
                        <Image
                          src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                          alt={video.title}
                          fill
                          sizes="112px"
                          className={`object-cover ${isFuture ? 'brightness-75' : ''}`}
                        />
                        {/* Play icon overlay */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className={`flex h-7 w-7 items-center justify-center rounded-full ${
                            isCurrent ? 'bg-[var(--accent-primary)]' : 'bg-black/50'
                          }`}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="white" className="ml-0.5 h-3.5 w-3.5">
                              <path d="M3 3.732a1.5 1.5 0 0 1 2.305-1.265l6.706 4.267a1.5 1.5 0 0 1 0 2.531l-6.706 4.268A1.5 1.5 0 0 1 3 12.267V3.732Z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col justify-center py-0.5">
                        <p className={`line-clamp-2 text-[13px] font-medium leading-snug ${
                          isCurrent ? 'text-[var(--accent-text)]' : 'text-[var(--text-primary)]'
                        }`}>
                          {video.title}
                        </p>
                        {isCurrent && (
                          <p className="mt-1 text-[11px] font-medium text-[var(--accent-primary)]">
                            다음 영상
                          </p>
                        )}
                        {watched && (
                          <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                            시청 완료
                          </p>
                        )}
                      </div>
                    </button>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Completion celebration */}
      {isCompleted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center"
        >
          <div className="mb-2 text-2xl">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="mx-auto h-10 w-10 text-emerald-500">
              <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.49 4.49 0 0 1-3.498-1.306 4.491 4.491 0 0 1-1.307-3.498A4.49 4.49 0 0 1 2.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 0 1 1.307-3.497 4.49 4.49 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-base font-bold text-emerald-600">
            클래스 완료!
          </p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            모든 영상을 시청했습니다. 표현들을 다시 복습해 보세요.
          </p>
        </motion.div>
      )}
    </AppPage>
  )
}
