'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BillingManagementCard } from '@/components/BillingManagementCard'
import { RedeemCodeCard } from '@/components/RedeemCodeCard'
import { AppPage } from '@/components/ui/AppPage'

export default function ProfileMembershipPage() {
  const router = useRouter()
  const [refreshKey, setRefreshKey] = useState(0)

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
      return
    }

    router.replace('/profile')
  }

  return (
    <AppPage>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="text-[var(--text-secondary)] transition-transform active:scale-90"
            aria-label="Back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path
                fillRule="evenodd"
                d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
              MEMBERSHIP
            </p>
          </div>
        </div>

        <BillingManagementCard mode="detail" refreshKey={refreshKey} />
        <RedeemCodeCard onRedeemed={() => setRefreshKey((value) => value + 1)} />
      </div>
    </AppPage>
  )
}
