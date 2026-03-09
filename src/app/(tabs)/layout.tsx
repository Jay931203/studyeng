'use client'

import { Suspense, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { BottomNav } from '@/components/BottomNav'
import { LogoFull } from '@/components/Logo'
import { LoginGateModal } from '@/components/LoginGateModal'
import { AdminActivator } from '@/components/AdminActivator'
import { buildPathWithNext } from '@/lib/navigation'
import { useOnboardingStore } from '@/stores/useOnboardingStore'
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore'
import { usePhraseStore } from '@/stores/usePhraseStore'
import { useUserStore } from '@/stores/useUserStore'
import { useAuth } from '@/hooks/useAuth'
import { useViewportLayout } from '@/hooks/useOrientation'

const GUEST_VIEW_LIMIT = 3

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const hasOnboarded = useOnboardingStore((state) => state.hasOnboarded)
  const onboardingHydrated = useOnboardingStore((state) => state.hydrated)
  const completeOnboarding = useOnboardingStore((state) => state.completeOnboarding)
  const watchedVideoIds = useWatchHistoryStore((state) => state.watchedVideoIds)
  const phraseCount = usePhraseStore((state) => state.phrases.length)
  const streakDays = useUserStore((state) => state.streakDays)
  const { user, loading: authLoading, authAvailable } = useAuth()
  const { isLandscapeViewport } = useViewportLayout()

  const [dismissedGuestGateVersion, setDismissedGuestGateVersion] = useState<number | null>(null)
  const isImmersiveRoute = pathname === '/shorts' || pathname === '/'
  const hasExistingActivity = watchedVideoIds.length > 0 || phraseCount > 0 || streakDays > 0
  const shouldAutoCompleteOnboarding =
    Boolean(user) && onboardingHydrated && !hasOnboarded && hasExistingActivity
  const shouldRedirectToOnboarding =
    Boolean(user) && onboardingHydrated && !hasOnboarded && !hasExistingActivity
  const onboardingGateReady = user ? onboardingHydrated : true
  const shellReady = !authLoading && onboardingGateReady && !shouldRedirectToOnboarding
  const guestGateVersion = authAvailable && !authLoading && !user ? watchedVideoIds.length : 0
  const showLoginGate =
    guestGateVersion > GUEST_VIEW_LIMIT && dismissedGuestGateVersion !== guestGateVersion

  useEffect(() => {
    if (authLoading || !onboardingHydrated || !user) return

    if (shouldAutoCompleteOnboarding) {
      completeOnboarding()
      return
    }

    if (shouldRedirectToOnboarding) {
      const currentPath =
        typeof window === 'undefined'
          ? pathname
          : `${pathname}${window.location.search}`
      router.replace(buildPathWithNext('/onboarding', currentPath))
    }
  }, [
    authLoading,
    completeOnboarding,
    onboardingHydrated,
    pathname,
    router,
    shouldAutoCompleteOnboarding,
    shouldRedirectToOnboarding,
    user,
  ])

  if (!shellReady) {
    return (
      <div className="flex h-dvh items-center justify-center bg-[var(--bg-primary)]">
        <LogoFull className="h-12 animate-fade-in" />
      </div>
    )
  }

  return (
    <div
      className={`relative mx-auto w-full ${
        isImmersiveRoute
          ? 'flex h-dvh flex-col'
          : 'min-h-dvh lg:grid lg:grid-cols-[280px_minmax(0,1fr)]'
      }`}
    >
      {!isImmersiveRoute && (
        <div className="hidden border-r border-[var(--border-card)]/60 bg-black/15 px-5 py-6 lg:block">
          <div className="sticky top-6 h-[calc(100dvh-3rem)]">
            <BottomNav mode="sidebar" />
          </div>
        </div>
      )}

      <div
        className={`relative flex min-h-dvh min-w-0 flex-col ${
          isImmersiveRoute ? 'w-full' : 'w-full'
        }`}
      >
        <main className="flex-1 overflow-hidden">{children}</main>
        {!isImmersiveRoute && <BottomNav />}
        {isImmersiveRoute && !isLandscapeViewport && <BottomNav />}
      </div>

      <LoginGateModal
        isOpen={showLoginGate}
        onClose={() => setDismissedGuestGateVersion(guestGateVersion)}
      />
      <Suspense fallback={null}>
        <AdminActivator />
      </Suspense>
    </div>
  )
}
