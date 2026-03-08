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
        d="M17.25 21 12 17.25 6.75 21V5.25A2.25 2.25 0 0 1 9 3h6a2.25 2.25 0 0 1 2.25 2.25V21Z"
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
        d="M4.5 6.75h6m3 0h6m-15 5.25h10.5m3 0h1.5M4.5 17.25h1.5m3 0h10.5"
      />
      <circle cx="12" cy="6.75" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="7.5" cy="17.25" r="1.5" />
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
