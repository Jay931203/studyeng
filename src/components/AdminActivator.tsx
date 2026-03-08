'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAdminStore } from '@/stores/useAdminStore'
import { useAuth } from '@/hooks/useAuth'

export function AdminActivator() {
  const searchParams = useSearchParams()
  const setAdmin = useAdminStore((s) => s.setAdmin)
  const adminEmail = useAdminStore((s) => s.adminEmail)
  const { user } = useAuth()

  useEffect(() => {
    const adminParam = searchParams.get('admin')

    if (adminParam === 'true') {
      setAdmin(true)
      return
    }

    if (adminParam === 'false') {
      setAdmin(false)
      return
    }

    setAdmin(Boolean(user?.email && user.email === adminEmail))
  }, [searchParams, setAdmin, user?.email, adminEmail])

  return null
}
