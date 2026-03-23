'use client'
import { useState } from 'react'
import Image from 'next/image'

interface Props {
  youtubeId: string
  alt: string
  fill?: boolean
  sizes?: string
  className?: string
  quality?: 'mq' | 'hq' | 'maxres'
}

export function YouTubeThumbnail({ youtubeId, alt, fill, sizes, className, quality = 'mq' }: Props) {
  const [error, setError] = useState(false)
  const qualityMap = { mq: 'mqdefault', hq: 'hqdefault', maxres: 'maxresdefault' }
  const src = `https://img.youtube.com/vi/${youtubeId}/${qualityMap[quality]}.jpg`

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-zinc-800 ${fill ? 'absolute inset-0' : ''} ${className || ''}`}>
        <span className="text-xs text-zinc-500 text-center px-2 line-clamp-2">{alt}</span>
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      sizes={sizes}
      className={className}
      onError={() => setError(true)}
      unoptimized
    />
  )
}
