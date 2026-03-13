'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { AdminIssuesList } from '@/components/AdminIssuesList'
import { BillingManagementCard } from '@/components/BillingManagementCard'
import { AppPage, SurfaceCard } from '@/components/ui/AppPage'
import { useAuth } from '@/hooks/useAuth'
import { useAdminStore } from '@/stores/useAdminStore'
import { usePremiumStore } from '@/stores/usePremiumStore'
import { usePlayerStore } from '@/stores/usePlayerStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { usePushStore } from '@/stores/usePushStore'
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
  {
    id: 'rainbow' as const,
    swatchClass:
      'bg-[conic-gradient(from_220deg,_#53d7ff,_#7c4dff,_#ff5ac8,_#ff9538,_#ffd84a,_#53d7ff)]',
  },
  { id: 'teal' as const, swatchClass: 'bg-[#14b8a6]' },
  { id: 'blue' as const, swatchClass: 'bg-[#3b82f6]' },
  { id: 'purple' as const, swatchClass: 'bg-[#a855f7]' },
] satisfies Array<{ id: ThemeAccent; swatchClass: string }>

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="mb-4 text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
      {label}
    </p>
  )
}

function LegalLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between border-t border-[var(--border-card)] px-5 py-4 text-xs font-semibold text-[var(--text-muted)]"
    >
      <span>{label}</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-4 w-4 text-[var(--text-muted)]"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M7.22 4.22a.75.75 0 011.06 0l5.25 5.25a.75.75 0 010 1.06l-5.25 5.25a.75.75 0 01-1.06-1.06L11.94 10 7.22 5.28a.75.75 0 010-1.06z"
          clipRule="evenodd"
        />
      </svg>
    </Link>
  )
}

