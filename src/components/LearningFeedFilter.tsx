'use client'

export type LearningFeedFilterValue = 'all' | 'series' | 'shorts'

const FILTER_OPTIONS: Array<{ value: LearningFeedFilterValue; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'series', label: 'Series' },
  { value: 'shorts', label: 'Shorts' },
]

interface LearningFeedFilterProps {
  value: LearningFeedFilterValue
  onChange: (value: LearningFeedFilterValue) => void
}

export function LearningFeedFilter({ value, onChange }: LearningFeedFilterProps) {
  return (
    <div className="mb-4 inline-flex rounded-full border border-[var(--border-card)] bg-[var(--bg-secondary)]/35 p-1">
      {FILTER_OPTIONS.map((option) => {
        const active = option.value === value

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              active ? 'bg-[var(--accent-glow)]' : ''
            }`}
            style={{
              color: active ? 'var(--accent-text)' : 'var(--text-secondary)',
            }}
            aria-pressed={active}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
