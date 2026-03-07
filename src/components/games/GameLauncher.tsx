'use client'

import { useState, useEffect, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FillBlankGame } from './FillBlankGame'
import { SentencePuzzleGame } from './SentencePuzzleGame'
import { SceneQuizGame } from './SceneQuizGame'
import { ListeningGame } from './ListeningGame'
import type { SavedPhrase } from '@/stores/usePhraseStore'
import { seedVideos, type SubtitleEntry } from '@/data/seed-videos'

type GameType = 'fill-blank' | 'sentence-puzzle' | 'scene-quiz' | 'listening'

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

const GAME_TYPES: GameType[] = ['fill-blank', 'sentence-puzzle', 'scene-quiz', 'listening']

export function GameLauncher({ phrases }: GameLauncherProps) {
  const [activeGame, setActiveGame] = useState<GameType | null>(null)
  const [currentPhraseIdx, setCurrentPhraseIdx] = useState(0)
  const [transcriptPhrases, setTranscriptPhrases] = useState<{ en: string; ko: string }[]>([])
  const [loadingTranscripts, setLoadingTranscripts] = useState(false)

  // Load transcript data from seed videos so new users can also play
  useEffect(() => {
    let cancelled = false
    setLoadingTranscripts(true)

    async function fetchTranscripts() {
      // Pick 3 random seed videos and load their transcripts
      const randomVideos = shuffle(seedVideos).slice(0, 3)
      const allEntries: SubtitleEntry[] = []

      for (const video of randomVideos) {
        const entries = await loadTranscript(video.youtubeId)
        allEntries.push(...entries)
        if (allEntries.length >= 20) break
      }

      if (!cancelled) {
        setTranscriptPhrases(
          shuffle(allEntries)
            .slice(0, 30)
            .map(subtitleToGamePhrase)
        )
        setLoadingTranscripts(false)
      }
    }

    fetchTranscripts()
    return () => { cancelled = true }
  }, [])

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

  const handleComplete = () => {
    setCurrentPhraseIdx((prev) => prev + 1)
    setActiveGame(null)
  }

  const launchGame = (type: GameType) => {
    setActiveGame(type)
  }

  // Show nothing only when both saved phrases AND transcripts are empty and still loading
  if (!hasPhrases && loadingTranscripts) {
    return (
      <div className="mb-6">
        <div className="w-full bg-[var(--bg-card)] shadow-[var(--card-shadow)] rounded-xl p-6 text-center">
          <p className="text-[var(--text-secondary)] text-sm animate-pulse">
            게임 준비 중...
          </p>
        </div>
      </div>
    )
  }

  if (!hasPhrases) return null

  return (
    <>
      <div className="mb-6">
        {/* Top row: Scene Quiz + Listening */}
        <div className="flex gap-3 mb-3">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => launchGame('scene-quiz')}
            className="flex-1 bg-gradient-to-br from-blue-500/20 to-purple-500/20 shadow-[var(--card-shadow)] rounded-xl p-4 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-blue-400">
                  <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97zM6.75 8.25a.75.75 0 01.75-.75h9a.75.75 0 010 1.5h-9a.75.75 0 01-.75-.75zm.75 3.75a.75.75 0 000 1.5H12a.75.75 0 000-1.5H7.5z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <span className="text-[var(--text-primary)] font-bold text-sm">빈칸 퀴즈</span>
                <span className="text-[var(--text-secondary)] text-xs block mt-0.5">핵심 단어 맞추기</span>
              </div>
            </div>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => launchGame('listening')}
            className="flex-1 bg-gradient-to-br from-green-500/20 to-teal-500/20 shadow-[var(--card-shadow)] rounded-xl p-4 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-green-400">
                  <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
                  <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
                </svg>
              </div>
              <div>
                <span className="text-[var(--text-primary)] font-bold text-sm">리스닝 게임</span>
                <span className="text-[var(--text-secondary)] text-xs block mt-0.5">들었던 문장 고르기</span>
              </div>
            </div>
          </motion.button>
        </div>

        {/* Bottom row: Fill Blank + Sentence Puzzle */}
        <div className="flex gap-3">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => launchGame('fill-blank')}
            className="flex-1 bg-[var(--bg-card)] shadow-[var(--card-shadow)] rounded-xl p-3 text-left"
          >
            <span className="text-[var(--text-primary)] font-medium text-sm">빈칸 채우기</span>
            <span className="text-[var(--text-secondary)] text-xs block mt-0.5">빠진 단어 맞추기</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => launchGame('sentence-puzzle')}
            className="flex-1 bg-[var(--bg-card)] shadow-[var(--card-shadow)] rounded-xl p-3 text-left"
          >
            <span className="text-[var(--text-primary)] font-medium text-sm">문장 만들기</span>
            <span className="text-[var(--text-secondary)] text-xs block mt-0.5">단어 조합하기</span>
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {activeGame && currentPhrase && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black"
          >
            <button
              onClick={() => setActiveGame(null)}
              className="absolute top-4 right-4 z-50 text-white/60 bg-white/10 w-8 h-8 rounded-full flex items-center justify-center"
            >
              {'\u2715'}
            </button>

            {activeGame === 'scene-quiz' && (
              <SceneQuizGame subtitle={currentPhrase} onComplete={handleComplete} />
            )}
            {activeGame === 'fill-blank' && (
              <FillBlankGame subtitle={currentPhrase} onComplete={handleComplete} />
            )}
            {activeGame === 'sentence-puzzle' && (
              <SentencePuzzleGame subtitle={currentPhrase} onComplete={handleComplete} />
            )}
            {activeGame === 'listening' && (
              <ListeningGame
                subtitle={currentPhrase}
                allSubtitles={gamePhrases}
                onComplete={handleComplete}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
