'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { PremiumModal } from '@/components/PremiumModal'
import { AppPage } from '@/components/ui/AppPage'
import { useLearnAccessStore } from '@/stores/useLearnAccessStore'
import { useReplayStore } from '@/stores/useReplayStore'
import type { ReplayClip } from '@/stores/useReplayStore'
import { useLearnProgressStore } from '@/stores/useLearnProgressStore'
import { useFamiliarityStore } from '@/stores/useFamiliarityStore'
import { useOnboardingStore } from '@/stores/useOnboardingStore'
import { useLocaleStore, type SupportedLocale } from '@/stores/useLocaleStore'
import { usePremiumStore } from '@/stores/usePremiumStore'
import expressionClasses from '@/data/expression-classes.json'
import {
  buildClassExpressionClips,
  type ExpressionWithClips,
} from '@/lib/classExpressionClips'
import { getLocalizedMeaning, getLocalizedClassTitle } from '@/lib/localeUtils'

type ExpressionClass = (typeof expressionClasses)[number]

const TRANSLATIONS: Record<SupportedLocale, {
  catFunction: string
  catGrammar: string
  catSituation: string
  catLevel: string
  exprPhrasalVerb: string
  exprIdiom: string
  exprCollocation: string
  exprFixedExpression: string
  exprDiscourseMarker: string
  exprSlang: string
  exprHedging: string
  exprExclamation: string
  exprFiller: string
  clipCount: (n: number) => string
  expressionCount: (n: number) => string
  videoCount: (n: number) => string
  classNotFound: string
  currentLevel: string
  levelLocked: string
  levelMismatch: (classLevel: string) => string
  goBack: string
  goToSettings: string
  resume: string
  fromBeginning: string
  startNow: string
  resumeProgress: (current: number, total: number) => string
  levelBadge: (current: string, classLevel: string) => string
  clipHint: string
  shownClipCount: (shown: number, total: number) => string
  noClips: string
  freeStartHint: string
  freeActiveHint: string
  freeLockedHint: string
}> = {
  ko: {
    catFunction: '기능',
    catGrammar: '문법',
    catSituation: '상황',
    catLevel: '레벨',
    exprPhrasalVerb: '구동사',
    exprIdiom: '관용구',
    exprCollocation: '연어',
    exprFixedExpression: '표현',
    exprDiscourseMarker: '담화',
    exprSlang: '속어',
    exprHedging: '완곡',
    exprExclamation: '감탄',
    exprFiller: '필러',
    clipCount: (n) => `${n}개 클립`,
    expressionCount: (n) => `${n}개 표현`,
    videoCount: (n) => `${n}개 영상`,
    classNotFound: '클래스를 찾을 수 없습니다',
    currentLevel: '현재 학습 레벨',
    levelLocked: 'Learn은 설정된 레벨 클래스만 열 수 있습니다.',
    levelMismatch: (classLevel) => `이 클래스는 ${classLevel} 레벨입니다. 설정에서 레벨을 바꾸면 다시 들어올 수 있습니다.`,
    goBack: '뒤로가기',
    goToSettings: '설정으로 이동',
    resume: '이어보기',
    fromBeginning: '처음부터',
    startNow: '바로 시작',
    resumeProgress: (current, total) => `이어보기 ${current} / ${total}`,
    levelBadge: (current, classLevel) => `현재 설정 ${current} · 이 클래스 ${classLevel}`,
    clipHint: '클립을 누르면 해당 구간이 바로 재생됩니다.',
    shownClipCount: (shown, total) => `${shown} / ${total}개 클립`,
    noClips: '이 클래스에 연결된 클립이 아직 없습니다.',
    freeStartHint: '이 클래스를 시작하면 오늘의 Learn 세션으로 고정됩니다.',
    freeActiveHint: '오늘 활성화한 Learn 클래스입니다. 순서대로 이어보세요.',
    freeLockedHint: '오늘은 다른 Learn 클래스를 이미 시작했습니다. Premium으로 전체 Learn을 열 수 있습니다.',
  },
  ja: {
    catFunction: '機能',
    catGrammar: '文法',
    catSituation: '場面',
    catLevel: 'レベル',
    exprPhrasalVerb: '句動詞',
    exprIdiom: '慣用句',
    exprCollocation: '連語',
    exprFixedExpression: '表現',
    exprDiscourseMarker: '談話',
    exprSlang: 'スラング',
    exprHedging: '婉曲',
    exprExclamation: '感嘆',
    exprFiller: 'フィラー',
    clipCount: (n) => `${n}件のクリップ`,
    expressionCount: (n) => `${n}件の表現`,
    videoCount: (n) => `${n}件の動画`,
    classNotFound: 'クラスが見つかりません',
    currentLevel: '現在の学習レベル',
    levelLocked: 'Learnは設定されたレベルのクラスのみ開けます。',
    levelMismatch: (classLevel) => `このクラスは${classLevel}レベルです。設定でレベルを変更すると再度アクセスできます。`,
    goBack: '戻る',
    goToSettings: '設定へ移動',
    resume: '続きから',
    fromBeginning: '最初から',
    startNow: '今すぐ開始',
    resumeProgress: (current, total) => `続きから ${current} / ${total}`,
    levelBadge: (current, classLevel) => `現在の設定 ${current} · このクラス ${classLevel}`,
    clipHint: 'クリップをタップすると該当区間が再生されます。',
    shownClipCount: (shown, total) => `${shown} / ${total} 件のクリップ`,
    noClips: 'このクラスにはまだクリップがありません。',
    freeStartHint: 'このクラスを開始すると、本日のLearnセッションとして固定されます。',
    freeActiveHint: '本日有効化したLearnクラスです。順番に学習しましょう。',
    freeLockedHint: '本日は別のLearnクラスを既に開始しています。Premiumで全てのLearnを開放できます。',
  },
  'zh-TW': {
    catFunction: '功能',
    catGrammar: '文法',
    catSituation: '情境',
    catLevel: '等級',
    exprPhrasalVerb: '片語動詞',
    exprIdiom: '慣用語',
    exprCollocation: '搭配詞',
    exprFixedExpression: '表達',
    exprDiscourseMarker: '話語',
    exprSlang: '俚語',
    exprHedging: '委婉',
    exprExclamation: '感嘆',
    exprFiller: '填詞',
    clipCount: (n) => `${n} 個片段`,
    expressionCount: (n) => `${n} 個表達`,
    videoCount: (n) => `${n} 部影片`,
    classNotFound: '找不到該課程',
    currentLevel: '目前學習等級',
    levelLocked: 'Learn 僅開放符合目前等級的課程。',
    levelMismatch: (classLevel) => `此課程為 ${classLevel} 等級。請在設定中更改等級後再進入。`,
    goBack: '返回',
    goToSettings: '前往設定',
    resume: '繼續學習',
    fromBeginning: '從頭開始',
    startNow: '立即開始',
    resumeProgress: (current, total) => `繼續學習 ${current} / ${total}`,
    levelBadge: (current, classLevel) => `目前設定 ${current} · 此課程 ${classLevel}`,
    clipHint: '點擊片段即可播放對應段落。',
    shownClipCount: (shown, total) => `${shown} / ${total} 個片段`,
    noClips: '此課程尚無片段。',
    freeStartHint: '開始此課程後，將成為今天的 Learn 課程。',
    freeActiveHint: '今天已啟用的 Learn 課程，請按順序繼續學習。',
    freeLockedHint: '今天已開始其他 Learn 課程。升級 Premium 可開放所有課程。',
  },
  vi: {
    catFunction: 'Chức năng',
    catGrammar: 'Ngữ pháp',
    catSituation: 'Tình huống',
    catLevel: 'Cấp độ',
    exprPhrasalVerb: 'Cụm động từ',
    exprIdiom: 'Thành ngữ',
    exprCollocation: 'Kết hợp từ',
    exprFixedExpression: 'Biểu đạt',
    exprDiscourseMarker: 'Liên kết',
    exprSlang: 'Tiếng lóng',
    exprHedging: 'Uyển chuyển',
    exprExclamation: 'Cảm thán',
    exprFiller: 'Từ đệm',
    clipCount: (n) => `${n} clip`,
    expressionCount: (n) => `${n} biểu đạt`,
    videoCount: (n) => `${n} video`,
    classNotFound: 'Không tìm thấy lớp học',
    currentLevel: 'Cấp độ học hiện tại',
    levelLocked: 'Learn chỉ mở các lớp phù hợp với cấp độ đã chọn.',
    levelMismatch: (classLevel) => `Lớp này ở cấp ${classLevel}. Thay đổi cấp độ trong cài đặt để truy cập lại.`,
    goBack: 'Quay lại',
    goToSettings: 'Đi tới cài đặt',
    resume: 'Tiếp tục',
    fromBeginning: 'Từ đầu',
    startNow: 'Bắt đầu ngay',
    resumeProgress: (current, total) => `Tiếp tục ${current} / ${total}`,
    levelBadge: (current, classLevel) => `Cài đặt hiện tại ${current} · Lớp này ${classLevel}`,
    clipHint: 'Nhấn clip để phát đoạn tương ứng.',
    shownClipCount: (shown, total) => `${shown} / ${total} clip`,
    noClips: 'Lớp này chưa có clip nào.',
    freeStartHint: 'Bat dau lop nay se co dinh thanh phien Learn hom nay.',
    freeActiveHint: 'Lop Learn da kich hoat hom nay. Hay hoc theo thu tu.',
    freeLockedHint: 'Hom nay ban da bat dau lop Learn khac. Nang cap Premium de mo khoa tat ca.',
  },
}

