'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { seedVideos } from '@/data/seed-videos'
import { VideoCard } from '@/components/VideoCard'

const categories = ['all', 'daily', 'travel', 'business']

export default function ExplorePage() {
  const [activeCategory, setActiveCategory] = useState('all')
  const router = useRouter()

  const filtered =
    activeCategory === 'all'
      ? seedVideos
      : seedVideos.filter((v) => v.category === activeCategory)

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-20 pt-12">
      <div className="px-4">
        <h1 className="text-white text-2xl font-bold mb-4">Explore</h1>

        <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize whitespace-nowrap transition-colors ${
                activeCategory === cat
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/10 text-gray-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {filtered.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onClick={() => router.push(`/?v=${video.id}`)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
