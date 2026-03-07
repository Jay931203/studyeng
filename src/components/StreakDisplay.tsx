'use client'

import { motion } from 'framer-motion'

interface StreakDisplayProps {
  days: number
}

export function StreakDisplay({ days }: StreakDisplayProps) {
  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  const isZero = days === 0

  return (
    <div className={`shadow-[var(--card-shadow)] rounded-2xl p-5 ${
      isZero
        ? 'bg-[var(--bg-card)]'
        : 'bg-gradient-to-br from-orange-500/20 to-red-500/20'
    }`}>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{isZero ? '\u2728' : '\uD83D\uDD25'}</span>
        <div>
          <p className="text-[var(--text-primary)] text-2xl font-bold">
            {isZero ? '오늘 시작해요!' : `${days}일 연속`}
          </p>
          <p className={`text-xs ${isZero ? 'text-[var(--text-muted)]' : 'text-orange-300/70'}`}>
            {isZero ? '영상 하나만 보면 연속 학습 시작!' : '계속 이어가세요!'}
          </p>
        </div>
      </div>
      <div className="flex justify-between">
        {weekDays.map((day, i) => {
          const isCompleted = i < (days % 7 || (days > 0 && days % 7 === 0 ? 7 : 0))
          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <motion.div
                initial={isCompleted ? { scale: 0.5 } : false}
                animate={isCompleted ? { scale: 1 } : {}}
                transition={{ type: 'spring', stiffness: 400, damping: 20, delay: i * 0.05 }}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-colors duration-300 ${
                  isCompleted
                    ? 'bg-orange-500 text-white'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-muted)]'
                }`}
              >
                {isCompleted ? '\u2713' : day}
              </motion.div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
