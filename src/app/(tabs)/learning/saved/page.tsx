'use client'

import { AnimatePresence } from 'framer-motion'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  LearningFeedFilter,
  type LearningFeedFilterValue,
} from '@/components/LearningFeedFilter'
import { SavedPhraseCard } from '@/components/SavedPhraseCard'
import { AppPage, SurfaceCard } from '@/components/ui/AppPage'
import { getCatalogVideoById } from '@/lib/catalog'
import { createHiddenVideoIdSet, filterHiddenItemsByVideoId } from '@/lib/videoVisibility'
import { buildShortsUrl } from '@/lib/videoRoutes'
import { useAdminStore } from '@/stores/useAdminStore'
import { useFamiliarityStore } from '@/stores/useFamiliarityStore'
import type { SavedPhrase } from '@/stores/usePhraseStore'
import { usePhraseStore } from '@/stores/usePhraseStore'
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore'
import expressionEntriesData from '@/data/expression-entries-v2.json'
import wordEntriesData from '@/data/word-entries.json'

function formatDateLabel(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const targetDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.round((today.getTime() - targetDay.getTime()) / (1000 * 60 * 60 * 24))
  const calendarLabel =
    date.getFullYear() === now.getFullYear()
      ? `${date.getMonth() + 1}/${date.getDate()}`
      : `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`

  if (diffDays === 0) return `TODAY · ${calendarLabel}`
  if (diffDays === 1) return `YESTERDAY · ${calendarLabel}`
  return calendarLabel
}

