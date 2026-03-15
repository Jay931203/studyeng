'use client'

import type { XpHistoryEvent } from '@/stores/useUserStore'
import { useTranslation } from '@/locales/useTranslation'

const LOCALE_DATE_MAP: Record<string, string> = {
  ko: 'ko-KR',
  ja: 'ja-JP',
  'zh-TW': 'zh-TW',
  vi: 'vi-VN',
}

export function XpHistoryFeed({
  events,
  limit,
  emptyCopy,
}: {
  events: XpHistoryEvent[]
  limit?: number
  emptyCopy?: string
}) {
  const { t, locale } = useTranslation()
  const resolvedEmptyCopy = emptyCopy ?? t('xpHistory.emptyFeed')
  const dateLocale = LOCALE_DATE_MAP[locale] ?? 'ko-KR'
  const visibleEvents = typeof limit === 'number' ? events.slice(0, limit) : events

  if (visibleEvents.length === 0) {
    return <p className="text-sm text-[var(--text-secondary)]">{resolvedEmptyCopy}</p>
  }

  return (
    <div className="space-y-3">
      {visibleEvents.map((event) => {
        const amountLabel = event.amount > 0 ? `+${event.amount}` : `${event.amount}`
        const date = new Date(event.createdAt)
        const formattedDate = date.toLocaleString(dateLocale, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        })

        return (
          <div key={event.id} className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                {event.reason}
              </p>
              <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                {formattedDate}
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
