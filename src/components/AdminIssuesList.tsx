'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { seedVideos } from '@/data/seed-videos'
import {
  useAdminStore,
  type AdminIssue,
  type HiddenVideo,
  type IssueType,
} from '@/stores/useAdminStore'

const typeStyles: Record<IssueType, { label: string; className: string }> = {
  subtitle: {
    label: 'SUBTITLE',
    className: 'bg-[var(--accent-primary)]/12 text-[var(--accent-text)]',
  },
  video: {
    label: 'VIDEO',
    className: 'bg-blue-400/12 text-blue-300',
  },
  other: {
    label: 'OTHER',
    className: 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]',
  },
}

function formatTimestamp(timestamp: number) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(timestamp))
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

function getVideoMeta(videoId: string) {
  return seedVideos.find((video) => video.id === videoId) ?? null
}

function buildIssueReplyMailto(issue: AdminIssue) {
  if (!issue.reporterEmail) return null

  const subject = encodeURIComponent(`[Shortee] Report follow-up for ${issue.videoId}`)
  const body = encodeURIComponent(
    [
      'Hi,',
      '',
      `We reviewed your report for video ${issue.videoId}.`,
      `Issue type: ${issue.type}`,
      `YouTube ID: ${issue.youtubeId}`,
      '',
      'Reply here if you have more details to add.',
    ].join('\n'),
  )

  return `mailto:${issue.reporterEmail}?subject=${subject}&body=${body}`
}

function IssueCard({
  issue,
  hidden,
  pending,
  chatPending,
  onResolve,
  onToggleHidden,
  onOpenChat,
}: {
  issue: AdminIssue
  hidden: boolean
  pending: boolean
  chatPending: boolean
  onResolve: () => void
  onToggleHidden: () => void
  onOpenChat: () => void
}) {
  const video = getVideoMeta(issue.videoId)
  const type = typeStyles[issue.type] ?? typeStyles.other
  const replyMailto = buildIssueReplyMailto(issue)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -60 }}
      className="rounded-2xl bg-[var(--bg-secondary)] p-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${type.className}`}>
              {type.label}
            </span>
            {hidden && (
              <span className="rounded-full bg-red-500/12 px-2 py-0.5 text-[10px] font-semibold text-red-300">
                HIDDEN
              </span>
            )}
            <span className="text-[10px] text-[var(--text-muted)]">
              {formatTimestamp(issue.timestamp)}
            </span>
          </div>

          <p className="mt-2 truncate text-sm font-medium text-[var(--text-primary)]">
            {video?.title ?? issue.videoId}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
            {issue.description}
          </p>

          <div className="mt-2 space-y-1 text-[10px] text-[var(--text-muted)]">
            <p>YouTube ID: {issue.youtubeId}</p>
            {issue.reporterEmail && <p>Reporter: {issue.reporterEmail}</p>}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 self-start">
          {issue.reporterUserId && (
            <button
              type="button"
              onClick={onOpenChat}
              disabled={chatPending}
              className="rounded-full bg-[var(--bg-card)] px-3 py-2 text-[10px] font-semibold text-[var(--text-secondary)] disabled:opacity-40"
            >
              {chatPending ? 'OPENING' : 'CHAT'}
            </button>
          )}
          {replyMailto && (
            <a
              href={replyMailto}
              className="rounded-full bg-[var(--bg-card)] px-3 py-2 text-[10px] font-semibold text-[var(--text-secondary)]"
            >
              EMAIL
            </a>
          )}
          <button
            type="button"
            onClick={onToggleHidden}
            disabled={pending}
            className="rounded-full bg-[var(--bg-card)] px-3 py-2 text-[10px] font-semibold text-[var(--text-secondary)] disabled:opacity-40"
          >
            {hidden ? 'SHOW' : 'HIDE'}
          </button>
          <button
            type="button"
            onClick={onResolve}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400"
            aria-label="Resolve issue"
            title="Resolve issue"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
            >
              <path
                fillRule="evenodd"
                d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function HiddenVideoCard({
  hiddenVideo,
  pending,
  onShow,
}: {
  hiddenVideo: HiddenVideo
  pending: boolean
  onShow: () => void
}) {
  const video = getVideoMeta(hiddenVideo.videoId)

  return (
    <div className="rounded-2xl bg-[var(--bg-secondary)] p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-red-500/12 px-2 py-0.5 text-[10px] font-semibold text-red-300">
              HIDDEN
            </span>
            <span className="text-[10px] text-[var(--text-muted)]">
              {formatTimestamp(new Date(hiddenVideo.hiddenAt).getTime())}
            </span>
          </div>

          <p className="mt-2 truncate text-sm font-medium text-[var(--text-primary)]">
            {video?.title ?? hiddenVideo.videoId}
          </p>
          <p className="mt-1 text-[10px] text-[var(--text-muted)]">
            Video ID: {hiddenVideo.videoId}
          </p>
        </div>

        <button
          type="button"
          onClick={onShow}
          disabled={pending}
          className="rounded-full bg-[var(--bg-card)] px-3 py-2 text-[10px] font-semibold text-[var(--text-secondary)] disabled:opacity-40"
        >
          SHOW
        </button>
      </div>
    </div>
  )
}

