'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Logo, LogoFull } from '@/components/Logo'
import { useOnboardingStore } from '@/stores/useOnboardingStore'
import { useAuth } from '@/hooks/useAuth'
import { buildPathWithNext, sanitizeAppPath } from '@/lib/navigation'
import { useLocaleStore } from '@/stores/useLocaleStore'
import type { CefrLevel } from '@/types/level'

const TRANSLATIONS = {
  ko: {
    shorteeStart: 'Shortee 시작',
    introBody1: '쇼츠와 시리즈를 넘기며 보고,',
    introBody2: '저장한 표현은 게임과 XP 흐름으로 바로 이어집니다.',
    continueBtn: '계속하기',
    levelQuestion: '지금 영어 감각은 어느 정도인가요?',
    levelHint: '선택한 난이도는 홈 추천, 쇼츠 랜덤, 표현 추천에 반영됩니다.',
    startBtn: '시작하기',
    howToUse: '이렇게 사용해보세요',
    howToUseDesc: '영상에서 바로 저장하고, 피드를 바꾸고, Learn에서 이어 복습할 수 있어요.',
    gestureTap: '탭',
    gestureTapDesc: '해당 장면으로 이동',
    gestureDoubleTap: '두 번 탭',
    gestureDoubleTapDesc: '표현 저장 / 해제',
    gestureLongPress: '길게 누르기',
    gestureLongPressDesc: '자막 고정 (프리즈)',
    gestureSwitcher: 'Series | Shorts',
    gestureSwitcherDesc: '하단 또는 가로 모드 스위처로 피드 전환',
    learnReview: 'Learn 복습',
    learnReviewDesc: '저장 표현과 게임, XP 흐름은 Learn 탭에서 다시 이어집니다.',
    remote: '리모콘',
    remoteDesc: '가로 모드에서는 플로팅 리모콘으로 재생, 이동, 프리즈를 조작할 수 있어요.',
    levelA1Title: 'A1 입문',
    levelA1Desc: '짧은 표현과 쉬운 대사를 중심으로 듣고 싶어요.',
    levelA2Title: 'A2 초급',
    levelA2Desc: '기초 표현은 알지만, 자연스럽게 연결해 말하고 싶어요.',
    levelB1Title: 'B1 중하급',
    levelB1Desc: '일상 표현은 이해하고, 말하기도 조금 더 자연스럽게 하고 싶어요.',
    levelB2Title: 'B2 중상급',
    levelB2Desc: '긴 대화와 다양한 주제를 무리 없이 따라가고 싶어요.',
    levelC1Title: 'C1 고급',
    levelC1Desc: '빠른 영상과 실제 대화도 큰 막힘 없이 따라가고 싶어요.',
    levelC2Title: 'C2 마스터',
    levelC2Desc: '원어민 수준의 뉘앙스와 표현까지 완벽하게 익히고 싶어요.',
  },
  ja: {
    shorteeStart: 'Shortee スタート',
    introBody1: 'ショート動画やシリーズをスワイプして視聴し、',
    introBody2: '保存した表現はゲームとXPの流れにそのまま繋がります。',
    continueBtn: '続ける',
    levelQuestion: '今の英語力はどのくらいですか？',
    levelHint: '選んだレベルはホームのおすすめ、ショートのランダム再生、表現のおすすめに反映されます。',
    startBtn: '始める',
    howToUse: 'こうやって使ってみましょう',
    howToUseDesc: '動画からすぐ保存、フィードを切り替え、Learnで復習を続けられます。',
    gestureTap: 'タップ',
    gestureTapDesc: 'そのシーンに移動',
    gestureDoubleTap: 'ダブルタップ',
    gestureDoubleTapDesc: '表現を保存 / 解除',
    gestureLongPress: '長押し',
    gestureLongPressDesc: '字幕を固定（フリーズ）',
    gestureSwitcher: 'Series | Shorts',
    gestureSwitcherDesc: '下部または横向きモードのスイッチャーでフィード切替',
    learnReview: 'Learn 復習',
    learnReviewDesc: '保存した表現やゲーム、XPの流れはLearnタブで引き続き確認できます。',
    remote: 'リモコン',
    remoteDesc: '横向きモードではフローティングリモコンで再生、移動、フリーズを操作できます。',
    levelA1Title: 'A1 入門',
    levelA1Desc: '短い表現や簡単なセリフを中心に聞きたいです。',
    levelA2Title: 'A2 初級',
    levelA2Desc: '基本的な表現は分かるけど、自然につなげて話したいです。',
    levelB1Title: 'B1 中級',
    levelB1Desc: '日常会話は理解できるので、もう少し自然に話したいです。',
    levelB2Title: 'B2 中上級',
    levelB2Desc: '長い会話やさまざまなテーマを無理なく理解したいです。',
    levelC1Title: 'C1 上級',
    levelC1Desc: '速い動画や実際の会話もスムーズに理解したいです。',
    levelC2Title: 'C2 マスター',
    levelC2Desc: 'ネイティブレベルのニュアンスや表現まで完璧に身につけたいです。',
  },
  'zh-TW': {
    shorteeStart: '開始 Shortee',
    introBody1: '滑動觀看短影片和系列影片，',
    introBody2: '儲存的表達會直接串接遊戲和 XP 流程。',
    continueBtn: '繼續',
    levelQuestion: '你目前的英語水平如何？',
    levelHint: '你選擇的等級會影響首頁推薦、短影片隨機播放和表達推薦。',
    startBtn: '開始',
    howToUse: '使用方式',
    howToUseDesc: '在影片中直接儲存，切換動態，在 Learn 中繼續複習。',
    gestureTap: '點擊',
    gestureTapDesc: '跳到該片段',
    gestureDoubleTap: '雙擊',
    gestureDoubleTapDesc: '儲存 / 取消儲存表達',
    gestureLongPress: '長按',
    gestureLongPressDesc: '凍結字幕',
    gestureSwitcher: 'Series | Shorts',
    gestureSwitcherDesc: '透過底部或橫向模式切換器切換動態',
    learnReview: 'Learn 複習',
    learnReviewDesc: '儲存的表達、遊戲和 XP 進度都可以在 Learn 分頁中繼續。',
    remote: '遙控器',
    remoteDesc: '橫向模式下可使用浮動遙控器操作播放、跳轉和凍結。',
    levelA1Title: 'A1 入門',
    levelA1Desc: '想從簡短的表達和簡單的台詞開始聽。',
    levelA2Title: 'A2 初級',
    levelA2Desc: '已知基礎表達，想更自然地連貫表達。',
    levelB1Title: 'B1 中級',
    levelB1Desc: '能理解日常表達，想讓口說更自然流暢。',
    levelB2Title: 'B2 中高級',
    levelB2Desc: '想輕鬆跟上長對話和各種主題。',
    levelC1Title: 'C1 高級',
    levelC1Desc: '想順暢理解快節奏影片和真實對話。',
    levelC2Title: 'C2 精通',
    levelC2Desc: '想完美掌握母語者級別的語感和表達。',
  },
  vi: {
    shorteeStart: 'B\u1eaft \u0111\u1ea7u Shortee',
    introBody1: 'Vu\u1ed1t xem video ng\u1eafn v\u00e0 series,',
    introBody2: 'c\u00e1c bi\u1ec3u \u0111\u1ea1t \u0111\u00e3 l\u01b0u s\u1ebd \u0111\u01b0\u1ee3c n\u1ed1i ti\u1ebfp b\u1eb1ng tr\u00f2 ch\u01a1i v\u00e0 XP.',
    continueBtn: 'Ti\u1ebfp t\u1ee5c',
    levelQuestion: 'Tr\u00ecnh \u0111\u1ed9 ti\u1ebfng Anh hi\u1ec7n t\u1ea1i c\u1ee7a b\u1ea1n?',
    levelHint: 'C\u1ea5p \u0111\u1ed9 b\u1ea1n ch\u1ecdn s\u1ebd \u1ea3nh h\u01b0\u1edfng \u0111\u1ebfn \u0111\u1ec1 xu\u1ea5t trang ch\u1ee7, ph\u00e1t ng\u1eabu nhi\u00ean Shorts v\u00e0 \u0111\u1ec1 xu\u1ea5t bi\u1ec3u \u0111\u1ea1t.',
    startBtn: 'B\u1eaft \u0111\u1ea7u',
    howToUse: 'C\u00e1ch s\u1eed d\u1ee5ng',
    howToUseDesc: 'L\u01b0u tr\u1ef1c ti\u1ebfp t\u1eeb video, chuy\u1ec3n \u0111\u1ed5i feed v\u00e0 ti\u1ebfp t\u1ee5c \u00f4n t\u1eadp t\u1ea1i Learn.',
    gestureTap: 'Nh\u1ea5n',
    gestureTapDesc: 'Chuy\u1ec3n \u0111\u1ebfn c\u1ea3nh \u0111\u00f3',
    gestureDoubleTap: 'Nh\u1ea5n \u0111\u00fap',
    gestureDoubleTapDesc: 'L\u01b0u / b\u1ecf l\u01b0u bi\u1ec3u \u0111\u1ea1t',
    gestureLongPress: 'Nh\u1ea5n gi\u1eef',
    gestureLongPressDesc: '\u0110\u00f3ng b\u0103ng ph\u1ee5 \u0111\u1ec1',
    gestureSwitcher: 'Series | Shorts',
    gestureSwitcherDesc: 'Chuy\u1ec3n \u0111\u1ed5i feed b\u1eb1ng thanh chuy\u1ec3n \u0111\u1ed5i \u1edf d\u01b0\u1edbi ho\u1eb7c ch\u1ebf \u0111\u1ed9 ngang',
    learnReview: '\u00d4n t\u1eadp Learn',
    learnReviewDesc: 'Bi\u1ec3u \u0111\u1ea1t \u0111\u00e3 l\u01b0u, tr\u00f2 ch\u01a1i v\u00e0 ti\u1ebfn tr\u00ecnh XP \u0111\u1ec1u c\u00f3 th\u1ec3 ti\u1ebfp t\u1ee5c t\u1ea1i tab Learn.',
    remote: '\u0110i\u1ec1u khi\u1ec3n',
    remoteDesc: '\u1ede ch\u1ebf \u0111\u1ed9 ngang, b\u1ea1n c\u00f3 th\u1ec3 d\u00f9ng \u0111i\u1ec1u khi\u1ec3n n\u1ed5i \u0111\u1ec3 ph\u00e1t, chuy\u1ec3n v\u00e0 \u0111\u00f3ng b\u0103ng.',
    levelA1Title: 'A1 Nh\u1eadp m\u00f4n',
    levelA1Desc: 'Mu\u1ed1n nghe c\u00e1c bi\u1ec3u \u0111\u1ea1t ng\u1eafn v\u00e0 l\u1eddi tho\u1ea1i \u0111\u01a1n gi\u1ea3n.',
    levelA2Title: 'A2 S\u01a1 c\u1ea5p',
    levelA2Desc: '\u0110\u00e3 bi\u1ebft bi\u1ec3u \u0111\u1ea1t c\u01a1 b\u1ea3n, mu\u1ed1n n\u00f3i t\u1ef1 nhi\u00ean h\u01a1n.',
    levelB1Title: 'B1 Trung c\u1ea5p',
    levelB1Desc: 'Hi\u1ec3u \u0111\u01b0\u1ee3c h\u1ed9i tho\u1ea1i h\u00e0ng ng\u00e0y, mu\u1ed1n n\u00f3i t\u1ef1 nhi\u00ean v\u00e0 tr\u00f4i ch\u1ea3y h\u01a1n.',
    levelB2Title: 'B2 Trung cao c\u1ea5p',
    levelB2Desc: 'Mu\u1ed1n theo k\u1ecbp h\u1ed9i tho\u1ea1i d\u00e0i v\u00e0 nhi\u1ec1u ch\u1ee7 \u0111\u1ec1 kh\u00e1c nhau.',
    levelC1Title: 'C1 Cao c\u1ea5p',
    levelC1Desc: 'Mu\u1ed1n hi\u1ec3u tr\u1ecdn video nhanh v\u00e0 h\u1ed9i tho\u1ea1i th\u1ef1c t\u1ebf.',
    levelC2Title: 'C2 Th\u00e0nh th\u1ea1o',
    levelC2Desc: 'Mu\u1ed1n n\u1eafm b\u1eaft ho\u00e0n h\u1ea3o s\u1eafc th\u00e1i v\u00e0 bi\u1ec3u \u0111\u1ea1t nh\u01b0 ng\u01b0\u1eddi b\u1ea3n ng\u1eef.',
  },
} as const

