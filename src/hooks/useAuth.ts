'use client'

import { useSyncExternalStore } from 'react'
import { clearAccountScopedState, prepareAccountScopedStateForUser } from '@/lib/accountScope'
import { sanitizeAppPath } from '@/lib/navigation'
import { syncBillingOnLogin } from '@/lib/supabase/billingSync'
import { createClient } from '@/lib/supabase/client'
import { syncOnLogin, onLogout } from '@/lib/supabase/sync'
import { syncOpsOnLogin } from '@/lib/supabase/opsSync'
import { useAdminStore } from '@/stores/useAdminStore'
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js'

const supabase = createClient()

interface AuthSnapshot {
  user: User | null
  loading: boolean
  authAvailable: boolean
}

const authListeners = new Set<() => void>()

let authSnapshot: AuthSnapshot = {
  user: null,
  loading: Boolean(supabase),
  authAvailable: Boolean(supabase),
}
let authInitialized = false
let authInitializationPromise: Promise<void> | null = null
let syncedUserId: string | null = null

function emitAuthChange() {
  authListeners.forEach((listener) => listener())
}

function setAuthSnapshot(nextSnapshot: AuthSnapshot) {
  const unchanged =
    authSnapshot.user?.id === nextSnapshot.user?.id &&
    authSnapshot.loading === nextSnapshot.loading &&
    authSnapshot.authAvailable === nextSnapshot.authAvailable

  if (unchanged) {
    return
  }

  authSnapshot = nextSnapshot
  emitAuthChange()
}

function mergeAuthSnapshot(partial: Partial<AuthSnapshot>) {
  setAuthSnapshot({
    ...authSnapshot,
    ...partial,
  })
}

function getSnapshot() {
  return authSnapshot
}

function resetSignedOutState() {
  const hadUser = authSnapshot.user !== null || syncedUserId !== null
  syncedUserId = null
  clearAccountScopedState()

  if (hadUser) {
    onLogout()
  }
}

async function syncSignedInUser(user: User) {
  if (syncedUserId === user.id) {
    return
  }

  prepareAccountScopedStateForUser(user.id)
  useAdminStore.setState({ isAdmin: false })
  syncedUserId = user.id

  try {
    await Promise.all([
      syncOnLogin(user.id),
      syncOpsOnLogin(user.id, user.email ?? null),
      syncBillingOnLogin(user.id),
    ])
  } catch (error) {
    console.warn('[auth] sync on sign-in failed:', error)
  }
}

function handleAuthStateChange(event: AuthChangeEvent, session: Session | null) {
  const user = session?.user ?? null

  mergeAuthSnapshot({
    user,
    loading: false,
  })

  if (event === 'SIGNED_OUT') {
    resetSignedOutState()
    return
  }

  if (user) {
    void syncSignedInUser(user)
  }
}

function ensureAuthInitialized() {
  if (!supabase) {
    mergeAuthSnapshot({
      loading: false,
      authAvailable: false,
      user: null,
    })
    return Promise.resolve()
  }

  if (authInitialized) {
    return authInitializationPromise ?? Promise.resolve()
  }

  authInitialized = true

  authInitializationPromise = (async () => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(handleAuthStateChange)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      mergeAuthSnapshot({
        user,
        loading: false,
      })

      if (user) {
        await syncSignedInUser(user)
      }
    } catch (error) {
      console.warn('[auth] initial user load failed:', error)
      mergeAuthSnapshot({
        user: null,
        loading: false,
      })
    }

    void subscription
  })().finally(() => {
    authInitializationPromise = null
  })

  return authInitializationPromise
}

function subscribe(listener: () => void) {
  authListeners.add(listener)
  void ensureAuthInitialized()

  return () => {
    authListeners.delete(listener)
  }
}

function buildAuthRedirect(nextPath = '/') {
  const redirectUrl = new URL('/auth/callback', window.location.origin)
  const safeNextPath = sanitizeAppPath(nextPath, '/')

  if (safeNextPath !== '/') {
    redirectUrl.searchParams.set('next', safeNextPath)
  }

  return redirectUrl.toString()
}

async function signInWithProvider(provider: 'google' | 'kakao', nextPath = '/') {
  if (!supabase) return

  await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: buildAuthRedirect(nextPath),
    },
  })
}

export function useAuth() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  return {
    ...state,
    signInWithGoogle: (nextPath = '/') => signInWithProvider('google', nextPath),
    signInWithKakao: (nextPath = '/') => signInWithProvider('kakao', nextPath),
    signOut: async () => {
      if (!supabase) return

      mergeAuthSnapshot({
        user: null,
        loading: false,
      })
      resetSignedOutState()

      await supabase.auth.signOut()
    },
  }
}
