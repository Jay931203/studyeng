'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BottomNav } from '@/components/BottomNav'
import { LogoFull } from '@/components/Logo'
import { LoginGateModal } from '@/components/LoginGateModal'
import { AdminActivator } from '@/components/AdminActivator'
import { useOnboardingStore } from '@/stores/useOnboardingStore'
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore'
import { usePhraseStore } from '@/stores/usePhraseStore'
import { useUserStore } from '@/stores/useUserStore'
import { useAuth } from '@/hooks/useAuth'
import { useOrientation } from '@/hooks/useOrientation'

const GUEST_VIEW_LIMIT = 3

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const hasOnboarded = useOnboardingStore((state) => state.hasOnboarded)
  const onboardingHydrated = useOnboardingStore((state) => state.hydrated)
  const completeOnboarding = useOnboardingStore((state) => state.completeOnboarding)
  const watchedVideoIds = useWatchHistoryStore((state) => state.watchedVideoIds)
  const phraseCount = usePhraseStore((state) => state.phrases.length)
  const streakDays = useUserStore((state) => state.streakDays)
  const { user, loading: authLoading } = useAuth()
  const { isLandscape } = useOrientation()

  const [checked, setChecked] = useState(false)
  const [splashDone, setSplashDone] = useState(false)
  const [showLoginGate, setShowLoginGate] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setSplashDone(true), 1500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (authLoading || !onboardingHydrated) return

    if (!user) {
      setChecked(true)
      return
    }

    const hasExistingActivity = watchedVideoIds.length > 0 || phraseCount > 0 || streakDays > 0

    if (hasExistingActivity && !hasOnboarded) {
      completeOnboarding()
      setChecked(true)
      return
    }

    if (!hasOnboarded) {
      router.replace('/onboarding')
      return
    }

    setChecked(true)
  }, [
    authLoading,
    completeOnboarding,
    hasOnboarded,
    onboardingHydrated,
    phraseCount,
    router,
    streakDays,
    user,
    watchedVideoIds.length,
  ])

  useEffect(() => {
    if (authLoading) return

    if (user) {
      setShowLoginGate(false)
      return
    }

    if (watchedVideoIds.length > GUEST_VIEW_LIMIT) {
      setShowLoginGate(true)
      try {
        localStorage.setItem('studyeng-guest-views', JSON.stringify(watchedVideoIds.length))
      } catch {}
    }
  }, [authLoading, user, watchedVideoIds.length])

  useEffect(() => {
    if (authLoading || user) return

    try {
      const stored = localStorage.getItem('studyeng-guest-views')
      if (stored && JSON.parse(stored) > GUEST_VIEW_LIMIT) {
        setShowLoginGate(true)
      }
    } catch {}
  }, [authLoading, user])

  if (!checked || !splashDone) {
    return (
      <div className="flex h-dvh items-center justify-center bg-black">
        <LogoFull className="h-12 animate-fade-in" />
      </div>
    )
  }

  return (
    <div className={`relative mx-auto flex h-dvh flex-col ${isLandscape ? 'max-w-none' : 'max-w-lg'}`}
      style={isLandscape ? {
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
      } : undefined}
    >
      <main className="flex-1 overflow-hidden">{children}</main>
      {!isLandscape && <BottomNav />}
      <LoginGateModal isOpen={showLoginGate} />
      <Suspense fallback={null}>
        <AdminActivator />
      </Suspense>
    </div>
  )
}
