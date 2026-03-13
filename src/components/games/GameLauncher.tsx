'use client'

import { useState, useEffect, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { SceneQuizGame } from './SceneQuizGame'
import { ListeningGame } from './ListeningGame'
import { ExpressionSwipeGame } from './ExpressionSwipeGame'
import { ListenFillGame } from './ListenFillGame'
import type { SavedPhrase } from '@/stores/usePhraseStore'
import { useDailyMissionStore } from '@/stores/useDailyMissionStore'
import { type SubtitleEntry } from '@/data/seed-videos'
import { catalogVideos } from '@/lib/catalog'
import { createHiddenVideoIdSet, filterHiddenVideos } from '@/lib/videoVisibility'
import { useAdminStore } from '@/stores/useAdminStore'
import { trackEvent, AnalyticsEvents } from '@/lib/analytics'

type GameType = 'scene-quiz' | 'listening' | 'expression-swipe' | 'listen-fill'
type PhrasePair = {
  sourceVideoId: string
  current: { en: string; ko: string }
  next: { en: string; ko: string }
}

interface GameLauncherProps {
  phrases: SavedPhrase[]
}

function shuffle<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** Convert a SubtitleEntry to the shape games expect */
function subtitleToGamePhrase(entry: SubtitleEntry): { en: string; ko: string } {
  return { en: entry.en, ko: entry.ko }
}

/** Load transcript JSON for a given YouTube ID */
async function loadTranscript(youtubeId: string): Promise<SubtitleEntry[]> {
  try {
    const res = await fetch(`/transcripts/${youtubeId}.json`)
    if (!res.ok) return []
    const data: SubtitleEntry[] = await res.json()
    return data.filter((entry) => entry.en && entry.en.trim().length > 0)
  } catch {
    return []
  }
}

export function GameLauncher({ phrases }: GameLauncherProps) {
  const [activeGame, setActiveGame] = useState<GameType | null>(null)
  const [currentPhraseIdx, setCurrentPhraseIdx] = useState(0)
  const [transcriptPhrases, setTranscriptPhrases] = useState<{ en: string; ko: string }[]>([])
  const [listeningRounds, setListeningRounds] = useState<PhrasePair[]>([])
  const [loadingTranscripts, setLoadingTranscripts] = useState(true)
  const incrementMission = useDailyMissionStore((s) => s.incrementMission)
  const hiddenVideos = useAdminStore((state) => state.hiddenVideos)
  const hiddenVideoIdSet = useMemo(() => createHiddenVideoIdSet(hiddenVideos), [hiddenVideos])
  const visibleCatalogVideos = useMemo(
    () => filterHiddenVideos(catalogVideos, hiddenVideoIdSet),
    [hiddenVideoIdSet],
  )


  // Load transcript data from seed videos so new users can also play
  useEffect(() => {
    let cancelled = false

    async function fetchTranscripts() {
      // Pick 3 random seed videos and load their transcripts
      const randomVideos = shuffle(visibleCatalogVideos).slice(0, 3)
      const allEntries: SubtitleEntry[] = []
      const allRounds: PhrasePair[] = []

      for (const video of randomVideos) {
        const entries = await loadTranscript(video.youtubeId)
        allEntries.push(...entries)
        for (let index = 0; index < entries.length - 1; index += 1) {
          const current = entries[index]
          const next = entries[index + 1]
          if (!current?.en || !next?.en) continue

          allRounds.push({
            sourceVideoId: video.id,
            current: subtitleToGamePhrase(current),
            next: subtitleToGamePhrase(next),
          })
        }
        if (allEntries.length >= 20) break
      }

      if (!cancelled) {
        setTranscriptPhrases(
          shuffle(allEntries)
            .slice(0, 30)
            .map(subtitleToGamePhrase)
        )
        setListeningRounds(shuffle(allRounds).slice(0, 20))
        setLoadingTranscripts(false)
      }
    }

    fetchTranscripts()
    return () => { cancelled = true }
  }, [visibleCatalogVideos])

  // Build the usable phrase pool: saved phrases first, then transcript phrases as fallback
  const gamePhrases = useMemo(() => {
    const fromSaved = phrases.map((p) => ({ en: p.en, ko: p.ko }))

    if (fromSaved.length >= 3) {
      return fromSaved
    }

    // Merge saved + transcript, dedup by English text
    const seen = new Set(fromSaved.map((p) => p.en))
    const merged = [...fromSaved]
    for (const tp of transcriptPhrases) {
      if (!seen.has(tp.en)) {
        merged.push(tp)
        seen.add(tp.en)
      }
    }
    return merged
  }, [phrases, transcriptPhrases])

  const hasPhrases = gamePhrases.length > 0

  const currentPhrase = hasPhrases
    ? gamePhrases[currentPhraseIdx % gamePhrases.length]
    : null
  const currentListeningRound =
    listeningRounds.length > 0
      ? listeningRounds[currentPhraseIdx % listeningRounds.length]
      : null

  const handleComplete = (correct: boolean) => {
    setCurrentPhraseIdx((prev) => prev + 1)
    setActiveGame(null)
    void correct
  }

  const launchGame = (type: GameType) => {
    incrementMission('play-game')
    trackEvent(AnalyticsEvents.GAME_PLAYED, { game_type: type })
    setActiveGame(type)
  }

  // Show nothing only when both saved phrases AND transcripts are empty and still loading
  if (!hasPhrases && loadingTranscripts) {
    return (
      <div className="mb-8">
        <div className="w-full rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-6 text-center shadow-[var(--card-shadow)]">
          <p className="text-[var(--text-muted)] text-sm animate-pulse">
            게임 준비 중...
          </p>
        </div>
      </div>
    )
  }

  if (!hasPhrases) return null

  return (
    <>
      <div className="mb-8">
        <h2 className="text-[var(--text-secondary)] text-xs font-medium tracking-wide uppercase mb-3">
          게임
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => launchGame('scene-quiz')}
            className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-4 text-left shadow-[var(--card-shadow)]"
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: 'var(--accent-glow)' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" style={{ color: 'var(--accent-text)' }}>
                  <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97zM6.75 8.25a.75.75 0 01.75-.75h9a.75.75 0 010 1.5h-9a.75.75 0 01-.75-.75zm.75 3.75a.75.75 0 000 1.5H12a.75.75 0 000-1.5H7.5z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <span className="text-[var(--text-primary)] font-semibold text-sm block">빈칸 퀴즈</span>
                <span className="text-[var(--text-muted)] text-xs block mt-0.5">핵심 단어 맞추기</span>
              </div>
            </div>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => launchGame('listening')}
            disabled={listeningRounds.length === 0}
            className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-4 text-left shadow-[var(--card-shadow)]"
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: 'var(--bg-secondary)' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" style={{ color: 'var(--text-secondary)' }}>
                  <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
                  <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
                </svg>
              </div>
              <div>
                <span className="text-[var(--text-primary)] font-semibold text-sm block">다음 대사 맞추기</span>
                <span className="text-[var(--text-muted)] text-xs block mt-0.5">문맥 읽기</span>
              </div>
            </div>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => launchGame('expression-swipe')}
            className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-4 text-left shadow-[var(--card-shadow)]"
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: 'var(--accent-glow)' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" style={{ color: 'var(--accent-text)' }}>
                  <path d="M5.566 4.657A4.505 4.505 0 016.75 4.5h10.5c.41 0 .806.055 1.183.157A3 3 0 0015.75 3h-7.5a3 3 0 00-2.684 1.657zM2.25 12a3 3 0 013-3h13.5a3 3 0 013 3v6a3 3 0 01-3 3H5.25a3 3 0 01-3-3v-6zM5.25 7.5c-.41 0-.806.055-1.184.157A3 3 0 016.75 6h10.5a3 3 0 012.683 1.657A4.505 4.505 0 0018.75 7.5H5.25z" />
                </svg>
              </div>
              <div>
                <span className="text-[var(--text-primary)] font-semibold text-sm block">표현 알아보기</span>
                <span className="text-[var(--text-muted)] text-xs block mt-0.5">알아요 / 몰라요</span>
              </div>
            </div>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => launchGame('listen-fill')}
            className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-4 text-left shadow-[var(--card-shadow)]"
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: 'var(--bg-secondary)' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" style={{ color: 'var(--text-secondary)' }}>
                  <path d="M12 2a7 7 0 00-7 7v1.07A5.5 5.5 0 003 15v1a3 3 0 003 3h1a1 1 0 001-1v-5a1 1 0 00-1-1H6v-3a6 6 0 1112 0v3h-1a1 1 0 00-1 1v5a1 1 0 001 1h1a3 3 0 003-3v-1a5.5 5.5 0 00-2-4.93V9a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <span className="text-[var(--text-primary)] font-semibold text-sm block">듣고 채우기</span>
                <span className="text-[var(--text-muted)] text-xs block mt-0.5">빈칸 맞추기</span>
              </div>
            </div>
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {activeGame && ((activeGame === 'scene-quiz' && currentPhrase) || (activeGame === 'listening' && currentListeningRound) || activeGame === 'expression-swipe' || activeGame === 'listen-fill') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[120]"
            style={{ backgroundColor: 'var(--bg-primary)' }}
          >
            <button
              onClick={() => setActiveGame(null)}
              className="absolute right-4 top-4 z-[130] flex h-8 w-8 items-center justify-center rounded-full"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-secondary)',
              }}
            >
              {'\u2715'}
            </button>

            {activeGame === 'scene-quiz' && currentPhrase && (
              <SceneQuizGame subtitle={currentPhrase} onComplete={handleComplete} />
            )}
            {activeGame === 'listening' && currentListeningRound && (
              <ListeningGame
                currentSubtitle={currentListeningRound.current}
                nextSubtitle={currentListeningRound.next}
                choicePool={
                  listeningRounds
                    .filter((round) => round.sourceVideoId === currentListeningRound.sourceVideoId)
                    .map((round) => round.next)
                }
                onComplete={handleComplete}
              />
            )}
            {activeGame === 'expression-swipe' && (
              <ExpressionSwipeGame onComplete={handleComplete} />
            )}
            {activeGame === 'listen-fill' && (
              <ListenFillGame onComplete={handleComplete} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
