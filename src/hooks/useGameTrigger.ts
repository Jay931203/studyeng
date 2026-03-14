'use client'

import { useEffect, useRef } from 'react'
import { usePlayerStore } from '@/stores/usePlayerStore'
import type { SubtitleEntry } from '@/data/seed-videos'

interface ExpressionSentence {
  id: string
  en: string
  ko?: string
  tags: {
    functions?: string[]
    situation?: string
    cefr?: string
    register?: string
    emotions?: string[]
    expression_types?: string[]
    vibe?: string
    power?: string[]
    grammar_intent?: string[]
    flags?: string[]
  }
}

interface ExpressionTagFile {
  videoId: string
  category?: string
  taggedCount: number
  sentences: ExpressionSentence[]
}

function calcScore(tags: ExpressionSentence['tags']): number {
  let score = 0
  if (tags.power && tags.power.length > 0) score += 3
  if (tags.vibe && tags.vibe !== 'V18') score += 2
  if (tags.expression_types?.some((x) => x !== 'X08')) score += 2
  if (tags.emotions?.some((e) => e !== 'E09')) score += 1
  if (tags.grammar_intent && tags.grammar_intent.length > 0) score += 1
  if (tags.flags?.includes('is_fragment')) score -= 3
  if (tags.flags?.includes('is_narration')) score -= 2
  return score
}

function weightedPick(candidates: { index: number; score: number }[]): number {
  const totalWeight = candidates.reduce((sum, c) => sum + c.score, 0)
  let rand = Math.random() * totalWeight
  for (const c of candidates) {
    rand -= c.score
    if (rand <= 0) return c.index
  }
  return candidates[candidates.length - 1].index
}

/**
 * Match an expression tag sentence's `en` text to the closest transcript subtitle index.
 * Returns -1 if no match found.
 */
function matchToSubtitleIndex(tagEn: string, subtitles: SubtitleEntry[]): number {
  const normalizedTag = tagEn.toLowerCase().trim()

  // Try exact match first
  for (let i = 0; i < subtitles.length; i++) {
    if (subtitles[i].en.toLowerCase().trim() === normalizedTag) return i
  }

  // Try includes / startsWith
  for (let i = 0; i < subtitles.length; i++) {
    const subEn = subtitles[i].en.toLowerCase().trim()
    if (subEn.includes(normalizedTag) || normalizedTag.includes(subEn)) return i
  }

  return -1
}

/**
 * Pick 2 wrong answer subtitles that are NOT adjacent to the correct answer index.
 * Returns their `en` texts.
 */
function pickWrongAnswers(
  correctIndex: number,
  subtitles: SubtitleEntry[],
): string[] {
  const candidates: number[] = []
  for (let i = 0; i < subtitles.length; i++) {
    // Exclude the correct answer and its immediate neighbors
    if (Math.abs(i - correctIndex) <= 1) continue
    // Exclude very short subtitles (single words, filler)
    if (subtitles[i].en.split(/\s+/).length < 3) continue
    candidates.push(i)
  }

  // If not enough non-adjacent, relax to just non-correct
  if (candidates.length < 2) {
    for (let i = 0; i < subtitles.length; i++) {
      if (i === correctIndex) continue
      if (!candidates.includes(i)) candidates.push(i)
      if (candidates.length >= 2) break
    }
  }

  // Shuffle and pick 2
  const shuffled = candidates.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 2).map((i) => subtitles[i].en)
}

