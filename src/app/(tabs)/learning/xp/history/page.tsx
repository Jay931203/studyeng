'use client'

import { useRouter } from 'next/navigation'
import { XpHistoryFeed } from '@/components/learning/XpHistoryFeed'
import { AppPage, SurfaceCard } from '@/components/ui/AppPage'
import { useUserStore } from '@/stores/useUserStore'
import { useTranslation } from '@/locales/useTranslation'

export default function XpHistoryPage() {
  const router = useRouter()
  const xpHistory = useUserStore((state) => state.xpHistory)
  const totalXP = useUserStore((state) => state.getTotalXP())
  const { t } = useTranslation()

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
      return
    }
    router.replace('/learning/xp')
  }

  return (
    <AppPage>
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="mb-6 flex items-center gap-3">
          <button
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
          <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
            {t('xpHistory.title')}
          </p>
        </div>

        <SurfaceCard className="p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-secondary)]/40 px-4 py-3">
              <p className="text-xs text-[var(--text-muted)]">{t('xpHistory.totalXp')}</p>
              <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">
                {totalXP.toLocaleString()} XP
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-secondary)]/40 px-4 py-3">
              <p className="text-xs text-[var(--text-muted)]">{t('xpHistory.recordCount')}</p>
              <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">
                {t('xpHistory.recordCountValue')(xpHistory.length)}
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm text-[var(--text-secondary)]">
            {t('xpHistory.description')}
          </p>
        </SurfaceCard>

        <SurfaceCard className="p-5">
          <p className="mb-4 text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
            {t('xpHistory.allHistory')}
          </p>
          <XpHistoryFeed events={xpHistory} emptyCopy={t('xpHistory.emptyHistory')} />
        </SurfaceCard>
      </div>
    </AppPage>
  )
}
