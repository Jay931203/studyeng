'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence } from 'framer-motion'
import { ComprehensionBadge } from '@/components/ComprehensionBadge'
import { TodayDashboard } from '@/components/DailyMissions'
import { SavedPhraseCard } from '@/components/SavedPhraseCard'
import { WatchHistory } from '@/components/WatchHistory'
import { GameLauncher } from '@/components/games/GameLauncher'
import { AppPage, SurfaceCard } from '@/components/ui/AppPage'
import { getCatalogSeriesById, getCatalogVideoById } from '@/lib/catalog'
import { getCategoryLabels } from '@/lib/uiTranslations'
import { buildShortsUrl } from '@/lib/videoRoutes'
import { useLikeStore } from '@/stores/useLikeStore'
import { usePhraseStore } from '@/stores/usePhraseStore'
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore'
import { useOnboardingStore } from '@/stores/useOnboardingStore'
import { useLocaleStore } from '@/stores/useLocaleStore'
import { CEFR_ORDER, LEVEL_LABELS } from '@/types/level'

const TRANSLATIONS = {
  ko: {
    viewDetails: '상세보기',
    level: '레벨',
    nextLevel: (name: string) => `다음 단계 ${name}`,
    maxLevel: '현재 최고 레벨',
    savedExpressions: '저장 표현',
    likedVideos: (n: number) => `좋아요한 영상 ${n}개`,
    completedVideos: '완료한 영상',
    totalPlays: (n: number) => `전체 재생 ${n}회`,
    noLikedVideos: '아직 좋아요한 영상이 없습니다.',
    noSavedExpressions: '아직 저장한 표현이 없습니다.',
  },
  ja: {
    viewDetails: '詳細',
    level: 'レベル',
    nextLevel: (name: string) => `次のステップ ${name}`,
    maxLevel: '現在の最高レベル',
    savedExpressions: '保存した表現',
    likedVideos: (n: number) => `お気に入り動画 ${n}件`,
    completedVideos: '視聴済み動画',
    totalPlays: (n: number) => `全再生 ${n}回`,
    noLikedVideos: 'お気に入りの動画はまだありません。',
    noSavedExpressions: '保存した表現はまだありません。',
  },
  'zh-TW': {
    viewDetails: '查看詳情',
    level: '等級',
    nextLevel: (name: string) => `下一階段 ${name}`,
    maxLevel: '目前最高等級',
    savedExpressions: '已儲存表達',
    likedVideos: (n: number) => `喜歡的影片 ${n}部`,
    completedVideos: '已完成影片',
    totalPlays: (n: number) => `總播放 ${n}次`,
    noLikedVideos: '還沒有喜歡的影片。',
    noSavedExpressions: '還沒有儲存的表達。',
  },
  vi: {
    viewDetails: 'Xem chi ti\u1EBFt',
    level: 'C\u1EA5p \u0111\u1ED9',
    nextLevel: (name: string) => `C\u1EA5p \u0111\u1ED9 ti\u1EBFp theo ${name}`,
    maxLevel: 'C\u1EA5p \u0111\u1ED9 cao nh\u1EA5t hi\u1EC7n t\u1EA1i',
    savedExpressions: 'Bi\u1EC3u th\u1EE9c \u0111\u00E3 l\u01B0u',
    likedVideos: (n: number) => `Video y\u00EAu th\u00EDch ${n}`,
    completedVideos: 'Video \u0111\u00E3 ho\u00E0n th\u00E0nh',
    totalPlays: (n: number) => `T\u1ED5ng l\u01B0\u1EE3t ph\u00E1t ${n}`,
    noLikedVideos: 'Ch\u01B0a c\u00F3 video y\u00EAu th\u00EDch.',
    noSavedExpressions: 'Ch\u01B0a c\u00F3 bi\u1EC3u th\u1EE9c \u0111\u00E3 l\u01B0u.',
  },
} as const

