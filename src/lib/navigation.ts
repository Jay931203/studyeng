const DEFAULT_APP_PATH = '/explore'

export function sanitizeAppPath(path: string | null | undefined, fallback = DEFAULT_APP_PATH) {
  if (!path) return fallback

  const trimmed = path.trim()
  if (!trimmed) return fallback

  if (!trimmed.startsWith('/')) return fallback
  if (trimmed.startsWith('//')) return fallback
  if (trimmed.startsWith('/auth/callback')) return fallback

  return trimmed
}

export function buildPathWithNext(basePath: string, nextPath: string) {
  const safeNext = sanitizeAppPath(nextPath)
  return `${basePath}?next=${encodeURIComponent(safeNext)}`
}

export function getGuestContinuePath(nextPath: string | null | undefined) {
  const safeNext = sanitizeAppPath(nextPath)

  if (safeNext.startsWith('/onboarding') || safeNext.startsWith('/billing/')) {
    return DEFAULT_APP_PATH
  }

  return safeNext
}
