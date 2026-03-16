'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocaleStore } from '@/stores/useLocaleStore'
import {
  FAQ_ITEMS,
  FAQ_CATEGORY_LABELS,
  SUPPORT_PAGE_STRINGS as T,
  type FaqCategory,
  type FaqItem,
} from '@/data/support-faq'
import { SupportChat } from '@/components/SupportChat'
import { SupportInbox } from '@/components/SupportInbox'

const SUPPORT_EMAIL = 'support@shortee.app'

const CATEGORIES: Array<FaqCategory | 'all'> = [
  'all',
  'account',
  'subscription',
  'video',
  'app',
  'general',
]

function FaqAccordionItem({
  item,
  locale,
  isOpen,
  onToggle,
}: {
  item: FaqItem
  locale: 'ko' | 'ja' | 'zh-TW' | 'vi'
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <div className="border-b border-[var(--border-card)]/40 last:border-b-0">
      <button
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-3 px-5 py-4 text-left"
      >
        <span className="text-sm font-medium leading-relaxed text-[var(--text-primary)]">
          {item.question[locale]}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`mt-0.5 h-4 w-4 shrink-0 text-[var(--text-muted)] transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        >
          <path
            fillRule="evenodd"
            d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 text-sm leading-relaxed text-[var(--text-secondary)]">
              {item.answer[locale]}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function HelpCenterPage() {
  const locale = useLocaleStore((s) => s.locale)
  const [activeCategory, setActiveCategory] = useState<FaqCategory | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [openItemId, setOpenItemId] = useState<string | null>(null)

  const filteredItems = useMemo(() => {
    let items = FAQ_ITEMS

    if (activeCategory !== 'all') {
      items = items.filter((item) => item.category === activeCategory)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      items = items.filter(
        (item) =>
          item.question[locale].toLowerCase().includes(q) ||
          item.answer[locale].toLowerCase().includes(q),
      )
    }

    return items
  }, [activeCategory, searchQuery, locale])

  // Group items by category when showing all
  const groupedItems = useMemo(() => {
    if (activeCategory !== 'all') {
      return [{ category: activeCategory, items: filteredItems }]
    }
    const groups: Array<{ category: FaqCategory; items: FaqItem[] }> = []
    const catOrder: FaqCategory[] = ['account', 'subscription', 'video', 'app', 'general']
    for (const cat of catOrder) {
      const catItems = filteredItems.filter((item) => item.category === cat)
      if (catItems.length > 0) {
        groups.push({ category: cat, items: catItems })
      }
    }
    return groups
  }, [activeCategory, filteredItems])

  return (
    <div className="min-h-dvh bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 border-b border-[var(--border-card)] bg-[var(--bg-primary)]/95 backdrop-blur-md">
        <div className="mx-auto max-w-2xl px-4">
          <div className="flex items-center gap-3 py-3">
            <Link
              href="/profile"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--bg-card)] text-[var(--text-secondary)]"
              aria-label={T.back[locale]}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-5 w-5"
              >
                <path
                  fillRule="evenodd"
                  d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
            <h1 className="text-lg font-bold">{T.pageTitle[locale]}</h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 pb-32 pt-5">
        {/* Page intro */}
        <div className="mb-6">
          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
            {T.pageDescription[locale]}
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
              clipRule="evenodd"
            />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={T.searchPlaceholder[locale]}
            className="w-full rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] py-3 pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:outline-none"
          />
        </div>

        {/* Category Tabs */}
        <div className="-mx-4 mb-6 overflow-x-auto px-4">
          <div className="flex gap-2">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat
              const label =
                cat === 'all'
                  ? T.allCategories[locale]
                  : FAQ_CATEGORY_LABELS[cat][locale]

              return (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat)
                    setOpenItemId(null)
                  }}
                  className={`shrink-0 rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-[var(--accent-primary)] text-white'
                      : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-card)]'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* FAQ List */}
        {filteredItems.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] px-5 py-12 text-center">
            <p className="text-sm text-[var(--text-muted)]">{T.noResults[locale]}</p>
          </div>
        ) : (
          <div className="space-y-5">
            {groupedItems.map((group) => (
              <div key={group.category}>
                {activeCategory === 'all' && (
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
                    {FAQ_CATEGORY_LABELS[group.category][locale]}
                  </p>
                )}
                <div className="overflow-hidden rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] shadow-[var(--card-shadow)]">
                  {group.items.map((item) => (
                    <FaqAccordionItem
                      key={item.id}
                      item={item}
                      locale={locale}
                      isOpen={openItemId === item.id}
                      onToggle={() =>
                        setOpenItemId((prev) => (prev === item.id ? null : item.id))
                      }
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Contact Section */}
        <div className="mt-8 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5 shadow-[var(--card-shadow)]">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--accent-text)]">
            {T.contactUs[locale]}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
            {T.contactDescription[locale]}
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--border-card)] bg-[var(--bg-secondary)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-secondary)]/80"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path d="M3 4a2 2 0 0 0-2 2v1.161l8.441 4.221a1.25 1.25 0 0 0 1.118 0L19 7.162V6a2 2 0 0 0-2-2H3Z" />
                <path d="m19 8.839-7.77 3.885a2.75 2.75 0 0 1-2.46 0L1 8.839V14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.839Z" />
              </svg>
              {T.emailSupport[locale]}
            </a>
          </div>
        </div>

        <SupportInbox />
      </div>

      {/* Floating Support Chat */}
      <SupportChat />
    </div>
  )
}