export default function ProfilePage() {
  const { user, loading, authAvailable, signInWithGoogle, signInWithKakao, signOut } = useAuth()
  const hapticEnabled = useSettingsStore((state) => state.hapticEnabled)
  const remoteEnabled = useSettingsStore((state) => state.remoteEnabled)
  const setHapticEnabled = useSettingsStore((state) => state.setHapticEnabled)
  const setRemoteEnabled = useSettingsStore((state) => state.setRemoteEnabled)
  const gameModeEnabled = usePlayerStore((state) => state.gameModeEnabled)
  const setGameModeEnabled = usePlayerStore((state) => state.setGameModeEnabled)
  const pushPermission = usePushStore((state) => state.permission)
  const pushSubscribe = usePushStore((state) => state.subscribe)
  const pushUnsubscribe = usePushStore((state) => state.unsubscribe)
  const pushEnabled = pushPermission === 'granted'
  const appliedPremium = usePremiumStore((state) => state.isPremium)
  const entitlementPremium = usePremiumStore((state) => state.entitlementPremium)
  const premiumOverride = usePremiumStore((state) => state.premiumOverride)
  const setPremiumOverride = usePremiumStore((state) => state.setPremiumOverride)
  const backgroundTheme = useThemeStore((state) => state.backgroundTheme)
  const colorTheme = useThemeStore((state) => state.colorTheme)
  const setBackgroundTheme = useThemeStore((state) => state.setBackgroundTheme)
  const setColorTheme = useThemeStore((state) => state.setColorTheme)
  const {
    adminEnabled,
    clearFlags,
    exportReportBundle,
    flaggedSubtitles,
    hiddenVideos,
    isAdmin,
    isAdminActive,
    issues,
    setAdminEnabled,
  } = useAdminStore()

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

  const premiumOverrideLabel =
    premiumOverride === 'premium'
      ? '강제 PRO'
      : premiumOverride === 'free'
        ? '강제 FREE'
        : '없음'

  return (
    <AppPage>
      {!authAvailable && (
        <section className="mb-6 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-secondary)] px-5 py-4">
          <p className="text-sm font-semibold text-[var(--text-secondary)]">LOGIN DISABLED</p>
        </section>
      )}

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

          <BillingManagementCard />

          <SurfaceCard className="p-6">
            <SectionLabel label="SETTINGS" />

            <div className="space-y-4">
              <div className="rounded-2xl bg-[var(--bg-primary)] px-4 py-4">
                <div className="mb-4">
                  <p className="text-sm font-medium text-[var(--text-primary)]">THEME</p>
                </div>

                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-4">
                    <p className="shrink-0 text-xs font-semibold text-[var(--text-muted)]">
                      BACKGROUND
                    </p>
                    <div className="flex min-h-10 items-center gap-3">
                      {BACKGROUND_OPTIONS.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => setBackgroundTheme(option.id)}
                          className={`h-10 w-10 rounded-full ${option.swatchClass} ${
                            backgroundTheme === option.id
                              ? 'ring-2 ring-[var(--accent-primary)] ring-offset-2 ring-offset-[var(--bg-primary)]'
                              : ''
                          }`}
                          aria-label={`Set background theme to ${option.id}`}
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
                              ? 'ring-2 ring-[var(--accent-primary)] ring-offset-2 ring-offset-[var(--bg-primary)]'
                              : ''
                          }`}
                          aria-label={`Set color theme to ${option.id}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-[var(--bg-primary)] px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">GAME MODE</p>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">시청 중 게임 등장</p>
                </div>
                <button
                  onClick={() => setGameModeEnabled(!gameModeEnabled)}
                  className={`relative h-6 w-11 rounded-full ${
                    gameModeEnabled ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-secondary)]'
                  }`}
                  role="switch"
                  aria-checked={gameModeEnabled}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                      gameModeEnabled ? 'translate-x-5' : ''
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-[var(--bg-primary)] px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">HAPTIC</p>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">Freeze, 저장, 유사 표현 등장 시 진동</p>
                </div>
                <button
                  onClick={() => setHapticEnabled(!hapticEnabled)}
                  className={`relative h-6 w-11 rounded-full ${
                    hapticEnabled ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-secondary)]'
                  }`}
                  role="switch"
                  aria-checked={hapticEnabled}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                      hapticEnabled ? 'translate-x-5' : ''
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-[var(--bg-primary)] px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">REMOTE</p>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    쇼츠 플레이어 리모컨 표시
                  </p>
                </div>
                <button
                  onClick={() => setRemoteEnabled(!remoteEnabled)}
                  className={`relative h-6 w-11 rounded-full ${
                    remoteEnabled ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-secondary)]'
                  }`}
                  role="switch"
                  aria-checked={remoteEnabled}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                      remoteEnabled ? 'translate-x-5' : ''
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-[var(--bg-primary)] px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">NOTIFICATIONS</p>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    {pushPermission === 'denied'
                      ? '브라우저 설정에서 알림을 허용해주세요'
                      : '스트릭 리마인더 알림'}
                  </p>
                </div>
                <button
                  onClick={() => (pushEnabled ? pushUnsubscribe() : pushSubscribe())}
                  disabled={pushPermission === 'denied'}
                  className={`relative h-6 w-11 rounded-full disabled:opacity-40 ${
                    pushEnabled ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-secondary)]'
                  }`}
                  role="switch"
                  aria-checked={pushEnabled}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                      pushEnabled ? 'translate-x-5' : ''
                    }`}
                  />
                </button>
              </div>
            </div>
          </SurfaceCard>

          {isAdmin && (
            <SurfaceCard className="p-6">
              <SectionLabel label="ADMIN SETTINGS" />

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

                <div className="rounded-2xl bg-[var(--bg-primary)] px-4 py-4">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          PRO ACCESS TEST
                        </p>
                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                          로컬 테스트 전용입니다. 실제 결제는 유지하고 앱에서만 PRO/FREE를 강제로 적용합니다.
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          appliedPremium
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                        }`}
                      >
                        {appliedPremium ? 'APP PRO' : 'APP FREE'}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setPremiumOverride('inherit')}
                        className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                          premiumOverride === 'inherit'
                            ? 'bg-[var(--accent-primary)] text-white'
                            : 'bg-[var(--bg-card)] text-[var(--text-secondary)]'
                        }`}
                      >
                        실제 구독
                      </button>
                      <button
                        type="button"
                        onClick={() => setPremiumOverride('premium')}
                        className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                          premiumOverride === 'premium'
                            ? 'bg-emerald-500 text-white'
                            : 'bg-[var(--bg-card)] text-[var(--text-secondary)]'
                        }`}
                      >
                        강제 PRO
                      </button>
                      <button
                        type="button"
                        onClick={() => setPremiumOverride('free')}
                        className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                          premiumOverride === 'free'
                            ? 'bg-slate-600 text-white'
                            : 'bg-[var(--bg-card)] text-[var(--text-secondary)]'
                        }`}
                      >
                        강제 FREE
                      </button>
                    </div>

                    <p className="mt-3 text-xs text-[var(--text-muted)]">
                      실제 구독 {entitlementPremium ? 'PRO' : 'FREE'} · 앱 적용{' '}
                      {appliedPremium ? 'PRO' : 'FREE'} · 오버라이드 {premiumOverrideLabel}
                    </p>
                    {premiumOverride === 'free' && (
                      <p className="mt-1 text-xs text-[var(--text-muted)]">
                        강제 FREE는 실제 구독이 있어도 앱을 무료 상태처럼 테스트합니다.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </SurfaceCard>
          )}

        {isAdminActive() && (
          <SurfaceCard className="p-6">
            <SectionLabel label="REPORTS" />

            <div className="rounded-2xl bg-[var(--bg-primary)] p-4">
              <p className="text-sm font-semibold text-red-400">
                OPEN {unresolvedCount} / FLAGS {flaggedSubtitles.length} / HIDDEN {hiddenVideos.length}
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

        <SurfaceCard className="overflow-hidden p-6">
          <SectionLabel label="LEGAL" />
          <div className="-mx-6 -mb-6 overflow-hidden">
            <LegalLink href="/terms" label="TERMS" />
            <LegalLink href="/privacy" label="PRIVACY" />
          </div>
        </SurfaceCard>
      </div>

      <div className="mt-6">
        <AdminIssuesList />
      </div>
    </AppPage>
  )
}
