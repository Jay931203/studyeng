'use client'

import { useMemo, useState } from 'react'
import { MetricCard, SurfaceCard } from '@/components/ui/AppPage'
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore'
import { usePhraseStore } from '@/stores/usePhraseStore'
import { useUserStore } from '@/stores/useUserStore'
import {
  seedVideos,
  series as allSeries,
  categories,
} from '@/data/seed-videos'

// ─── Helpers ──────────────────────────────────────────────

function getDayLabel(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return ['일', '월', '화', '수', '목', '금', '토'][d.getDay()]
}

function CategoryBar({
  label,
  percent,
  index,
}: {
  label: string
  percent: number
  index: number
}) {
  // Use opacity stepping so categories have visual hierarchy
  const opacities = [1, 0.8, 0.65, 0.5, 0.38, 0.28]
  const opacity = opacities[index] ?? 0.28

  return (
    <div className="flex items-center gap-3">
      <span className="w-12 flex-shrink-0 text-right text-xs font-medium text-[var(--text-secondary)]">
        {label}
      </span>
      <div className="relative h-5 flex-1 overflow-hidden rounded-full bg-[var(--bg-secondary)]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.max(percent, 2)}%`,
            backgroundColor: `var(--accent-primary)`,
            opacity,
          }}
        />
      </div>
      <span className="w-10 flex-shrink-0 text-right text-xs tabular-nums text-[var(--text-muted)]">
        {percent}%
      </span>
    </div>
  )
}

function SeriesRow({
  rank,
  title,
  count,
}: {
  rank: number
  title: string
  count: number
}) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-[var(--bg-secondary)] text-xs font-bold text-[var(--text-secondary)]">
        {rank}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm text-[var(--text-primary)]">
        {title}
      </span>
      <span className="flex-shrink-0 text-xs tabular-nums text-[var(--text-muted)]">
        {count}회
      </span>
    </div>
  )
}

function DifficultySegment({
  label,
  percent,
  isActive,
}: {
  label: string
  percent: number
  isActive: boolean
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-xs text-[var(--text-muted)]">{label}</span>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-secondary)]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.max(percent, 2)}%`,
            backgroundColor: isActive
              ? 'var(--accent-primary)'
              : 'var(--text-muted)',
            opacity: isActive ? 1 : 0.5,
          }}
        />
      </div>
      <span className="text-xs font-semibold tabular-nums text-[var(--text-primary)]">
        {percent}%
      </span>
    </div>
  )
}

