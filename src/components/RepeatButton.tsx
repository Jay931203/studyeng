'use client'

import { usePlayerStore } from '@/stores/usePlayerStore'
import { useLocaleStore } from '@/stores/useLocaleStore'

const T = {
  repeat: { ko: '반복 재생', ja: 'リピート再生', 'zh-TW': '重複播放', vi: 'Phat lai' },
} as const

const REPEAT_CYCLE = ['off', 'x2', 'x3'] as const

export function RepeatButton() {
  const { repeatMode, setRepeatMode } = usePlayerStore()
  const locale = useLocaleStore((s) => s.locale)

  const handleTap = (e: React.PointerEvent) => {
    e.stopPropagation()
    const idx = REPEAT_CYCLE.indexOf(repeatMode)
    const next = REPEAT_CYCLE[(idx + 1) % REPEAT_CYCLE.length]
    setRepeatMode(next)
  }

  const isActive = repeatMode !== 'off'
  const label = repeatMode === 'off' ? '1x' : repeatMode === 'x2' ? '2x' : '3x'

  return (
    <button
      onPointerUp={handleTap}
      className={`backdrop-blur-sm w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
        isActive ? 'bg-purple-500 text-white' : 'bg-black/50 text-white'
      }`}
      title={T.repeat[locale]}
    >
      <div className="flex flex-col items-center leading-none">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-4 h-4"
        >
          <path d="M4.755 10.059a7.5 7.5 0 0112.548-3.364l1.903 1.903H14.25a.75.75 0 000 1.5h6a.75.75 0 00.75-.75v-6a.75.75 0 00-1.5 0v3.068l-1.903-1.903A9 9 0 003.306 9.67a.75.75 0 101.45.388zm14.49 3.882a7.5 7.5 0 01-12.548 3.364l-1.903-1.903H9.75a.75.75 0 000-1.5h-6a.75.75 0 00-.75.75v6a.75.75 0 001.5 0v-3.068l1.903 1.903A9 9 0 0020.694 14.33a.75.75 0 10-1.45-.388z" />
        </svg>
        <span className="text-[9px] font-bold mt-0.5">{label}</span>
      </div>
    </button>
  )
}
