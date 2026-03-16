'use client'

import { useCallback, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { AppPage, SurfaceCard } from '@/components/ui/AppPage'
import { buildShortsUrl } from '@/lib/videoRoutes'
import { getCatalogVideoById } from '@/lib/catalog'
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
  videoId: string
  youtubeId: string
  title: string
}

export default function ClassDetailPage() {
  const params = useParams()
  const router = useRouter()
  const clearDeletedFlag = useWatchHistoryStore((state) => state.clearDeletedFlag)
  const classId = params.classId as string

  const cls: ExpressionClass | undefined = useMemo(
    () => expressionClasses.find((c) => c.id === classId),
    [classId],
  )

  const videos = useMemo<VideoInfo[]>(() => {
    if (!cls) return []
    return cls.videoIds
      .map((videoId) => {
        const catalogVideo = getCatalogVideoById(videoId)
        if (!catalogVideo) return null
        return {
          videoId,
          youtubeId: catalogVideo.youtubeId,
          title: catalogVideo.title,
        }
      })
      .filter((v): v is VideoInfo => v !== null)
  }, [cls])

  const handleBack = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
      return
    }
    router.replace('/explore/learn', { scroll: false })
  }, [router])

  const handlePlayAll = useCallback(() => {
    if (videos.length === 0) return
    const firstVideo = videos[0]
    clearDeletedFlag(firstVideo.videoId)
    router.push(buildShortsUrl(firstVideo.videoId), { scroll: false })
  }, [clearDeletedFlag, router, videos])

  const handlePlayVideo = useCallback(
    (videoId: string) => {
      clearDeletedFlag(videoId)
      router.push(buildShortsUrl(videoId), { scroll: false })
    },
    [clearDeletedFlag, router],
  )

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

      {/* Class info card */}
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

          <div className="mt-4 flex items-center gap-4 text-xs text-[var(--text-muted)]">
            <span>{cls.expressions.length}개 표현</span>
            <span>{videos.length}개 영상</span>
          </div>

          <button
            onClick={handlePlayAll}
            disabled={videos.length === 0}
            className="mt-5 w-full rounded-2xl bg-[var(--accent-primary)] py-3.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            START
          </button>
        </div>
      </SurfaceCard>

      {/* Expressions */}
      <section className="mb-8">
        <h3 className="mb-3 text-lg font-bold text-[var(--text-primary)]">
          표현 목록
        </h3>
        <div className="flex flex-wrap gap-2">
          {cls.expressions.map((expr) => (
            <span
              key={expr}
              className="rounded-full border border-[var(--border-card)] bg-[var(--bg-card)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] shadow-[var(--card-shadow)]"
            >
              {expr}
            </span>
          ))}
        </div>
      </section>

      {/* Video grid */}
      {videos.length > 0 && (
        <section className="mb-8">
          <h3 className="mb-3 text-lg font-bold text-[var(--text-primary)]">
            영상 ({videos.length})
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {videos.map((video, index) => (
              <motion.button
                key={video.videoId}
                initial={{ opacity: 0, y: 12 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: {
                    delay: Math.min(index * 0.04, 0.4),
                    duration: 0.3,
                    ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
                  },
                }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handlePlayVideo(video.videoId)}
                className="overflow-hidden rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] text-left shadow-[var(--card-shadow)]"
              >
                <div className="relative aspect-video overflow-hidden">
                  <Image
                    src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                    alt={video.title}
                    fill
                    sizes="(min-width: 1280px) 22vw, (min-width: 640px) 30vw, 45vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-2.5">
                  <p className="line-clamp-2 text-xs font-medium leading-tight text-[var(--text-primary)]">
                    {video.title}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        </section>
      )}
    </AppPage>
  )
}
