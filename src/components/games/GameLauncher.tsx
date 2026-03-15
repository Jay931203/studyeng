'use client'

import { type ReactNode, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { ExpressionSwipeGame } from './ExpressionSwipeGame'
import { ListenFillGame } from './ListenFillGame'
import { SurfaceCard } from '@/components/ui/AppPage'
import { useDailyMissionStore } from '@/stores/useDailyMissionStore'
import { usePlayerStore } from '@/stores/usePlayerStore'
import { useLocaleStore } from '@/stores/useLocaleStore'
import { trackEvent, AnalyticsEvents } from '@/lib/analytics'

const TRANSLATIONS = {
  ko: {
    nextLineGuess: '다음 대사 맞히기',
    startFromShortsPlayer: '쇼츠 플레이어에서 바로 시작',
    meaningMatch: '뜻 매칭',
    meaningMatchDesc: '표현 뜻 고르기',
    listenFill: '듣고 채우기',
    listenFillDesc: '오디오 빈칸 맞히기',
  },
  ja: {
    nextLineGuess: '次のセリフを当てよう',
    startFromShortsPlayer: 'ショーツプレイヤーからすぐ開始',
    meaningMatch: '意味マッチング',
    meaningMatchDesc: '表現の意味を選ぶ',
    listenFill: '聞いて埋める',
    listenFillDesc: '音声の空欄を当てる',
  },
  'zh-TW': {
    nextLineGuess: '猜下一句台詞',
    startFromShortsPlayer: '在短影片播放器中直接開始',
    meaningMatch: '意思配對',
    meaningMatchDesc: '選擇表達的意思',
    listenFill: '聽力填空',
    listenFillDesc: '音頻填空',
  },
  vi: {
    nextLineGuess: 'Đoán câu thoại tiếp theo',
    startFromShortsPlayer: 'Bắt đầu ngay trong trình phát Shorts',
    meaningMatch: 'Ghép nghĩa',
    meaningMatchDesc: 'Chọn nghĩa của cụm từ',
    listenFill: 'Nghe và điền',
    listenFillDesc: 'Điền từ nghe được',
  },
} as const

type GameType = 'expression-swipe' | 'listen-fill'

function GameCard({
  title,
  description,
  tone,
  icon,
  onClick,
}: {
  title: string
  description: string
  tone: 'accent' | 'muted'
  icon: ReactNode
  onClick: () => void
}) {
  const accentTone = tone === 'accent'

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-4 text-left shadow-[var(--card-shadow)]"
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
          style={{
            backgroundColor: accentTone ? 'var(--accent-glow)' : 'var(--bg-secondary)',
            color: accentTone ? 'var(--accent-text)' : 'var(--text-secondary)',
          }}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <span className="block text-sm font-semibold text-[var(--text-primary)]">{title}</span>
          <span className="mt-0.5 block text-xs text-[var(--text-muted)]">{description}</span>
        </div>
      </div>
    </motion.button>
  )
}

export function GameLauncher() {
  const router = useRouter()
  const locale = useLocaleStore((s) => s.locale)
  const T = TRANSLATIONS[locale]
  const [activeGame, setActiveGame] = useState<GameType | null>(null)
  const incrementMission = useDailyMissionStore((state) => state.incrementMission)
  const setGameModeEnabled = usePlayerStore((state) => state.setGameModeEnabled)

  const handleComplete = (correct: boolean) => {
    void correct
    incrementMission('play-game')
    setActiveGame(null)
  }

  const launchGame = (type: GameType) => {
    trackEvent(AnalyticsEvents.GAME_PLAYED, { game_type: type })
    setActiveGame(type)
  }

  const launchShortsQuiz = () => {
    setGameModeEnabled(true)
    trackEvent(AnalyticsEvents.GAME_PLAYED, { game_type: 'subtitle-quiz' })
    router.push('/shorts')
  }

  return (
    <>
      <SurfaceCard className="p-5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
            GAMES
          </p>
        </div>

        <motion.button
          whileTap={{ scale: 0.985 }}
          onClick={launchShortsQuiz}
          className="mb-3 w-full rounded-2xl border border-[var(--border-card)] bg-[var(--bg-secondary)]/45 p-4 text-left"
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl"
              style={{ backgroundColor: 'var(--accent-glow)' }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                className="h-4 w-4"
                style={{ color: 'var(--accent-text)' }}
              >
                <rect x="5.25" y="5.25" width="13.5" height="13.5" rx="3.2" />
                <circle cx="9.15" cy="9.15" r="1.1" fill="currentColor" stroke="none" />
                <circle cx="14.85" cy="9.15" r="1.1" fill="currentColor" stroke="none" />
                <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
                <circle cx="9.15" cy="14.85" r="1.1" fill="currentColor" stroke="none" />
                <circle cx="14.85" cy="14.85" r="1.1" fill="currentColor" stroke="none" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-[var(--text-primary)]">
                {T.nextLineGuess}
              </span>
              <span className="mt-0.5 block text-xs text-[var(--text-muted)]">
                {T.startFromShortsPlayer}
              </span>
            </div>
          </div>
        </motion.button>

        <div className="grid grid-cols-2 gap-3">
          <GameCard
            title={T.meaningMatch}
            description={T.meaningMatchDesc}
            tone="accent"
            onClick={() => launchGame('expression-swipe')}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path d="M5.566 4.657A4.505 4.505 0 016.75 4.5h10.5c.41 0 .806.055 1.183.157A3 3 0 0015.75 3h-7.5a3 3 0 00-2.684 1.657zM2.25 12a3 3 0 013-3h13.5a3 3 0 013 3v6a3 3 0 01-3 3H5.25a3 3 0 01-3-3v-6zM5.25 7.5c-.41 0-.806.055-1.184.157A3 3 0 016.75 6h10.5a3 3 0 012.683 1.657A4.505 4.505 0 0018.75 7.5H5.25z" />
              </svg>
            }
          />

          <GameCard
            title={T.listenFill}
            description={T.listenFillDesc}
            tone="muted"
            onClick={() => launchGame('listen-fill')}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path d="M12 2a7 7 0 00-7 7v1.07A5.5 5.5 0 003 15v1a3 3 0 003 3h1a1 1 0 001-1v-5a1 1 0 00-1-1H6v-3a6 6 0 1112 0v3h-1a1 1 0 00-1 1v5a1 1 0 001 1h1a3 3 0 003-3v-1a5.5 5.5 0 00-2-4.93V9a7 7 0 00-7-7z" />
              </svg>
            }
          />
        </div>
      </SurfaceCard>

      <AnimatePresence>
        {activeGame && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[120] overflow-hidden"
            style={{
              backgroundColor: 'var(--bg-primary)',
              paddingTop: 'calc(env(safe-area-inset-top, 0px) + 2.75rem)',
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)',
            }}
          >
            <button
              onClick={() => setActiveGame(null)}
              className="absolute right-4 z-[130] flex h-8 w-8 items-center justify-center rounded-full"
              style={{
                top: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-secondary)',
              }}
            >
              {'\u2715'}
            </button>

            {activeGame === 'expression-swipe' && (
              <ExpressionSwipeGame onComplete={handleComplete} />
            )}
            {activeGame === 'listen-fill' && <ListenFillGame onComplete={handleComplete} />}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
