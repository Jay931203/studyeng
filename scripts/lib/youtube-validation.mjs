import { existsSync } from 'fs'
import { mkdir, readFile, writeFile } from 'fs/promises'
import { execFileSync } from 'child_process'
import { dirname } from 'path'

const ALLOWED_AVAILABILITY = new Set(['public', 'unlisted'])

export async function readValidationCache(filePath) {
  if (!existsSync(filePath)) {
    return {
      generatedAt: null,
      videos: {},
    }
  }

  try {
    const raw = JSON.parse((await readFile(filePath, 'utf-8')).replace(/^\uFEFF/, ''))
    return normalizeValidationCache(raw)
  } catch {
    return {
      generatedAt: null,
      videos: {},
    }
  }
}

export async function writeValidationCache(filePath, cache) {
  await mkdir(dirname(filePath), { recursive: true })
  const normalized = normalizeValidationCache(cache)
  normalized.generatedAt = new Date().toISOString()
  await writeFile(filePath, JSON.stringify(normalized, null, 2) + '\n', 'utf-8')
}

export function normalizeValidationCache(raw) {
  if (raw?.videos && typeof raw.videos === 'object' && !Array.isArray(raw.videos)) {
    return {
      generatedAt: raw.generatedAt ?? null,
      videos: raw.videos,
    }
  }

  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return {
      generatedAt: raw.generatedAt ?? null,
      videos: raw,
    }
  }

  return {
    generatedAt: null,
    videos: {},
  }
}

export function validateYoutubeId(youtubeId) {
  const checkedAt = new Date().toISOString()

  try {
    const raw = execFileSync(
      'yt-dlp',
      ['-J', '--no-download', `https://www.youtube.com/watch?v=${youtubeId}`],
      {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 60000,
        maxBuffer: 20 * 1024 * 1024,
      }
    )

    const data = JSON.parse(raw)
    const playback = classifyPlayback({
      availability: data.availability ?? null,
      playableInEmbed: data.playable_in_embed ?? null,
      ageLimit: data.age_limit ?? 0,
    })

    return {
      youtubeId,
      checkedAt,
      title: data.title ?? null,
      channel: data.channel ?? null,
      availability: data.availability ?? null,
      playableInEmbed: data.playable_in_embed ?? null,
      ageLimit: data.age_limit ?? 0,
      durationSec: Number.isFinite(data.duration) ? data.duration : null,
      status: playback.status,
      reason: playback.reason,
      blocked: playback.blocked,
      error: null,
    }
  } catch (error) {
    const stderr = stringifyError(error)
    const playback = classifyValidationError(stderr)

    return {
      youtubeId,
      checkedAt,
      title: null,
      channel: null,
      availability: null,
      playableInEmbed: null,
      ageLimit: 0,
      durationSec: null,
      status: playback.status,
      reason: playback.reason,
      blocked: playback.blocked,
      error: stderr || String(error.message || error),
    }
  }
}

export function classifyPlayback({ availability, playableInEmbed, ageLimit }) {
  if (availability && !ALLOWED_AVAILABILITY.has(availability)) {
    return {
      status: 'blocked',
      reason: `availability_${availability}`,
      blocked: true,
    }
  }

  if (playableInEmbed === false) {
    return {
      status: 'blocked',
      reason: 'external_restricted',
      blocked: true,
    }
  }

  if (Number(ageLimit || 0) >= 18) {
    return {
      status: 'blocked',
      reason: 'age_restricted',
      blocked: true,
    }
  }

  return {
    status: 'ok',
    reason: 'ok',
    blocked: false,
  }
}

export function classifyValidationError(errorText) {
  const normalized = (errorText || '').toLowerCase()

  if (normalized.includes('private video')) {
    return { status: 'blocked', reason: 'private', blocked: true }
  }
  if (normalized.includes('members-only')) {
    return { status: 'blocked', reason: 'members_only', blocked: true }
  }
  if (normalized.includes('sign in to confirm your age') || normalized.includes('age-restricted')) {
    return { status: 'blocked', reason: 'age_restricted', blocked: true }
  }
  if (normalized.includes('video unavailable') || normalized.includes('this video is unavailable')) {
    return { status: 'blocked', reason: 'unavailable', blocked: true }
  }
  if (normalized.includes('copyright') && normalized.includes('country')) {
    return { status: 'blocked', reason: 'geo_restricted', blocked: true }
  }

  return { status: 'error', reason: 'metadata_fetch_failed', blocked: false }
}

export function getExternalPlaybackStatus(entry) {
  if (!entry) return 'unchecked'
  if (entry.blocked) return 'blocked'
  if (entry.status === 'ok') return 'pass'
  return 'unchecked'
}

function stringifyError(error) {
  if (!error) return ''

  const stderr = typeof error.stderr === 'string'
    ? error.stderr
    : Buffer.isBuffer(error.stderr)
    ? error.stderr.toString('utf8')
    : ''
  const stdout = typeof error.stdout === 'string'
    ? error.stdout
    : Buffer.isBuffer(error.stdout)
    ? error.stdout.toString('utf8')
    : ''

  return [stderr, stdout, error.message].filter(Boolean).join('\n').trim()
}
