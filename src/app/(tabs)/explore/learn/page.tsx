'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { AppPage } from '@/components/ui/AppPage'
import { PremiumModal } from '@/components/PremiumModal'
import { useLearnAccessStore } from '@/stores/useLearnAccessStore'
import { useOnboardingStore } from '@/stores/useOnboardingStore'
import { useLearnProgressStore } from '@/stores/useLearnProgressStore'
import { useLocaleStore, type SupportedLocale } from '@/stores/useLocaleStore'
import { usePremiumStore } from '@/stores/usePremiumStore'
import expressionClasses from '@/data/expression-classes.json'

type ExpressionClass = (typeof expressionClasses)[number]
type Category = 'all' | 'function' | 'grammar' | 'situation' | 'level'

const TRANSLATIONS: Record<SupportedLocale, {
  catAll: string
  catFunction: string
  catGrammar: string
  catSituation: string
  catLevel: string
  levelDescription: string
  levelClassCount: (level: string, count: number) => string
  expressionCount: (n: number) => string
  videoCount: (n: number) => string
  resumeProgress: (current: number, total: number) => string
  noClassTitle: string
  noClassDescription: string
}> = {
  ko: {
    catAll: '전체',
    catFunction: '기능',
    catGrammar: '문법',
    catSituation: '상황',
    catLevel: '레벨',
    levelDescription: '설정된 레벨에 맞는 클래스만 이어서 학습합니다.',
    levelClassCount: (level, count) => `${level} 레벨 클래스 ${count}개`,
    expressionCount: (n) => `${n}개 표현`,
    videoCount: (n) => `${n}개 영상`,
    resumeProgress: (current, total) => `이어보기 ${current} / ${total}`,
    noClassTitle: '현재 레벨에 맞는 클래스가 없습니다',
    noClassDescription: '설정에서 레벨을 바꾸면 다른 클래스를 볼 수 있습니다.',
  },
  ja: {
    catAll: '全て',
    catFunction: '機能',
    catGrammar: '文法',
    catSituation: '場面',
    catLevel: 'レベル',
    levelDescription: '設定されたレベルに合ったクラスのみ学習します。',
    levelClassCount: (level, count) => `${level}レベル クラス ${count}件`,
    expressionCount: (n) => `${n}件の表現`,
    videoCount: (n) => `${n}件の動画`,
    resumeProgress: (current, total) => `続きから ${current} / ${total}`,
    noClassTitle: '現在のレベルに合うクラスがありません',
    noClassDescription: '設定でレベルを変更すると、他のクラスが表示されます。',
  },
  'zh-TW': {
    catAll: '全部',
    catFunction: '功能',
    catGrammar: '文法',
    catSituation: '情境',
    catLevel: '等級',
    levelDescription: '僅顯示符合目前等級的課程。',
    levelClassCount: (level, count) => `${level} 等級課程 ${count} 個`,
    expressionCount: (n) => `${n} 個表達`,
    videoCount: (n) => `${n} 部影片`,
    resumeProgress: (current, total) => `繼續學習 ${current} / ${total}`,
    noClassTitle: '目前等級沒有對應的課程',
    noClassDescription: '在設定中更改等級即可查看其他課程。',
  },
  vi: {
    catAll: 'Tất cả',
    catFunction: 'Chức năng',
    catGrammar: 'Ngữ pháp',
    catSituation: 'Tình huống',
    catLevel: 'Cấp độ',
    levelDescription: 'Chỉ hiển thị lớp học phù hợp với cấp độ đã chọn.',
    levelClassCount: (level, count) => `Cấp ${level} - ${count} lớp`,
    expressionCount: (n) => `${n} biểu đạt`,
    videoCount: (n) => `${n} video`,
    resumeProgress: (current, total) => `Tiếp tục ${current} / ${total}`,
    noClassTitle: 'Không có lớp học phù hợp với cấp độ hiện tại',
    noClassDescription: 'Thay đổi cấp độ trong cài đặt để xem các lớp khác.',
  },
}

const CATEGORY_IDS: Category[] = ['all', 'function', 'grammar', 'situation', 'level']

function getCategoryLabel(id: Category, tx: (typeof TRANSLATIONS)['ko']): string {
  const map: Record<Category, string> = {
    all: tx.catAll,
    function: tx.catFunction,
    grammar: tx.catGrammar,
    situation: tx.catSituation,
    level: tx.catLevel,
  }
  return map[id]
}

const LEVEL_COLORS: Record<string, string> = {
  A1: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/20',
  A2: 'bg-teal-500/15 text-teal-600 border-teal-500/20',
  B1: 'bg-sky-500/15 text-sky-600 border-sky-500/20',
  B2: 'bg-violet-500/15 text-violet-600 border-violet-500/20',
  C1: 'bg-rose-500/15 text-rose-600 border-rose-500/20',
  C2: 'bg-fuchsia-500/15 text-fuchsia-600 border-fuchsia-500/20',
}