type Tx = (typeof TRANSLATIONS)['ko']

function getCategoryLabel(category: string, tx: Tx): string {
  const map: Record<string, string> = {
    function: tx.catFunction,
    grammar: tx.catGrammar,
    situation: tx.catSituation,
    level: tx.catLevel,
  }
  return map[category] ?? category
}

function getExprCategoryLabel(category: string, tx: Tx): string {
  const map: Record<string, string> = {
    phrasal_verb: tx.exprPhrasalVerb,
    idiom: tx.exprIdiom,
    collocation: tx.exprCollocation,
    fixed_expression: tx.exprFixedExpression,
    discourse_marker: tx.exprDiscourseMarker,
    slang: tx.exprSlang,
    hedging: tx.exprHedging,
    exclamation: tx.exprExclamation,
    filler: tx.exprFiller,
  }
  return map[category] ?? category
}

const LEVEL_COLORS: Record<string, string> = {
  A1: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  A2: 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/20',
  B1: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/20',
  B2: 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/20',
  C1: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20',
  C2: 'bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/20',
}

const MAX_CLIPS_PER_EXPRESSION = 20

function pickRepresentativeClips<T>(clips: T[], limit: number): T[] {
  if (clips.length <= limit) return clips
  if (limit <= 1) return clips.slice(0, 1)

  const picked = new Set<number>()
  const sampled: T[] = []

  for (let slot = 0; slot < limit; slot += 1) {
    let index = Math.round((slot * (clips.length - 1)) / (limit - 1))

    while (picked.has(index) && index < clips.length - 1) {
      index += 1
    }

    while (picked.has(index) && index > 0) {
      index -= 1
    }

    if (picked.has(index)) continue
    picked.add(index)
    sampled.push(clips[index])
  }

  return sampled
}

