import { createBrowserClient } from '@supabase/ssr'
import { getSupabaseEnv } from './config'

let browserClient: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  const { url, anonKey, configured } = getSupabaseEnv()

  if (!configured || !url || !anonKey) {
    return null
  }

  if (!browserClient) {
    browserClient = createBrowserClient(url, anonKey)
  }

  return browserClient
}
