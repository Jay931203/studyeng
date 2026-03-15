'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminIssuesList } from '@/components/AdminIssuesList'
import { DeleteAccountModal } from '@/components/DeleteAccountModal'
import { BillingManagementCard } from '@/components/BillingManagementCard'
import { AppPage, SurfaceCard } from '@/components/ui/AppPage'
import { useAuth } from '@/hooks/useAuth'
import { useAdminStore } from '@/stores/useAdminStore'
import { usePremiumStore } from '@/stores/usePremiumStore'
import { usePlayerStore } from '@/stores/usePlayerStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useLocaleStore, type SupportedLocale } from '@/stores/useLocaleStore'
import { usePushStore } from '@/stores/usePushStore'
import {
  useThemeStore,
  type ThemeAccent,
  type ThemeBackground,
} from '@/stores/useThemeStore'

const TRANSLATIONS = {
  ko: {
    guest: '게스트',
    account: '계정',
    logout: '로그아웃',
    continueWithGoogle: 'Google로 계속',
    continueWithKakao: 'Kakao로 계속',
    settings: '설정',
    translateLang: '번역 언어 선택',
    theme: '테마',
    background: '배경',
    color: '색상',
    gameMode: '게임 모드',
    gameModeDesc: '시청 중 게임 등장',
    vibration: '진동',
    vibrationDesc: '고정, 저장, 유사 표현 등장 시 진동',
    remote: '리모컨',
    remoteDesc: '쇼츠 플레이어 리모컨 표시',
    guide: '안내',
    guideDesc: '자막, Key Picks, 사용법 힌트 표시',
    notifications: '알림',
    notifBrowserPrompt: '브라우저 설정에서 알림을 허용해주세요',
    streakReminder: '스트릭 리마인더 알림',
    legalSupport: '법률 및 지원',
    support: '지원',
    terms: '이용약관',
    privacy: '개인정보처리방침',
    deleteAccount: '계정 삭제',
    subscription: '구독',
    forcePro: '강제 PRO',
    forceFree: '강제 FREE',
    none: '없음',
    authUnavailable: '로그인 비활성화',
    adminLocalTest: '로컬 테스트 전용입니다. 실제 결제는 유지하고 앱에서만 PRO/FREE를 강제로 적용합니다.',
    actualSubscription: '실제 구독',
    forceProDesc: '강제 FREE는 실제 구독이 있어도 앱을 무료 상태처럼 테스트합니다.',
  },
  ja: {
    guest: 'ゲスト',
    account: 'アカウント',
    logout: 'ログアウト',
    continueWithGoogle: 'Googleで続ける',
    continueWithKakao: 'Kakaoで続ける',
    settings: '設定',
    translateLang: '翻訳言語を選択',
    theme: 'テーマ',
    background: '背景',
    color: 'カラー',
    gameMode: 'ゲームモード',
    gameModeDesc: '視聴中にゲームが登場',
    vibration: 'バイブレーション',
    vibrationDesc: 'ピン留め、保存、類似表現の出現時に振動',
    remote: 'リモコン',
    remoteDesc: 'ショートプレーヤーのリモコンを表示',
    guide: 'ガイド',
    guideDesc: '字幕、Key Picks、使い方ヒントを表示',
    notifications: '通知',
    notifBrowserPrompt: 'ブラウザの設定で通知を許可してください',
    streakReminder: 'ストリークリマインダー通知',
    legalSupport: '法律とサポート',
    support: 'サポート',
    terms: '利用規約',
    privacy: 'プライバシーポリシー',
    deleteAccount: 'アカウント削除',
    subscription: 'サブスクリプション',
    forcePro: '強制PRO',
    forceFree: '強制FREE',
    none: 'なし',
    authUnavailable: 'ログイン無効',
    adminLocalTest: 'ローカルテスト専用です。実際の決済は維持し、アプリでのみPRO/FREEを強制的に適用します。',
    actualSubscription: '実際のサブスクリプション',
    forceProDesc: '強制FREEは実際のサブスクリプションがあってもアプリを無料状態のようにテストします。',
  },
  'zh-TW': {
    guest: '訪客',
    account: '帳號',
    logout: '登出',
    continueWithGoogle: '使用 Google 繼續',
    continueWithKakao: '使用 Kakao 繼續',
    settings: '設定',
    translateLang: '選擇翻譯語言',
    theme: '主題',
    background: '背景',
    color: '顏色',
    gameMode: '遊戲模式',
    gameModeDesc: '觀看時出現遊戲',
    vibration: '振動',
    vibrationDesc: '釘選、儲存、相似表達出現時振動',
    remote: '遙控器',
    remoteDesc: '顯示短影片播放器遙控器',
    guide: '引導',
    guideDesc: '顯示字幕、Key Picks、使用提示',
    notifications: '通知',
    notifBrowserPrompt: '請在瀏覽器設定中允許通知',
    streakReminder: '連續學習提醒通知',
    legalSupport: '法律與支援',
    support: '支援',
    terms: '使用條款',
    privacy: '隱私權政策',
    deleteAccount: '刪除帳號',
    subscription: '訂閱',
    forcePro: '強制 PRO',
    forceFree: '強制 FREE',
    none: '無',
    authUnavailable: '登入已停用',
    adminLocalTest: '僅供本地測試。實際付款保持不變，僅在應用程式中強制套用 PRO/FREE。',
    actualSubscription: '實際訂閱',
    forceProDesc: '強制 FREE 即使有實際訂閱也會將應用程式當作免費狀態測試。',
  },
  vi: {
    guest: 'Khach',
    account: 'Tai khoan',
    logout: 'Dang xuat',
    continueWithGoogle: 'Tiep tuc voi Google',
    continueWithKakao: 'Tiep tuc voi Kakao',
    settings: 'Cai dat',
    translateLang: 'Chon ngon ngu dich',
    theme: 'Giao dien',
    background: 'Nen',
    color: 'Mau sac',
    gameMode: 'Che do tro choi',
    gameModeDesc: 'Tro choi xuat hien khi xem',
    vibration: 'Rung',
    vibrationDesc: 'Rung khi ghim, luu, bieu dat tuong tu xuat hien',
    remote: 'Dieu khien',
    remoteDesc: 'Hien thi dieu khien trinh phat Shorts',
    guide: 'Huong dan',
    guideDesc: 'Hien thi phu de, Key Picks, goi y su dung',
    notifications: 'Thong bao',
    notifBrowserPrompt: 'Vui long cho phep thong bao trong cai dat trinh duyet',
    streakReminder: 'Thong bao nhac streak',
    legalSupport: 'Phap ly va ho tro',
    support: 'Ho tro',
    terms: 'Dieu khoan su dung',
    privacy: 'Chinh sach bao mat',
    deleteAccount: 'Xoa tai khoan',
    subscription: 'Dang ky',
    forcePro: 'Buoc PRO',
    forceFree: 'Buoc FREE',
    none: 'Khong',
    authUnavailable: 'Dang nhap bi vo hieu hoa',
    adminLocalTest: 'Chi dung cho thu nghiem cuc bo. Thanh toan thuc te duoc giu nguyen, chi ap dung cuong che PRO/FREE trong ung dung.',
    actualSubscription: 'Dang ky thuc te',
    forceProDesc: 'Buoc FREE se thu nghiem ung dung nhu trang thai mien phi ngay ca khi co dang ky thuc te.',
  },
} as const

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
  const router = useRouter()
  const { user, loading, authAvailable, signInWithGoogle, signInWithKakao, signOut } = useAuth()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const hapticEnabled = useSettingsStore((state) => state.hapticEnabled)
  const remoteEnabled = useSettingsStore((state) => state.remoteEnabled)
  const subtitleGuidesEnabled = useSettingsStore((state) => state.subtitleGuidesEnabled)
  const setHapticEnabled = useSettingsStore((state) => state.setHapticEnabled)
  const setRemoteEnabled = useSettingsStore((state) => state.setRemoteEnabled)
  const setSubtitleGuidesEnabled = useSettingsStore((state) => state.setSubtitleGuidesEnabled)
  const locale = useLocaleStore((state) => state.locale)
  const setLocale = useLocaleStore((state) => state.setLocale)
  const T = TRANSLATIONS[locale]
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
    T.guest

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
      ? T.forcePro
      : premiumOverride === 'free'
        ? T.forceFree
        : T.none

  return (
    <AppPage>
      {!authAvailable && (
        <section className="mb-6 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-secondary)] px-5 py-4">
          <p className="text-sm font-semibold text-[var(--text-secondary)]">{T.authUnavailable}</p>
        </section>
      )}

      <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-6 shadow-[var(--card-shadow)]"
          >
            <SectionLabel label={T.account} />
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
                  {user?.email ?? T.guest}
                </p>
              </div>
            </div>

            <div className="mt-5">
              {loading ? null : user ? (
                <button
                  onClick={signOut}
                  className="w-full rounded-2xl bg-[var(--bg-secondary)] py-3 text-sm font-medium text-[var(--text-primary)]"
                >
                  {T.logout}
                </button>
              ) : (
                <div className="grid gap-3">
                  <button
                    onClick={() => signInWithGoogle('/profile')}
                    disabled={!authAvailable}
                    className="w-full rounded-2xl bg-white py-3 text-sm font-medium text-black disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {T.continueWithGoogle}
                  </button>
                  <button
                    onClick={() => signInWithKakao('/profile')}
                    disabled={!authAvailable}
                    className="w-full rounded-2xl bg-[#FEE500] py-3 text-sm font-medium text-[#191919] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {T.continueWithKakao}
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          <BillingManagementCard />

          <SurfaceCard className="p-6">
            <SectionLabel label={T.settings} />

            <div className="divide-y divide-[var(--border-card)]/40">
              <div className="flex items-center justify-between px-1 py-3">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">Language / 言語</p>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">{T.translateLang}</p>
                </div>
                <div className="flex gap-1 rounded-xl bg-[var(--bg-secondary)] p-1">
                  {([
                    { id: 'ko' as SupportedLocale, label: '한국어' },
                    { id: 'ja' as SupportedLocale, label: '日本語' },
                    { id: 'zh-TW' as SupportedLocale, label: '繁體中文' },
                    { id: 'vi' as SupportedLocale, label: 'Tiếng Việt' },
                  ]).map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setLocale(option.id)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                        locale === option.id
                          ? 'bg-[var(--accent-primary)] text-white'
                          : 'text-[var(--text-secondary)]'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-1 py-4">
                <div className="mb-4">
                  <p className="text-sm font-medium text-[var(--text-primary)]">{T.theme}</p>
                </div>

                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-4">
                    <p className="shrink-0 text-xs font-semibold text-[var(--text-muted)]">
                      {T.background}
                    </p>
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
                          aria-label={`Set background theme to ${option.id}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <p className="shrink-0 text-xs font-semibold text-[var(--text-muted)]">{T.color}</p>
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
                          aria-label={`Set color theme to ${option.id}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between px-1 py-3">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{T.gameMode}</p>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">{T.gameModeDesc}</p>
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

              <div className="flex items-center justify-between px-1 py-3">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{T.vibration}</p>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">{T.vibrationDesc}</p>
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

              <div className="flex items-center justify-between px-1 py-3">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{T.remote}</p>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    {T.remoteDesc}
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

              <div className="flex items-center justify-between px-1 py-3">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{T.guide}</p>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    {T.guideDesc}
                  </p>
                </div>
                <button
                  onClick={() => setSubtitleGuidesEnabled(!subtitleGuidesEnabled)}
                  className={`relative h-6 w-11 rounded-full ${
                    subtitleGuidesEnabled ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-secondary)]'
                  }`}
                  role="switch"
                  aria-checked={subtitleGuidesEnabled}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                      subtitleGuidesEnabled ? 'translate-x-5' : ''
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between px-1 py-3">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{T.notifications}</p>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    {pushPermission === 'denied'
                      ? T.notifBrowserPrompt
                      : T.streakReminder}
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

              <div className="divide-y divide-[var(--border-card)]/40">
                <div className="flex items-center justify-between px-1 py-3">
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

                <div className="px-1 py-4">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          PRO ACCESS TEST
                        </p>
                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                          {T.adminLocalTest}
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
                        {T.actualSubscription}
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
                        {T.forcePro}
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
                        {T.forceFree}
                      </button>
                    </div>

                    <p className="mt-3 text-xs text-[var(--text-muted)]">
                      {T.actualSubscription} {entitlementPremium ? 'PRO' : 'FREE'} · App{' '}
                      {appliedPremium ? 'PRO' : 'FREE'} · Override {premiumOverrideLabel}
                    </p>
                    {premiumOverride === 'free' && (
                      <p className="mt-1 text-xs text-[var(--text-muted)]">
                        {T.forceProDesc}
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
          <SectionLabel label={T.legalSupport} />
          <div className="-mx-6 -mb-6 overflow-hidden">
            <LegalLink href="/support" label={T.support} />
            <LegalLink href="/terms" label={T.terms} />
            <LegalLink href="/privacy" label={T.privacy} />
          </div>
        </SurfaceCard>
      </div>

      {user && (
        <div className="mt-6">
          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full rounded-2xl bg-[var(--bg-secondary)] py-3 text-sm font-medium text-red-400"
          >
            {T.deleteAccount}
          </button>
        </div>
      )}

      <div className="mt-6">
        <AdminIssuesList />
      </div>

      {showDeleteModal && (
        <DeleteAccountModal
          onClose={() => setShowDeleteModal(false)}
          onDeleted={() => {
            setShowDeleteModal(false)
            router.replace('/login')
          }}
        />
      )}
    </AppPage>
  )
}
