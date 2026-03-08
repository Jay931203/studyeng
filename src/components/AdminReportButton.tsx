'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAdminStore, type IssueType } from '@/stores/useAdminStore'

interface AdminReportButtonProps {
  videoId: string
  youtubeId: string
}

const issueTypes: { value: IssueType; label: string }[] = [
  { value: 'subtitle', label: '자막' },
  { value: 'video', label: '영상' },
  { value: 'other', label: '기타' },
]

export function AdminReportButton({ videoId, youtubeId }: AdminReportButtonProps) {
  const { isAdminActive, addIssue, getUnresolvedCount } = useAdminStore()
  const [isOpen, setIsOpen] = useState(false)
  const [type, setType] = useState<IssueType>('subtitle')
  const [description, setDescription] = useState('')

  if (!isAdminActive()) return null

  const unresolvedCount = getUnresolvedCount()

  const handleClose = () => {
    setIsOpen(false)
  }

  const handleSubmit = () => {
    const trimmed = description.trim()
    if (!trimmed) return

    addIssue(videoId, youtubeId, type, trimmed)
    setDescription('')
    setType('subtitle')
    handleClose()
  }

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.94 }}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`fixed top-16 right-4 z-[70] flex h-11 min-w-[44px] items-center justify-center gap-2 rounded-full px-3 shadow-lg backdrop-blur-sm transition-colors ${
          isOpen ? 'bg-red-600 text-white' : 'bg-red-500/90 text-white'
        }`}
        aria-label="이슈 리포트 열기"
        aria-expanded={isOpen}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
          <path d="M3.5 2.75a.75.75 0 0 0-1.5 0v14.5a.75.75 0 0 0 1.5 0v-4.392l1.657-.348a6.449 6.449 0 0 1 4.271.572 7.948 7.948 0 0 0 5.965.524l2.078-.64A.75.75 0 0 0 18 11.75V3.885a.75.75 0 0 0-.975-.716l-2.296.707a6.449 6.449 0 0 1-4.848-.426 7.948 7.948 0 0 0-5.259-.704L3.5 3.99V2.75Z" />
        </svg>
        <span className="text-xs font-semibold">리포트</span>
        {unresolvedCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-red-500">
            {unresolvedCount}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="fixed left-4 right-4 top-32 z-[60] mx-auto w-auto max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-4 shadow-2xl">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">이슈 리포트</h3>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      나중에 한 번에 수정할 수 있도록 영상 이슈를 기록합니다.
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-secondary)] text-[var(--text-muted)]"
                    aria-label="리포트 닫기"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                    </svg>
                  </button>
                </div>

                <div className="mb-3 rounded-xl bg-[var(--bg-secondary)] px-3 py-2">
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Video ID <span className="text-[var(--text-secondary)]">{videoId}</span>
                  </p>
                </div>

                <div className="mb-3 flex gap-2">
                  {issueTypes.map((issue) => (
                    <button
                      key={issue.value}
                      onClick={() => setType(issue.value)}
                      className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                        type === issue.value
                          ? 'border-red-500/30 bg-red-500/20 text-red-400'
                          : 'border-transparent bg-[var(--bg-secondary)] text-[var(--text-muted)]'
                      }`}
                    >
                      {issue.label}
                    </button>
                  ))}
                </div>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="문제를 간단히 적어주세요"
                  rows={4}
                  className="w-full resize-none rounded-xl border border-transparent bg-[var(--bg-secondary)] p-3 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-red-500/30"
                />

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={handleClose}
                    className="flex-1 rounded-xl bg-[var(--bg-secondary)] py-3 text-sm font-medium text-[var(--text-secondary)]"
                  >
                    닫기
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubmit}
                    disabled={!description.trim()}
                    className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    리포트 저장
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
