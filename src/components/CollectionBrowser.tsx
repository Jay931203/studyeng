'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { SectionHeader } from '@/components/ui/AppPage'
import {
  getCollectionGroups,
  getCollectionsByGroup,
  type CollectionSummary,
} from '@/lib/collections'
import { t } from '@/lib/uiTranslations'
import { useLocaleStore } from '@/stores/useLocaleStore'

export function CollectionBrowser() {
  const router = useRouter()
  const locale = useLocaleStore((state) => state.locale)
  const groups = useMemo(() => getCollectionGroups(), [])
  const [activeGroup, setActiveGroup] = useState(groups[0]?.id ?? 'situation')

  const collections = useMemo<CollectionSummary[]>(
    () => getCollectionsByGroup(activeGroup),
    [activeGroup],
  )

  const handleOpenCollection = (collectionId: string) => {
    const params = new URLSearchParams(window.location.search)
    params.set('collection', collectionId)
    router.push(`/explore?${params.toString()}`, { scroll: false })
  }

  return (
    <section className="mb-8">
      <SectionHeader title={t('collections', locale)} />

      {/* Group tabs */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {groups.map((group) => (
          <button
            key={group.id}
            onClick={() => setActiveGroup(group.id)}
            className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm transition-colors ${
              activeGroup === group.id
                ? 'bg-[var(--accent-primary)] text-white'
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
            }`}
          >
            {group.label}
          </button>
        ))}
      </div>

      {/* Collection cards or placeholder */}
      {collections.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {collections.map((collection, index) => (
            <motion.button
              key={collection.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: {
                  delay: index * 0.04,
                  duration: 0.3,
                  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
                },
              }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleOpenCollection(collection.id)}
              className="rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] p-4 text-left shadow-[var(--card-shadow)] transition-colors"
            >
              <p className="text-[15px] font-semibold text-[var(--text-primary)]">
                {collection.name}
              </p>
              <div className="mt-2 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                <span>{collection.sentenceCount}{t('sentencesUnit', locale)}</span>
                <span className="text-[var(--text-muted)]">/</span>
                <span>{collection.videoCount}{t('videosUnit', locale)}</span>
              </div>
            </motion.button>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] px-6 py-10 text-center shadow-[var(--card-shadow)]">
          <p className="text-sm font-medium text-[var(--text-primary)]">
            {t('tagDataPreparing', locale)}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">
            {t('tagDataPreparingDescription', locale)}
          </p>
        </div>
      )}
    </section>
  )
}
