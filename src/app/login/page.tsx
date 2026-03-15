'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useMemo } from 'react'
import { Logo, LogoFull } from '@/components/Logo'
import { useAuth } from '@/hooks/useAuth'
import { getGuestContinuePath, sanitizeAppPath } from '@/lib/navigation'
import { trackEvent } from '@/lib/analytics'
import { useLocaleStore, type SupportedLocale } from '@/stores/useLocaleStore'

const TRANSLATIONS: Record<string, Record<SupportedLocale, string>> = {
  heroTitle1: {
    ko: '짧은 장면을 넘기다 보면',
    ja: '短いシーンをめくるうちに',
    'zh-TW': '滑過一段段短片',
    vi: 'Luot qua nhung doan phim ngan',
  },
  heroTitle2: {
    ko: '귀가 먼저 익숙해집니다',
    ja: '耳が先に慣れていきます',
    'zh-TW': '耳朵自然就熟悉了',
    vi: 'tai ban se quen truoc',
  },
  heroDesc: {
    ko: '로그인하면 본 장면, 저장 표현, 이어보기가 한 계정에 정리되어 다시 들어와도 흐름이 이어집니다.',
    ja: 'ログインすると視聴した場面、保存した表現、続きがひとつのアカウントにまとまり、いつでも流れが続きます。',
    'zh-TW': '登入後，看過的片段、儲存的表達、續看進度都整合在同一個帳號，隨時銜接。',
    vi: 'Dang nhap de dong bo lich su xem, bieu thuc da luu va tien trinh xem tiep trong mot tai khoan.',
  },
  tagShorts: {
    ko: '쇼츠',
    ja: 'ショート',
    'zh-TW': '短片',
    vi: 'Shorts',
  },
  tagSubtitles: {
    ko: '자막',
    ja: '字幕',
    'zh-TW': '字幕',
    vi: 'Phu de',
  },
  tagSave: {
    ko: '저장',
    ja: '保存',
    'zh-TW': '儲存',
    vi: 'Luu',
  },
  flowNoteTitle: {
    ko: '쇼츠와 시리즈에서 보고, 자막에서 멈추고, Learn에서 다시 꺼내 보세요.',
    ja: 'ショートやシリーズで見て、字幕で止めて、Learnでもう一度引き出しましょう。',
    'zh-TW': '在短片和系列中觀看，在字幕處停下，在 Learn 中再次複習。',
    vi: 'Xem trong Shorts va Series, dung lai o phu de, on lai trong Learn.',
  },
  flowNoteDesc: {
    ko: '계정을 연결하면 이어보기, 저장 표현, XP와 게임 복습 흐름이 한 계정에 묶입니다.',
    ja: 'アカウントを連携すると、続き、保存した表現、XPとゲーム復習がひとつにまとまります。',
    'zh-TW': '連結帳號後，續看進度、儲存的表達、XP 和遊戲複習都會綁定在同一個帳號。',
    vi: 'Lien ket tai khoan de dong bo tien trinh xem tiep, bieu thuc da luu, XP va luong on tap game.',
  },
  featureContinue: {
    ko: '이어보기',
    ja: '続きから再生',
    'zh-TW': '續看',
    vi: 'Xem tiep',
  },
  featureContinueDesc: {
    ko: '보던 흐름이 그대로 이어집니다.',
    ja: '見ていた流れがそのまま続きます。',
    'zh-TW': '觀看進度無縫銜接。',
    vi: 'Tien trinh xem tiep tuc lien mach.',
  },
  featureSaved: {
    ko: '저장 표현',
    ja: '保存した表現',
    'zh-TW': '儲存的表達',
    vi: 'Bieu thuc da luu',
  },
  featureSavedDesc: {
    ko: '남겨둔 문장을 다시 꺼낼 수 있습니다.',
    ja: '保存した文をいつでも取り出せます。',
    'zh-TW': '隨時取出儲存的句子。',
    vi: 'Lay lai cac cau da luu bat cu luc nao.',
  },
  featureRecommend: {
    ko: '반응형 추천',
    ja: 'パーソナル推薦',
    'zh-TW': '個人化推薦',
    vi: 'Goi y ca nhan',
  },
  featureRecommendDesc: {
    ko: '내 레벨과 본 흐름이 홈과 쇼츠 추천에 바로 반영됩니다.',
    ja: 'あなたのレベルと視聴履歴がホームとショートのおすすめに即反映されます。',
    'zh-TW': '你的等級和觀看紀錄即時反映在首頁和短片推薦中。',
    vi: 'Cap do va lich su xem duoc phan anh ngay vao goi y trang chu va Shorts.',
  },
  featureGames: {
    ko: '게임과 XP',
    ja: 'ゲームとXP',
    'zh-TW': '遊戲與 XP',
    vi: 'Game va XP',
  },
  featureGamesDesc: {
    ko: 'Learn에서 저장 표현과 게임, XP 흐름이 이어집니다.',
    ja: 'Learnで保存した表現とゲーム、XPの流れが続きます。',
    'zh-TW': '在 Learn 中延續儲存的表達、遊戲和 XP 進度。',
    vi: 'Tiep tuc bieu thuc da luu, game va XP trong Learn.',
  },
  accountConnect: {
    ko: '계정 연결',
    ja: 'アカウント連携',
    'zh-TW': '帳號連結',
    vi: 'Lien ket tai khoan',
  },
  loginTitle: {
    ko: '로그인하고 이어서 보기',
    ja: 'ログインして続きを見る',
    'zh-TW': '登入並繼續觀看',
    vi: 'Dang nhap va xem tiep',
  },
  loginDesc: {
    ko: '한 번 로그인하면 오늘 장면과 저장 표현, 이어보기가 같은 흐름으로 붙습니다.',
    ja: '一度ログインすれば、今日の場面と保存した表現、続きがひとつの流れにまとまります。',
    'zh-TW': '登入一次，今天的片段、儲存的表達和續看進度都整合在同一個流程中。',
    vi: 'Dang nhap mot lan, cac doan phim hom nay, bieu thuc da luu va tien trinh xem tiep deu duoc dong bo.',
  },
  badgeSync: {
    ko: '이어보기 동기화',
    ja: '続き同期',
    'zh-TW': '續看同步',
    vi: 'Dong bo xem tiep',
  },
  badgeSaved: {
    ko: '저장 표현 유지',
    ja: '保存した表現を維持',
    'zh-TW': '保留儲存的表達',
    vi: 'Giu bieu thuc da luu',
  },
  badgeLevel: {
    ko: '레벨 맞춤 추천',
    ja: 'レベル別おすすめ',
    'zh-TW': '等級推薦',
    vi: 'Goi y theo cap do',
  },
  badgeReview: {
    ko: 'Learn 복습',
    ja: 'Learn 復習',
    'zh-TW': 'Learn 複習',
    vi: 'On tap Learn',
  },
  authUnavailableTitle: {
    ko: '로그인 연결이 아직 비어 있습니다.',
    ja: 'ログイン連携がまだ設定されていません。',
    'zh-TW': '登入連結尚未設定。',
    vi: 'Lien ket dang nhap chua duoc thiet lap.',
  },
  authUnavailableDesc: {
    ko: '지금은 둘러보기만 가능합니다. Supabase 환경 변수를 연결하면 로그인 버튼이 활성화됩니다.',
    ja: '現在は閲覧のみ可能です。Supabase環境変数を設定するとログインボタンが有効になります。',
    'zh-TW': '目前只能瀏覽。設定 Supabase 環境變數後，登入按鈕將啟用。',
    vi: 'Hien tai chi co the duyet xem. Nut dang nhap se duoc kich hoat khi cau hinh bien moi truong Supabase.',
  },
  googleButton: {
    ko: 'Google로 이어가기',
    ja: 'Googleで続ける',
    'zh-TW': '使用 Google 繼續',
    vi: 'Tiep tuc voi Google',
  },
  kakaoButton: {
    ko: '카카오로 이어가기',
    ja: 'Kakaoで続ける',
    'zh-TW': '使用 Kakao 繼續',
    vi: 'Tiep tuc voi Kakao',
  },
  guestButton: {
    ko: '먼저 둘러보기',
    ja: 'まず見てみる',
    'zh-TW': '先看看',
    vi: 'Xem truoc',
  },
  termsPrefix: {
    ko: '계속하면',
    ja: '続けることで',
    'zh-TW': '繼續即表示您同意',
    vi: 'Tiep tuc dong nghia voi viec ban dong y',
  },
  termsLink: {
    ko: '이용약관',
    ja: '利用規約',
    'zh-TW': '服務條款',
    vi: 'Dieu khoan su dung',
  },
  termsMid: {
    ko: ' 및 ',
    ja: ' および ',
    'zh-TW': ' 和 ',
    vi: ' va ',
  },
  privacyLink: {
    ko: '개인정보처리방침',
    ja: 'プライバシーポリシー',
    'zh-TW': '隱私權政策',
    vi: 'Chinh sach bao mat',
  },
  termsSuffix: {
    ko: '에 동의한 것으로 간주됩니다.',
    ja: 'に同意したものとみなされます。',
    'zh-TW': '。',
    vi: '.',
  },
}

