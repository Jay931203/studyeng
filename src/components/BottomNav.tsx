'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslation } from '@/locales/useTranslation'
import { Logo } from './Logo'

type NavTabIcon = 'home' | 'play' | 'bookmark' | 'settings'
type FeedOption = 'series' | 'shorts'

type NavTab = {
  href: string
  icon: NavTabIcon
  labelKey: 'home' | 'seriesAndShorts' | 'my' | 'settings'
  descKey: 'homeDesc' | 'seriesAndShortsDesc' | 'myDesc' | 'settingsDesc'
}

const tabs: readonly NavTab[] = [
  { href: '/explore', icon: 'home', labelKey: 'home', descKey: 'homeDesc' },
  { href: '/shorts', icon: 'play', labelKey: 'seriesAndShorts', descKey: 'seriesAndShortsDesc' },
  { href: '/learning', icon: 'bookmark', labelKey: 'my', descKey: 'myDesc' },
  { href: '/profile', icon: 'settings', labelKey: 'settings', descKey: 'settingsDesc' },
]

const icons: Record<NavTabIcon, (active: boolean) => ReactNode> = {
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

function FeedBurst({ animationKey }: { animationKey: string | null }) {
  if (!animationKey) return null

  const particles = [
    { className: '-top-1 left-1/2', x: 0, y: -8, delay: 0 },
    { className: 'top-1/2 -right-1', x: 8, y: 0, delay: 0.04 },
    { className: 'bottom-0 left-0', x: -6, y: 4, delay: 0.08 },
  ]

  return (
    <>
      {particles.map((particle, index) => (
        <motion.span
          key={`${animationKey}-${index}`}
          initial={{ opacity: 0, scale: 0.35, x: 0, y: 0 }}
          animate={{ opacity: [0, 0.9, 0], scale: [0.35, 1, 0.65], x: particle.x, y: particle.y }}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1], delay: particle.delay }}
          className={`pointer-events-none absolute h-1.5 w-1.5 rounded-full ${particle.className}`}
          style={{ backgroundColor: 'var(--nav-active)' }}
        />
      ))}
    </>
  )
}

