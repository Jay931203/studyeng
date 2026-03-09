'use client'

import Image from 'next/image'
import { useThemeStore } from '@/stores/useThemeStore'

interface LogoProps {
  className?: string
}

const LOGO_SRC = '/logo-full-transparent.png'
const LOGO_WIDTH = 878
const LOGO_HEIGHT = 274

function BrandLogo({
  className = 'h-5',
  alt = 'Shortee',
}: LogoProps & {
  alt?: string
}) {
  const themeId = useThemeStore((state) => state.themeId)
  const filter = themeId.startsWith('light')
    ? 'none'
    : 'brightness(0) saturate(100%) invert(1) opacity(0.96)'

  return (
    <span className={`inline-flex shrink-0 items-center overflow-visible pr-[2px] ${className}`}>
      <Image
        src={LOGO_SRC}
        alt={alt}
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        sizes="(max-width: 640px) 9rem, 14rem"
        className="block h-full w-auto max-w-none shrink-0 object-contain"
        style={{ filter }}
      />
    </span>
  )
}

export function Logo({ className = 'h-5' }: LogoProps) {
  return <BrandLogo className={className} />
}

export function LogoFull({ className = 'h-10' }: LogoProps) {
  return <BrandLogo className={className} />
}
