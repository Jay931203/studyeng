'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { seedVideos } from '@/data/seed-videos'
import { useAdminStore, type AdminIssue, type IssueType } from '@/stores/useAdminStore'

const typeStyles: Record<IssueType, { label: string; className: string }> = {
  subtitle: { label: '자막', className: 'bg-yellow-400/10 text-yellow-400' },
  video: { label: '영상', className: 'bg-blue-400/10 text-blue-400' },
  other: { label: '기타', className: 'bg-gray-400/10 text-gray-400' },
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

function IssueCard({ issue, onResolve }: { issue: AdminIssue; onResolve: () => void }) {
  const video = seedVideos.find((item) => item.id === issue.videoId)
  const type = typeStyles[issue.type] ?? typeStyles.other

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
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${type.className}`}
            >
              {type.label}
            </span>
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
          <p className="mt-2 text-[10px] text-[var(--text-muted)]">
            YouTube ID: {issue.youtubeId}
          </p>
        </div>

        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={onResolve}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400"
          aria-label="이슈 해결 처리"
          title="이슈 해결 처리"
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
        </motion.button>
      </div>
    </motion.div>
  )
}

export function AdminIssuesList() {
  const clearResolved = useAdminStore((state) => state.clearResolved)
  const exportReportBundle = useAdminStore((state) => state.exportReportBundle)
  const isAdminActive = useAdminStore((state) => state.isAdminActive)
  const issues = useAdminStore((state) => state.issues)
  const resolveIssue = useAdminStore((state) => state.resolveIssue)

  if (!isAdminActive()) return null

  const unresolvedIssues = issues.filter((issue) => !issue.resolved)
  const resolvedCount = issues.filter((issue) => issue.resolved).length

  const handleExport = async () => {
    const payload = exportReportBundle()
    const copied = await copyText(payload)

    if (copied) {
      window.alert(`리포트 ${issues.length}건을 클립보드에 복사했습니다.`)
      return
    }

    window.prompt('리포트 내보내기', payload)
  }

  return (
    <div className="mt-3 overflow-hidden rounded-2xl bg-[var(--bg-card)] shadow-[var(--card-shadow)]">
      <div className="flex items-center justify-between border-b border-[var(--border-card)] px-4 py-3">
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4 text-orange-400"
          >
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <p className="text-xs font-semibold text-orange-400">ISSUE REPORTS</p>
            <p className="text-[10px] text-[var(--text-muted)]">
              미해결 {unresolvedIssues.length}건 · 해결됨 {resolvedCount}건
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={issues.length === 0}
            className="rounded-lg bg-[var(--bg-secondary)] px-3 py-2 text-[11px] font-medium text-[var(--text-secondary)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            리포트 내보내기
          </button>
          {resolvedCount > 0 && (
            <button
              onClick={clearResolved}
              className="rounded-lg bg-[var(--bg-secondary)] px-3 py-2 text-[11px] font-medium text-[var(--text-muted)]"
            >
              해결된 항목 정리
            </button>
          )}
        </div>
      </div>

      <div className="max-h-[320px] space-y-2 overflow-y-auto px-3 py-3 no-scrollbar">
        {unresolvedIssues.length === 0 ? (
          <p className="py-6 text-center text-xs text-[var(--text-muted)]">
            아직 저장된 미해결 리포트가 없습니다.
          </p>
        ) : (
          <AnimatePresence mode="popLayout">
            {unresolvedIssues.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                onResolve={() => resolveIssue(issue.id)}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
