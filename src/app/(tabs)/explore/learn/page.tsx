'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { AppPage } from '@/components/ui/AppPage'
import expressionClasses from '@/data/expression-classes.json'

type ExpressionClass = (typeof expressionClasses)[number]
type Level = 'ALL' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1'
type Category = 'all' | 'function' | 'grammar' | 'situation' | 'level'

const LEVELS: Level[] = ['ALL', 'A1', 'A2', 'B1', 'B2', 'C1']

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'function', label: '기능' },
  { id: 'grammar', label: '문법' },
  { id: 'situation', label: '상황' },
  { id: 'level', label: '레벨' },
]

const LEVEL_COLORS: Record<string, string> = {
  A1: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/20',
  A2: 'bg-teal-500/15 text-teal-600 border-teal-500/20',
  B1: 'bg-sky-500/15 text-sky-600 border-sky-500/20',
  B2: 'bg-violet-500/15 text-violet-600 border-violet-500/20',
  C1: 'bg-rose-500/15 text-rose-600 border-rose-500/20',
}

export default function LearnPage() {
  const router = useRouter()
  const [activeLevel, setActiveLevel] = useState<Level>('ALL')
  const [activeCategory, setActiveCategory] = useState<Category>('all')

  const filtered = useMemo(() => {
    let result: ExpressionClass[] = [...expressionClasses]

    if (activeLevel !== 'ALL') {
      result = result.filter((c) => c.level === activeLevel)
    }
    if (activeCategory !== 'all') {
      result = result.filter((c) => c.category === activeCategory)
    }

    return result
  }, [activeLevel, activeCategory])

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
      return
    }
    router.replace('/explore', { scroll: false })
  }

  return (
    <AppPage>
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={handleBack}
          className="text-[var(--text-secondary)] transition-transform active:scale-90"
          aria-label="Back"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-5 w-5"
          >
            <path
              fillRule="evenodd"
              d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-text)]">
          LEARN
        </p>
      </div>

      <h1 className="mb-2 text-2xl font-bold text-[var(--text-primary)]">
        표현 학습
      </h1>
      <p className="mb-6 text-sm text-[var(--text-secondary)]">
        {expressionClasses.length}개 클래스 / 레벨과 카테고리별로 학습하세요
      </p>

      {/* Level filter */}
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {LEVELS.map((level) => (
          <button
            key={level}
            onClick={() => setActiveLevel(level)}
            className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeLevel === level
                ? 'bg-[var(--accent-primary)] text-white'
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
            }`}
          >
            {level}
          </button>
        ))}
      </div>

      {/* Category filter */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
              activeCategory === cat.id
                ? 'border-[var(--accent-primary)]/30 bg-[var(--accent-glow)] text-[var(--accent-text)]'
                : 'border-[var(--border-card)] bg-[var(--bg-card)] text-[var(--text-secondary)]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="mb-4 text-xs text-[var(--text-muted)]">
        {filtered.length}개 클래스
      </p>

      {/* Class grid */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((cls, index) => (
          <motion.button
            key={cls.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: {
                delay: Math.min(index * 0.03, 0.3),
                duration: 0.3,
                ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
              },
            }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push(`/explore/learn/${cls.id}`)}
            className="overflow-hidden rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] p-4 text-left shadow-[var(--card-shadow)] transition-colors"
          >
            <div className="mb-3 flex items-center gap-2">
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  LEVEL_COLORS[cls.level] ?? 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                }`}
              >
                {cls.level}
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                {CATEGORIES.find((c) => c.id === cls.category)?.label ?? cls.category}
              </span>
            </div>

            <p className="text-[15px] font-semibold text-[var(--text-primary)]">
              {cls.titleKo}
            </p>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              {cls.title}
            </p>

            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[var(--text-secondary)]">
              {cls.descriptionKo}
            </p>

            <div className="mt-3 flex items-center gap-3 text-[11px] text-[var(--text-muted)]">
              <span>{cls.expressions.length}개 표현</span>
              <span>{cls.videoIds.length}개 영상</span>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] px-6 py-10 text-center shadow-[var(--card-shadow)]">
          <p className="text-sm font-medium text-[var(--text-primary)]">
            해당 조건의 클래스가 없습니다
          </p>
          <p className="mt-2 text-xs text-[var(--text-secondary)]">
            다른 레벨이나 카테고리를 선택해 보세요
          </p>
        </div>
      )}
    </AppPage>
  )
}
