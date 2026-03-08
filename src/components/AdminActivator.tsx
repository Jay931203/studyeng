'use client'

import { useEffect } from 'react'
import { useAdminStore } from '@/stores/useAdminStore'
import { useAuth } from '@/hooks/useAuth'

export function AdminActivator() {
  const setAdmin = useAdminStore((s) => s.setAdmin)
  const { loading, user } = useAuth()

  useEffect(() => {
    if (loading) {
      return
    }

    if (!user) {
      setAdmin(false)
    }
  }, [loading, setAdmin, user])

  return null
}
