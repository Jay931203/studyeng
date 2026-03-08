'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { usePremiumStore } from '@/stores/usePremiumStore'
import { useDiscountStore } from '@/stores/useDiscountStore'

interface PremiumModalProps {
  isOpen: boolean
  onClose: () => void
  trigger?: 'video-limit' | 'phrase-limit'
}

const triggerMessages: Record<string, string> = {
  'video-limit': '오늘의 무료 영상을 다 봤어요',
  'phrase-limit': '무료 표현 저장이 가득 찼어요',
}

const features = [
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm14.024-.983a1.125 1.125 0 010 1.966l-5.603 3.113A1.125 1.125 0 019 15.113V8.887c0-.857.921-1.4 1.671-.983l5.603 3.113z" clipRule="evenodd" />
      </svg>
    ),
    text: '무제한 영상 시청',
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z" clipRule="evenodd" />
      </svg>
    ),
    text: '무제한 표현 저장',
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M14.447 3.027a.75.75 0 0 1 .527.92l-4.5 16.5a.75.75 0 0 1-1.448-.394l4.5-16.5a.75.75 0 0 1 .921-.526ZM16.72 6.22a.75.75 0 0 1 1.06 0l5.25 5.25a.75.75 0 0 1 0 1.06l-5.25 5.25a.75.75 0 1 1-1.06-1.06L21.44 12l-4.72-4.72a.75.75 0 0 1 0-1.06Zm-9.44 0a.75.75 0 0 1 0 1.06L2.56 12l4.72 4.72a.75.75 0 0 1-1.06 1.06L.97 12.53a.75.75 0 0 1 0-1.06l5.25-5.25a.75.75 0 0 1 1.06 0Z" />
      </svg>
    ),
    text: '전체 복습 게임',
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM6.262 6.072a8.25 8.25 0 1010.562-.766 4.5 4.5 0 01-1.318 8.357A6.013 6.013 0 0114.56 12c0-1.26-.388-2.43-1.05-3.397a8.08 8.08 0 00-2.248-2.531zM12 7.5a3 3 0 00-3 3c0 .98.47 1.85 1.198 2.396A4.49 4.49 0 0112 16.5a4.49 4.49 0 011.802-3.604A3 3 0 0012 7.5z" clipRule="evenodd" />
      </svg>
    ),
    text: '광고 없음',
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 5H5.25a.75.75 0 000 1.5h.656l-.789 10.283A2.25 2.25 0 007.362 19.5h9.276a2.25 2.25 0 002.245-2.717L18.094 6.5h.656a.75.75 0 000-1.5h-3.8l-.178-1.183a1.875 1.875 0 00-1.85-1.567h-2.844zM13.669 5l-.113-.75h-3.112L10.331 5h3.338zM9.44 8.25a.75.75 0 01.75.75v7.5a.75.75 0 01-1.5 0v-7.5a.75.75 0 01.75-.75zm5.12.75a.75.75 0 00-1.5 0v7.5a.75.75 0 001.5 0v-7.5z" clipRule="evenodd" />
      </svg>
    ),
    text: 'AI 개인화 난이도',
  },
]

const MONTHLY_PRICE = 9900
const YEARLY_PRICE = 79900

function formatPrice(price: number): string {
  return price.toLocaleString('ko-KR')
}

