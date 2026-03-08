'use client'

import type { ReactNode } from 'react'

function joinClassNames(...tokens: Array<string | false | null | undefined>) {
  return tokens.filter(Boolean).join(' ')
}

export function AppPage({ children }: { children: ReactNode }) {
  return (
    <div className="h-full overflow-y-auto pb-20 pt-6 lg:pb-10 lg:pt-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">{children}</div>
    </div>
  )
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">
          {description}
        </p>
      </div>
      {action}
    </div>
  )
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && eyebrow !== title && (
          <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
            {eyebrow}
          </p>
        )}
        <h2 className="mt-2 text-2xl font-bold text-[var(--text-primary)]">{title}</h2>
        <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
          {description}
        </p>
      </div>
      {action}
    </div>
  )
}

export function SurfaceCard({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={joinClassNames(
        'rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] shadow-[var(--card-shadow)]',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function MetricCard({
  label,
  value,
  detail,
  tone = 'default',
  className,
}: {
  label: string
  value: string | number
  detail?: string
  tone?: 'default' | 'accent'
  className?: string
}) {
  return (
    <div
      className={joinClassNames(
        'rounded-2xl border px-4 py-3',
        tone === 'accent'
          ? 'border-[var(--accent-primary)]/18 bg-[var(--accent-glow)]'
          : 'border-[var(--border-card)] bg-[var(--bg-secondary)]/45',
        className,
      )}
    >
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{value}</p>
      {detail && (
        <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">{detail}</p>
      )}
    </div>
  )
}
