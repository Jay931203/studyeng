'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { usePathname, useSearchParams } from 'next/navigation'
import { Logo } from './Logo'

type NavTab = {
  href: string
  icon: NavTabIcon
  label: string
  description?: string
}

type NavTabIcon = 'home' | 'play' | 'bookmark' | 'settings'

const tabs: readonly NavTab[] = [
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
    description: '쇼츠와 자막',
  },
  {
    href: '/learning',
    icon: 'bookmark',
    label: '학습',
    description: '기록과 복습',
  },
  {
    href: '/profile',
    icon: 'settings',
    label: '설정',
  },
]

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
      <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
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
      <path d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
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
          <Logo className="h-7 text-[var(--text-primary)]" />
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
        <div className="flex items-center justify-center rounded-[28px] border border-[var(--border-card)] bg-black/20 px-4 py-5 text-center">
          <Logo className="h-10 text-[var(--text-primary)]" />
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
                    {description ? (
                      <p className="mt-0.5 text-xs text-[var(--text-muted)]">{description}</p>
                    ) : null}
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
