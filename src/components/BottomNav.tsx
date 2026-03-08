'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { usePathname, useSearchParams } from 'next/navigation'

const tabs = [
  { href: '/explore', icon: 'home', label: '홈' },
  { href: '/shorts', icon: 'play', label: '쇼츠' },
  { href: '/learning', icon: 'book', label: '복습' },
  { href: '/profile', icon: 'user', label: 'MY' },
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
  book: (active) => (
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
  user: (active) => (
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
        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
      />
    </svg>
  ),
}

export function BottomNav() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isLegacyShortsAlias =
    pathname === '/' && Boolean(searchParams.get('v') || searchParams.get('series'))

  return (
    <nav className="safe-area-bottom sticky bottom-0 left-0 right-0 z-50 border-t border-[var(--border-card)] bg-[var(--bg-nav)] backdrop-blur-2xl">
      <div className="grid h-[64px] grid-cols-4 px-2">
        {tabs.map(({ href, icon, label }) => {
          const isActive =
            href === '/shorts'
              ? pathname === '/shorts' || isLegacyShortsAlias
              : href === '/explore'
                ? pathname === '/explore'
                : pathname.startsWith(href)

          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className={`relative flex flex-col items-center justify-center gap-1 rounded-2xl transition-all duration-200 active:scale-95 ${
                isActive ? 'text-[var(--nav-active)]' : 'text-[var(--nav-inactive)]'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute inset-x-5 top-0 h-[2px] rounded-full bg-[var(--nav-indicator)]"
                  transition={{ type: 'spring', stiffness: 520, damping: 36 }}
                />
              )}

              <motion.div
                animate={{ scale: isActive ? 1 : 0.92, y: isActive ? -1 : 0 }}
                transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                className="relative z-10"
              >
                {icons[icon](isActive)}
              </motion.div>

              <span
                className={`text-[11px] font-medium leading-none ${
                  isActive ? 'opacity-100' : 'opacity-85'
                }`}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
