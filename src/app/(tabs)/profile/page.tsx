'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { AdminIssuesList } from '@/components/AdminIssuesList'
import { BillingManagementCard } from '@/components/BillingManagementCard'
import { AppPage, SurfaceCard } from '@/components/ui/AppPage'
import { useAuth } from '@/hooks/useAuth'
import { isBillingEnabled } from '@/lib/billing'
import { useAdminStore } from '@/stores/useAdminStore'
import {
  useThemeStore,
  type ThemeAccent,
  type ThemeBackground,
} from '@/stores/useThemeStore'

const BACKGROUND_OPTIONS = [
  { id: 'dark' as const, swatchClass: 'bg-[#050505] border border-white/10' },
  { id: 'light' as const, swatchClass: 'bg-[#f8fafc] border border-slate-300' },
] satisfies Array<{ id: ThemeBackground; swatchClass: string }>

const COLOR_OPTIONS = [
  { id: 'teal' as const, swatchClass: 'bg-[#14b8a6]' },
  { id: 'blue' as const, swatchClass: 'bg-[#3b82f6]' },
  { id: 'purple' as const, swatchClass: 'bg-[#a855f7]' },
] satisfies Array<{ id: ThemeAccent; swatchClass: string }>

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="mb-4 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
      {label}
    </p>
  )
}

export default function ProfilePage() {
  const { user, loading, authAvailable, signInWithGoogle, signInWithKakao, signOut } = useAuth()
  const backgroundTheme = useThemeStore((state) => state.backgroundTheme)
  const colorTheme = useThemeStore((state) => state.colorTheme)
  const setBackgroundTheme = useThemeStore((state) => state.setBackgroundTheme)
  const setColorTheme = useThemeStore((state) => state.setColorTheme)
  const {
    adminEnabled,
    clearFlags,
    exportReportBundle,
    flaggedSubtitles,
    isAdmin,
    isAdminActive,
    issues,
    setAdminEnabled,
  } = useAdminStore()

  const billingEnabled = isBillingEnabled()
  const unresolvedCount = issues.filter((issue) => !issue.resolved).length
  const profileName =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email?.split('@')[0] ??
    'Guest'

  const copyBundle = async () => {
    const json = exportReportBundle()

    try {
      await navigator.clipboard.writeText(json)
      window.alert('Copied report bundle.')
    } catch {
      window.prompt('Report bundle JSON', json)
    }
  }

  return (
    <AppPage>
      {!authAvailable && (
        <section className="mb-6 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-secondary)] px-5 py-4">
          <p className="text-sm font-semibold text-[var(--text-secondary)]">LOGIN DISABLED</p>
        </section>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-6 shadow-[var(--card-shadow)]"
          >
            <SectionLabel label="ACCOUNT" />
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] text-2xl font-bold text-white">
                {user?.user_metadata?.avatar_url ? (
                  <span className="relative block h-full w-full">
                    <Image
                      src={user.user_metadata.avatar_url}
                      alt={profileName}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </span>
                ) : (
                  <span>{profileName.slice(0, 1).toUpperCase()}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xl font-bold text-[var(--text-primary)]">
                  {profileName}
                </p>
                <p className="mt-1 truncate text-sm text-[var(--text-secondary)]">
                  {user?.email ?? 'Guest'}
                </p>
              </div>
            </div>

            <div className="mt-5">
              {loading ? null : user ? (
                <button
                  onClick={signOut}
                  className="w-full rounded-2xl bg-[var(--bg-secondary)] py-3 text-sm font-medium text-[var(--text-primary)]"
                >
                  LOG OUT
                </button>
              ) : (
                <div className="grid gap-3">
                  <button
                    onClick={() => signInWithGoogle('/profile')}
                    disabled={!authAvailable}
                    className="w-full rounded-2xl bg-white py-3 text-sm font-medium text-black disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    GOOGLE
                  </button>
                  <button
                    onClick={() => signInWithKakao('/profile')}
                    disabled={!authAvailable}
                    className="w-full rounded-2xl bg-[#FEE500] py-3 text-sm font-medium text-[#191919] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    KAKAO
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          <SurfaceCard className="p-6">
            <SectionLabel label="THEME" />

            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-4">
                <p className="shrink-0 text-xs font-semibold text-[var(--text-muted)]">BACKGROUND</p>
                <div className="flex min-h-10 items-center gap-3">
                  {BACKGROUND_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setBackgroundTheme(option.id)}
                      className={`h-10 w-10 rounded-full ${option.swatchClass} ${
                        backgroundTheme === option.id
                          ? 'ring-2 ring-[var(--accent-primary)] ring-offset-2 ring-offset-[var(--bg-card)]'
                          : ''
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <p className="shrink-0 text-xs font-semibold text-[var(--text-muted)]">COLOR</p>
                <div className="flex min-h-10 items-center gap-3">
                  {COLOR_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setColorTheme(option.id)}
                      className={`h-10 w-10 rounded-full ${option.swatchClass} ${
                        colorTheme === option.id
                          ? 'ring-2 ring-[var(--accent-primary)] ring-offset-2 ring-offset-[var(--bg-card)]'
                          : ''
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </SurfaceCard>

          {isAdmin && (
            <SurfaceCard className="p-6">
              <SectionLabel label="ADMIN" />

              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-2xl bg-[var(--bg-primary)] px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">ADMIN MODE</p>
                  </div>
                  <button
                    onClick={() => setAdminEnabled(!adminEnabled)}
                    className={`relative h-6 w-11 rounded-full ${
                      adminEnabled ? 'bg-red-500' : 'bg-[var(--bg-secondary)]'
                    }`}
                    role="switch"
                    aria-checked={adminEnabled}
                  >
                    <span
                      className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                        adminEnabled ? 'translate-x-5' : ''
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-[var(--bg-primary)] px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">PREMIUM</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      billingEnabled
                        ? 'bg-emerald-500/15 text-emerald-300'
                        : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {billingEnabled ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>
            </SurfaceCard>
          )}
        </div>

        <div className="space-y-6">
          {isAdminActive() && (
            <SurfaceCard className="p-6">
              <SectionLabel label="REPORTS" />

              <div className="rounded-2xl bg-[var(--bg-primary)] p-4">
                <p className="text-sm font-semibold text-red-400">
                  OPEN {unresolvedCount} · FLAGS {flaggedSubtitles.length}
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={copyBundle}
                    className="flex-1 rounded-xl bg-red-500/10 py-2 text-xs font-medium text-red-400"
                  >
                    COPY JSON
                  </button>
                  <button
                    onClick={clearFlags}
                    disabled={flaggedSubtitles.length === 0}
                    className="rounded-xl bg-[var(--bg-secondary)] px-4 py-2 text-xs text-[var(--text-muted)] disabled:opacity-30"
                  >
                    CLEAR
                  </button>
                </div>
              </div>
            </SurfaceCard>
          )}

          <SurfaceCard className="overflow-hidden">
            <Link
              href="/terms"
              className="flex items-center justify-between border-b border-[var(--border-card)] px-5 py-4 text-sm text-[var(--text-secondary)]"
            >
              <span>TERMS</span>
              <span aria-hidden>→</span>
            </Link>
            <Link
              href="/privacy"
              className="flex items-center justify-between px-5 py-4 text-sm text-[var(--text-secondary)]"
            >
              <span>PRIVACY</span>
              <span aria-hidden>→</span>
            </Link>
          </SurfaceCard>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        <BillingManagementCard />
        <AdminIssuesList />
      </div>
    </AppPage>
  )
}
