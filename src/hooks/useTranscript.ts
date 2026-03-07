import { useState, useEffect, useRef } from 'react'
import type { SubtitleEntry } from '@/data/seed-videos'

// Client-side cache to avoid re-fetching on component re-mount
const clientCache = new Map<string, SubtitleEntry[]>()

export function useTranscript(youtubeId: string) {
  const [subtitles, setSubtitles] = useState<SubtitleEntry[]>(() => {
    // Return cached value immediately if available
    return clientCache.get(youtubeId) ?? []
  })
  const [loading, setLoading] = useState(() => !clientCache.has(youtubeId))
  const [error, setError] = useState<string | null>(null)

  // Track the current youtubeId to handle race conditions
  const activeIdRef = useRef(youtubeId)

  useEffect(() => {
    activeIdRef.current = youtubeId

    // Already cached on client side
    if (clientCache.has(youtubeId)) {
      setSubtitles(clientCache.get(youtubeId)!)
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    const controller = new AbortController()

    // Try static JSON first (pre-baked transcripts), then fallback to API
    fetchWithStaticFallback(youtubeId, controller.signal)
      .then((subs) => {
        if (activeIdRef.current !== youtubeId) return
        clientCache.set(youtubeId, subs)
        setSubtitles(subs)
        setLoading(false)
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        if (activeIdRef.current !== youtubeId) return

        console.error('[useTranscript] fetch failed:', err)
        setSubtitles([])
        setLoading(false)
        setError(err.message ?? 'Failed to load transcript')
      })

    return () => {
      controller.abort()
    }
  }, [youtubeId])

  return { subtitles, loading, error }
}

async function fetchWithStaticFallback(
  youtubeId: string,
  signal: AbortSignal
): Promise<SubtitleEntry[]> {
  // 1. Try pre-baked static JSON file (no API cost, instant)
  try {
    const staticRes = await fetch(`/transcripts/${youtubeId}.json`, { signal })
    if (staticRes.ok) {
      const data = await staticRes.json()
      if (Array.isArray(data) && data.length > 0) {
        return data
      }
    }
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') throw err
    // Static file not found, fall through to API
  }

  // 2. Fallback to API (fetches from YouTube + optional translation)
  const apiRes = await fetch(
    `/api/transcript?v=${encodeURIComponent(youtubeId)}`,
    { signal }
  )
  if (!apiRes.ok) throw new Error(`HTTP ${apiRes.status}`)
  const data: { subtitles: SubtitleEntry[]; error?: string } = await apiRes.json()
  return data.subtitles ?? []
}
