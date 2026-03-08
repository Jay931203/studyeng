'use client'

const EMBED_BLOCKED_STORAGE_KEY = 'studyeng-embed-blocked-videos'
const BLOCK_EXPIRY_MS = 24 * 60 * 60 * 1000 // 24 hours

interface BlockedEntry {
  id: string
  ts: number
}

export function readEmbedBlockedVideoIds(): string[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(EMBED_BLOCKED_STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw)

    // Migration: old format was string[], new format is BlockedEntry[]
    if (Array.isArray(parsed) && parsed.length > 0) {
      if (typeof parsed[0] === 'string') {
        // Old format – treat all as expired and clear
        window.localStorage.removeItem(EMBED_BLOCKED_STORAGE_KEY)
        return []
      }

      const now = Date.now()
      const valid = (parsed as BlockedEntry[]).filter(
        (entry) => entry.ts && now - entry.ts < BLOCK_EXPIRY_MS,
      )

      // Prune expired entries
      if (valid.length !== parsed.length) {
        window.localStorage.setItem(EMBED_BLOCKED_STORAGE_KEY, JSON.stringify(valid))
      }

      return valid.map((entry) => entry.id)
    }

    return []
  } catch {
    return []
  }
}

export function writeEmbedBlockedVideoIds(videoIds: string[]) {
  if (typeof window === 'undefined') return

  try {
    const now = Date.now()

    // Read existing entries to preserve their timestamps
    const raw = window.localStorage.getItem(EMBED_BLOCKED_STORAGE_KEY)
    const existing: BlockedEntry[] = []
    try {
      const parsed = JSON.parse(raw ?? '[]')
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object') {
        existing.push(...(parsed as BlockedEntry[]))
      }
    } catch { /* ignore */ }

    const existingMap = new Map(existing.map((e) => [e.id, e.ts]))

    const entries: BlockedEntry[] = videoIds.slice(-200).map((id) => ({
      id,
      ts: existingMap.get(id) ?? now,
    }))

    window.localStorage.setItem(EMBED_BLOCKED_STORAGE_KEY, JSON.stringify(entries))
  } catch {
    // Ignore storage write failures.
  }
}
