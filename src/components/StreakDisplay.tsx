'use client'

interface StreakDisplayProps {
  days: number
}

export function StreakDisplay({ days }: StreakDisplayProps) {
  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  return (
    <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 shadow-[var(--card-shadow)] rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{'\uD83D\uDD25'}</span>
        <div>
          <p className="text-[var(--text-primary)] text-2xl font-bold">{days}일 연속</p>
          <p className="text-orange-300/70 text-xs">계속 이어가세요!</p>
        </div>
      </div>
      <div className="flex justify-between">
        {weekDays.map((day, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                i < (days % 7)
                  ? 'bg-orange-500 text-white'
                  : 'bg-[var(--bg-card)] text-[var(--text-muted)]'
              }`}
            >
              {i < (days % 7) ? '\u2713' : day}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
