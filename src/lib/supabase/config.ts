const PLACEHOLDER_PREFIXES = ['your_', 'YOUR_']

function hasPlaceholderValue(value: string | undefined) {
  if (!value) return true

  const trimmed = value.trim()
  if (!trimmed) return true

  return PLACEHOLDER_PREFIXES.some((prefix) => trimmed.startsWith(prefix))
}

function isValidHttpUrl(value: string | undefined) {
  if (!value || hasPlaceholderValue(value)) return false

  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  return {
    url,
    anonKey,
    configured: isValidHttpUrl(url) && !hasPlaceholderValue(anonKey),
  }
}

export function isSupabaseConfigured() {
  return getSupabaseEnv().configured
}
