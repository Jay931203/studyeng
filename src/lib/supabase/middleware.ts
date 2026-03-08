import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseEnv } from './config'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const { url, anonKey, configured } = getSupabaseEnv()

  if (!configured || !url || !anonKey) {
    return supabaseResponse
  }

  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  try {
    await supabase.auth.getUser()
  } catch (error) {
    console.warn('[supabase] session refresh skipped:', error)
  }

  return supabaseResponse
}
