'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { searchVideos, type SearchResult } from '@/lib/search'

export function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [focused, setFocused] = useState(false)
  const debounceRef = useRef<number | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => {
      setResults(searchVideos(query))
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  const showResults = focused && query.trim().length > 0 && results.length > 0

  return (
    <div className="relative mb-4">
      <div className="relative">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]"
        >
          <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          placeholder="표현, 주제 검색..."
          className="w-full bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl pl-9 pr-9 py-2.5 text-[var(--text-primary)] text-sm placeholder-[var(--text-muted)] outline-none focus:border-blue-500/50"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults([]) }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        )}
      </div>

      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-search-dropdown)] border border-[var(--border-card)] rounded-xl overflow-hidden z-50 max-h-64 overflow-y-auto shadow-lg">
          {results.map((r) => (
            <button
              key={r.video.id}
              onMouseDown={() => router.push(`/?v=${r.video.id}`)}
              className="w-full p-3 text-left hover:bg-[var(--bg-card)] border-b border-[var(--border-card)] last:border-0"
            >
              <p className="text-[var(--text-primary)] text-sm font-medium truncate">{r.video.title}</p>
              {r.matchedPhrase && (
                <p className="text-[var(--text-secondary)] text-xs mt-0.5 truncate">
                  &quot;{r.matchedPhrase.en}&quot;
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
