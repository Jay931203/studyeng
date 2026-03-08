import { useEffect, useSyncExternalStore } from 'react'
import type { SubtitleEntry } from '@/data/seed-videos'
import staticTranscriptManifest from '../../scripts/whisper-manifest.json'

interface TranscriptState {
  subtitles: SubtitleEntry[]
  loading: boolean
  error: string | null
}

const clientCache = new Map<string, SubtitleEntry[]>()
const transcriptStateCache = new Map<string, TranscriptState>()
const transcriptListeners = new Map<string, Set<() => void>>()
const inFlightRequests = new Map<string, Promise<void>>()
const availableStaticTranscripts = new Set<string>(Object.keys(staticTranscriptManifest))
const LOADING_STATE: TranscriptState = Object.freeze({
  subtitles: [],
  loading: true,
  error: null,
})

function subscribeToTranscript(youtubeId: string, listener: () => void) {
  const listeners = transcriptListeners.get(youtubeId) ?? new Set<() => void>()
  listeners.add(listener)
  transcriptListeners.set(youtubeId, listeners)

  return () => {
    const currentListeners = transcriptListeners.get(youtubeId)
    if (!currentListeners) return

    currentListeners.delete(listener)
    if (currentListeners.size === 0) {
      transcriptListeners.delete(youtubeId)
    }
  }
}

function emitTranscriptChange(youtubeId: string) {
  transcriptListeners.get(youtubeId)?.forEach((listener) => listener())
}

function setTranscriptState(youtubeId: string, state: TranscriptState) {
  transcriptStateCache.set(youtubeId, state)
  emitTranscriptChange(youtubeId)
}

function getTranscriptState(youtubeId: string) {
  if (transcriptStateCache.has(youtubeId)) {
    return transcriptStateCache.get(youtubeId)!
  }

  if (clientCache.has(youtubeId)) {
    return {
      subtitles: clientCache.get(youtubeId)!,
      loading: false,
      error: null,
    }
  }

  return LOADING_STATE
}

async function ensureTranscript(youtubeId: string) {
  if (clientCache.has(youtubeId)) {
    setTranscriptState(youtubeId, {
      subtitles: clientCache.get(youtubeId)!,
      loading: false,
      error: null,
    })
    return
  }

  if (inFlightRequests.has(youtubeId)) {
    return inFlightRequests.get(youtubeId)
  }

  setTranscriptState(youtubeId, LOADING_STATE)

  const request = fetchWithStaticFallback(youtubeId)
    .then((subtitles) => {
      clientCache.set(youtubeId, subtitles)
      setTranscriptState(youtubeId, {
        subtitles,
        loading: false,
        error: null,
      })
    })
    .catch((err: unknown) => {
      console.error('[useTranscript] fetch failed:', err)
      setTranscriptState(youtubeId, {
        subtitles: [],
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load transcript',
      })
    })
    .finally(() => {
      inFlightRequests.delete(youtubeId)
    })

  inFlightRequests.set(youtubeId, request)
  await request
}

export function useTranscript(youtubeId: string) {
  const state = useSyncExternalStore(
    (listener) => subscribeToTranscript(youtubeId, listener),
    () => getTranscriptState(youtubeId),
    () => LOADING_STATE,
  )

  useEffect(() => {
    void ensureTranscript(youtubeId)
  }, [youtubeId])

  return state
}

async function fetchWithStaticFallback(youtubeId: string): Promise<SubtitleEntry[]> {
  let staticData: SubtitleEntry[] | null = null

  if (availableStaticTranscripts.has(youtubeId)) {
    try {
      const staticResponse = await fetch(`/transcripts/${youtubeId}.json`)
      if (staticResponse.ok) {
        const data: unknown = await staticResponse.json()
        if (Array.isArray(data) && data.length > 0) {
          staticData = data as SubtitleEntry[]
          const hasKorean = staticData.some((entry) => entry.ko && entry.ko.trim() !== '')
          if (hasKorean) {
            return staticData
          }
        }
      }
    } catch {
      // Fall back to the API below if the static asset is missing or unreadable.
    }
  }

  try {
    const apiResponse = await fetch(`/api/transcript?v=${encodeURIComponent(youtubeId)}`)
    if (!apiResponse.ok) {
      if (staticData) return staticData
      throw new Error(`HTTP ${apiResponse.status}`)
    }

    const data: { subtitles?: SubtitleEntry[] } = await apiResponse.json()
    const apiSubtitles = data.subtitles ?? []

    if (apiSubtitles.length > 0) return apiSubtitles
    if (staticData) return staticData

    return []
  } catch (err) {
    if (staticData) return staticData
    throw err
  }
}
