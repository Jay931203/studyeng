'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { categories } from '@/data/seed-videos'
import { searchVideos, type SearchResult } from '@/lib/search'
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore'

const quickQueries = ['일상 표현', '드라마', '면접 영어', '비즈니스']
const categoryLabels = Object.fromEntries(categories.map((category) => [category.id, category.label]))

export function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [focused, setFocused] = useState(false)
  const debounceRef = useRef<number | null>(null)
  const searchIdRef = useRef(0)
  const router = useRouter()
  const clearDeletedFlag = useWatchHistoryStore((state) => state.clearDeletedFlag)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!query.trim()) return

    const currentSearchId = ++searchIdRef.current

    debounceRef.current = window.setTimeout(() => {
      searchVideos(query)
        .then((response) => {
          if (searchIdRef.current === currentSearchId) {
            setResults(response)
          }
        })
        .catch((error) => {
          console.error('[search] failed:', error)
          if (searchIdRef.current === currentSearchId) {
            setResults([])
          }
        })
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  const normalizedQuery = query.trim()
  const showDropdown = focused && normalizedQuery.length > 0

  return (
    <section className="relative rounded-[28px] border border-[var(--border-card)] bg-[var(--bg-card)]/92 p-4 shadow-[var(--card-shadow)] backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-text)]">
            빠른 검색
          </p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">대사, 상황, 시리즈</p>
        </div>
        {normalizedQuery.length > 0 && (
          <span className="rounded-full bg-[var(--bg-secondary)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-secondary)]">
            {results.length}개 결과
          </span>
        )}
      </div>

      <label htmlFor="video-search" className="sr-only">
        표현 또는 주제 검색
      </label>
      <div className="relative">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"
        >
          <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
        </svg>
        <input
          id="video-search"
          type="text"
          value={query}
          onChange={(event) => {
            const nextQuery = event.target.value
            setQuery(nextQuery)

            if (!nextQuery.trim()) {
              searchIdRef.current += 1
              setResults([])
            }
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          placeholder="표현, 장면, 상황 검색"
          className="w-full rounded-2xl border border-[var(--border-card)] bg-[var(--bg-primary)]/55 py-3 pl-11 pr-11 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[rgba(var(--accent-primary-rgb),0.18)]"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('')
              setResults([])
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[var(--text-muted)] transition hover:bg-[var(--bg-secondary)]"
            aria-label="검색어 지우기"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {quickQueries.map((quickQuery) => (
          <button
            key={quickQuery}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => setQuery(quickQuery)}
            className="rounded-full border border-[var(--border-card)] bg-[var(--bg-secondary)]/35 px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition hover:border-[var(--accent-primary)]/35 hover:text-[var(--text-primary)]"
          >
            {quickQuery}
          </button>
        ))}
      </div>

      {showDropdown && (
        <div
          id="search-results"
          className="absolute left-4 right-4 top-[calc(100%-8px)] z-50 mt-4 max-h-72 overflow-y-auto rounded-3xl border border-[var(--border-card)] bg-[var(--bg-search-dropdown)] p-2 shadow-2xl"
        >
          {results.length > 0 ? (
            results.map((result) => (
              <button
                key={result.video.id}
                onMouseDown={() => {
                  clearDeletedFlag(result.video.id)
                  router.push(`/shorts?v=${result.video.id}`)
                }}
                className="w-full rounded-2xl px-3 py-3 text-left transition hover:bg-[var(--bg-card)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                      {result.video.title}
                    </p>
                    <p className="mt-1 truncate text-xs text-[var(--text-secondary)]">
                      {result.matchedPhrase
                        ? `"${result.matchedPhrase.en}"`
                        : '이 장면으로 바로 이동'}
                    </p>
                  </div>
                  <span className="rounded-full bg-[var(--bg-secondary)] px-2.5 py-1 text-[10px] font-medium text-[var(--text-secondary)]">
                    {categoryLabels[result.video.category]}
                  </span>
                </div>
              </button>
            ))
          ) : (
            <div className="rounded-2xl bg-[var(--bg-card)]/40 px-4 py-5 text-center">
              <p className="text-sm font-medium text-[var(--text-primary)]">
                아직 맞는 장면이 없습니다
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                다른 키워드로 좁혀 보거나 빠른 키워드를 눌러보세요.
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
