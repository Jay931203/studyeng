'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Logo, LogoFull } from '@/components/Logo'
import { useOnboardingStore } from '@/stores/useOnboardingStore'
import { useAuth } from '@/hooks/useAuth'

const LEVELS = [
  {
    id: 'beginner' as const,
    title: '입문',
    desc: '짧은 표현과 쉬운 대사를 중심으로 듣고 싶어요.',
  },
  {
    id: 'intermediate' as const,
    title: '중급',
    desc: '일상 표현은 이해하고, 말하기도 조금 더 자연스럽게 하고 싶어요.',
  },
  {
    id: 'advanced' as const,
    title: '고급',
    desc: '빠른 영상과 실제 대화도 큰 막힘 없이 따라가고 싶어요.',
  },
] as const

function LoadingScreen() {
  return (
    <div className="flex h-dvh items-center justify-center bg-black">
      <LogoFull className="h-12 text-white animate-fade-in" />
    </div>
  )
}

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [selectedLevel, setSelectedLevel] =
    useState<'beginner' | 'intermediate' | 'advanced'>('beginner')
  const { user, loading } = useAuth()
  const hasOnboarded = useOnboardingStore((state) => state.hasOnboarded)
  const hydrated = useOnboardingStore((state) => state.hydrated)
  const completeOnboarding = useOnboardingStore((state) => state.completeOnboarding)
  const setLevel = useOnboardingStore((state) => state.setLevel)
  const router = useRouter()

  useEffect(() => {
    if (loading || !hydrated) return

    if (!user) {
      router.replace('/login?next=/onboarding')
      return
    }

    if (hasOnboarded) {
      router.replace('/explore')
    }
  }, [hasOnboarded, hydrated, loading, router, user])

  const finish = () => {
    setLevel(selectedLevel)
    completeOnboarding()
    router.replace('/explore')
  }

  if (loading || !hydrated || !user) {
    return <LoadingScreen />
  }

  return (
    <div className="flex h-dvh flex-col bg-black">
      <div className="flex justify-center gap-1.5 pb-4 pt-12">
        {[0, 1].map((index) => (
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
                  Shortee 시작
                </p>
                <Logo className="h-8 mx-auto mt-4 mb-3 text-white" />
                <p className="mb-12 text-lg leading-relaxed text-gray-400">
                  처음 한 번만 감각을 맞추면
                  <br />
                  오늘 볼 장면과 복습 흐름이 바로 정리됩니다.
                </p>
                <button
                  onClick={() => setStep(1)}
                  className="w-full rounded-xl bg-[var(--accent-primary)] py-3.5 text-base font-medium text-white"
                >
                  계속하기
                </button>
              </div>
            )}

            {step === 1 && (
              <div>
                <h2 className="mb-2 text-xl font-bold text-white">
                  지금 영어 감각은 어느 정도인가요?
                </h2>
                <p className="mb-6 text-sm text-gray-400">
                  선택한 난이도는 오늘 장면과 복습 순서에 반영됩니다.
                </p>
                <div className="mb-8 flex flex-col gap-3">
                  {LEVELS.map((level) => (
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
                  onClick={finish}
                  className="w-full rounded-xl bg-[var(--accent-primary)] py-3.5 font-medium text-white"
                >
                  오늘 장면 받기
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
