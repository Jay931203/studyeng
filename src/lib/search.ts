import { seedVideos, type VideoData } from '@/data/seed-videos'

export interface SearchResult {
  video: VideoData
  matchedPhrase?: { en: string; ko: string }
  matchType: 'title' | 'subtitle'
}

export function searchVideos(query: string): SearchResult[] {
  if (!query.trim()) return []

  const q = query.toLowerCase().trim()
  const results: SearchResult[] = []
  const seen = new Set<string>()

  for (const video of seedVideos) {
    // Title match
    if (video.title.toLowerCase().includes(q)) {
      if (!seen.has(video.id)) {
        results.push({ video, matchType: 'title' })
        seen.add(video.id)
      }
    }

    // Subtitle match
    for (const sub of video.subtitles) {
      if (seen.has(video.id)) break
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
