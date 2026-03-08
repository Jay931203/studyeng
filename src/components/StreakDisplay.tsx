'use client'

import { motion } from 'framer-motion'

interface StreakDisplayProps {
  days: number
}

function LoopIcon({ active }: { active: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-6 w-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.5 7.5h8.75A3.25 3.25 0 0 1 19.5 10.75v.75M16.5 4.5 19.5 7.5l-3 3M16.5 16.5H7.75A3.25 3.25 0 0 1 4.5 13.25v-.75M7.5 19.5l-3-3 3-3"
      />
      {active && <circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none" />}
    </svg>
  )
}

export function StreakDisplay({ days }: StreakDisplayProps) {
  const weekDays = ['월', '화', '수', '목', '금', '토', '일']
  const isZero = days === 0
  const activeCount = days > 0 ? ((days - 1) % 7) + 1 : 0

  return (
    <div
      className={`rounded-2xl border p-5 shadow-[var(--card-shadow)] sm:p-6 ${
        isZero
          ? 'border-[var(--border-card)] bg-[var(--bg-card)]'
          : 'border-[var(--border-card)] bg-gradient-to-br from-[var(--accent-primary)]/14 via-transparent to-transparent'
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-[20px] border ${
              isZero
                ? 'border-[var(--border-card)] bg-[var(--bg-secondary)] text-[var(--accent-text)]'
                : 'border-[var(--border-card)] bg-[var(--accent-primary)]/12 text-[var(--accent-text)]'
            }`}
          >
            <LoopIcon active={!isZero} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
              루틴
            </p>
            <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">
              {isZero ? '루프가 비어 있어요' : `${days}일 이어 보는 중`}
            </p>
            <p
              className={`mt-1 text-sm ${
                isZero ? 'text-[var(--text-secondary)]' : 'text-[var(--text-secondary)]'
              }`}
            >
              {isZero
                ? '오늘 장면 하나면 다시 켜집니다.'
                : '길게 하지 않아도 됩니다. 오늘 한 장면만 더 보면 됩니다.'}
            </p>
          </div>
        </div>

        <div className="rounded-[22px] border border-[var(--border-card)] bg-black/15 px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
            이번 주
          </p>
          <p className="mt-1 text-xl font-semibold text-[var(--text-primary)]">
            {activeCount}
            <span className="ml-1 text-sm font-medium text-[var(--text-muted)]">/7</span>
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-7 gap-2 sm:gap-3">
        {weekDays.map((day, index) => {
          const isCompleted = index < activeCount

          return (
            <div key={day} className="flex flex-col items-center">
              <motion.div
                initial={isCompleted ? { scale: 0.5 } : false}
                animate={isCompleted ? { scale: 1 } : {}}
                transition={{ type: 'spring', stiffness: 400, damping: 20, delay: index * 0.05 }}
                className={`flex h-10 w-10 items-center justify-center rounded-2xl border text-xs font-semibold transition-colors duration-300 sm:h-11 sm:w-11 ${
                  isCompleted
                    ? 'border-transparent bg-[var(--accent-primary)] text-white shadow-lg shadow-[var(--accent-primary)]/20'
                    : 'border-[var(--border-card)] bg-[var(--bg-secondary)] text-[var(--text-muted)]'
                }`}
              >
                {isCompleted ? <span className="h-2.5 w-2.5 rounded-full bg-black/75" /> : day}
              </motion.div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
