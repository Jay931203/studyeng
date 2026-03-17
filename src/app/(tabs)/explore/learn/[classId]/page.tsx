'use client'

import { useCallback, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { AppPage } from '@/components/ui/AppPage'
import { useReplayStore } from '@/stores/useReplayStore'
import { useFamiliarityStore } from '@/stores/useFamiliarityStore'
import { useOnboardingStore } from '@/stores/useOnboardingStore'
import expressionClasses from '@/data/expression-classes.json'
import {
  buildClassExpressionClips,
  type ExpressionWithClips,
} from '@/lib/classExpressionClips'

type ExpressionClass = (typeof expressionClasses)[number]

const LEVEL_COLORS: Record<string, string> = {
  A1: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  A2: 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/20',
  B1: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/20',
  B2: 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/20',
  C1: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20',
  C2: 'bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/20',
}

const CATEGORY_LABELS: Record<string, string> = {
  function: '기능',
  grammar: '문법',
  situation: '상황',
  level: '레벨',
}

const EXPR_CATEGORY_LABELS: Record<string, string> = {
  phrasal_verb: '구동사',
  idiom: '관용구',
  collocation: '연어',
  fixed_expression: '표현',
  discourse_marker: '담화',
  slang: '속어',
  hedging: '완곡',
  exclamation: '감탄',
  filler: '필러',
}

const INITIAL_RENDER_COUNT = 4
const LOAD_MORE_COUNT = 4

function getCefrBadgeStyle(cefr: string): { bg: string; text: string } {
  const level = cefr.toUpperCase()
  if (level === 'A1' || level === 'A2') {
    return { bg: 'rgba(34, 197, 94, 0.16)', text: '#4ade80' }
  }
  if (level === 'B1' || level === 'B2') {
    return { bg: 'rgba(59, 130, 246, 0.16)', text: '#60a5fa' }
  }
  if (level === 'C1' || level === 'C2') {
    return { bg: 'rgba(168, 85, 247, 0.16)', text: '#c084fc' }
  }
  return { bg: 'rgba(255, 255, 255, 0.08)', text: 'rgba(255, 255, 255, 0.6)' }
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
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
  )
}

function ClipCard({
  youtubeId,
  videoTitle,
  sentenceEn,
  isPlaying,
  onPlay,
}: {
  youtubeId: string
  videoTitle: string
  sentenceEn: string
  isPlaying: boolean
  onPlay: () => void
}) {
  return (
    <button
      onClick={onPlay}
      className="group flex w-[182px] shrink-0 flex-col overflow-hidden rounded-xl border transition-all active:scale-[0.97]"
      style={{
        borderColor: isPlaying ? 'var(--accent-primary)' : 'var(--border-card)',
        backgroundColor: isPlaying ? 'var(--accent-glow)' : 'var(--bg-card)',
      }}
    >
      <div className="relative aspect-video w-full overflow-hidden">
        <Image
          src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
          alt={videoTitle}
          fill
          sizes="182px"
          className="object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{
              backgroundColor: isPlaying
                ? 'var(--accent-primary)'
                : 'rgba(0, 0, 0, 0.6)',
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="white"
              className="ml-0.5 h-4 w-4"
            >
              <path d="M3 3.732a1.5 1.5 0 0 1 2.305-1.265l6.706 4.267a1.5 1.5 0 0 1 0 2.531l-6.706 4.268A1.5 1.5 0 0 1 3 12.267V3.732Z" />
            </svg>
          </div>
        </div>
        {isPlaying && (
          <div
            className="absolute bottom-0 left-0 right-0 h-0.5"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          />
        )}
      </div>
      <div className="flex flex-1 flex-col px-2.5 py-2">
        <p className="mb-1 line-clamp-1 text-[10px] font-medium text-[var(--text-muted)]">
          {videoTitle}
        </p>
        <p className="line-clamp-2 text-[11px] leading-snug text-[var(--text-primary)]">
          {sentenceEn}
        </p>
      </div>
    </button>
  )
}