function t(key: string, locale: SupportedLocale): string {
  return TRANSLATIONS[key]?.[locale] ?? TRANSLATIONS[key]?.ko ?? key
}

function FeatureRow({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="rounded-[24px] border border-[var(--border-card)] bg-[var(--bg-card)]/85 p-4 shadow-[var(--card-shadow)]">
      <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
        {description}
      </p>
    </div>
  )
}

function FlowNote({ locale }: { locale: SupportedLocale }) {
  return (
      <div className="rounded-[28px] border border-[var(--border-card)] bg-[var(--bg-card)]/88 p-5 shadow-[var(--card-shadow)]">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-[var(--accent-glow)] px-3 py-1 text-xs font-medium text-[var(--accent-text)]">
            {t('tagShorts', locale)}
          </span>
          <span className="rounded-full bg-[var(--bg-secondary)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
            {t('tagSubtitles', locale)}
          </span>
          <span className="rounded-full bg-[var(--bg-secondary)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
            {t('tagSave', locale)}
          </span>
          <span className="rounded-full bg-[var(--bg-secondary)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
            Learn
          </span>
        </div>
        <p className="mt-4 text-xl font-bold text-[var(--text-primary)]">
          {t('flowNoteTitle', locale)}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
          {t('flowNoteDesc', locale)}
        </p>
      </div>
  )
}

