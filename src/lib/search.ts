import { series, type VideoData, type SubtitleEntry } from '@/data/seed-videos'
import { catalogVideos, getCatalogSeriesById } from '@/lib/catalog'

// Build series lookup for search: map youtubeId → Series
const videoSeriesMap = new Map<string, typeof series[0]>()
for (const video of catalogVideos) {
  if (video.seriesId) {
    const s = getCatalogSeriesById(video.seriesId)
    if (s) videoSeriesMap.set(video.youtubeId, s)
  }
}

export interface SearchResult {
  video: VideoData
  matchedPhrase?: { en: string; ko: string }
  matchType: 'title' | 'subtitle'
}

const transcriptCache = new Map<string, SubtitleEntry[]>()
const TRANSCRIPT_FETCH_BATCH_SIZE = 6

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

function findTranscriptMatch(transcript: SubtitleEntry[], query: string) {
  return transcript.find(
    (subtitle) => subtitle.en.toLowerCase().includes(query) || subtitle.ko.includes(query)
  )
}

/**
 * Search through video titles and transcript subtitles.
 * Keeps network usage bounded by checking local data and cached transcripts first,
 * then loading the remaining transcript files in small batches until enough
 * matches are found.
 */
export async function searchVideos(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return []

  const q = query.toLowerCase().trim()
  const results: SearchResult[] = []
  const seen = new Set<string>()

  // First pass: title, description, and series name matches (instant)
  for (const video of catalogVideos) {
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

  // Second pass: in-memory subtitles already bundled with the catalog
  for (const video of catalogVideos) {
    if (seen.has(video.id)) continue

    const matchedPhrase = findTranscriptMatch(video.subtitles, q)
    if (!matchedPhrase) continue

    results.push({
      video,
      matchedPhrase: { en: matchedPhrase.en, ko: matchedPhrase.ko },
      matchType: 'subtitle',
    })
    seen.add(video.id)
  }

  // Third pass: cached transcript JSON files
  for (const video of catalogVideos) {
    if (seen.has(video.id) || !transcriptCache.has(video.youtubeId)) continue

    const matchedPhrase = findTranscriptMatch(transcriptCache.get(video.youtubeId) ?? [], q)
    if (!matchedPhrase) continue

    results.push({
      video,
      matchedPhrase: { en: matchedPhrase.en, ko: matchedPhrase.ko },
      matchType: 'subtitle',
    })
    seen.add(video.id)
  }

  // Final pass: fetch uncached transcript files in bounded batches.
  const uncachedVideos = catalogVideos.filter(
    (video) => !seen.has(video.id) && !transcriptCache.has(video.youtubeId)
  )

  for (let index = 0; index < uncachedVideos.length && results.length < 10; index += TRANSCRIPT_FETCH_BATCH_SIZE) {
    const batch = uncachedVideos.slice(index, index + TRANSCRIPT_FETCH_BATCH_SIZE)
    const transcripts = await Promise.all(
      batch.map(async (video) => ({
        video,
        transcript: await fetchTranscript(video.youtubeId),
      }))
    )

    for (const { video, transcript } of transcripts) {
      const matchedPhrase = findTranscriptMatch(transcript, q)
      if (!matchedPhrase) continue

      results.push({
        video,
        matchedPhrase: { en: matchedPhrase.en, ko: matchedPhrase.ko },
        matchType: 'subtitle',
      })
      seen.add(video.id)

      if (results.length >= 10) {
        break
      }
    }
  }

  return results.slice(0, 10)
}
