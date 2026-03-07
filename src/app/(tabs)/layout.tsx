'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BottomNav } from '@/components/BottomNav'
import { LevelUpModal } from '@/components/LevelUpModal'
import { XpGainToast } from '@/components/XpGainToast'
import { BadgeUnlock } from '@/components/BadgeUnlock'
import { useOnboardingStore } from '@/stores/useOnboardingStore'
import { useBadgeChecker } from '@/hooks/useBadgeChecker'

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const hasOnboarded = useOnboardingStore((s) => s.hasOnboarded)
  const [checked, setChecked] = useState(false)

  // Reactively check badge conditions whenever relevant stats change
  useBadgeChecker()

  useEffect(() => {
    if (!hasOnboarded) {
      router.replace('/onboarding')
    } else {
      setChecked(true)
    }
  }, [hasOnboarded, router])

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
      <BadgeUnlock />
    </div>
  )
}
