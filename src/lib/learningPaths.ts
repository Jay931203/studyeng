/**
 * learningPaths.ts
 *
 * Auto-generates curated learning paths from expression clusters.
 * A path is a sequence of 5-10 videos that teach related expressions together.
 *
 * Path types:
 *   1. Root verb paths: "Phrasal Verbs with 'break'" — videos with break down/up/out/in
 *   2. Theme paths: "Agreeing & Disagreeing" — expressions sharing a theme
 *   3. Category paths: "Essential Idioms (B1)" — expressions of same category + level
 */

import type { CefrLevel } from '@/types/level'
import type { ExpressionEntry } from './expressionLookup'
import {
  getAllExpressionEntries,
  getVideosForExpression,
} from './expressionWeb'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LearningPath {
  id: string
  title: string
  titleKo: string
  description: string
  descriptionKo: string
  expressions: string[]
  videoIds: string[]
  level: CefrLevel
  type: 'root_verb' | 'theme' | 'category'
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CEFR_ORDER_MAP: Record<string, number> = { A1: 0, A2: 1, B1: 2, B2: 3, C1: 4, C2: 5 }

/** Determine the median CEFR level of a set of expressions */
function medianCefr(exprs: ExpressionEntry[]): CefrLevel {
  if (exprs.length === 0) return 'A1'
  const levels = exprs.map((e) => CEFR_ORDER_MAP[e.cefr.toUpperCase()] ?? 0).sort((a, b) => a - b)
  const mid = Math.floor(levels.length / 2)
  const midVal = levels[mid]
  const cefrLevels: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
  return cefrLevels[midVal] ?? 'A1'
}

/** Capitalize first letter */
function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Collect unique video IDs for a set of expression IDs, capped at maxVideos */
function collectVideos(exprIds: string[], maxVideos: number): string[] {
  const videoSet = new Set<string>()
  // Prioritize expressions that appear in fewer videos (more specific)
  const exprsByVideoCount = exprIds
    .map((id) => ({ id, videos: getVideosForExpression(id) }))
    .sort((a, b) => a.videos.length - b.videos.length)

  for (const { videos } of exprsByVideoCount) {
    for (const vid of videos) {
      videoSet.add(vid)
      if (videoSet.size >= maxVideos) return Array.from(videoSet)
    }
  }
  return Array.from(videoSet)
}

// ---------------------------------------------------------------------------
// Korean labels for path generation
// ---------------------------------------------------------------------------

const ROOT_VERB_KO: Record<string, string> = {
  go: 'go', come: 'come', take: 'take', put: 'put', get: 'get',
  run: 'run', pull: 'pull', cut: 'cut', fall: 'fall', let: 'let',
  call: 'call', play: 'play', look: 'look', keep: 'keep', turn: 'turn',
  break: 'break', bring: 'bring', hold: 'hold', set: 'set', pick: 'pick',
  make: 'make', give: 'give', work: 'work', shut: 'shut', throw: 'throw',
  hang: 'hang', blow: 'blow', stand: 'stand', check: 'check', back: 'back',
}

const THEME_KO: Record<string, string> = {
  conversation: '대화',
  academic: '학문',
  daily_life: '일상',
  social: '소셜',
  internet: '인터넷',
  business: '비즈니스',
  work: '직장',
  politics: '정치',
  conflict: '갈등',
  general: '일반',
  relationships: '관계',
  communication: '소통',
  emotion: '감정',
  emotions: '감정',
  body: '신체',
  surprise: '놀라움',
  money: '돈',
  law: '법률',
  writing: '글쓰기',
  health: '건강',
  opinion: '의견',
  frustration: '좌절',
  animal: '동물',
  food: '음식',
  dating: '연애',
  time: '시간',
  sports: '스포츠',
  movement: '이동',
  education: '교육',
  hygiene: '위생',
  daily_routine: '일과',
  weather: '날씨',
}

const CATEGORY_KO: Record<string, string> = {
  phrasal_verb: '구동사',
  idiom: '관용구',
  collocation: '연어',
  fixed_expression: '고정 표현',
  discourse_marker: '담화 표지',
  slang: '슬랭',
  hedging: '완곡 표현',
  exclamation: '감탄사',
}

const CATEGORY_EN: Record<string, string> = {
  phrasal_verb: 'Phrasal Verbs',
  idiom: 'Idioms',
  collocation: 'Collocations',
  fixed_expression: 'Fixed Expressions',
  discourse_marker: 'Discourse Markers',
  slang: 'Slang',
  hedging: 'Hedging',
  exclamation: 'Exclamations',
}

const CEFR_KO: Record<string, string> = {
  A1: '입문', A2: '초급', B1: '중급', B2: '중상급', C1: '고급', C2: '마스터',
}

// ---------------------------------------------------------------------------
// Path generators
// ---------------------------------------------------------------------------

const MIN_EXPRESSIONS = 3
const MIN_VIDEOS = 3
const MAX_VIDEOS = 10

function generateRootVerbPaths(entries: Record<string, ExpressionEntry>): LearningPath[] {
  const rootGroups = new Map<string, ExpressionEntry[]>()

  for (const entry of Object.values(entries)) {
    if (entry.category !== 'phrasal_verb') continue
    const parts = entry.canonical.toLowerCase().split(/\s+/)
    if (parts.length < 2) continue
    const root = parts[0]
    if (root.length < 2) continue

    const group = rootGroups.get(root)
    if (group) {
      group.push(entry)
    } else {
      rootGroups.set(root, [entry])
    }
  }

  const paths: LearningPath[] = []

  for (const [root, exprs] of rootGroups) {
    if (exprs.length < MIN_EXPRESSIONS) continue

    // Only include expressions that actually appear in videos
    const withVideos = exprs.filter((e) => getVideosForExpression(e.id).length > 0)
    if (withVideos.length < MIN_EXPRESSIONS) continue

    const exprIds = withVideos.map((e) => e.id)
    const videoIds = collectVideos(exprIds, MAX_VIDEOS)
    if (videoIds.length < MIN_VIDEOS) continue

    const level = medianCefr(withVideos)
    const rootLabel = ROOT_VERB_KO[root] ?? root

    paths.push({
      id: `root-${root}`,
      title: `Phrasal Verbs with "${capitalize(root)}"`,
      titleKo: `"${rootLabel}" 구동사 모음`,
      description: `${withVideos.length} phrasal verbs using "${root}" across ${videoIds.length} videos`,
      descriptionKo: `"${rootLabel}"을 사용한 ${withVideos.length}개 구동사, ${videoIds.length}개 영상`,
      expressions: exprIds,
      videoIds,
      level,
      type: 'root_verb',
    })
  }

  // Sort by number of expressions (richer paths first)
  paths.sort((a, b) => b.expressions.length - a.expressions.length)
  return paths
}

function generateThemePaths(entries: Record<string, ExpressionEntry>): LearningPath[] {
  const themeGroups = new Map<string, ExpressionEntry[]>()

  for (const entry of Object.values(entries)) {
    for (const theme of entry.theme ?? []) {
      const group = themeGroups.get(theme)
      if (group) {
        group.push(entry)
      } else {
        themeGroups.set(theme, [entry])
      }
    }
  }

  const paths: LearningPath[] = []

  for (const [theme, allExprs] of themeGroups) {
    // Group by CEFR to create level-appropriate paths
    const byLevel = new Map<string, ExpressionEntry[]>()
    for (const expr of allExprs) {
      const cefr = expr.cefr.toUpperCase()
      // Bucket into broader ranges: A (A1+A2), B (B1+B2), C (C1+C2)
      const bucket = cefr.startsWith('A') ? 'A' : cefr.startsWith('B') ? 'B' : 'C'
      const group = byLevel.get(bucket)
      if (group) {
        group.push(expr)
      } else {
        byLevel.set(bucket, [expr])
      }
    }

    for (const [bucket, exprs] of byLevel) {
      const withVideos = exprs.filter((e) => getVideosForExpression(e.id).length > 0)
      if (withVideos.length < MIN_EXPRESSIONS) continue

      // Limit expressions to keep paths focused
      const selected = withVideos.slice(0, 12)
      const exprIds = selected.map((e) => e.id)
      const videoIds = collectVideos(exprIds, MAX_VIDEOS)
      if (videoIds.length < MIN_VIDEOS) continue

      const level = medianCefr(selected)
      const themeKo = THEME_KO[theme] ?? theme
      const levelKo = CEFR_KO[level] ?? level

      paths.push({
        id: `theme-${theme}-${bucket}`,
        title: `${capitalize(theme.replace(/_/g, ' '))} (${level})`,
        titleKo: `${themeKo} 표현 (${levelKo})`,
        description: `${selected.length} expressions about ${theme.replace(/_/g, ' ')} at ${level} level`,
        descriptionKo: `${themeKo} 관련 ${selected.length}개 표현 (${levelKo} 수준)`,
        expressions: exprIds,
        videoIds,
        level,
        type: 'theme',
      })
    }
  }

  paths.sort((a, b) => b.expressions.length - a.expressions.length)
  return paths
}

function generateCategoryPaths(entries: Record<string, ExpressionEntry>): LearningPath[] {
  const groups = new Map<string, ExpressionEntry[]>()

  for (const entry of Object.values(entries)) {
    // Skip fillers — not interesting enough for paths
    if (entry.category === 'filler') continue

    const key = `${entry.category}-${entry.cefr.toUpperCase()}`
    const group = groups.get(key)
    if (group) {
      group.push(entry)
    } else {
      groups.set(key, [entry])
    }
  }

  const paths: LearningPath[] = []

  for (const [key, exprs] of groups) {
    const withVideos = exprs.filter((e) => getVideosForExpression(e.id).length > 0)
    if (withVideos.length < MIN_EXPRESSIONS) continue

    // Pick the most useful ones (essential > useful > enrichment)
    const sorted = [...withVideos].sort((a, b) => {
      const valOrder: Record<string, number> = { essential: 0, useful: 1, enrichment: 2 }
      return (valOrder[a.learner_value] ?? 9) - (valOrder[b.learner_value] ?? 9)
    })
    const selected = sorted.slice(0, 10)
    const exprIds = selected.map((e) => e.id)
    const videoIds = collectVideos(exprIds, MAX_VIDEOS)
    if (videoIds.length < MIN_VIDEOS) continue

    const [category, cefr] = key.split('-')
    const level = (cefr ?? 'A1') as CefrLevel
    const catEn = CATEGORY_EN[category] ?? capitalize(category)
    const catKo = CATEGORY_KO[category] ?? category
    const levelKo = CEFR_KO[level] ?? level

    paths.push({
      id: `cat-${key}`,
      title: `${catEn} (${level})`,
      titleKo: `${catKo} (${levelKo})`,
      description: `${selected.length} ${catEn.toLowerCase()} at ${level} level across ${videoIds.length} videos`,
      descriptionKo: `${levelKo} 수준 ${catKo} ${selected.length}개, ${videoIds.length}개 영상`,
      expressions: exprIds,
      videoIds,
      level,
      type: 'category',
    })
  }

  paths.sort((a, b) => b.expressions.length - a.expressions.length)
  return paths
}

// ---------------------------------------------------------------------------
// Cached result
// ---------------------------------------------------------------------------

let _cachedPaths: LearningPath[] | null = null

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate all learning paths from expression clusters.
 * Results are cached after first call.
 */
export function generatePaths(): LearningPath[] {
  if (_cachedPaths) return _cachedPaths

  const entries = getAllExpressionEntries()

  const rootPaths = generateRootVerbPaths(entries)
  const themePaths = generateThemePaths(entries)
  const categoryPaths = generateCategoryPaths(entries)

  // Merge and sort: root verb paths first (strongest learning signal),
  // then category, then theme
  const typeOrder: Record<string, number> = { root_verb: 0, category: 1, theme: 2 }
  const all = [...rootPaths, ...categoryPaths, ...themePaths]
  all.sort((a, b) => {
    const typeDiff = (typeOrder[a.type] ?? 9) - (typeOrder[b.type] ?? 9)
    if (typeDiff !== 0) return typeDiff
    return b.expressions.length - a.expressions.length
  })

  _cachedPaths = all
  return all
}

/**
 * Find the best learning path that includes a given expression.
 * Prefers root_verb paths, then category, then theme.
 */
export function getPathForExpression(exprId: string): LearningPath | null {
  const paths = generatePaths()

  // Priority: root_verb > category > theme
  let best: LearningPath | null = null
  let bestTypeScore = Infinity

  const typeScore: Record<string, number> = { root_verb: 0, category: 1, theme: 2 }

  for (const path of paths) {
    if (!path.expressions.includes(exprId)) continue
    const score = typeScore[path.type] ?? 9
    if (score < bestTypeScore) {
      bestTypeScore = score
      best = path
    }
  }

  return best
}

/**
 * Get paths filtered by CEFR level.
 */
export function getPathsByLevel(level: CefrLevel): LearningPath[] {
  return generatePaths().filter((p) => p.level === level)
}

/**
 * Get paths filtered by type.
 */
export function getPathsByType(type: LearningPath['type']): LearningPath[] {
  return generatePaths().filter((p) => p.type === type)
}
