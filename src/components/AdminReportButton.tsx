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
  const { isAdmin, addIssue, getUnresolvedCount } = useAdminStore()
  const [isOpen, setIsOpen] = useState(false)
  const [type, setType] = useState<IssueType>('subtitle')
  const [description, setDescription] = useState('')

  if (!isAdmin) return null

  const unresolvedCount = getUnresolvedCount()

  const handleSubmit = () => {
    if (!description.trim()) return
    addIssue(videoId, youtubeId, type, description.trim())
    setDescription('')
    setType('subtitle')
    setIsOpen(false)
  }

  return (
    <>
      {/* Floating report button — bottom-right, above bottom nav */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-[76px] right-4 z-40 w-11 h-11 rounded-full bg-red-500/90 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-red-500/25"
        aria-label="이슈 리포트"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-white">
          <path d="M3.5 2.75a.75.75 0 0 0-1.5 0v14.5a.75.75 0 0 0 1.5 0v-4.392l1.657-.348a6.449 6.449 0 0 1 4.271.572 7.948 7.948 0 0 0 5.965.524l2.078-.64A.75.75 0 0 0 18 11.75V3.885a.75.75 0 0 0-.975-.716l-2.296.707a6.449 6.449 0 0 1-4.848-.426 7.948 7.948 0 0 0-5.259-.704L3.5 3.99V2.75Z" />
        </svg>
        {unresolvedCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-white text-red-500 text-[10px] font-bold flex items-center justify-center px-1">
            {unresolvedCount}
          </span>
        )}
      </motion.button>

      {/* Report modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, y: 60, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 60, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto"
            >
              <div className="bg-[var(--bg-card)] rounded-t-2xl p-5 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-red-400">
                      <path d="M3.5 2.75a.75.75 0 0 0-1.5 0v14.5a.75.75 0 0 0 1.5 0v-4.392l1.657-.348a6.449 6.449 0 0 1 4.271.572 7.948 7.948 0 0 0 5.965.524l2.078-.64A.75.75 0 0 0 18 11.75V3.885a.75.75 0 0 0-.975-.716l-2.296.707a6.449 6.449 0 0 1-4.848-.426 7.948 7.948 0 0 0-5.259-.704L3.5 3.99V2.75Z" />
                    </svg>
                    <h3 className="text-[var(--text-primary)] font-semibold text-sm">이슈 리포트</h3>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-8 h-8 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-[var(--text-muted)]">
                      <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                    </svg>
                  </button>
                </div>

                {/* Video context */}
                <div className="mb-3 px-3 py-2 bg-[var(--bg-secondary)] rounded-lg">
                  <p className="text-[var(--text-muted)] text-[11px]">
                    Video: <span className="text-[var(--text-secondary)]">{videoId}</span>
                  </p>
                </div>

                {/* Issue type selector */}
                <div className="flex gap-2 mb-3">
                  {issueTypes.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setType(t.value)}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                        type === t.value
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] border border-transparent'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Description */}
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="이슈 설명..."
                  rows={3}
                  className="w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm rounded-lg p-3 border border-transparent focus:border-red-500/30 focus:outline-none resize-none placeholder:text-[var(--text-muted)]"
                />

                {/* Submit */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  disabled={!description.trim()}
                  className="w-full mt-3 py-3 bg-red-500 text-white rounded-xl text-sm font-semibold disabled:opacity-30 disabled:cursor-not-allowed active:bg-red-600 transition-colors"
                >
                  리포트 제출
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
