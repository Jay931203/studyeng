'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { syncOnLogin, onLogout, setCachedUserId } from '@/lib/supabase/sync'
import type { User } from '@supabase/supabase-js'

const supabase = createClient()

function buildAuthRedirect(nextPath = '/') {
  const redirectUrl = new URL('/auth/callback', window.location.origin)

  if (nextPath && nextPath !== '/') {
    redirectUrl.searchParams.set('next', nextPath)
  }

  return redirectUrl.toString()
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const syncedRef = useRef<string | null>(null)

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)

      // Trigger initial sync if user is already logged in
      if (user && syncedRef.current !== user.id) {
        syncedRef.current = user.id
        syncOnLogin(user.id).catch((err) =>
          console.warn('[auth] initial sync failed:', err)
        )
      }
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const newUser = session?.user ?? null
      setUser(newUser)
      setLoading(false)

      if (event === 'SIGNED_IN' && newUser && syncedRef.current !== newUser.id) {
        syncedRef.current = newUser.id
        syncOnLogin(newUser.id).catch((err) =>
          console.warn('[auth] sync on sign-in failed:', err)
        )
      }

      if (event === 'SIGNED_OUT') {
        syncedRef.current = null
        onLogout()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = async (nextPath = '/') => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: buildAuthRedirect(nextPath),
      },
    })
  }

  const signInWithKakao = async (nextPath = '/') => {
    await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: buildAuthRedirect(nextPath),
      },
    })
  }

  const signOut = async () => {
    onLogout()
    await supabase.auth.signOut()
    setUser(null)
  }

  return { user, loading, signInWithGoogle, signInWithKakao, signOut }
}
