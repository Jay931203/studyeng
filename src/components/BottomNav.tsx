'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { usePathname, useSearchParams } from 'next/navigation'
import { Logo } from './Logo'

const tabs = [
  {
    href: '/explore',
    icon: 'home',
    label: '오늘',
    description: '추천과 이어보기',
  },
  {
    href: '/shorts',
    icon: 'play',
    label: '피드',
    description: '자막과 반복',
  },
  {
    href: '/learning',
    icon: 'bookmark',
    label: '보관함',
    description: '저장 표현과 기록',
  },
  {
    href: '/profile',
    icon: 'settings',
    label: '설정',
    description: '계정과 앱 톤',
  },
] as const

const icons: Record<string, (active: boolean) => ReactNode> = {
  home: (active) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={active ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={active ? 0 : 1.7}
      className="h-[21px] w-[21px]"
    >
      <path d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  ),
  play: (active) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={active ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={active ? 0 : 1.7}
      className="h-[21px] w-[21px]"
    >
      <path d="M6.75 5.653c0-1.336 1.433-2.183 2.603-1.54l9.161 5.036c1.211.666 1.211 2.404 0 3.07l-9.16 5.036c-1.171.643-2.604-.204-2.604-1.54V5.653Z" />
    </svg>
  ),
  bookmark: (active) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={active ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={active ? 0 : 1.7}
      className="h-[21px] w-[21px]"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 6.75A2.25 2.25 0 0 1 4.5 4.5h6.19c.596 0 1.17.237 1.591.659l.53.53a.75.75 0 0 0 .53.22h6.16A2.25 2.25 0 0 1 21.75 8.16v9.09A2.25 2.25 0 0 1 19.5 19.5H13.34a.75.75 0 0 0-.53.22l-.53.53a2.25 2.25 0 0 1-1.59.66H4.5a2.25 2.25 0 0 1-2.25-2.25V6.75Z"
      />
    </svg>
  ),
  settings: (active) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={active ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={active ? 0 : 1.7}
      className="h-[21px] w-[21px]"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.592c.55 0 1.02.398 1.11.94l.213 1.274c.066.39.363.701.744.836.28.1.55.216.808.347.354.18.785.156 1.098-.047l1.022-.665a1.125 1.125 0 0 1 1.457.127l1.832 1.832c.39.39.444 1.003.127 1.457l-.665 1.022a1.125 1.125 0 0 0-.047 1.098c.13.258.247.529.347.808.135.38.446.678.836.744l1.274.213c.542.09.94.56.94 1.11v2.592c0 .55-.398 1.02-.94 1.11l-1.274.213a1.125 1.125 0 0 0-.836.744 7.466 7.466 0 0 1-.347.808c-.18.354-.156.785.047 1.098l.665 1.022a1.125 1.125 0 0 1-.127 1.457l-1.832 1.832a1.125 1.125 0 0 1-1.457.127l-1.022-.665a1.125 1.125 0 0 0-1.098-.047 7.466 7.466 0 0 1-.808.347 1.125 1.125 0 0 0-.744.836l-.213 1.274a1.125 1.125 0 0 1-1.11.94h-2.592a1.125 1.125 0 0 1-1.11-.94l-.213-1.274a1.125 1.125 0 0 0-.744-.836 7.466 7.466 0 0 1-.808-.347 1.125 1.125 0 0 0-1.098.047l-1.022.665a1.125 1.125 0 0 1-1.457-.127l-1.832-1.832a1.125 1.125 0 0 1-.127-1.457l.665-1.022c.203-.313.227-.744.047-1.098a7.466 7.466 0 0 1-.347-.808 1.125 1.125 0 0 0-.836-.744l-1.274-.213A1.125 1.125 0 0 1 3 13.296v-2.592c0-.55.398-1.02.94-1.11l1.274-.213a1.125 1.125 0 0 0 .836-.744 7.466 7.466 0 0 1 .347-.808c.18-.354.156-.785-.047-1.098l-.665-1.022a1.125 1.125 0 0 1 .127-1.457l1.832-1.832a1.125 1.125 0 0 1 1.457-.127l1.022.665c.313.203.744.227 1.098.047.258-.13.529-.247.808-.347.38-.135.678-.446.744-.836l.213-1.274Z"
      />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
}

interface BottomNavProps {
  mode?: 'bottom' | 'sidebar' | 'rail'
}

function isTabActive(pathname: string, href: string, isLegacyShortsAlias: boolean) {
  if (href === '/shorts') {
    return pathname === '/shorts' || isLegacyShortsAlias
  }

  if (href === '/explore') {
    return pathname === '/explore'
  }

  return pathname.startsWith(href)
}

export function BottomNav({ mode = 'bottom' }: BottomNavProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isLegacyShortsAlias =
    pathname === '/' && Boolean(searchParams.get('v') || searchParams.get('series'))

  if (mode === 'rail') {
    return (
      <aside className="flex h-full flex-col rounded-[28px] border border-[var(--border-card)] bg-[var(--bg-card)]/88 p-2 shadow-[var(--card-shadow)] backdrop-blur-xl">
        <div className="mb-3 flex items-center justify-center rounded-[20px] bg-black/20 px-2 py-3">
          <Logo className="h-5 text-[var(--text-primary)]" />
        </div>

        <nav className="flex flex-1 flex-col items-center gap-2">
          {tabs.map(({ href, icon, label }) => {
            const active = isTabActive(pathname, href, isLegacyShortsAlias)

            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                aria-current={active ? 'page' : undefined}
                className={`flex w-full flex-col items-center justify-center gap-1 rounded-[20px] px-2 py-3 text-center transition-all ${
                  active
                    ? 'bg-[var(--accent-glow)] text-[var(--nav-active)]'
                    : 'text-[var(--nav-inactive)] hover:bg-[var(--bg-secondary)]/45'
                }`}
              >
                <div className="relative z-10">{icons[icon](active)}</div>
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>
    )
  }

  if (mode === 'sidebar') {
    return (
      <aside className="hidden h-full flex-col rounded-[32px] border border-[var(--border-card)] bg-[var(--bg-card)]/88 p-4 shadow-[var(--card-shadow)] backdrop-blur-xl lg:flex">
        <div className="rounded-[28px] border border-[var(--border-card)] bg-black/20 px-4 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--accent-text)]">
            Shortee
          </p>
          <Logo className="mt-3 h-7 text-[var(--text-primary)]" />
        </div>

        <nav className="mt-5 flex flex-1 flex-col gap-2">
          {tabs.map(({ href, icon, label, description }) => {
            const active = isTabActive(pathname, href, isLegacyShortsAlias)

            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                aria-current={active ? 'page' : undefined}
                className={`rounded-2xl border px-4 py-3 transition-all ${
                  active
                    ? 'border-[var(--accent-primary)]/35 bg-[var(--accent-glow)]'
                    : 'border-transparent hover:border-[var(--border-card)] hover:bg-[var(--bg-secondary)]/45'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                      active
                        ? 'bg-[var(--accent-primary)] text-white'
                        : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {icons[icon](active)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{label}</p>
                    <p className="mt-0.5 text-xs text-[var(--text-muted)]">{description}</p>
                  </div>
                </div>
              </Link>
            )
          })}
        </nav>

      </aside>
    )
  }

  return (
    <nav className="safe-area-bottom sticky bottom-0 left-0 right-0 z-50 border-t border-[var(--border-card)] bg-[var(--bg-nav)]/92 backdrop-blur-2xl lg:hidden">
      <div className="grid h-[74px] grid-cols-4 gap-1 px-2 pb-2 pt-1">
        {tabs.map(({ href, icon, label }) => {
          const active = isTabActive(pathname, href, isLegacyShortsAlias)

          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center gap-1 rounded-[20px] px-1 py-2 transition-all duration-200 active:scale-95 ${
                active
                  ? 'bg-[var(--accent-glow)] text-[var(--nav-active)]'
                  : 'text-[var(--nav-inactive)]'
              }`}
            >
              {active && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute inset-x-4 top-0 h-[2px] rounded-full bg-[var(--nav-indicator)]"
                  transition={{ type: 'spring', stiffness: 520, damping: 36 }}
                />
              )}

              <motion.div
                animate={{ scale: active ? 1 : 0.92, y: active ? -1 : 0 }}
                transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                className="relative z-10"
              >
                {icons[icon](active)}
              </motion.div>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
