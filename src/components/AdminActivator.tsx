'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAdminStore } from '@/stores/useAdminStore'
import { useAuth } from '@/hooks/useAuth'

/**
 * Watches for ?admin=true in the URL and activates admin mode.
 * Also auto-activates admin mode when the logged-in user's email
 * matches the configured admin email.
 * Mount this once in a layout that wraps all pages.
 */
export function AdminActivator() {
  const searchParams = useSearchParams()
  const setAdmin = useAdminStore((s) => s.setAdmin)
  const adminEmail = useAdminStore((s) => s.adminEmail)
  const { user } = useAuth()

  // URL param activation
  useEffect(() => {
    const adminParam = searchParams.get('admin')
    if (adminParam === 'true') {
      setAdmin(true)
    } else if (adminParam === 'false') {
      setAdmin(false)
    }
  }, [searchParams, setAdmin])

  // Auto-activate when user email matches admin email
  useEffect(() => {
    if (user?.email && user.email === adminEmail) {
      setAdmin(true)
    }
  }, [user, adminEmail, setAdmin])

  return null
}