export function AdminIssuesList() {
  const adminSyncError = useAdminStore((state) => state.adminSyncError)
  const clearResolved = useAdminStore((state) => state.clearResolved)
  const exportReportBundle = useAdminStore((state) => state.exportReportBundle)
  const hiddenVideos = useAdminStore((state) => state.hiddenVideos)
  const hideVideo = useAdminStore((state) => state.hideVideo)
  const isAdminActive = useAdminStore((state) => state.isAdminActive)
  const issues = useAdminStore((state) => state.issues)
  const resolveIssue = useAdminStore((state) => state.resolveIssue)
  const setAdminSyncError = useAdminStore((state) => state.setAdminSyncError)
  const showVideo = useAdminStore((state) => state.showVideo)
  const router = useRouter()

  const [pendingVideoId, setPendingVideoId] = useState<string | null>(null)
  const [pendingChatIssueId, setPendingChatIssueId] = useState<string | null>(null)

  const unresolvedIssues = useMemo(() => issues.filter((issue) => !issue.resolved), [issues])
  const resolvedCount = issues.length - unresolvedIssues.length
  const hiddenVideoIds = useMemo(
    () => new Set(hiddenVideos.map((video) => video.videoId)),
    [hiddenVideos],
  )

  if (!isAdminActive()) return null

  const handleExport = async () => {
    const payload = exportReportBundle()
    const copied = await copyText(payload)

    if (copied) {
      window.alert(`Copied ${issues.length} reports to clipboard.`)
      return
    }

    window.prompt('Report bundle JSON', payload)
  }

  const handleToggleHidden = async (videoId: string, hidden: boolean) => {
    setPendingVideoId(videoId)
    if (hidden) {
      await showVideo(videoId)
    } else {
      await hideVideo(videoId)
    }
    setPendingVideoId(null)
  }

  const handleOpenChat = async (issue: AdminIssue) => {
    if (!issue.reporterUserId) {
      setAdminSyncError('This report is missing the reporter account link.')
      return
    }

    setPendingChatIssueId(issue.id)
    setAdminSyncError(null)

    try {
      const response = await fetch('/api/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'admin-open-thread',
          targetUserId: issue.reporterUserId,
          targetUserEmail: issue.reporterEmail ?? null,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = (await response.json()) as { thread: { id: string } }
      router.push(`/support?view=inbox&threadId=${encodeURIComponent(data.thread.id)}`)
    } catch (error) {
      console.error('[admin-issues] open chat failed:', error)
      setAdminSyncError('Could not open the support thread for this report.')
    } finally {
      setPendingChatIssueId(null)
    }
  }

  return (
    <div className="mt-3 overflow-hidden rounded-2xl bg-[var(--bg-card)] shadow-[var(--card-shadow)]">
      <div className="flex items-center justify-between border-b border-[var(--border-card)] px-4 py-3">
        <div>
          <p className="text-xs font-semibold text-orange-400">ISSUE REPORTS</p>
          <p className="text-[10px] text-[var(--text-muted)]">
            Open {unresolvedIssues.length} · Resolved {resolvedCount} · Hidden {hiddenVideos.length}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={issues.length === 0}
            className="rounded-lg bg-[var(--bg-secondary)] px-3 py-2 text-[11px] font-medium text-[var(--text-secondary)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            COPY JSON
          </button>
          {resolvedCount > 0 && (
            <button
              onClick={clearResolved}
              className="rounded-lg bg-[var(--bg-secondary)] px-3 py-2 text-[11px] font-medium text-[var(--text-muted)]"
            >
              CLEAR RESOLVED
            </button>
          )}
        </div>
      </div>

      <div className="max-h-[420px] space-y-4 overflow-y-auto px-3 py-3 no-scrollbar">
        {adminSyncError && (
          <div className="rounded-xl border border-[var(--border-card)] bg-[var(--bg-secondary)] px-3 py-2 text-xs text-[var(--text-secondary)]">
            <div className="flex items-start justify-between gap-3">
              <span>{adminSyncError}</span>
              <button
                onClick={() => setAdminSyncError(null)}
                className="text-[10px] font-semibold text-[var(--text-secondary)]"
              >
                CLOSE
              </button>
            </div>
          </div>
        )}

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--accent-text)]">
            Open Reports
          </p>
          {unresolvedIssues.length === 0 ? (
            <p className="rounded-2xl bg-[var(--bg-secondary)] px-4 py-5 text-center text-xs text-[var(--text-muted)]">
              No open reports.
            </p>
          ) : (
            <AnimatePresence mode="popLayout">
              {unresolvedIssues.map((issue) => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  hidden={hiddenVideoIds.has(issue.videoId)}
                  pending={pendingVideoId === issue.videoId}
                  chatPending={pendingChatIssueId === issue.id}
                  onResolve={() => resolveIssue(issue.id)}
                  onToggleHidden={() =>
                    void handleToggleHidden(issue.videoId, hiddenVideoIds.has(issue.videoId))
                  }
                  onOpenChat={() => void handleOpenChat(issue)}
                />
              ))}
            </AnimatePresence>
          )}
        </div>

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--accent-text)]">
            Hidden Videos
          </p>
          {hiddenVideos.length === 0 ? (
            <p className="rounded-2xl bg-[var(--bg-secondary)] px-4 py-5 text-center text-xs text-[var(--text-muted)]">
              No hidden videos.
            </p>
          ) : (
            <div className="space-y-2">
              {hiddenVideos.map((hiddenVideo) => (
                <HiddenVideoCard
                  key={hiddenVideo.videoId}
                  hiddenVideo={hiddenVideo}
                  pending={pendingVideoId === hiddenVideo.videoId}
                  onShow={() => void handleToggleHidden(hiddenVideo.videoId, true)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