export default function LearnPage() {
  const router = useRouter()
  const currentLevel = useOnboardingStore((s) => s.level)
  const classProgress = useLearnProgressStore((s) => s.classProgress)
  const isPremium = usePremiumStore((s) => s.isPremium)
  const canAccessClassToday = useLearnAccessStore((s) => s.canAccessClassToday)
  const getActiveClassForToday = useLearnAccessStore((s) => s.getActiveClassForToday)
  const hasFreeSessionRemaining = useLearnAccessStore((s) => s.hasFreeSessionRemaining)
  const locale = useLocaleStore((s) => s.locale)
  const [activeCategory, setActiveCategory] = useState<Category>('all')
  const [showPremiumModal, setShowPremiumModal] = useState(false)

  const tx = TRANSLATIONS[locale]
  const activeClassId = getActiveClassForToday()
  const canStartNewSession = hasFreeSessionRemaining(isPremium)

  const learnAccessMessage = useMemo(() => {
    if (isPremium) {
      return locale === 'ko'
        ? 'Premium은 모든 Learn 클래스를 자유롭게 이어볼 수 있습니다.'
        : 'Premium unlocks every Learn class without daily limits.'
    }

    if (activeClassId) {
      const activeClass = expressionClasses.find((entry) => entry.id === activeClassId)
      const activeTitle = activeClass?.titleKo ?? activeClass?.title ?? 'Learn'
      return locale === 'ko'
        ? `오늘은 ${activeTitle} 클래스만 이어볼 수 있습니다. Premium으로 전체 Learn을 열 수 있습니다.`
        : `You can continue only ${activeTitle} today. Upgrade to Premium to unlock every Learn class.`
    }

    return locale === 'ko'
      ? '무료 사용자는 하루 1개의 Learn 클래스를 활성화할 수 있습니다.'
      : 'Free users can activate one Learn class per day.'
  }, [activeClassId, isPremium, locale])

  const filtered = useMemo(() => {
    let result: ExpressionClass[] = expressionClasses.filter(
      (entry) => entry.level === currentLevel,
    )

    if (activeCategory !== 'all') {
      result = result.filter((entry) => entry.category === activeCategory)
    }

    return result
  }, [activeCategory, currentLevel])

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
      return
    }
    router.replace('/explore', { scroll: false })
  }

  return (
    <AppPage>
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

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
            LEVEL_COLORS[currentLevel] ??
            'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
          }`}
        >
          {currentLevel}
        </span>
        <p className="text-sm text-[var(--text-secondary)]">
          {tx.levelDescription}
        </p>
      </div>

      <div className="mb-4 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] px-4 py-3 shadow-[var(--card-shadow)]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-[var(--text-primary)]">
            {locale === 'ko' ? 'Learn 이용 방식' : 'Learn access'}
          </p>
          {!isPremium ? (
            <span className="rounded-full bg-[var(--bg-secondary)] px-2.5 py-1 text-[11px] font-semibold text-[var(--accent-text)]">
              {canStartNewSession
                ? locale === 'ko'
                  ? '오늘 1개 시작 가능'
                  : '1 class available today'
                : locale === 'ko'
                  ? '오늘 세션 사용 완료'
                  : 'Today complete'}
            </span>
          ) : null}
        </div>
        <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">
          {learnAccessMessage}
        </p>
      </div>

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {CATEGORY_IDS.map((id) => (
          <button
            key={id}
            onClick={() => setActiveCategory(id)}
            className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
              activeCategory === id
                ? 'border-[var(--accent-primary)]/30 bg-[var(--accent-glow)] text-[var(--accent-text)]'
                : 'border-[var(--border-card)] bg-[var(--bg-card)] text-[var(--text-secondary)]'
            }`}
          >
            {getCategoryLabel(id, tx)}
          </button>
        ))}
      </div>

      <p className="mb-4 text-xs text-[var(--text-muted)]">
        {tx.levelClassCount(currentLevel, filtered.length)}
      </p>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((entry, index) => (
          <motion.button
            key={entry.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: {
                delay: Math.min(index * 0.03, 0.25),
                duration: 0.28,
                ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
              },
            }}
            whileTap={{ scale: 0.985 }}
            onClick={() => {
              if (!canAccessClassToday(entry.id, isPremium)) {
                setShowPremiumModal(true)
                return
              }

              router.push(`/explore/learn/${entry.id}`)
            }}
            className="overflow-hidden rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] p-4 text-left shadow-[var(--card-shadow)] transition-colors"
          >
            <div className="mb-3 flex items-center gap-2">
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  LEVEL_COLORS[entry.level] ??
                  'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                }`}
              >
                {entry.level}
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                {getCategoryLabel(entry.category as Category, tx)}
              </span>
              {!canAccessClassToday(entry.id, isPremium) ? (
                <span className="rounded-full border border-[var(--border-card)] bg-[var(--bg-secondary)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-muted)]">
                  {locale === 'ko' ? '오늘 잠금' : 'Locked today'}
                </span>
              ) : null}
            </div>

            <p className="text-[15px] font-semibold text-[var(--text-primary)]">
              {entry.titleKo}
            </p>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">{entry.title}</p>

            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[var(--text-secondary)]">
              {entry.descriptionKo}
            </p>

            <div className="mt-3 flex items-center gap-3 text-[11px] text-[var(--text-muted)]">
              <span>{tx.expressionCount(entry.expressions.length)}</span>
              <span>{tx.videoCount(entry.videoIds.length)}</span>
            </div>
            {classProgress[entry.id] && (
              <p className="mt-2 text-[11px] font-medium text-[var(--accent-text)]">
                {tx.resumeProgress(
                  Math.min(classProgress[entry.id].lastIndex + 1, classProgress[entry.id].total),
                  classProgress[entry.id].total,
                )}
              </p>
            )}
          </motion.button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] px-6 py-10 text-center shadow-[var(--card-shadow)]">
          <p className="text-sm font-medium text-[var(--text-primary)]">
            {tx.noClassTitle}
          </p>
          <p className="mt-2 text-xs text-[var(--text-secondary)]">
            {tx.noClassDescription}
          </p>
        </div>
      )}

      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        trigger="learn-limit"
      />
    </AppPage>
  )
}