function FeedLabel({
  label,
  selected,
  animationKey,
  onClick,
}: {
  label: string
  selected: boolean
  animationKey: string | null
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={selected}
      className="rounded-full px-1 py-0.5 transition-colors"
      style={{ color: selected ? 'var(--nav-active)' : 'var(--nav-inactive)' }}
    >
      <span className="relative inline-flex items-center justify-center">
        <FeedBurst animationKey={selected ? animationKey : null} />
        <motion.span
          key={`${label}-${selected ? animationKey ?? 'on' : 'off'}`}
          initial={selected ? { scale: 0.92, opacity: 0.72 } : false}
          animate={selected ? { scale: [1, 1.12, 1], opacity: 1 } : { scale: 1, opacity: 1 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          {label}
        </motion.span>
      </span>
    </button>
  )
}

interface BottomNavProps {
  mode?: 'bottom' | 'sidebar' | 'rail'
}

function useFeedNavigation() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isLegacyShortsAlias =
    pathname === '/' && Boolean(searchParams.get('v') || searchParams.get('series'))
  const isOnShortsPage = pathname === '/shorts' || isLegacyShortsAlias
  const isShortsMode = isOnShortsPage && searchParams.get('feed') === 'shorts'
  const activeFeed: FeedOption | null = isOnShortsPage ? (isShortsMode ? 'shorts' : 'series') : null
  const feedAnimationKey = activeFeed ? `${activeFeed}-entry` : null

  const navigateToFeed = (feed: FeedOption) => {
    router.push(feed === 'shorts' ? '/shorts?feed=shorts' : '/shorts', { scroll: false })
  }

  const getTabHref = (tab: NavTab) => {
    if (tab.href !== '/shorts') return tab.href
    return '/shorts?feed=shorts'
  }

  return {
    activeFeed,
    feedAnimationKey,
    getTabHref,
    isLegacyShortsAlias,
    pathname,
    navigateToFeed,
  }
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

export function LandscapeFeedSwitcher() {
  const { activeFeed, feedAnimationKey, navigateToFeed } = useFeedNavigation()

  if (!activeFeed) return null

  return (
    <div
      className="pointer-events-auto flex w-[108px] flex-col items-center gap-2 rounded-[22px] border px-2.5 py-3 shadow-[var(--card-shadow)] backdrop-blur-2xl"
      style={{
        backgroundColor: 'rgba(10, 12, 18, 0.74)',
        borderColor: 'var(--border-card)',
      }}
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <motion.button
        type="button"
        onClick={() => {
          navigateToFeed(activeFeed === 'shorts' ? 'series' : 'shorts')
        }}
        aria-label="Toggle feed"
        animate={{ scale: 1, y: -1 }}
        transition={{ type: 'spring', stiffness: 420, damping: 28 }}
        className="relative z-10 rounded-full transition-opacity active:scale-95"
        style={{ color: 'var(--nav-active)' }}
      >
        {icons.play(true)}
      </motion.button>

      <div className="flex items-center gap-1 text-[10px] font-medium leading-none">
        <FeedLabel
          label="Series"
          selected={activeFeed === 'series'}
          animationKey={feedAnimationKey}
          onClick={() => {
            if (activeFeed === 'series') return
            navigateToFeed('series')
          }}
        />
        <span aria-hidden="true" style={{ color: 'var(--nav-divider)' }}>
          |
        </span>
        <FeedLabel
          label="Shorts"
          selected={activeFeed === 'shorts'}
          animationKey={feedAnimationKey}
          onClick={() => {
            if (activeFeed === 'shorts') return
            navigateToFeed('shorts')
          }}
        />
      </div>
    </div>
  )
}

export function BottomNav({ mode = 'bottom' }: BottomNavProps) {
  const { t } = useTranslation()
  const { pathname, isLegacyShortsAlias, activeFeed, feedAnimationKey, navigateToFeed, getTabHref } =
    useFeedNavigation()
  const getTabLabel = (tab: NavTab) => t(`nav.${tab.labelKey}`) as string
  const getTabDesc = (tab: NavTab) => t(`nav.${tab.descKey}`) as string

  if (mode === 'rail') {
    return (
      <aside className="flex h-full flex-col rounded-[28px] border border-[var(--border-card)] bg-[var(--bg-card)]/88 p-2 shadow-[var(--card-shadow)] backdrop-blur-xl">
        <div className="mb-3 flex items-center justify-center rounded-[20px] bg-black/20 px-2 py-3">
          <Logo className="h-7 text-[var(--text-primary)]" />
        </div>

        <nav className="flex flex-1 flex-col items-center gap-2">
          {tabs.map((tab) => {
            const active = isTabActive(pathname, tab.href, isLegacyShortsAlias)

            return (
              <Link
                key={tab.href}
                href={getTabHref(tab)}
                aria-label={getTabLabel(tab)}
                aria-current={active ? 'page' : undefined}
                className={`flex w-full flex-col items-center justify-center gap-1 rounded-[20px] px-2 py-3 text-center transition-all ${
                  active
                    ? 'bg-[var(--accent-glow)] text-[var(--nav-active)]'
                    : 'text-[var(--nav-inactive)] hover:bg-[var(--bg-secondary)]/45'
                }`}
              >
                <div className="relative z-10">{icons[tab.icon](active)}</div>
                <span className="whitespace-nowrap text-[10px] font-medium leading-none">
                  {getTabLabel(tab)}
                </span>
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
        <nav className="flex flex-1 flex-col gap-2">
          {tabs.map((tab) => {
            const active = isTabActive(pathname, tab.href, isLegacyShortsAlias)

            return (
              <Link
                key={tab.href}
                href={getTabHref(tab)}
                aria-label={getTabLabel(tab)}
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
                    {icons[tab.icon](active)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      {getTabLabel(tab)}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                      {getTabDesc(tab)}
                    </p>
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
        {tabs.map((tab) => {
          const active = isTabActive(pathname, tab.href, isLegacyShortsAlias)
          const effectiveHref = getTabHref(tab)

          if (tab.href === '/shorts') {
            return (
              <div
                key={tab.href}
                className={`flex flex-col items-center justify-center gap-1 rounded-[20px] px-1 py-2 transition-all ${
                  active ? 'bg-[var(--accent-glow)]' : ''
                }`}
              >
                <motion.button
                  type="button"
                  onClick={() => {
                    if (!activeFeed) {
                      navigateToFeed('shorts')
                      return
                    }

                    navigateToFeed(activeFeed === 'shorts' ? 'series' : 'shorts')
                  }}
                  aria-label="Toggle feed"
                  animate={{ scale: active ? 1 : 0.92, y: active ? -1 : 0 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                  className="relative z-10 rounded-full transition-opacity active:scale-95"
                  style={{ color: active ? 'var(--nav-active)' : 'var(--nav-inactive)' }}
                >
                  {icons.play(active)}
                </motion.button>
                <div className="flex items-center gap-1 text-[9px] font-medium leading-none">
                  <FeedLabel
                    label="Series"
                    selected={activeFeed === 'series'}
                    animationKey={feedAnimationKey}
                    onClick={() => {
                      if (activeFeed === 'series') return
                      navigateToFeed('series')
                    }}
                  />
                  <span aria-hidden="true" style={{ color: 'var(--nav-divider)' }}>
                    |
                  </span>
                  <FeedLabel
                    label="Shorts"
                    selected={activeFeed === 'shorts'}
                    animationKey={feedAnimationKey}
                    onClick={() => {
                      if (activeFeed === 'shorts') return
                      navigateToFeed('shorts')
                    }}
                  />
                </div>
              </div>
            )
          }

          return (
            <Link
              key={tab.href}
              href={effectiveHref}
              onClick={
                active
                  ? (event) => {
                      event.preventDefault()
                    }
                  : undefined
              }
              aria-label={getTabLabel(tab)}
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
                {icons[tab.icon](active)}
              </motion.div>

              <span
                className="whitespace-nowrap text-[10px] font-medium leading-none"
                style={{ color: active ? 'var(--nav-active)' : 'var(--nav-inactive)' }}
              >
                {getTabLabel(tab)}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