function WeekBar({
  dayLabel,
  count,
  maxCount,
}: {
  dayLabel: string
  count: number
  maxCount: number
}) {
  const heightPercent = maxCount > 0 ? (count / maxCount) * 100 : 0

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative flex h-20 w-full items-end justify-center">
        <div
          className="w-full max-w-[20px] rounded-t-md transition-all duration-500"
          style={{
            height: count > 0 ? `${Math.max(heightPercent, 8)}%` : '4px',
            backgroundColor:
              count > 0 ? 'var(--accent-primary)' : 'var(--bg-secondary)',
            opacity: count > 0 ? 0.85 : 1,
          }}
        />
      </div>
      <span className="text-[11px] text-[var(--text-muted)]">{dayLabel}</span>
      {count > 0 && (
        <span className="text-[10px] tabular-nums text-[var(--text-secondary)]">
          {count}
        </span>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────

export function ViewingStats() {
  const viewCounts = useWatchHistoryStore((s) => s.viewCounts)
  const watchRecords = useWatchHistoryStore((s) => s.watchRecords)
  const watchedVideoIds = useWatchHistoryStore((s) => s.watchedVideoIds)
  const phrases = usePhraseStore((s) => s.phrases)
  const streakDays = useUserStore((s) => s.streakDays)
  const [statsNow] = useState(() => Date.now())

  const totalWatched = watchedVideoIds.length
  const totalViews = useMemo(
    () => Object.values(viewCounts).reduce((sum, c) => sum + c, 0),
    [viewCounts],
  )

  // ── Build a lookup map for videos ──
  const videoMap = useMemo(() => {
    const map = new Map<string, (typeof seedVideos)[number]>()
    for (const v of seedVideos) {
      map.set(v.id, v)
    }
    return map
  }, [])

  // ── Category breakdown ──
  const categoryStats = useMemo(() => {
    if (totalWatched === 0) return []

    const counts: Record<string, number> = {}
    for (const id of watchedVideoIds) {
      const video = videoMap.get(id)
      if (!video) continue
      counts[video.category] = (counts[video.category] ?? 0) + (viewCounts[id] ?? 1)
    }

    const total = Object.values(counts).reduce((s, c) => s + c, 0)
    if (total === 0) return []

    return categories
      .map((cat) => ({
        id: cat.id,
        label: cat.label,
        count: counts[cat.id] ?? 0,
        percent: Math.round(((counts[cat.id] ?? 0) / total) * 100),
      }))
      .filter((c) => c.count > 0)
      .sort((a, b) => b.count - a.count)
  }, [watchedVideoIds, viewCounts, videoMap, totalWatched])

  // ── Top 5 series ──
  const topSeries = useMemo(() => {
    if (totalWatched === 0) return []

    const seriesCounts: Record<string, number> = {}
    for (const id of watchedVideoIds) {
      const video = videoMap.get(id)
      if (!video?.seriesId) continue
      seriesCounts[video.seriesId] =
        (seriesCounts[video.seriesId] ?? 0) + (viewCounts[id] ?? 1)
    }

    return Object.entries(seriesCounts)
      .map(([seriesId, count]) => {
        const s = allSeries.find((item) => item.id === seriesId)
        return { seriesId, title: s?.title ?? seriesId, count }
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [watchedVideoIds, viewCounts, videoMap, totalWatched])

  // ── Difficulty breakdown ──
  const difficultyStats = useMemo(() => {
    if (totalWatched === 0) return { easy: 0, medium: 0, hard: 0 }

    let easy = 0,
      medium = 0,
      hard = 0
    for (const id of watchedVideoIds) {
      const video = videoMap.get(id)
      if (!video) continue
      const views = viewCounts[id] ?? 1
      if (video.difficulty <= 2) easy += views
      else if (video.difficulty <= 3) medium += views
      else hard += views
    }

    const total = easy + medium + hard
    if (total === 0) return { easy: 0, medium: 0, hard: 0 }

    return {
      easy: Math.round((easy / total) * 100),
      medium: Math.round((medium / total) * 100),
      hard: Math.round((hard / total) * 100),
    }
  }, [watchedVideoIds, viewCounts, videoMap, totalWatched])

  // ── Weekly activity (last 7 days) ──
  const weeklyActivity = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const daysAgo = 6 - i // index 0 = 6 days ago, index 6 = today
      const dayStart = new Date(statsNow)
      dayStart.setDate(dayStart.getDate() - daysAgo)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(dayStart)
      dayEnd.setDate(dayEnd.getDate() + 1)
      return {
        label: getDayLabel(daysAgo),
        start: dayStart.getTime(),
        end: dayEnd.getTime(),
        count: 0,
      }
    })

    for (const record of watchRecords) {
      for (const day of days) {
        if (record.watchedAt >= day.start && record.watchedAt < day.end) {
          day.count++
          break
        }
      }
    }

    const maxCount = Math.max(...days.map((d) => d.count), 1)
    return { days, maxCount }
  }, [statsNow, watchRecords])

  // ── Find preferred difficulty label ──
  const preferredDifficulty = useMemo(() => {
    const { easy, medium, hard } = difficultyStats
    if (easy >= medium && easy >= hard) return '쉬움'
    if (medium >= easy && medium >= hard) return '보통'
    return '어려움'
  }, [difficultyStats])

  // Don't render if there's no data at all
  if (totalWatched === 0) return null

  return (
    <section className="mb-8">
      <div className="flex flex-col gap-3">
        <SurfaceCard className="rounded-[28px] p-4">
          <div className="grid grid-cols-3 gap-3">
            <MetricCard label="누적 시청" value={`${totalWatched}개`} className="text-center" />
            <MetricCard label="저장 표현" value={`${phrases.length}개`} className="text-center" />
            <MetricCard
              label="연속 루프"
              value={`${Math.max(streakDays, totalViews > 0 ? 1 : 0)}일`}
              className="text-center"
            />
          </div>
        </SurfaceCard>

        {categoryStats.length > 0 && (
          <SurfaceCard className="rounded-[28px] p-4">
            <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
              카테고리 선호도
            </h3>
            <div className="flex flex-col gap-2">
              {categoryStats.map((cat, i) => (
                <CategoryBar
                  key={cat.id}
                  label={cat.label}
                  percent={cat.percent}
                  index={i}
                />
              ))}
            </div>
          </SurfaceCard>
        )}

        {topSeries.length > 0 && (
          <SurfaceCard className="rounded-[28px] p-4">
            <h3 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">
              많이 본 시리즈 Top {Math.min(topSeries.length, 5)}
            </h3>
            <div className="flex flex-col">
              {topSeries.map((s, i) => (
                <SeriesRow
                  key={s.seriesId}
                  rank={i + 1}
                  title={s.title}
                  count={s.count}
                />
              ))}
            </div>
          </SurfaceCard>
        )}

        <SurfaceCard className="rounded-[28px] p-4">
          <div className="mb-3 flex items-baseline justify-between">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              선호 난이도
            </h3>
            <span className="text-xs text-[var(--accent-text)]">
              {preferredDifficulty} 선호
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <DifficultySegment
              label="쉬움"
              percent={difficultyStats.easy}
              isActive={preferredDifficulty === '쉬움'}
            />
            <DifficultySegment
              label="보통"
              percent={difficultyStats.medium}
              isActive={preferredDifficulty === '보통'}
            />
            <DifficultySegment
              label="어려움"
              percent={difficultyStats.hard}
              isActive={preferredDifficulty === '어려움'}
            />
          </div>
        </SurfaceCard>

        <SurfaceCard className="rounded-[28px] p-4">
          <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
            이번 주 활동
          </h3>
          <div className="grid grid-cols-7 gap-1">
            {weeklyActivity.days.map((day, i) => (
              <WeekBar
                key={i}
                dayLabel={day.label}
                count={day.count}
                maxCount={weeklyActivity.maxCount}
              />
            ))}
          </div>
        </SurfaceCard>
      </div>
    </section>
  )
}
