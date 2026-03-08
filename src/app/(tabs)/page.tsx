'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ShortsFeedPage } from '@/components/ShortsFeedPage'

function LoadingScreen() {
  return (
    <div className="flex h-full items-center justify-center bg-black">
      <div className="relative">
        <div className="h-8 w-8 rounded-full border-[1.5px] border-white/10" />
        <div className="absolute inset-0 h-8 w-8 animate-spin rounded-full border-[1.5px] border-transparent border-t-white/60" />
      </div>
    </div>
  )
}

export default function RootTabPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const hasVideoContext = Boolean(searchParams.get('v') || searchParams.get('series'))

  useEffect(() => {
    if (!hasVideoContext) {
      router.replace('/explore')
    }
  }, [hasVideoContext, router])

  if (!hasVideoContext) {
    return <LoadingScreen />
  }

  return <ShortsFeedPage />
}
