import { NextRequest, NextResponse } from 'next/server'
import { YoutubeTranscript } from 'youtube-transcript'

export interface TranscriptSubtitle {
  start: number
  end: number
  en: string
  ko: string
}

// In-memory cache to avoid re-fetching transcripts
const transcriptCache = new Map<string, TranscriptSubtitle[]>()

/**
 * Group raw transcript entries into ~3-5 second segments,
 * splitting at sentence boundaries when entries are long.
 */
function groupTranscriptEntries(
  raw: { text: string; offset: number; duration: number }[]
): TranscriptSubtitle[] {
  if (raw.length === 0) return []

  const TARGET_DURATION = 4 // target ~4 seconds per segment
  const MAX_DURATION = 6 // never exceed 6 seconds

  const subtitles: TranscriptSubtitle[] = []
  let currentTexts: string[] = []
  let segmentStart = raw[0].offset / 1000
  let segmentEnd = segmentStart

  for (let i = 0; i < raw.length; i++) {
    const entry = raw[i]
    const entryStart = entry.offset / 1000
    const entryEnd = entryStart + entry.duration / 1000
    const text = decodeHTMLEntities(entry.text).trim()

    if (!text) continue

    if (currentTexts.length === 0) {
      // Start a new segment
      segmentStart = entryStart
      segmentEnd = entryEnd
      currentTexts.push(text)
    } else {
      const potentialDuration = entryEnd - segmentStart

      if (potentialDuration <= TARGET_DURATION) {
        // Still within target, add to current segment
        currentTexts.push(text)
        segmentEnd = entryEnd
      } else if (potentialDuration <= MAX_DURATION && !endsWithSentenceBoundary(currentTexts[currentTexts.length - 1])) {
        // Slightly over target but not at sentence boundary, keep going
        currentTexts.push(text)
        segmentEnd = entryEnd
      } else {
        // Flush current segment and start a new one
        subtitles.push({
          start: round2(segmentStart),
          end: round2(segmentEnd),
          en: currentTexts.join(' '),
          ko: '',
        })
        segmentStart = entryStart
        segmentEnd = entryEnd
        currentTexts = [text]
      }
    }
  }

  // Flush remaining
  if (currentTexts.length > 0) {
    subtitles.push({
      start: round2(segmentStart),
      end: round2(segmentEnd),
      en: currentTexts.join(' '),
      ko: '',
    })
  }

  return subtitles
}

function endsWithSentenceBoundary(text: string): boolean {
  return /[.!?]["']?\s*$/.test(text)
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/\n/g, ' ')
}

export async function GET(request: NextRequest) {
  const videoId = request.nextUrl.searchParams.get('v')

  if (!videoId) {
    return NextResponse.json(
      { error: 'Missing video ID parameter "v"' },
      { status: 400 }
    )
  }

  // Check cache first
  if (transcriptCache.has(videoId)) {
    return NextResponse.json(
      { subtitles: transcriptCache.get(videoId)! },
      {
        headers: {
          'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        },
      }
    )
  }

  try {
    // Try English transcript first
    let rawTranscript = await fetchTranscript(videoId, 'en')

    // If English not available, try without specifying language (auto-generated)
    if (!rawTranscript || rawTranscript.length === 0) {
      rawTranscript = await fetchTranscript(videoId)
    }

    if (!rawTranscript || rawTranscript.length === 0) {
      return NextResponse.json(
        { subtitles: [], error: 'No transcript available for this video' },
        { status: 200 }
      )
    }

    const subtitles = groupTranscriptEntries(rawTranscript)

    // Cache the result
    transcriptCache.set(videoId, subtitles)

    // Limit cache size to prevent memory issues
    if (transcriptCache.size > 200) {
      const firstKey = transcriptCache.keys().next().value
      if (firstKey) transcriptCache.delete(firstKey)
    }

    return NextResponse.json(
      { subtitles },
      {
        headers: {
          'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        },
      }
    )
  } catch (error) {
    console.error(`[transcript] Failed to fetch transcript for ${videoId}:`, error)
    return NextResponse.json(
      { subtitles: [], error: 'Failed to fetch transcript' },
      { status: 200 } // Return 200 with empty subtitles so the video still plays
    )
  }
}

async function fetchTranscript(
  videoId: string,
  lang?: string
): Promise<{ text: string; offset: number; duration: number }[] | null> {
  try {
    const config = lang ? { lang } : undefined
    const transcript = await YoutubeTranscript.fetchTranscript(videoId, config)
    return transcript.map((entry) => ({
      text: entry.text,
      offset: entry.offset,
      duration: entry.duration,
    }))
  } catch {
    return null
  }
}