function LoadingScreen() {
  return (
    <div className="flex h-dvh items-center justify-center bg-black">
      <LogoFull className="h-12 text-white animate-fade-in" />
    </div>
  )
}

function OnboardingPageContent() {
  const [step, setStep] = useState(0)
  const [selectedLevel, setSelectedLevel] =
    useState<CefrLevel>('A1')
  const { user, loading } = useAuth()
  const hasOnboarded = useOnboardingStore((state) => state.hasOnboarded)
  const hydrated = useOnboardingStore((state) => state.hydrated)
  const completeOnboarding = useOnboardingStore((state) => state.completeOnboarding)
  const setLevel = useOnboardingStore((state) => state.setLevel)
  const router = useRouter()
  const searchParams = useSearchParams()
  const locale = useLocaleStore((s) => s.locale)
  const T = useMemo(() => {
    const lang = locale in TRANSLATIONS ? (locale as keyof typeof TRANSLATIONS) : 'ko'
    return TRANSLATIONS[lang]
  }, [locale])
  const nextPath = sanitizeAppPath(searchParams.get('next'), '/explore')
  const onboardingReturnPath = nextPath === '/explore' ? '/onboarding' : buildPathWithNext('/onboarding', nextPath)

  const levels: readonly { id: CefrLevel; title: string; desc: string }[] = useMemo(() => [
    { id: 'A1', title: T.levelA1Title, desc: T.levelA1Desc },
    { id: 'A2', title: T.levelA2Title, desc: T.levelA2Desc },
    { id: 'B1', title: T.levelB1Title, desc: T.levelB1Desc },
    { id: 'B2', title: T.levelB2Title, desc: T.levelB2Desc },
    { id: 'C1', title: T.levelC1Title, desc: T.levelC1Desc },
    { id: 'C2', title: T.levelC2Title, desc: T.levelC2Desc },
  ], [T])

  useEffect(() => {
    if (loading || !hydrated) return

    if (!user) {
      router.replace(buildPathWithNext('/login', onboardingReturnPath))
      return
    }

    if (hasOnboarded) {
      router.replace(nextPath)
    }
  }, [hasOnboarded, hydrated, loading, nextPath, onboardingReturnPath, router, user])

  const finish = () => {
    setLevel(selectedLevel)
    completeOnboarding()
    router.replace(nextPath)
  }

  if (loading || !hydrated || !user) {
    return <LoadingScreen />
  }

  return (
    <div className="flex h-dvh flex-col bg-black">
      <div className="flex justify-center gap-1.5 pb-4 pt-12">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className={`h-1 rounded-full transition-all ${
              index === step
                ? 'w-6 bg-[var(--accent-primary)]'
                : index < step
                  ? 'w-1.5 bg-[var(--accent-primary)]/50'
                  : 'w-1.5 bg-white/20'
            }`}
          />
        ))}
      </div>

      <div className="flex flex-1 items-center justify-center px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-sm"
          >
            {step === 0 && (
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent-text)]">
                  {T.shorteeStart}
                </p>
                <Logo className="h-8 mx-auto mt-4 mb-3 text-white" />
                <p className="mb-12 text-lg leading-relaxed text-gray-400">
                  {T.introBody1}
                  <br />
                  {T.introBody2}
                </p>
                <button
                  onClick={() => setStep(1)}
                  className="w-full rounded-xl bg-[var(--accent-primary)] py-3.5 text-base font-medium text-white"
                >
                  {T.continueBtn}
                </button>
              </div>
            )}

            {step === 1 && (
              <div>
                <h2 className="mb-2 text-xl font-bold text-white">
                  {T.levelQuestion}
                </h2>
                <p className="mb-6 text-sm text-gray-400">
                  {T.levelHint}
                </p>
                <div className="mb-8 flex flex-col gap-3">
                  {levels.map((level) => (
                    <button
                      key={level.id}
                      onClick={() => setSelectedLevel(level.id)}
                      className={`rounded-xl p-4 text-left transition-colors ${
                        selectedLevel === level.id
                          ? 'border-2 border-[var(--accent-primary)] bg-[var(--accent-primary)]/15'
                          : 'border border-white/10 bg-white/5'
                      }`}
                    >
                      <p className="font-medium text-white">{level.title}</p>
                      <p className="mt-0.5 text-sm text-gray-400">{level.desc}</p>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => { setLevel(selectedLevel); setStep(2) }}
                  className="w-full rounded-xl bg-[var(--accent-primary)] py-3.5 font-medium text-white"
                >
                  {T.continueBtn}
                </button>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="mb-2 text-xl font-bold text-white">
                  {T.howToUse}
                </h2>
                <p className="mb-6 text-sm text-gray-400">
                  {T.howToUseDesc}
                </p>
                <div className="mb-6 flex flex-col gap-3">
                  {[
                    { gesture: T.gestureTap, desc: T.gestureTapDesc },
                    { gesture: T.gestureDoubleTap, desc: T.gestureDoubleTapDesc },
                    { gesture: T.gestureLongPress, desc: T.gestureLongPressDesc },
                    { gesture: T.gestureSwitcher, desc: T.gestureSwitcherDesc },
                  ].map((item) => (
                    <div
                      key={item.gesture}
                      className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4"
                    >
                      <span className="shrink-0 rounded-lg bg-[var(--accent-primary)]/15 px-3 py-1.5 text-xs font-semibold text-[var(--accent-text)]">
                        {item.gesture}
                      </span>
                      <p className="text-sm text-gray-300">{item.desc}</p>
                    </div>
                  ))}
                </div>
                <div className="mb-8 rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-primary)]/15 text-[var(--accent-text)]">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                        <path d="M10 3a1 1 0 0 1 1 1v5.382l2.447 2.447a1 1 0 0 1-1.414 1.414l-2.74-2.74A1 1 0 0 1 9 9.796V4a1 1 0 0 1 1-1Z" />
                        <path fillRule="evenodd" d="M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm0-14a6 6 0 1 0 0 12 6 6 0 0 0 0-12Z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{T.learnReview}</p>
                      <p className="mt-0.5 text-xs text-gray-400">
                        {T.learnReviewDesc}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-gray-400">
                        <path fillRule="evenodd" d="M3.25 3A2.25 2.25 0 0 0 1 5.25v9.5A2.25 2.25 0 0 0 3.25 17h13.5A2.25 2.25 0 0 0 19 14.75v-9.5A2.25 2.25 0 0 0 16.75 3H3.25ZM2.5 9v5.75c0 .414.336.75.75.75h13.5a.75.75 0 0 0 .75-.75V9h-15ZM4 5.25a.75.75 0 0 0-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 0 0 .75-.75V6a.75.75 0 0 0-.75-.75H4ZM6.25 6a.75.75 0 0 1 .75-.75h.01a.75.75 0 0 1 .75.75v.01a.75.75 0 0 1-.75.75H7a.75.75 0 0 1-.75-.75V6ZM10 5.25a.75.75 0 0 0-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 0 0 .75-.75V6a.75.75 0 0 0-.75-.75H10Z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{T.remote}</p>
                      <p className="mt-0.5 text-xs text-gray-400">
                        {T.remoteDesc}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={finish}
                  className="w-full rounded-xl bg-[var(--accent-primary)] py-3.5 font-medium text-white"
                >
                  {T.startBtn}
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <OnboardingPageContent />
    </Suspense>
  )
}
