import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { buildPathWithNext, sanitizeAppPath } from '@/lib/navigation'
import { getSupabaseEnv } from '@/lib/supabase/config'

function getCanonicalOrigin(fallbackOrigin: string) {
  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL

  if (!configuredOrigin) return fallbackOrigin

  try {
    const parsed = new URL(configuredOrigin)
    return parsed.origin
  } catch {
    return fallbackOrigin
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const redirectOrigin = getCanonicalOrigin(origin)
  const code = searchParams.get('code')
  const next = sanitizeAppPath(searchParams.get('next'), '/')
  const { url, anonKey, configured } = getSupabaseEnv()
  const loginRedirectBase = `${redirectOrigin}${buildPathWithNext('/login', next)}`

  if (!configured || !url || !anonKey) {
    return NextResponse.redirect(`${loginRedirectBase}&auth=unavailable`)
  }

  if (code) {
    const redirectUrl = `${redirectOrigin}${next}`
    const response = NextResponse.redirect(redirectUrl)

    const supabase = createServerClient(
      url,
      anonKey,
      {
        cookies: {
          getAll() {
            // Read cookies from the incoming request
            const cookieHeader = request.headers.get('cookie') ?? ''
            const parsed: { name: string; value: string }[] = []
            cookieHeader.split(';').forEach((c) => {
              const [name, ...rest] = c.trim().split('=')
              if (name) {
                parsed.push({ name, value: rest.join('=') })
              }
            })
            return parsed
          },
          setAll(cookiesToSet) {
            // Write cookies to the outgoing response
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return response
    }
  }

  return NextResponse.redirect(`${loginRedirectBase}&auth=error`)
}
