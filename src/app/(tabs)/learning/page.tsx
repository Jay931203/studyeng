'use client'

import { AnimatePresence } from 'framer-motion'
import { usePhraseStore } from '@/stores/usePhraseStore'
import { SavedPhraseCard } from '@/components/SavedPhraseCard'

export default function LearningPage() {
  const { phrases, removePhrase } = usePhraseStore()

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-20 pt-12">
      <div className="px-4">
        <h1 className="text-white text-2xl font-bold mb-1">My Learning</h1>
        <p className="text-gray-500 text-sm mb-6">
          {phrases.length} phrases saved
        </p>

        {phrases.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No saved phrases yet</p>
            <p className="text-gray-600 text-sm mt-2">
              Double-tap subtitles in videos to save them here
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
