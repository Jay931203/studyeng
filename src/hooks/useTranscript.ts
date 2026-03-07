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

    fetch(`/api/transcript?v=${encodeURIComponent(youtubeId)}`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data: { subtitles: SubtitleEntry[]; error?: string }) => {
        // Only update if this is still the active request
        if (activeIdRef.current !== youtubeId) return

        const subs = data.subtitles ?? []
        clientCache.set(youtubeId, subs)
        setSubtitles(subs)
        setLoading(false)
        if (data.error) setError(data.error)
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
