'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useAdminStore, type AdminIssue } from '@/stores/useAdminStore'
import { seedVideos } from '@/data/seed-videos'

const typeLabels: Record<string, { label: string; color: string }> = {
  subtitle: { label: '자막', color: 'text-yellow-400 bg-yellow-400/10' },
  video: { label: '영상', color: 'text-blue-400 bg-blue-400/10' },
  other: { label: '기타', color: 'text-gray-400 bg-gray-400/10' },
}

function IssueCard({ issue, onResolve }: { issue: AdminIssue; onResolve: () => void }) {
  const video = seedVideos.find((v) => v.id === issue.videoId)
  const videoTitle = video?.title ?? issue.videoId
  const typeInfo = typeLabels[issue.type] ?? typeLabels.other
  const date = new Date(issue.timestamp)
  const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -60 }}
      className="bg-[var(--bg-secondary)] rounded-lg p-3 mb-2"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[var(--text-primary)] text-xs font-medium line-clamp-1">
            {videoTitle}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${typeInfo.color}`}>
              {typeInfo.label}
            </span>
            <span className="text-[var(--text-muted)] text-[10px]">{dateStr}</span>
          </div>
          <p className="text-[var(--text-secondary)] text-xs mt-1.5 leading-relaxed">
            {issue.description}
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onResolve}
          className="shrink-0 w-7 h-7 rounded-full bg-green-500/10 flex items-center justify-center"
          aria-label="해결 완료"
          title="해결 완료"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-green-400">
            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
          </svg>
        </motion.button>
      </div>
    </motion.div>
  )
}

export function AdminIssuesList() {
  const { isAdmin, issues, resolveIssue, clearResolved } = useAdminStore()

  if (!isAdmin) return null

  const unresolvedIssues = issues.filter((i) => !i.resolved)
  const resolvedCount = issues.filter((i) => i.resolved).length

  return (
    <div className="mt-3 bg-[var(--bg-card)] shadow-[var(--card-shadow)] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--border-card)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-orange-400">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
          </svg>
          <span className="text-orange-400 text-xs font-semibold">ISSUES</span>
          <span className="text-[var(--text-muted)] text-[10px]">
            {unresolvedIssues.length}건 미해결
          </span>
        </div>
        {resolvedCount > 0 && (
          <button
            onClick={() => {
              if (confirm(`해결된 ${resolvedCount}건을 삭제하시겠습니까?`)) {
                clearResolved()
              }
            }}
            className="text-[var(--text-muted)] text-[10px] font-medium bg-[var(--bg-secondary)] px-2 py-1 rounded-md active:scale-95 transition-transform"
          >
            해결 {resolvedCount}건 삭제
          </button>
        )}
      </div>

      {/* Issues list */}
      <div className="px-3 py-2 max-h-[300px] overflow-y-auto no-scrollbar">
        {unresolvedIssues.length === 0 ? (
          <p className="text-[var(--text-muted)] text-xs text-center py-4">
            미해결 이슈 없음
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