export default function LearningPage() {
  const locale = useLocaleStore((s) => s.locale)
  const T = TRANSLATIONS[locale as keyof typeof TRANSLATIONS] ?? TRANSLATIONS.ko
  const categoryLabels = getCategoryLabels(locale)
  const router = useRouter()
  const { phrases, removePhrase } = usePhraseStore()
  const clearDeletedFlag = useWatchHistoryStore((state) => state.clearDeletedFlag)
  const viewCounts = useWatchHistoryStore((state) => state.viewCounts)
  const watchedVideoIds = useWatchHistoryStore((state) => state.watchedVideoIds)
  const likes = useLikeStore((state) => state.likes)
  const level = useOnboardingStore((state) => state.level)

  const totalViews = useMemo(
    () => Object.values(viewCounts).reduce((sum, count) => sum + count, 0),
    [viewCounts],
  )

  const levelIdx = CEFR_ORDER.indexOf(level)
  const nextLevel = levelIdx < CEFR_ORDER.length - 1 ? CEFR_ORDER[levelIdx + 1] : null
  const nextLevelLabel = nextLevel ? LEVEL_LABELS[nextLevel] : null
  const likedVideos = useMemo(
    () =>
      Object.keys(likes)
        .map((id) => getCatalogVideoById(id))
        .filter(Boolean) as NonNullable<ReturnType<typeof getCatalogVideoById>>[],
    [likes],
  )

  return (
    <AppPage>
      <TodayDashboard />

      <div className="mt-6 space-y-6">
        <SurfaceCard className="p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
              STATS
            </p>
            <Link
              href="/learning/stats"
              className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]"
            >
              {T.viewDetails}
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <OverviewStatCard
              label={T.level}
              value={LEVEL_LABELS[level]}
              detail={nextLevelLabel ? T.nextLevel(nextLevelLabel) : T.maxLevel}
              accent
            />

            <OverviewStatCard
              label={T.savedExpressions}
              value={phrases.length}
              detail={T.likedVideos(likedVideos.length)}
            />

            <OverviewStatCard
              label={T.completedVideos}
              value={watchedVideoIds.length}
              detail={T.totalPlays(totalViews)}
            />
          </div>
        </SurfaceCard>

        <GameLauncher />

        <SurfaceCard className="p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
              LIKED
            </p>
            {likedVideos.length > 0 && (
              <Link
                href="/learning/liked"
                className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]"
              >
                {T.viewDetails}
              </Link>
            )}
          </div>

          {likedVideos.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-[var(--border-card)] px-5 py-8 text-center">
              <p className="text-sm text-[var(--text-secondary)]">{T.noLikedVideos}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {likedVideos.slice(0, 5).map((video) => {
                const count = viewCounts[video.id] ?? 0
                const categoryLabel = categoryLabels[video.category] ?? ''
                const seriesTitle = video.seriesId
                  ? getCatalogSeriesById(video.seriesId)?.title
                  : null

                return (
                  <button
                    key={video.id}
                    onClick={() => {
                      clearDeletedFlag(video.id)
                      router.push(buildShortsUrl(video.id, video.seriesId))
                    }}
                    className="flex items-center gap-3 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-3 text-left shadow-[var(--card-shadow)]"
                  >
                    <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-xl">
                      <Image
                        src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                        alt={video.title}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                      {count > 0 && (
                        <div className="absolute bottom-0.5 right-0.5 rounded bg-black/70 px-1 py-0.5 text-[9px] font-bold text-white">
                          x{count > 99 ? '99+' : count}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                        {video.title}
                      </p>
                      {seriesTitle && (
                        <p className="mt-1 truncate text-xs text-[var(--text-secondary)]">
                          {seriesTitle}
                        </p>
                      )}
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="text-xs text-[var(--text-muted)]">{categoryLabel}</span>
                        <span className="text-[10px] text-[var(--text-muted)]">&middot;</span>
                        <span className="text-xs text-[var(--text-muted)]">Lv.{video.difficulty}</span>
                        <ComprehensionBadge videoId={video.id} compact />
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </SurfaceCard>

        <SurfaceCard className="p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
              SAVED
            </p>
            {phrases.length > 0 && (
              <Link
                href="/learning/saved"
                className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]"
              >
                {T.viewDetails}
              </Link>
            )}
          </div>

          {phrases.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-[var(--border-card)] px-5 py-8 text-center">
              <p className="text-sm text-[var(--text-secondary)]">{T.noSavedExpressions}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <AnimatePresence>
                {phrases.slice(0, 3).map((phrase) => (
                  <SavedPhraseCard
                    key={phrase.id}
                    phrase={phrase}
                    onDelete={() => removePhrase(phrase.id)}
                    onPlay={() => {
                      clearDeletedFlag(phrase.videoId)
                      const seriesId = getCatalogVideoById(phrase.videoId)?.seriesId
                      const baseUrl = buildShortsUrl(phrase.videoId, seriesId)
                      const separator = baseUrl.includes('?') ? '&' : '?'
                      const url = `${baseUrl}${separator}t=${phrase.timestampStart}&phraseId=${phrase.id}`
                      router.push(url)
                    }}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </SurfaceCard>

        <WatchHistory />
      </div>
    </AppPage>
  )
}

function OverviewStatCard({
  label,
  value,
  detail,
  accent = false,
}: {
  label: string
  value: string | number
  detail: string
  accent?: boolean
}) {
  return (
    <div
      className="rounded-2xl border px-4 py-3"
      style={{
        borderColor: accent ? 'rgba(var(--accent-primary-rgb), 0.2)' : 'var(--border-card)',
        backgroundColor: accent ? 'var(--accent-glow)' : 'var(--bg-secondary)',
      }}
    >
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{value}</p>
      <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">{detail}</p>
    </div>
  )
}