function LoginPageContent() {
  const { user, loading, authAvailable, signInWithGoogle, signInWithKakao } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const locale = useLocaleStore((s) => s.locale)
  const nextPath = useMemo(
    () => sanitizeAppPath(searchParams.get('next'), '/explore'),
    [searchParams],
  )
  const guestContinuePath = useMemo(() => getGuestContinuePath(nextPath), [nextPath])

  useEffect(() => {
    if (!loading && user) {
      trackEvent('sign_up', { method: user.app_metadata?.provider ?? 'unknown' })
      router.replace(nextPath)
    }
  }, [loading, nextPath, router, user])

  return (
    <div className="min-h-dvh px-6 py-10 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100dvh-5rem)] max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <Logo className="h-12 text-[var(--text-primary)]" />
          <h1 className="mt-6 text-4xl font-bold leading-tight text-[var(--text-primary)]">
            {t('heroTitle1', locale)}
            <br />
            {t('heroTitle2', locale)}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--text-secondary)]">
            {t('heroDesc', locale)}
          </p>

          <div className="mt-8 max-w-xl">
            <FlowNote locale={locale} />
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <FeatureRow
              title={t('featureContinue', locale)}
              description={t('featureContinueDesc', locale)}
            />
            <FeatureRow
              title={t('featureSaved', locale)}
              description={t('featureSavedDesc', locale)}
            />
            <FeatureRow
              title={t('featureRecommend', locale)}
              description={t('featureRecommendDesc', locale)}
            />
            <FeatureRow
              title={t('featureGames', locale)}
              description={t('featureGamesDesc', locale)}
            />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[32px] border border-[var(--border-card)] bg-[var(--bg-card)]/92 p-6 shadow-2xl backdrop-blur-xl sm:p-8"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-text)]">
            {t('accountConnect', locale)}
          </p>
          <h2 className="mt-3 text-3xl font-bold text-[var(--text-primary)]">
            {t('loginTitle', locale)}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
            {t('loginDesc', locale)}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full bg-[var(--accent-glow)] px-3 py-1 text-xs font-medium text-[var(--accent-text)]">
              {t('badgeSync', locale)}
            </span>
            <span className="rounded-full bg-[var(--bg-secondary)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
              {t('badgeSaved', locale)}
            </span>
            <span className="rounded-full bg-[var(--bg-secondary)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
              {t('badgeLevel', locale)}
            </span>
            <span className="rounded-full bg-[var(--bg-secondary)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
              {t('badgeReview', locale)}
            </span>
          </div>

          {!authAvailable && (
            <div className="mt-5 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-secondary)] px-4 py-3">
              <p className="text-sm font-semibold text-[var(--text-secondary)]">
                {t('authUnavailableTitle', locale)}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                {t('authUnavailableDesc', locale)}
              </p>
            </div>
          )}

          <div className="mt-8 space-y-4">
            <button
              onClick={() => signInWithGoogle(nextPath)}
              disabled={!authAvailable}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-4 text-base font-medium text-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {t('googleButton', locale)}
            </button>

            <button
              onClick={() => signInWithKakao(nextPath)}
              disabled={!authAvailable}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FEE500] py-4 text-base font-medium text-[#191919] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#191919"
                  d="M12 3C6.48 3 2 6.36 2 10.5c0 2.67 1.74 5.01 4.36 6.36l-1.1 4.07c-.08.31.27.55.54.38l4.73-3.12c.48.05.97.08 1.47.08 5.52 0 10-3.36 10-7.5S17.52 3 12 3z"
                />
              </svg>
              {t('kakaoButton', locale)}
            </button>

            <button
              onClick={() => router.push(guestContinuePath)}
              className="w-full rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] py-4 text-base text-[var(--text-secondary)]"
            >
              {t('guestButton', locale)}
            </button>
          </div>

          <p className="mt-8 text-xs leading-relaxed text-[var(--text-muted)]">
            {t('termsPrefix', locale)}{' '}
            <Link href="/terms" className="text-[var(--text-secondary)] underline underline-offset-2">
              {t('termsLink', locale)}
            </Link>
            {t('termsMid', locale)}
            <Link href="/privacy" className="text-[var(--text-secondary)] underline underline-offset-2">
              {t('privacyLink', locale)}
            </Link>
            {t('termsSuffix', locale)}
          </p>
        </motion.div>
      </div>
    </div>
  )
}

function LoginPageFallback() {
  return (
    <div className="flex h-dvh items-center justify-center bg-[var(--bg-primary)]">
      <LogoFull className="h-12 animate-fade-in text-[var(--text-primary)]" />
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageContent />
    </Suspense>
  )
}