function getCefrBadgeStyle(cefr: string): { bg: string; text: string } {
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

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
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
  )
}

function ClipCard({
  youtubeId,
  videoTitle,
  sentenceEn,
  isPlaying,
  disabled = false,
  onPlay,
  onLockedAttempt,
}: {
  youtubeId: string
  videoTitle: string
  sentenceEn: string
  isPlaying: boolean
  disabled?: boolean
  onPlay: () => void
  onLockedAttempt?: () => void
}) {
  return (
    <button
      type="button"
      onClick={() => {
        if (disabled) {
          onLockedAttempt?.()
          return
        }
        onPlay()
      }}
      aria-disabled={disabled}
      className={`group flex w-[172px] shrink-0 flex-col overflow-hidden rounded-xl border transition-all ${
        disabled ? 'cursor-not-allowed' : 'active:scale-[0.97]'
      }`}
      style={{
        borderColor: isPlaying ? 'var(--accent-primary)' : 'var(--border-card)',
        backgroundColor: isPlaying ? 'var(--accent-glow)' : 'var(--bg-card)',
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <div className="relative aspect-video w-full overflow-hidden">
        <Image
          src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
          alt={videoTitle}
          fill
          sizes="172px"
          className="object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{
              backgroundColor: isPlaying
                ? 'var(--accent-primary)'
                : 'rgba(0, 0, 0, 0.6)',
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="white"
              className="ml-0.5 h-4 w-4"
            >
              <path d="M3 3.732a1.5 1.5 0 0 1 2.305-1.265l6.706 4.267a1.5 1.5 0 0 1 0 2.531l-6.706 4.268A1.5 1.5 0 0 1 3 12.267V3.732Z" />
            </svg>
          </div>
        </div>
        {isPlaying && (
          <div
            className="absolute bottom-0 left-0 right-0 h-0.5"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          />
        )}
        {disabled ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-semibold text-white">
              Next
            </span>
          </div>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col px-2.5 py-1.5">
        <p className="mb-1 line-clamp-1 text-[10px] font-medium text-[var(--text-muted)]">
          {videoTitle}
        </p>
        <p className="line-clamp-2 text-[11px] leading-snug text-[var(--text-primary)]">
          {sentenceEn}
        </p>
      </div>
    </button>
  )
}

function ExpressionSection({
  data,
  index,
  total,
  replayQueue,
  queueIndexByKey,
  isQueueIndexPlayable,
  onLockedAttempt,
  tx,
}: {
  data: ExpressionWithClips & { totalClipCount: number }
  index: number
  total: number
  replayQueue: ReplayClip[]
  queueIndexByKey: Map<string, number>
  isQueueIndexPlayable: (index: number) => boolean
  onLockedAttempt: (blockedByPremium: boolean) => void
  tx: Tx
}) {
  const playQueue = useReplayStore((s) => s.playQueue)
  const currentClip = useReplayStore((s) => s.clip)
  const isFamiliar = useFamiliarityStore((s) => s.isFamiliar)
  const getFamiliarCount = useFamiliarityStore((s) => s.getFamiliarCount)
  const locale = useLocaleStore((s) => s.locale)

  const { entry, clips } = data
  const cefrStyle = getCefrBadgeStyle(entry.cefr)
  const categoryLabel = getExprCategoryLabel(entry.category, tx)
  const familiar = isFamiliar(entry.id)
  const familiarCount = getFamiliarCount(entry.id)

  const handlePlayClip = useCallback(
    (clip: (typeof clips)[number]) => {
      const key = `${clip.youtubeId}:${clip.sentenceIdx}:${entry.canonical}`
      const queueIndex = queueIndexByKey.get(key)
      if (queueIndex === undefined || !isQueueIndexPlayable(queueIndex)) {
        onLockedAttempt(false)
        return
      }
      playQueue(replayQueue, queueIndex)
    },
    [entry.canonical, isQueueIndexPlayable, onLockedAttempt, playQueue, queueIndexByKey, replayQueue],
  )

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.25), duration: 0.32 }}
      className="mb-4"
    >
      <div className="mb-3 flex items-center gap-3">
        <span className="text-xs font-medium text-[var(--text-muted)]">
          {index + 1}/{total}
        </span>
        <div className="h-px flex-1 bg-[var(--border-card)]" />
      </div>

      <div
        className="relative mb-2 rounded-xl border p-3"
        style={{
          borderColor: 'var(--border-card)',
          backgroundColor: 'var(--bg-card)',
        }}
      >
        <div className="absolute right-4 top-4 flex items-center gap-1">
          {familiar ? (
            <span
              className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{
                backgroundColor: 'rgba(34, 197, 94, 0.12)',
                color: '#4ade80',
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="h-3 w-3"
              >
                <path
                  fillRule="evenodd"
                  d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
                  clipRule="evenodd"
                />
              </svg>
              familiar
            </span>
          ) : (
            <div className="flex items-center gap-[3px]">
              {[0, 1, 2].map((step) => (
                <span
                  key={step}
                  className="inline-block h-[5px] w-[5px] rounded-full"
                  style={{
                    backgroundColor:
                      step < familiarCount
                        ? 'var(--accent-text, #5eead4)'
                        : 'var(--text-muted)',
                    opacity: step < familiarCount ? 1 : 0.3,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <h3 className="pr-20 text-[15px] font-bold text-[var(--text-primary)]">
          {entry.canonical}
        </h3>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          {getLocalizedMeaning(entry as { meaning_ko?: string; meaning_ja?: string; meaning_zhTW?: string; meaning_vi?: string }, locale)}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span
            className="rounded-full px-2 py-[3px] text-[10px] font-bold uppercase leading-none"
            style={{ backgroundColor: cefrStyle.bg, color: cefrStyle.text }}
          >
            {entry.cefr.toUpperCase()}
          </span>
          <span
            className="rounded-full border px-2 py-[3px] text-[10px] font-medium leading-none"
            style={{
              borderColor: 'var(--border-card)',
              color: 'var(--text-muted)',
            }}
          >
            {categoryLabel}
          </span>
          <span className="text-[10px] text-[var(--text-muted)]">
            {data.totalClipCount > clips.length
              ? tx.shownClipCount(clips.length, data.totalClipCount)
              : tx.clipCount(data.totalClipCount)}
          </span>
        </div>
      </div>

      <div
        className="no-scrollbar flex gap-2 overflow-x-auto pb-1"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {clips.map((clip, clipIndex) => {
          const isPlaying =
            currentClip?.videoId === clip.youtubeId &&
            currentClip?.sentenceIdx === clip.sentenceIdx &&
            currentClip?.expressionText === entry.canonical

          return (
            <div
              key={`${clip.youtubeId}-${clip.sentenceIdx}-${clipIndex}`}
              style={{ scrollSnapAlign: 'start' }}
            >
              {(() => {
                const queueKey = `${clip.youtubeId}:${clip.sentenceIdx}:${entry.canonical}`
                const queueIndex = queueIndexByKey.get(queueKey)
                const disabled = queueIndex === undefined || !isQueueIndexPlayable(queueIndex)

                return (
              <ClipCard
                youtubeId={clip.youtubeId}
                videoTitle={clip.videoTitle}
                sentenceEn={clip.sentenceEn}
                isPlaying={isPlaying}
                disabled={disabled}
                onPlay={() => handlePlayClip(clip)}
                onLockedAttempt={() => onLockedAttempt(true)}
              />
                )
              })()}
            </div>
          )
        })}
      </div>
    </motion.section>
  )
}

export default function ClassDetailPage() {
  const params = useParams()
  const router = useRouter()
  const classId = params.classId as string
  const currentLevel = useOnboardingStore((s) => s.level)
  const isPremium = usePremiumStore((s) => s.isPremium)
  const canAccessClassToday = useLearnAccessStore((s) => s.canAccessClassToday)
  const activateClassForToday = useLearnAccessStore((s) => s.activateClassForToday)
  const hasFreeSessionRemaining = useLearnAccessStore((s) => s.hasFreeSessionRemaining)
  const playQueue = useReplayStore((s) => s.playQueue)
  const replayClip = useReplayStore((s) => s.clip)
  const replayQueueIndex = useReplayStore((s) => s.queueIndex)
  const savedProgress = useLearnProgressStore((s) => s.classProgress[classId])
  const saveClassProgress = useLearnProgressStore((s) => s.saveClassProgress)
  const clearClassProgress = useLearnProgressStore((s) => s.clearClassProgress)
  const locale = useLocaleStore((s) => s.locale)
  const [showPremiumModal, setShowPremiumModal] = useState(false)

  const tx = TRANSLATIONS[locale]

  const cls: ExpressionClass | undefined = useMemo(
    () => expressionClasses.find((entry) => entry.id === classId),
    [classId],
  )

  const [expressionDataState, setExpressionDataState] = useState<{
    classId: string | null
    data: (ExpressionWithClips & { totalClipCount: number })[]
  }>({ classId: null, data: [] })
  useEffect(() => {
    if (!cls) return
    let cancelled = false
    buildClassExpressionClips(cls.expressions, cls.videoIds).then((sections) => {
      if (cancelled) return
      setExpressionDataState({
        classId,
        data: sections.map((section) => ({
          ...section,
          totalClipCount: section.clips.length,
          clips: pickRepresentativeClips(section.clips, MAX_CLIPS_PER_EXPRESSION),
        })),
      })
    }).catch(() => {
      if (cancelled) return
      setExpressionDataState({ classId, data: [] })
    })
    return () => { cancelled = true }
  }, [classId, cls])

  const expressionData = useMemo(
    () => (expressionDataState.classId === classId ? expressionDataState.data : []),
    [classId, expressionDataState.classId, expressionDataState.data],
  )
  const clipsLoading = Boolean(cls) && expressionDataState.classId !== classId

  const replayQueue = useMemo<ReplayClip[]>(
    () =>
      expressionData.flatMap((section) =>
        section.clips.map((clip) => ({
          videoId: clip.youtubeId,
          start: clip.start,
          end: clip.end,
          contextId: classId,
          expressionText: section.entry.canonical,
          sentenceEn: clip.sentenceEn,
          sentenceKo: clip.sentenceKo,
          videoTitle: clip.videoTitle,
          sentenceIdx: clip.sentenceIdx,
          source: 'learn',
        })),
      ),
    [classId, expressionData],
  )

  const resumeIndex = savedProgress
    ? Math.min(savedProgress.lastIndex, Math.max(0, replayQueue.length - 1))
    : 0
  const hasResume = Boolean(savedProgress && replayQueue.length > 0 && resumeIndex > 0)
  const isLevelMismatch = cls ? cls.level !== currentLevel : false
  const canUseClassToday = canAccessClassToday(classId, isPremium)
  const hasSessionRemaining = hasFreeSessionRemaining(isPremium)
  const unlockedIndex = isPremium
    ? Math.max(0, replayQueue.length - 1)
    : Math.min((savedProgress?.lastIndex ?? -1) + 1, Math.max(0, replayQueue.length - 1))
  const playableReplayQueue = useMemo(
    () => (isPremium ? replayQueue : replayQueue.slice(0, unlockedIndex + 1)),
    [isPremium, replayQueue, unlockedIndex],
  )

  const queueIndexByKey = useMemo(() => {
    const map = new Map<string, number>()
    playableReplayQueue.forEach((clip, index) => {
      map.set(`${clip.videoId}:${clip.sentenceIdx ?? -1}:${clip.expressionText ?? ''}`, index)
    })
    return map
  }, [playableReplayQueue])

  const isQueueIndexPlayable = useCallback(
    (index: number) => {
      if (!canUseClassToday) return false
      if (isPremium) return true
      return index <= unlockedIndex
    },
    [canUseClassToday, isPremium, unlockedIndex],
  )

  const beginLearnPlayback = useCallback(
    (startIndex: number) => {
      if (playableReplayQueue.length === 0) return

      if (!canUseClassToday) {
        setShowPremiumModal(true)
        return
      }

      if (!isPremium) {
        activateClassForToday(classId)
      }

      const safeStartIndex = Math.max(0, Math.min(startIndex, playableReplayQueue.length - 1))
      playQueue(playableReplayQueue, safeStartIndex)
    },
    [
      activateClassForToday,
      canUseClassToday,
      classId,
      isPremium,
      playQueue,
      playableReplayQueue,
    ],
  )

  const handleLockedAttempt = useCallback(
    (blockedByPremium: boolean) => {
      if (blockedByPremium) {
        setShowPremiumModal(true)
      }
    },
    [],
  )

  const handleBack = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
      return
    }
    router.replace('/explore/learn', { scroll: false })
  }, [router])

  useEffect(() => {
    if (!replayClip || replayClip.source !== 'learn' || replayClip.contextId !== classId) {
      return
    }

    if (replayQueue.length === 0) return

    saveClassProgress(classId, replayQueueIndex, replayQueue.length)
  }, [classId, replayClip, replayQueue.length, replayQueueIndex, saveClassProgress])

  if (!cls) {
    return (
      <AppPage>
        <div className="flex items-center gap-3">
          <BackButton onClick={handleBack} />
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-text)]">
            LEARN
          </p>
        </div>
        <div className="mt-10 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] px-6 py-10 text-center shadow-[var(--card-shadow)]">
          <p className="text-sm font-medium text-[var(--text-primary)]">
            {tx.classNotFound}
          </p>
        </div>
      </AppPage>
    )
  }

  if (isLevelMismatch) {
    return (
      <AppPage>
        <div className="mb-6 flex items-center gap-3">
          <BackButton onClick={handleBack} />
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-text)]">
            LEARN
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] px-6 py-8 shadow-[var(--card-shadow)]">
          <div className="mb-3 flex items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                LEVEL_COLORS[currentLevel] ??
                'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
              }`}
            >
              {currentLevel}
            </span>
            <span className="text-xs text-[var(--text-muted)]">{tx.currentLevel}</span>
          </div>

          <p className="text-base font-semibold text-[var(--text-primary)]">
            {tx.levelLocked}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
            {tx.levelMismatch(cls?.level ?? '')}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              onClick={handleBack}
              className="rounded-xl border border-[var(--border-card)] bg-[var(--bg-secondary)] px-4 py-2 text-sm font-medium text-[var(--text-primary)]"
            >
              {tx.goBack}
            </button>
            <button
              onClick={() => router.push('/profile')}
              className="rounded-xl bg-[var(--accent-primary)] px-4 py-2 text-sm font-semibold text-white"
            >
              {tx.goToSettings}
            </button>
          </div>
        </div>
      </AppPage>
    )
  }

  return (
    <AppPage>
      <div className="mb-5 flex items-center gap-3">
        <BackButton onClick={handleBack} />
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-text)]">
          LEARN
        </p>
      </div>

      <div className="mb-4 rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] px-4 py-3 shadow-[var(--card-shadow)]">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              LEVEL_COLORS[cls.level] ??
              'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
            }`}
          >
            {cls.level}
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
            {getCategoryLabel(cls.category, tx)}
          </span>
          </div>
          {replayQueue.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {hasResume && (
                <button
                  type="button"
                  onClick={() => beginLearnPlayback(resumeIndex)}
                  className="rounded-full bg-[var(--accent-primary)] px-3 py-1.5 text-[11px] font-semibold text-white"
                >
                  {tx.resume}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  clearClassProgress(classId)
                  beginLearnPlayback(0)
                }}
                className="rounded-full border border-[var(--border-card)] bg-[var(--bg-secondary)] px-3 py-1.5 text-[11px] font-semibold text-[var(--text-primary)]"
              >
                {hasResume ? tx.fromBeginning : tx.startNow}
              </button>
            </div>
          )}
        </div>

        <h1 className="text-lg font-bold text-[var(--text-primary)]">{getLocalizedClassTitle(cls as Parameters<typeof getLocalizedClassTitle>[0], locale)}</h1>
        <p className="mt-1 text-xs text-[var(--text-muted)]">{cls.title}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-[var(--text-muted)]">
          <span>{tx.expressionCount(expressionData.length)}</span>
          <span>{tx.videoCount(cls.videoIds.length)}</span>
          {isLevelMismatch && (
            <span className="rounded-full border border-[var(--border-card)] bg-[var(--bg-secondary)] px-2 py-0.5 font-medium text-[var(--accent-text)]">
              {tx.levelBadge(currentLevel, cls.level)}
            </span>
          )}
          {savedProgress && (
            <span>
              {tx.resumeProgress(Math.min(savedProgress.lastIndex + 1, replayQueue.length), replayQueue.length)}
            </span>
          )}
          <span>{tx.clipHint}</span>
        </div>
        {!isPremium ? (
          <div className="mt-3 rounded-xl border border-[var(--border-card)] bg-[var(--bg-secondary)] px-3 py-2 text-[11px] leading-relaxed text-[var(--text-secondary)]">
            {canUseClassToday
              ? hasSessionRemaining
                ? tx.freeStartHint
                : tx.freeActiveHint
              : tx.freeLockedHint}
          </div>
        ) : null}
      </div>

      {expressionData.map((data, index) => (
        <ExpressionSection
          key={data.entry.id}
          data={data}
          index={index}
          total={expressionData.length}
          replayQueue={playableReplayQueue}
          queueIndexByKey={queueIndexByKey}
          isQueueIndexPlayable={isQueueIndexPlayable}
          onLockedAttempt={() => handleLockedAttempt(!canUseClassToday)}
          tx={tx}
        />
      ))}

      {clipsLoading && (
        <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] px-6 py-10 text-center">
          <div className="mx-auto h-3 w-28 animate-pulse rounded-full bg-[var(--bg-secondary)]" />
        </div>
      )}

      {!clipsLoading && expressionData.length === 0 && (
        <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] px-6 py-10 text-center">
          <p className="text-sm text-[var(--text-secondary)]">
            {tx.noClips}
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