function getDateKey(timestamp: number): string {
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

function FamiliarExpressionCard({
  exprId,
  entry,
  count,
  onReset,
}: {
  exprId: string
  entry: { canonical: string; meaning_ko: string; cefr: string; category: string }
  count: number
  onReset: () => void
}) {
  const categoryLabels: Record<string, string> = {
    phrasal_verb: '구동사', idiom: '관용구', collocation: '연어',
    fixed_expression: '표현', discourse_marker: '담화', slang: '슬랭',
    hedging: '완곡', exclamation: '감탄', filler: '필러',
  }

  function getCefrColor(cefr: string) {
    const level = cefr?.toUpperCase()
    if (level === 'A1' || level === 'A2') return { bg: 'rgba(34, 197, 94, 0.16)', text: '#4ade80' }
    if (level === 'B1' || level === 'B2') return { bg: 'rgba(59, 130, 246, 0.16)', text: '#60a5fa' }
    if (level === 'C1' || level === 'C2') return { bg: 'rgba(168, 85, 247, 0.16)', text: '#c084fc' }
    return { bg: 'rgba(255, 255, 255, 0.08)', text: 'rgba(255, 255, 255, 0.6)' }
  }

  const cefrColor = getCefrColor(entry.cefr)
  const categoryLabel = categoryLabels[entry.category] ?? entry.category

  return (
    <div className="flex items-center justify-between rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[var(--text-primary)]">{entry.canonical}</p>
        <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{entry.meaning_ko}</p>
        <div className="mt-1.5 flex items-center gap-1.5">
          <span className="rounded-full bg-[var(--bg-elevated)] px-2 py-[2px] text-[10px] font-medium text-[var(--text-muted)]">
            {categoryLabel}
          </span>
          <span
            className="rounded-full px-2 py-[2px] text-[10px] font-bold uppercase"
            style={{ backgroundColor: cefrColor.bg, color: cefrColor.text }}
          >
            {entry.cefr?.toUpperCase()}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {/* 3-dot gauge */}
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="inline-block h-[6px] w-[6px] rounded-full"
              style={{
                backgroundColor: i < count ? '#4ade80' : 'var(--border-card)',
              }}
            />
          ))}
        </div>
        {/* Reset button */}
        <button
          onClick={onReset}
          className="flex h-6 w-6 items-center justify-center rounded-full text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
          aria-label="Reset"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function FamiliarWordCard({
  wordId,
  entry,
  count,
  onReset,
}: {
  wordId: string
  entry: { canonical: string; pos: string; meaning_ko: string; cefr: string }
  count: number
  onReset: () => void
}) {
  const posLabels: Record<string, string> = {
    noun: 'n.', verb: 'v.', adjective: 'adj.', adverb: 'adv.',
    preposition: 'prep.', conjunction: 'conj.', pronoun: 'pron.',
    interjection: 'int.', determiner: 'det.',
  }

  function getCefrColor(cefr: string) {
    const level = cefr?.toUpperCase()
    if (level === 'A1' || level === 'A2') return { bg: 'rgba(34, 197, 94, 0.16)', text: '#4ade80' }
    if (level === 'B1' || level === 'B2') return { bg: 'rgba(59, 130, 246, 0.16)', text: '#60a5fa' }
    if (level === 'C1' || level === 'C2') return { bg: 'rgba(168, 85, 247, 0.16)', text: '#c084fc' }
    return { bg: 'rgba(255, 255, 255, 0.08)', text: 'rgba(255, 255, 255, 0.6)' }
  }

  const cefrColor = getCefrColor(entry.cefr)
  const posLabel = posLabels[entry.pos] ?? entry.pos

  return (
    <div className="flex items-center justify-between rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[var(--text-primary)]">{entry.canonical}</p>
        <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{entry.meaning_ko}</p>
        <div className="mt-1.5 flex items-center gap-1.5">
          <span className="rounded-full bg-[var(--bg-elevated)] px-2 py-[2px] text-[10px] font-medium text-[var(--text-muted)]">
            {posLabel}
          </span>
          <span
            className="rounded-full px-2 py-[2px] text-[10px] font-bold uppercase"
            style={{ backgroundColor: cefrColor.bg, color: cefrColor.text }}
          >
            {entry.cefr?.toUpperCase()}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="inline-block h-[6px] w-[6px] rounded-full"
              style={{
                backgroundColor: i < count ? '#4ade80' : 'var(--border-card)',
              }}
            />
          ))}
        </div>
        <button
          onClick={onReset}
          className="flex h-6 w-6 items-center justify-center rounded-full text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
          aria-label="Reset"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default function SavedPhrasesPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'phrases' | 'expressions' | 'words'>('phrases')
  const [filter, setFilter] = useState<LearningFeedFilterValue>('all')
  const { phrases, removePhrase } = usePhraseStore()
  const familiarEntries = useFamiliarityStore((state) => state.entries)
  const resetFamiliarity = useFamiliarityStore((state) => state.resetFamiliarity)
  const clearDeletedFlag = useWatchHistoryStore((state) => state.clearDeletedFlag)
  const hiddenVideos = useAdminStore((state) => state.hiddenVideos)
  const hiddenVideoIdSet = useMemo(() => createHiddenVideoIdSet(hiddenVideos), [hiddenVideos])
  const visiblePhrases = useMemo(
    () => filterHiddenItemsByVideoId(phrases, hiddenVideoIdSet),
    [hiddenVideoIdSet, phrases],
  )
  const filteredPhrases = useMemo(
    () =>
      visiblePhrases.filter((phrase) => {
        const video = getCatalogVideoById(phrase.videoId)
        if (!video) return false
        if (filter === 'all') return true
        if (filter === 'shorts') return video.format === 'shorts'
        return video.format !== 'shorts'
      }),
    [filter, visiblePhrases],
  )

  const groupedPhrases = useMemo(() => {
    const groups: { label: string; key: string; phrases: SavedPhrase[] }[] = []
    const seen = new Set<string>()

    for (const phrase of filteredPhrases) {
      const dateKey = getDateKey(phrase.savedAt)

      if (!seen.has(dateKey)) {
        seen.add(dateKey)
        groups.push({
          label: formatDateLabel(phrase.savedAt),
          key: dateKey,
          phrases: [],
        })
      }

      const group = groups.find((item) => item.key === dateKey)
      group?.phrases.push(phrase)
    }

    return groups
  }, [filteredPhrases])

  const familiarExpressions = useMemo(() => {
    const entries = expressionEntriesData as Record<string, any>
    return Object.entries(familiarEntries)
      .filter(([key, data]) => !key.startsWith('word:') && data.count > 0)
      .map(([exprId, data]) => ({
        exprId,
        entry: entries[exprId],
        count: data.count,
        lastMarkedAt: data.lastMarkedAt,
      }))
      .filter(item => item.entry)
      .sort((a, b) => b.lastMarkedAt - a.lastMarkedAt)
  }, [familiarEntries])

  const familiarWords = useMemo(() => {
    const entries = wordEntriesData as Record<string, { canonical: string; pos: string; meaning_ko: string; cefr: string; theme: string[] }>
    return Object.entries(familiarEntries)
      .filter(([key, data]) => key.startsWith('word:') && data.count > 0)
      .map(([key, data]) => {
        const wordId = key.slice(5) // remove 'word:' prefix
        return {
          wordId,
          entry: entries[wordId],
          count: data.count,
          lastMarkedAt: data.lastMarkedAt,
        }
      })
      .filter(item => item.entry)
      .sort((a, b) => b.lastMarkedAt - a.lastMarkedAt)
  }, [familiarEntries])

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
      return
    }

    router.replace('/learning')
  }

  return (
    <AppPage>
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={handleBack}
            className="text-[var(--text-secondary)] transition-transform active:scale-90"
            aria-label="Back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path
                fillRule="evenodd"
                d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
            SAVED
          </p>
        </div>

        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setActiveTab('phrases')}
            className="rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors"
            style={{
              backgroundColor: activeTab === 'phrases' ? 'var(--accent-primary)' : 'var(--bg-card)',
              color: activeTab === 'phrases' ? '#fff' : 'var(--text-secondary)',
              border: activeTab === 'phrases' ? 'none' : '1px solid var(--border-card)',
            }}
          >
            Phrases
          </button>
          <button
            onClick={() => setActiveTab('expressions')}
            className="rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors"
            style={{
              backgroundColor: activeTab === 'expressions' ? 'var(--accent-primary)' : 'var(--bg-card)',
              color: activeTab === 'expressions' ? '#fff' : 'var(--text-secondary)',
              border: activeTab === 'expressions' ? 'none' : '1px solid var(--border-card)',
            }}
          >
            Expressions
          </button>
          <button
            onClick={() => setActiveTab('words')}
            className="rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors"
            style={{
              backgroundColor: activeTab === 'words' ? 'var(--accent-primary)' : 'var(--bg-card)',
              color: activeTab === 'words' ? '#fff' : 'var(--text-secondary)',
              border: activeTab === 'words' ? 'none' : '1px solid var(--border-card)',
            }}
          >
            Words
          </button>
        </div>

        {activeTab === 'phrases' && (
          <SurfaceCard className="p-5">
            {visiblePhrases.length > 0 && <LearningFeedFilter value={filter} onChange={setFilter} />}

            {groupedPhrases.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-[var(--border-card)] px-5 py-10 text-center">
                <p className="text-sm text-[var(--text-secondary)]">
                  {visiblePhrases.length === 0 ? 'No saved items yet.' : `No saved ${filter} yet.`}
                </p>
              </div>
            ) : (
              groupedPhrases.map((group) => (
                <div key={group.key} className="mb-5 last:mb-0">
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
                    {group.label}
                  </p>
                  <div className="flex flex-col gap-3">
                    <AnimatePresence>
                      {group.phrases.map((phrase) => (
                        <SavedPhraseCard
                          key={phrase.id}
                          phrase={phrase}
                          onDelete={() => removePhrase(phrase.id)}
                          onPlay={() => {
                            clearDeletedFlag(phrase.videoId)
                            const seriesId = getCatalogVideoById(phrase.videoId)?.seriesId
                            const baseUrl = buildShortsUrl(phrase.videoId, seriesId)
                            const separator = baseUrl.includes('?') ? '&' : '?'
                            const url = `${baseUrl}${separator}t=${phrase.timestampStart}&phraseId=${phrase.id}`
                            router.push(url)
                          }}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              ))
            )}
          </SurfaceCard>
        )}

        {activeTab === 'expressions' && (
          <SurfaceCard className="p-5">
            {familiarExpressions.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-[var(--border-card)] px-5 py-10 text-center">
                <p className="text-sm text-[var(--text-secondary)]">
                  No familiar expressions yet.
                </p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Tap the gauge on Key Expressions to mark them.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {familiarExpressions.map((item) => (
                  <FamiliarExpressionCard
                    key={item.exprId}
                    exprId={item.exprId}
                    entry={item.entry}
                    count={item.count}
                    onReset={() => resetFamiliarity(item.exprId)}
                  />
                ))}
              </div>
            )}
          </SurfaceCard>
        )}

        {activeTab === 'words' && (
          <SurfaceCard className="p-5">
            {familiarWords.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-[var(--border-card)] px-5 py-10 text-center">
                <p className="text-sm text-[var(--text-secondary)]">
                  No familiar words yet.
                </p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Swipe words you already know to mark them.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {familiarWords.map((item) => (
                  <FamiliarWordCard
                    key={item.wordId}
                    wordId={item.wordId}
                    entry={item.entry}
                    count={item.count}
                    onReset={() => resetFamiliarity(`word:${item.wordId}`)}
                  />
                ))}
              </div>
            )}
          </SurfaceCard>
        )}
      </div>
    </AppPage>
  )
}
