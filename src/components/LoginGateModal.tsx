'use client'

import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'

const GUEST_VIEW_LIMIT = 3

interface LoginGateModalProps {
  isOpen: boolean
}

export function LoginGateModal({ isOpen }: LoginGateModalProps) {
  const { signInWithGoogle, signInWithKakao } = useAuth()

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-sm mx-6 bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl px-6 py-10 text-center"
        style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.4)' }}
      >
        <h2 className="text-[var(--text-primary)] text-2xl font-bold mb-2">
          로그인하고 계속 학습하기
        </h2>
        <p className="text-[var(--text-secondary)] text-sm mb-8">
          무료 {GUEST_VIEW_LIMIT}개 영상을 다 봤어요.
          <br />
          로그인하면 학습 기록이 안전하게 저장돼요.
        </p>

        <div className="space-y-3">
          <button
            onClick={signInWithGoogle}
            className="w-full py-3.5 bg-white text-black rounded-xl font-medium flex items-center justify-center gap-2 text-base"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google로 계속하기
          </button>

          <button
            onClick={signInWithKakao}
            className="w-full py-3.5 bg-[#FEE500] text-[#191919] rounded-xl font-medium flex items-center justify-center gap-2 text-base"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#191919" d="M12 3C6.48 3 2 6.36 2 10.5c0 2.67 1.74 5.01 4.36 6.36l-1.1 4.07c-.08.31.27.55.54.38l4.73-3.12c.48.05.97.08 1.47.08 5.52 0 10-3.36 10-7.5S17.52 3 12 3z" />
            </svg>
            카카오로 계속하기
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