function ExpressionSection({
  data,
  index,
  total,
}: {
  data: ExpressionWithClips
  index: number
  total: number
}) {
  const play = useReplayStore((s) => s.play)
  const currentClip = useReplayStore((s) => s.clip)
  const isFamiliar = useFamiliarityStore((s) => s.isFamiliar)
  const getFamiliarCount = useFamiliarityStore((s) => s.getFamiliarCount)

  const { entry, clips } = data
  const cefrStyle = getCefrBadgeStyle(entry.cefr)
  const categoryLabel = EXPR_CATEGORY_LABELS[entry.category] ?? entry.category
  const familiar = isFamiliar(entry.id)
  const familiarCount = getFamiliarCount(entry.id)

  const handlePlayClip = useCallback(
    async (clip: (typeof clips)[number]) => {
      let start = clip.start
      let end = clip.end

      if (start === 0 && end === 0) {
        try {
          const response = await fetch(`/transcripts/${clip.youtubeId}.json`)
          if (response.ok) {
            const subtitles = await response.json()
            const matchedSubtitle = subtitles[clip.sentenceIdx]
            if (matchedSubtitle) {
              start = matchedSubtitle.start
              end = matchedSubtitle.end
            }
          }
        } catch {
          // Keep the resolved fallback below.
        }
      }

      play({
        videoId: clip.youtubeId,
        start,
        end: end || start + 5,
        expressionText: entry.canonical,
      })
    },
    [entry.canonical, play],
  )

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.25), duration: 0.32 }}
      className="mb-5"
    >
      <div className="mb-3 flex items-center gap-3">
        <span className="text-xs font-medium text-[var(--text-muted)]">
          {index + 1}/{total}
        </span>
        <div className="h-px flex-1 bg-[var(--border-card)]" />
      </div>

      <div
        className="relative mb-2.5 rounded-xl border p-3.5"
        style={{
          borderColor: 'var(--border-card)',
          backgroundColor: 'var(--bg-card)',
        }}
      >
        <div className="absolute right-4 top-4 flex items-center gap-1">
          {familiar ? (
            <span
              className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{
                backgroundColor: 'rgba(34, 197, 94, 0.12)',
                color: '#4ade80',
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="h-3 w-3"
              >
                <path
                  fillRule="evenodd"
                  d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
                  clipRule="evenodd"
                />
              </svg>
              familiar
            </span>
          ) : (
            <div className="flex items-center gap-[3px]">
              {[0, 1, 2].map((step) => (
                <span
                  key={step}
                  className="inline-block h-[5px] w-[5px] rounded-full"
                  style={{
                    backgroundColor:
                      step < familiarCount
                        ? 'var(--accent-text, #5eead4)'
                        : 'var(--text-muted)',
                    opacity: step < familiarCount ? 1 : 0.3,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <h3 className="pr-20 text-base font-bold text-[var(--text-primary)]">
          {entry.canonical}
        </h3>
        <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
          {entry.meaning_ko}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span
            className="rounded-full px-2 py-[3px] text-[10px] font-bold uppercase leading-none"
            style={{ backgroundColor: cefrStyle.bg, color: cefrStyle.text }}
          >
            {entry.cefr.toUpperCase()}
          </span>
          <span
            className="rounded-full border px-2 py-[3px] text-[10px] font-medium leading-none"
            style={{
              borderColor: 'var(--border-card)',
              color: 'var(--text-muted)',
            }}
          >
            {categoryLabel}
          </span>
          <span className="text-[10px] text-[var(--text-muted)]">
            {clips.length}개 클립
          </span>
        </div>
      </div>

      <div
        className="no-scrollbar flex gap-2.5 overflow-x-auto pb-1"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {clips.map((clip, clipIndex) => {
          const isPlaying =
            currentClip?.videoId === clip.youtubeId &&
            currentClip?.start === clip.start

          return (
            <div
              key={`${clip.youtubeId}-${clip.sentenceIdx}-${clipIndex}`}
              style={{ scrollSnapAlign: 'start' }}
            >
              <ClipCard
                youtubeId={clip.youtubeId}
                videoTitle={clip.videoTitle}
                sentenceEn={clip.sentenceEn}
                isPlaying={isPlaying}
                onPlay={() => handlePlayClip(clip)}
              />
            </div>
          )
        })}
      </div>
    </motion.section>
  )
}

export default function ClassDetailPage() {
  const params = useParams()
  const router = useRouter()
  const currentLevel = useOnboardingStore((s) => s.level)
  const classId = params.classId as string

  const cls: ExpressionClass | undefined = useMemo(
    () => expressionClasses.find((entry) => entry.id === classId),
    [classId],
  )

  const expressionData = useMemo<ExpressionWithClips[]>(() => {
    if (!cls) return []
    return buildClassExpressionClips(cls.expressions, cls.videoIds)
  }, [cls])

  const [renderCount, setRenderCount] = useState(INITIAL_RENDER_COUNT)
  const visibleData = expressionData.slice(0, renderCount)
  const hasMore = renderCount < expressionData.length

  const handleLoadMore = useCallback(() => {
    setRenderCount((count) => Math.min(count + LOAD_MORE_COUNT, expressionData.length))
  }, [expressionData.length])

  const handleBack = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
      return
    }
    router.replace('/explore/learn', { scroll: false })
  }, [router])

  if (!cls) {
    return (
      <AppPage>
        <div className="flex items-center gap-3">
          <BackButton onClick={handleBack} />
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

  if (cls.level !== currentLevel) {
    return (
      <AppPage>
        <div className="mb-6 flex items-center gap-3">
          <BackButton onClick={handleBack} />
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-text)]">
            LEARN
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] px-6 py-8 shadow-[var(--card-shadow)]">
          <div className="mb-3 flex items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                LEVEL_COLORS[currentLevel] ??
                'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
              }`}
            >
              {currentLevel}
            </span>
            <span className="text-xs text-[var(--text-muted)]">현재 학습 레벨</span>
          </div>

          <p className="text-base font-semibold text-[var(--text-primary)]">
            Learn은 설정된 레벨 클래스만 열 수 있습니다.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
            이 클래스는 {cls.level} 레벨입니다. 설정에서 레벨을 바꾸면 다시 들어올 수 있습니다.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              onClick={handleBack}
              className="rounded-xl border border-[var(--border-card)] bg-[var(--bg-secondary)] px-4 py-2 text-sm font-medium text-[var(--text-primary)]"
            >
              뒤로가기
            </button>
            <button
              onClick={() => router.push('/profile')}
              className="rounded-xl bg-[var(--accent-primary)] px-4 py-2 text-sm font-semibold text-white"
            >
              설정으로 이동
            </button>
          </div>
        </div>
      </AppPage>
    )
  }

  return (
    <AppPage>
      <div className="mb-5 flex items-center gap-3">
        <BackButton onClick={handleBack} />
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-text)]">
          LEARN
        </p>
      </div>

      <div className="mb-5 rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] px-4 py-3.5 shadow-[var(--card-shadow)]">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              LEVEL_COLORS[cls.level] ??
              'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
            }`}
          >
            {cls.level}
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
            {CATEGORY_LABELS[cls.category] ?? cls.category}
          </span>
        </div>

        <h1 className="text-xl font-bold text-[var(--text-primary)]">{cls.titleKo}</h1>
        <p className="mt-1 text-xs text-[var(--text-muted)]">{cls.title}</p>
        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-[var(--text-secondary)]">
          {cls.descriptionKo}
        </p>

        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[10px] text-[var(--text-muted)]">
          <span>{expressionData.length}개 표현</span>
          <span>{cls.videoIds.length}개 영상</span>
          <span>클립을 누르면 해당 구간이 바로 재생됩니다.</span>
        </div>
      </div>

      {visibleData.map((data, index) => (
        <ExpressionSection
          key={data.entry.id}
          data={data}
          index={index}
          total={expressionData.length}
        />
      ))}

      {hasMore && (
        <div className="mb-8 flex justify-center">
          <button
            onClick={handleLoadMore}
            className="rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] px-6 py-3 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)]"
          >
            더 보기 ({expressionData.length - renderCount}개)
          </button>
        </div>
      )}

      {expressionData.length === 0 && (
        <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] px-6 py-10 text-center">
          <p className="text-sm text-[var(--text-secondary)]">
            이 클래스에 연결된 클립이 아직 없습니다.
          </p>
        </div>
      )}
    </AppPage>
  )
}
