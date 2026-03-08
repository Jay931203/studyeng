'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BottomNav } from '@/components/BottomNav'
import { LevelUpModal } from '@/components/LevelUpModal'
import { XpGainToast } from '@/components/XpGainToast'

import { LoginGateModal } from '@/components/LoginGateModal'
import { AdminActivator } from '@/components/AdminActivator'
import { useOnboardingStore } from '@/stores/useOnboardingStore'
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore'

import { useAuth } from '@/hooks/useAuth'

const GUEST_VIEW_LIMIT = 3

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const hasOnboarded = useOnboardingStore((s) => s.hasOnboarded)
  const [checked, setChecked] = useState(false)
  const [showLoginGate, setShowLoginGate] = useState(false)
  const { user, loading: authLoading } = useAuth()
  const watchedVideoIds = useWatchHistoryStore((s) => s.watchedVideoIds)

  useEffect(() => {
    if (!hasOnboarded) {
      router.replace('/onboarding')
    } else {
      setChecked(true)
    }
  }, [hasOnboarded, router])

  // Track guest views: show login gate when limit exceeded
  useEffect(() => {
    if (authLoading) return
    if (user) {
      setShowLoginGate(false)
      return
    }
    // Non-logged-in user: check unique video watch count
    if (watchedVideoIds.length > GUEST_VIEW_LIMIT) {
      setShowLoginGate(true)
      // Also persist to localStorage for cross-session awareness
      try {
        localStorage.setItem('studyeng-guest-views', JSON.stringify(watchedVideoIds.length))
      } catch {}
    }
  }, [watchedVideoIds.length, user, authLoading])

  // On mount, check if guest was already over limit from a previous session
  useEffect(() => {
    if (authLoading) return
    if (user) return
    try {
      const stored = localStorage.getItem('studyeng-guest-views')
      if (stored && JSON.parse(stored) > GUEST_VIEW_LIMIT) {
        setShowLoginGate(true)
      }
    } catch {}
  }, [user, authLoading])

  // Show nothing until we confirm onboarding is complete.
  // This prevents the feed from flashing before the redirect fires.
  if (!checked) {
    return (
      <div className="h-dvh bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-dvh flex flex-col max-w-lg mx-auto relative">
      <main className="flex-1 overflow-hidden">{children}</main>
      <BottomNav />
      <LevelUpModal />
      <XpGainToast />

      <LoginGateModal isOpen={showLoginGate} />
      <Suspense fallback={null}>
        <AdminActivator />
      </Suspense>
    </div>
  )
}
