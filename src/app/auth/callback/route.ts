import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const redirectUrl = `${origin}${next}`
    const response = NextResponse.redirect(redirectUrl)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  return NextResponse.redirect(`${origin}/auth/error`)
}