export function PremiumModal({ isOpen, onClose, trigger = 'video-limit' }: PremiumModalProps) {
  const setPremium = usePremiumStore((s) => s.setPremium)
  const getCompletionRate = useDiscountStore((s) => s.getCompletionRate)
  const getDiscountRate = useDiscountStore((s) => s.getDiscountRate)
  const checkAndResetMonthly = useDiscountStore((s) => s.checkAndResetMonthly)

  // 월 리셋 확인
  if (isOpen) {
    checkAndResetMonthly()
  }

  const completionRate = getCompletionRate()
  const discountRate = getDiscountRate()
  const hasDiscount = discountRate > 0

  const discountedMonthly = Math.round(MONTHLY_PRICE * (1 - discountRate / 100))
  const discountedYearly = Math.round(YEARLY_PRICE * (1 - discountRate / 100))

  const handleUpgrade = () => {
    // For now, just set premium directly (no real payment)
    setPremium(true)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200] flex items-end justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[var(--bg-card)] rounded-t-3xl px-6 pt-8 pb-10 safe-area-bottom"
            style={{
              boxShadow: '0 -4px 40px rgba(0,0,0,0.3)',
              border: '1px solid var(--border-card)',
              borderBottom: 'none',
            }}
          >
            {/* Handle bar */}
            <div className="w-10 h-1 bg-[var(--text-muted)] rounded-full mx-auto mb-6 opacity-40" />

            {/* Trigger context message */}
            <p className="text-[var(--text-muted)] text-sm text-center mb-2">
              {triggerMessages[trigger]}
            </p>

            {/* Title */}
            <h2 className="text-[var(--text-primary)] text-2xl font-bold text-center mb-4">
              프리미엄으로 제한 없이
            </h2>

            {/* 할인 배지 - 할인율이 있을 때만 */}
            {hasDiscount && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-6"
              >
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-center">
                  <p className="text-emerald-400 text-sm font-bold">
                    이번 달 달성률 {Math.round(completionRate)}% -- {discountRate}% 할인 적용
                  </p>
                  <p className="text-[var(--text-muted)] text-xs mt-1">
                    미션 달성에 따라 최대 20% 할인
                  </p>
                </div>
              </motion.div>
            )}

            {!hasDiscount && (
              <p className="text-[var(--text-muted)] text-xs text-center mb-6">
                미션을 꾸준히 달성하면 구독료 할인을 받을 수 있습니다
              </p>
            )}

            {/* Features list */}
            <div className="space-y-4 mb-8">
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500/15 flex items-center justify-center text-blue-400">
                    {feature.icon}
                  </div>
                  <span className="text-[var(--text-primary)] font-medium">
                    {feature.text}
                  </span>
                </div>
              ))}
            </div>

            {/* Pricing */}
            <div className="space-y-3 mb-8">
              {/* 연간 플랜 */}
              <div className="flex items-center justify-between bg-blue-500/10 rounded-2xl px-5 py-4 ring-2 ring-blue-500/40">
                <div>
                  <p className="text-[var(--text-primary)] font-bold">
                    연간 플랜
                  </p>
                  <p className="text-blue-400 text-sm font-medium mt-0.5">
                    {hasDiscount ? `33% + ${discountRate}% 추가 할인` : '33% 할인'}
                  </p>
                </div>
                <div className="text-right">
                  {hasDiscount ? (
                    <>
                      <p className="text-[var(--text-muted)] text-sm line-through">
                        {formatPrice(YEARLY_PRICE)}원
                      </p>
                      <p className="text-emerald-400 font-bold text-lg">
                        {formatPrice(discountedYearly)}원
                      </p>
                    </>
                  ) : (
                    <p className="text-[var(--text-primary)] font-bold text-lg">
                      {formatPrice(YEARLY_PRICE)}원
                    </p>
                  )}
                  <p className="text-[var(--text-muted)] text-xs">
                    /년
                  </p>
                </div>
              </div>

              {/* 월간 플랜 */}
              <div className="flex items-center justify-between bg-[var(--bg-secondary)] rounded-2xl px-5 py-4">
                <div>
                  <p className="text-[var(--text-primary)] font-medium">
                    월간 플랜
                  </p>
                  {hasDiscount && (
                    <p className="text-emerald-400 text-sm font-medium mt-0.5">
                      {discountRate}% 할인
                    </p>
                  )}
                </div>
                <div className="text-right">
                  {hasDiscount ? (
                    <>
                      <p className="text-[var(--text-muted)] text-sm line-through">
                        {formatPrice(MONTHLY_PRICE)}원
                      </p>
                      <p className="text-emerald-400 font-bold text-lg">
                        {formatPrice(discountedMonthly)}원
                      </p>
                    </>
                  ) : (
                    <p className="text-[var(--text-primary)] font-bold text-lg">
                      {formatPrice(MONTHLY_PRICE)}원
                    </p>
                  )}
                  <p className="text-[var(--text-muted)] text-xs">
                    /월
                  </p>
                </div>
              </div>
            </div>

            {/* CTA buttons */}
            <button
              onClick={handleUpgrade}
              className="w-full py-4 rounded-2xl bg-blue-500 text-white font-bold text-base transition-colors hover:bg-blue-600 active:bg-blue-700"
            >
              {hasDiscount ? `${discountRate}% 할인된 가격으로 시작` : '프리미엄 시작'}
            </button>

            <button
              onClick={onClose}
              className="w-full py-3 mt-2 text-[var(--text-muted)] text-sm font-medium"
            >
              나중에
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
