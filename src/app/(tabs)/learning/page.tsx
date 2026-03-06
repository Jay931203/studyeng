'use client'

import { useState, useMemo } from 'react'
import { AnimatePresence } from 'framer-motion'
import { usePhraseStore } from '@/stores/usePhraseStore'
import { SavedPhraseCard } from '@/components/SavedPhraseCard'
import { GameLauncher } from '@/components/games/GameLauncher'
import { seedVideos } from '@/data/seed-videos'

function DailyPhrases() {
  const savePhrase = usePhraseStore((s) => s.savePhrase)
  const [saved, setSaved] = useState<Set<number>>(new Set())

  // Pick 5 random phrases from all seed videos
  // Deterministic "random" based on today's date
  const dailyPhrases = useMemo(() => {
    const all = seedVideos.flatMap(v =>
      v.subtitles.map(s => ({ ...s, videoId: v.id, videoTitle: v.title }))
    )
    const today = new Date().toDateString()
    let hash = 0
    for (let i = 0; i < today.length; i++) {
      hash = ((hash << 5) - hash) + today.charCodeAt(i)
      hash |= 0
    }
    const shuffled = [...all].sort((a, b) => {
      const ha = ((hash + a.en.length) * 2654435761) | 0
      const hb = ((hash + b.en.length) * 2654435761) | 0
      return ha - hb
    })
    return shuffled.slice(0, 5)
  }, [])

  return (
    <div className="mb-6">
      <h2 className="text-white font-bold text-lg mb-3">오늘의 추천 표현</h2>
      <div className="flex flex-col gap-2">
        {dailyPhrases.map((phrase, i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-white text-sm font-medium">{phrase.en}</p>
              <p className="text-gray-400 text-xs mt-0.5">{phrase.ko}</p>
            </div>
            <button
              onClick={() => {
                if (saved.has(i)) return
                savePhrase({
                  videoId: phrase.videoId,
                  videoTitle: phrase.videoTitle,
                  en: phrase.en,
                  ko: phrase.ko,
                  timestampStart: phrase.start,
                  timestampEnd: phrase.end,
                })
                setSaved(new Set([...saved, i]))
              }}
              className={`text-xs px-2.5 py-1 rounded-full flex-shrink-0 ${
                saved.has(i)
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-blue-500/20 text-blue-400'
              }`}
            >
              {saved.has(i) ? '저장됨' : '+ 저장'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function LearningPage() {
  const { phrases, removePhrase } = usePhraseStore()

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-20 pt-12">
      <div className="px-4">
        <h1 className="text-white text-2xl font-bold mb-1">내 학습</h1>
        <p className="text-gray-500 text-sm mb-6">
          {phrases.length}개 표현 저장됨
        </p>

        <DailyPhrases />

        <GameLauncher phrases={phrases} />

        {phrases.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">아직 저장한 표현이 없어요</p>
            <p className="text-gray-600 text-sm mt-2">
              영상에서 자막을 두 번 탭하면 여기에 저장돼요
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <AnimatePresence>
              {phrases.map((phrase) => (
                <SavedPhraseCard
                  key={phrase.id}
                  phrase={phrase}
                  onDelete={() => removePhrase(phrase.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
