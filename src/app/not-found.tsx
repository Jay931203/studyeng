'use client'

import Link from 'next/link'
import { getPersistedLocale, NOT_FOUND_STRINGS } from '@/lib/i18n-error'

export default function NotFound() {
  const locale = getPersistedLocale()
  return (
    <div className="h-dvh flex flex-col items-center justify-center bg-black text-white px-6">
      <p className="text-7xl font-bold text-blue-500">404</p>
      <p className="mt-4 text-lg text-gray-300">
        {NOT_FOUND_STRINGS.message[locale]}
      </p>
      <Link
        href="/"
        className="mt-8 px-6 py-3 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-colors"
      >
        {NOT_FOUND_STRINGS.goHome[locale]}
      </Link>
    </div>
  )
}
