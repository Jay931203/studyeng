'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useOnboardingStore } from '@/stores/useOnboardingStore'

const LEVELS = [
  { id: 'beginner' as const, title: '초급', desc: '기본 인사, 간단한 문장 정도' },
  { id: 'intermediate' as const, title: '중급', desc: '일상 대화는 가능해요' },
  { id: 'advanced' as const, title: '고급', desc: '원어민 영상도 도전해볼래요' },
]

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [selectedLevel, setSelectedLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner')
  const { completeOnboarding, setLevel } = useOnboardingStore()
  const router = useRouter()

  const finish = () => {
    setLevel(selectedLevel)
    completeOnboarding()
    router.replace('/')
  }

  const next = () => setStep((s) => s + 1)

  return (
    <div className="h-dvh bg-black flex flex-col">
      {/* Progress dots */}
      <div className="flex gap-1.5 justify-center pt-12 pb-4">
        {[0, 1].map((i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all ${
              i === step ? 'w-6 bg-blue-500' : i < step ? 'w-1.5 bg-blue-500/50' : 'w-1.5 bg-white/20'
            }`}
          />
        ))}
      </div>

      <div className="flex-1 flex items-center justify-center px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-sm"
          >
            {step === 0 && (
              <div className="text-center">
                <h1 className="text-white text-3xl font-black mb-3">StudyEng</h1>
                <p className="text-gray-400 text-lg mb-12">짧은 영상으로 영어가 재밌어져요</p>
                <button onClick={next} className="w-full py-3.5 bg-blue-500 text-white rounded-xl font-medium text-base">
                  시작하기
                </button>
              </div>
            )}

            {step === 1 && (
              <div>
                <h2 className="text-white text-xl font-bold mb-6">영어 실력은 어느 정도예요?</h2>
                <div className="flex flex-col gap-3 mb-8">
                  {LEVELS.map((lv) => (
                    <button
                      key={lv.id}
                      onClick={() => setSelectedLevel(lv.id)}
                      className={`p-4 rounded-xl text-left transition-colors ${
                        selectedLevel === lv.id
                          ? 'bg-blue-500/20 border-2 border-blue-500'
                          : 'bg-white/5 border border-white/10'
                      }`}
                    >
                      <p className="text-white font-medium">{lv.title}</p>
                      <p className="text-gray-400 text-sm mt-0.5">{lv.desc}</p>
                    </button>
                  ))}
                </div>
                <button onClick={finish} className="w-full py-3.5 bg-blue-500 text-white rounded-xl font-medium">
                  시작하기
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
