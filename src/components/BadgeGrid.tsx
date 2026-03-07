'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBadgeStore, type Badge } from '@/stores/useBadgeStore'

function formatDate(timestamp: number): string {
  const d = new Date(timestamp)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

function BadgeItem({ badge, index }: { badge: Badge; index: number }) {
  const [showDetail, setShowDetail] = useState(false)

  return (
    <>
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowDetail(true)}
        className={`relative flex flex-col items-center gap-2 p-3 rounded-xl transition-colors ${
          badge.earned
            ? 'bg-gradient-to-br from-amber-500/15 to-yellow-500/15'
            : 'bg-[var(--bg-secondary)]'
        }`}
      >
        {/* Icon */}
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center ${
            badge.earned
              ? 'bg-gradient-to-br from-amber-500 to-yellow-500 shadow-lg shadow-amber-500/20'
              : 'bg-[var(--bg-card)]'
          }`}
        >
          {badge.earned ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6 text-white"
            >
              <path fillRule="evenodd" d={badge.icon} clipRule="evenodd" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5 text-[var(--text-muted)]"
            >
              <path
                fillRule="evenodd"
                d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>

        {/* Name */}
        <span
          className={`text-xs font-medium text-center leading-tight ${
            badge.earned ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'
          }`}
        >
          {badge.name}
        </span>

        {/* Earned checkmark */}
        {badge.earned && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-3 h-3 text-white"
            >
              <path
                fillRule="evenodd"
                d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                clipRule="evenodd"
              />
            </svg>
          </motion.div>
        )}
      </motion.button>

      {/* Detail overlay */}
      <AnimatePresence>
        {showDetail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDetail(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-8"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[var(--bg-card)] rounded-2xl p-6 w-full max-w-[280px] text-center shadow-xl"
            >
              <div
                className={`w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center ${
                  badge.earned
                    ? 'bg-gradient-to-br from-amber-500 to-yellow-500 shadow-lg shadow-amber-500/20'
                    : 'bg-[var(--bg-secondary)]'
                }`}
              >
                {badge.earned ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-8 h-8 text-white"
                  >
                    <path fillRule="evenodd" d={badge.icon} clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-7 h-7 text-[var(--text-muted)]"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>

              <p
                className={`font-bold text-lg ${
                  badge.earned ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'
                }`}
              >
                {badge.name}
              </p>
              <p className="text-[var(--text-secondary)] text-sm mt-1">{badge.description}</p>

              {badge.earned && badge.earnedAt && (
                <p className="text-[var(--text-muted)] text-xs mt-3">
                  {formatDate(badge.earnedAt)} 달성
                </p>
              )}

              {!badge.earned && (
                <p className="text-[var(--text-muted)] text-xs mt-3">
                  아직 달성하지 못했어요
                </p>
              )}

              <button
                onClick={() => setShowDetail(false)}
                className="mt-4 px-6 py-2 bg-[var(--bg-secondary)] text-[var(--text-secondary)] rounded-full text-sm font-medium"
              >
                닫기
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export function BadgeGrid() {
  const badges = useBadgeStore((s) => s.badges)
  const earnedCount = badges.filter((b) => b.earned).length

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[var(--text-primary)] font-bold text-sm">배지</h3>
        <span className="text-[var(--text-muted)] text-xs">
          {earnedCount}/{badges.length}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {badges.map((badge, i) => (
          <BadgeItem key={badge.id} badge={badge} index={i} />
        ))}
      </div>
    </div>
  )
}