export function useGameTrigger(
  youtubeId: string,
  subtitles: SubtitleEntry[],
) {
  const gameModeEnabled = usePlayerStore((s) => s.gameModeEnabled)
  const activeSubIndex = usePlayerStore((s) => s.activeSubIndex)
  const freezeSubIndex = usePlayerStore((s) => s.freezeSubIndex)
  const gameActive = usePlayerStore((s) => s.gameActive)
  const gameSentenceIndex = usePlayerStore((s) => s.gameSentenceIndex)

  const setFreezeSubIndex = usePlayerStore((s) => s.setFreezeSubIndex)
  const setGameSentenceIndex = usePlayerStore((s) => s.setGameSentenceIndex)
  const triggerGame = usePlayerStore((s) => s.triggerGame)
  const clearGame = usePlayerStore((s) => s.clearGame)

  // Track whether we've already triggered for this video
  const triggeredForVideoRef = useRef<string | null>(null)
  // Track the computed game sentence index for this video
  const computedGameIndexRef = useRef<number | null>(null)
  // Track if we're currently computing (prevent double-fire)
  const computingRef = useRef(false)

  // Reset when video changes
  useEffect(() => {
    if (triggeredForVideoRef.current !== youtubeId) {
      computedGameIndexRef.current = null
      computingRef.current = false
      clearGame()
    }
  }, [youtubeId, clearGame])

  // Fetch expression tags and compute game sentence when video loads
  useEffect(() => {
    if (!gameModeEnabled) return
    if (subtitles.length === 0) return
    if (computedGameIndexRef.current !== null) return
    if (computingRef.current) return

    computingRef.current = true

    fetch(`/expression-tags/${youtubeId}.json`)
      .then((res) => {
        if (!res.ok) throw new Error('Not found')
        return res.json() as Promise<ExpressionTagFile>
      })
      .then((data) => {
        if (data.taggedCount === 0) {
          computingRef.current = false
          return
        }

        // Score each sentence
        const scored: { sentenceIndex: number; subIndex: number; score: number }[] = []
        for (let i = 0; i < data.sentences.length; i++) {
          const sentence = data.sentences[i]
          const score = calcScore(sentence.tags)
          if (score < 4) continue

          const subIndex = matchToSubtitleIndex(sentence.en, subtitles)
          if (subIndex < 0) continue
          // Need at least one subtitle before the game sentence for the freeze
          if (subIndex === 0) continue

          scored.push({ sentenceIndex: i, subIndex, score })
        }

        if (scored.length === 0) {
          computingRef.current = false
          return
        }

        // Pick one via weighted random
        const pickedIdx = weightedPick(
          scored.map((s) => ({ index: s.subIndex, score: s.score })),
        )

        computedGameIndexRef.current = pickedIdx
        setGameSentenceIndex(pickedIdx)
        computingRef.current = false
      })
      .catch(() => {
        // No expression tags for this video, just skip
        computingRef.current = false
      })
  }, [youtubeId, subtitles, gameModeEnabled, setGameSentenceIndex])

  // Watch activeSubIndex and trigger the game when we reach gameSentenceIndex - 1
  useEffect(() => {
    if (!gameModeEnabled) return
    if (gameSentenceIndex === null) return
    if (gameActive) return
    if (triggeredForVideoRef.current === youtubeId) return
    if (freezeSubIndex !== null) return // User has manually frozen, don't interfere

    const triggerAt = gameSentenceIndex - 1
    if (activeSubIndex !== triggerAt) return
    if (subtitles.length === 0) return

    // Mark as triggered for this video
    triggeredForVideoRef.current = youtubeId

    // Freeze on the current subtitle (one before game sentence)
    // Do not pause the player here: keeping playback alive lets the frozen line
    // loop naturally, which matches the rest of the freeze-mode behavior.
    setFreezeSubIndex(triggerAt)

    // Haptic feedback for game trigger
    try { navigator.vibrate?.(15) } catch { /* unsupported */ }

    // Generate choices
    const correctAnswer = subtitles[gameSentenceIndex].en
    const wrongAnswers = pickWrongAnswers(gameSentenceIndex, subtitles)

    const allChoices = [correctAnswer, ...wrongAnswers]
    // Shuffle
    const shuffled = allChoices.sort(() => Math.random() - 0.5)
    const correctIndex = shuffled.indexOf(correctAnswer)

    triggerGame(shuffled, correctIndex)
  }, [
    activeSubIndex,
    gameModeEnabled,
    gameSentenceIndex,
    gameActive,
    freezeSubIndex,
    youtubeId,
    subtitles,
    setFreezeSubIndex,
    triggerGame,
  ])
}
