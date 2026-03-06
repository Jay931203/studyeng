'use client'

import { useRouter } from 'next/navigation'
import { AnimatePresence } from 'framer-motion'
import { usePhraseStore } from '@/stores/usePhraseStore'
import { SavedPhraseCard } from '@/components/SavedPhraseCard'
import { GameLauncher } from '@/components/games/GameLauncher'

export default function LearningPage() {
  const { phrases, removePhrase } = usePhraseStore()
  const router = useRouter()

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-20 pt-12">
      <div className="px-4">
        <h1 className="text-[var(--text-primary)] text-2xl font-bold mb-1">내 학습</h1>
        <p className="text-[var(--text-muted)] text-sm mb-6">
          {phrases.length}개 표현 저장됨
        </p>

        <GameLauncher phrases={phrases} />

        {phrases.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[var(--text-muted)] text-lg">저장한 표현이 없어요</p>
            <p className="text-[var(--text-muted)] text-sm mt-2">
              영상에서 표현을 저장해보세요
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
                  onPlay={() => router.push(`/?v=${phrase.videoId}`)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
