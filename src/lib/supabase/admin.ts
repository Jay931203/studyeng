import { createClient } from '@supabase/supabase-js'
import { getSupabaseEnv } from './config'
import { hasPlaceholderValue } from '@/lib/billing'

let adminClient: ReturnType<typeof createClient> | null = null

export function getSupabaseAdminConfig() {
  const { url, configured } = getSupabaseEnv()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  return {
    url,
    serviceRoleKey,
    enabled: configured && !hasPlaceholderValue(serviceRoleKey),
  }
}

export function createAdminClient() {
  const { url, serviceRoleKey, enabled } = getSupabaseAdminConfig()

  if (!enabled || !url || !serviceRoleKey) {
    return null
  }

  if (!adminClient) {
    adminClient = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  return adminClient
}
