'use client'

import type { XpHistoryEvent } from '@/stores/useUserStore'

function formatXpTimestamp(createdAt: string) {
  const date = new Date(createdAt)
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function XpHistoryFeed({
  events,
  limit,
  emptyCopy = '아직 기록된 XP 변동이 없습니다.',
}: {
  events: XpHistoryEvent[]
  limit?: number
  emptyCopy?: string
}) {
  const visibleEvents = typeof limit === 'number' ? events.slice(0, limit) : events

  if (visibleEvents.length === 0) {
    return <p className="text-sm text-[var(--text-secondary)]">{emptyCopy}</p>
  }

  return (
    <div className="space-y-3">
      {visibleEvents.map((event) => {
        const amountLabel = event.amount > 0 ? `+${event.amount}` : `${event.amount}`

        return (
          <div key={event.id} className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                {event.reason}
              </p>
              <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                {formatXpTimestamp(event.createdAt)}
              </p>
            </div>
            <span className="shrink-0 text-sm font-semibold text-[var(--accent-text)]">
              {amountLabel} XP
            </span>
          </div>
        )
      })}
    </div>
  )
}
