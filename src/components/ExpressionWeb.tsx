'use client'

import { useRef, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useLocaleStore } from '@/stores/useLocaleStore'
import { getRelatedExpressions, type RelatedExpression } from '@/lib/expressionWeb'

// ---------------------------------------------------------------------------
// CEFR badge colors (matches PrimingCard)
// ---------------------------------------------------------------------------

function getCefrColor(cefr: string): { bg: string; text: string } {
  const level = cefr.toUpperCase()
  if (level === 'A1' || level === 'A2') {
    return { bg: 'rgba(34, 197, 94, 0.16)', text: '#4ade80' }
  }
  if (level === 'B1' || level === 'B2') {
    return { bg: 'rgba(59, 130, 246, 0.16)', text: '#60a5fa' }
  }
  if (level === 'C1' || level === 'C2') {
    return { bg: 'rgba(168, 85, 247, 0.16)', text: '#c084fc' }
  }
  return { bg: 'rgba(255, 255, 255, 0.08)', text: 'rgba(255, 255, 255, 0.6)' }
}

// ---------------------------------------------------------------------------
// Category labels (localized)
// ---------------------------------------------------------------------------

const CATEGORY_LABELS: Record<string, Record<string, string>> = {
  ko: {
    phrasal_verb: '구동사',
    idiom: '관용구',
    collocation: '연어',
    fixed_expression: '표현',
    discourse_marker: '담화',
    slang: '슬랭',
    hedging: '완곡',
    exclamation: '감탄',
    filler: '필러',
  },
  ja: {
    phrasal_verb: '句動詞',
    idiom: '慣用句',
    collocation: '連語',
    fixed_expression: '表現',
    discourse_marker: '談話',
    slang: 'スラング',
    hedging: '婉曲',
    exclamation: '感嘆',
    filler: 'フィラー',
  },
  'zh-TW': {
    phrasal_verb: '片語動詞',
    idiom: '慣用語',
    collocation: '搭配詞',
    fixed_expression: '表達',
    discourse_marker: '話語',
    slang: '俚語',
    hedging: '委婉語',
    exclamation: '感嘆詞',
    filler: '填充詞',
  },
  vi: {
    phrasal_verb: 'Cụm ĐT',
    idiom: 'Thành ngữ',
    collocation: 'Kết hợp',
    fixed_expression: 'Biểu thức',
    discourse_marker: 'Diễn ngôn',
    slang: 'Tiếng lóng',
    hedging: 'Uyển ngữ',
    exclamation: 'Thán từ',
    filler: 'Từ đệm',
  },
}

const SECTION_TITLE: Record<string, string> = {
  ko: '관련 표현',
  ja: '関連表現',
  'zh-TW': '相關表達',
  vi: 'Lien quan',
}

const VIDEO_LABEL: Record<string, string> = {
  ko: '개 영상',
  ja: '本の動画',
  'zh-TW': '部影片',
  vi: ' video',
}

// ---------------------------------------------------------------------------
// Relation reason labels
// ---------------------------------------------------------------------------

type RelationReason = 'same_root' | 'same_theme' | 'same_category' | 'same_cefr'

const REASON_LABELS: Record<string, Record<RelationReason, string>> = {
  ko: {
    same_root: '같은 동사',
    same_theme: '같은 주제',
    same_category: '같은 유형',
    same_cefr: '같은 레벨',
  },
  ja: {
    same_root: '同じ動詞',
    same_theme: '同じテーマ',
    same_category: '同じ種類',
    same_cefr: '同じレベル',
  },
  'zh-TW': {
    same_root: '同動詞',
    same_theme: '同主題',
    same_category: '同類型',
    same_cefr: '同等級',
  },
  vi: {
    same_root: 'Cung dong tu',
    same_theme: 'Cung chu de',
    same_category: 'Cung loai',
    same_cefr: 'Cung cap do',
  },
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ExpressionWebProps {
  /** The current expression ID to find connections for */
  exprId: string
  /** Max related expressions to show (default 8) */
  limit?: number
  /** Called when user taps a related expression card */
  onSelectExpression?: (exprId: string) => void
}

function RelatedCard({
  item,
  index,
  langKey,
  onTap,
}: {
  item: RelatedExpression
  index: number
  langKey: string
  onTap?: () => void
}) {
  const cefrColor = getCefrColor(item.entry.cefr)
  const categoryLabel = CATEGORY_LABELS[langKey]?.[item.entry.category] ?? item.entry.category
  const videoLabel = VIDEO_LABEL[langKey] ?? VIDEO_LABEL.ko
  const primaryReason = item.reasons[0]
  const reasonLabel = primaryReason
    ? (REASON_LABELS[langKey] ?? REASON_LABELS.ko)[primaryReason]
    : null

  return (
    <motion.button
      type="button"
      onClick={onTap}
      className="flex-shrink-0 rounded-2xl border px-4 py-3 text-left transition-colors"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderColor: 'rgba(255, 255, 255, 0.08)',
        width: 180,
      }}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 400, damping: 30 }}
      whileTap={{ scale: 0.97 }}
    >
      {/* Expression name */}
      <p className="truncate text-[15px] font-bold leading-snug text-white">
        {item.entry.canonical}
      </p>

      {/* Korean meaning */}
      <p
        className="mt-0.5 truncate text-[12px] leading-snug"
        style={{ color: 'rgba(255, 255, 255, 0.5)' }}
      >
        {item.entry.meaning_ko}
      </p>

      {/* Badges row */}
      <div className="mt-2 flex flex-wrap items-center gap-1">
        <span
          className="rounded-full px-1.5 py-[2px] text-[9px] font-bold leading-none uppercase"
          style={{ backgroundColor: cefrColor.bg, color: cefrColor.text }}
        >
          {item.entry.cefr.toUpperCase()}
        </span>
        <span
          className="rounded-full px-1.5 py-[2px] text-[9px] font-semibold leading-none"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.07)', color: 'rgba(255, 255, 255, 0.5)' }}
        >
          {categoryLabel}
        </span>
      </div>

      {/* Bottom row: video count + reason */}
      <div className="mt-2 flex items-center justify-between">
        <span
          className="text-[11px] font-medium"
          style={{ color: 'rgba(255, 255, 255, 0.4)' }}
        >
          {item.videoCount}{videoLabel}
        </span>
        {reasonLabel && (
          <span
            className="text-[10px]"
            style={{ color: 'var(--accent-text, #5eead4)', opacity: 0.7 }}
          >
            {reasonLabel}
          </span>
        )}
      </div>
    </motion.button>
  )
}

export function ExpressionWeb({ exprId, limit = 8, onSelectExpression }: ExpressionWebProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const locale = useLocaleStore((s) => s.locale)
  const langKey = locale === 'zh-TW' || locale === 'vi' || locale === 'ja' ? locale : 'ko'

  const related = useMemo(() => getRelatedExpressions(exprId, limit), [exprId, limit])

  if (related.length === 0) return null

  const sectionTitle = SECTION_TITLE[langKey] ?? SECTION_TITLE.ko

  return (
    <div className="w-full">
      {/* Section header */}
      <p
        className="mb-3 px-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
        style={{ color: 'var(--accent-text, #5eead4)' }}
      >
        {sectionTitle}
      </p>

      {/* Horizontal scroll container */}
      <div
        ref={scrollRef}
        className="flex gap-2.5 overflow-x-auto pb-2"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {related.map((item, index) => (
          <RelatedCard
            key={item.entry.id}
            item={item}
            index={index}
            langKey={langKey}
            onTap={() => onSelectExpression?.(item.entry.id)}
          />
        ))}
      </div>
    </div>
  )
}
