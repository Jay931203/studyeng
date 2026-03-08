import { seedVideos, series, type VideoData, type SubtitleEntry } from '@/data/seed-videos'

// Build series lookup for search: map youtubeId → Series
const videoSeriesMap = new Map<string, typeof series[0]>()
for (const video of seedVideos) {
  if (video.seriesId) {
    const s = series.find(sr => sr.id === video.seriesId)
    if (s) videoSeriesMap.set(video.youtubeId, s)
  }
}

export interface SearchResult {
  video: VideoData
  matchedPhrase?: { en: string; ko: string }
  matchType: 'title' | 'subtitle'
}

// Module-level cache for fetched transcripts (persists across searches)
const transcriptCache = new Map<string, SubtitleEntry[]>()
let allTranscriptsFetched = false

/**
 * Fetch a single transcript JSON file for a given youtubeId.
 * Returns cached data if already fetched.
 */
async function fetchTranscript(youtubeId: string): Promise<SubtitleEntry[]> {
  if (transcriptCache.has(youtubeId)) {
    return transcriptCache.get(youtubeId)!
  }

  try {
    const res = await fetch(`/transcripts/${youtubeId}.json`)
    if (!res.ok) {
      transcriptCache.set(youtubeId, [])
      return []
    }
    const data: SubtitleEntry[] = await res.json()
    if (Array.isArray(data)) {
      transcriptCache.set(youtubeId, data)
      return data
    }
    transcriptCache.set(youtubeId, [])
    return []
  } catch {
    transcriptCache.set(youtubeId, [])
    return []
  }
}

/**
 * Fetch all transcripts in parallel for all seed videos.
 * After the first call, subsequent calls return immediately from cache.
 */
async function ensureAllTranscripts(): Promise<void> {
  if (allTranscriptsFetched) return

  await Promise.all(
    seedVideos.map((video) => fetchTranscript(video.youtubeId))
  )
  allTranscriptsFetched = true
}

/**
 * Search through video titles and transcript subtitles.
 * Fetches transcript JSON files and caches them for fast subsequent searches.
 */
export async function searchVideos(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return []

  const q = query.toLowerCase().trim()
  const results: SearchResult[] = []
  const seen = new Set<string>()

  // First pass: title, description, and series name matches (instant)
  for (const video of seedVideos) {
    if (seen.has(video.id)) continue
    const s = videoSeriesMap.get(video.youtubeId)
    const searchable = [
      video.title.toLowerCase(),
      s?.title.toLowerCase() ?? '',
      s?.description.toLowerCase() ?? '',
    ].join(' ')
    if (searchable.includes(q)) {
      results.push({ video, matchType: 'title' })
      seen.add(video.id)
    }
  }

  // Second pass: subtitle/transcript matches
  await ensureAllTranscripts()

  for (const video of seedVideos) {
    if (seen.has(video.id)) continue

    const transcript = transcriptCache.get(video.youtubeId) ?? []

    for (const sub of transcript) {
      if (sub.en.toLowerCase().includes(q) || sub.ko.includes(q)) {
        results.push({
          video,
          matchedPhrase: { en: sub.en, ko: sub.ko },
          matchType: 'subtitle',
        })
        seen.add(video.id)
        break
      }
    }
  }

  return results.slice(0, 10)
}
