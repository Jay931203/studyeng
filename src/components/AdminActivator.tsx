'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAdminStore } from '@/stores/useAdminStore'

/**
 * Watches for ?admin=true in the URL and activates admin mode.
 * Mount this once in a layout that wraps all pages.
 */
export function AdminActivator() {
  const searchParams = useSearchParams()
  const setAdmin = useAdminStore((s) => s.setAdmin)

  useEffect(() => {
    const adminParam = searchParams.get('admin')
    if (adminParam === 'true') {
      setAdmin(true)
    } else if (adminParam === 'false') {
      setAdmin(false)
    }
  }, [searchParams, setAdmin])

  return null
}
