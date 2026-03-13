import expressionEntriesData from '@/data/expression-entries-v2.json'

const CEFR_WEIGHTS: Record<string, number> = {
  A1: 1,
  A2: 2,
  B1: 3,
  B2: 5,
  C1: 8,
  C2: 13,
}

const CATEGORY_MULTIPLIERS: Record<string, number> = {
  idiom: 1.5,
  phrasal_verb: 1.4,
  collocation: 1.3,
  fixed_expression: 1.2,
  sentence_frame: 1.2,
  discourse_marker: 1.2,
  slang: 1.0,
  interjection: 1.0,
  exclamation: 1.0,
  filler: 0.8,
}

type FamiliarityEntries = Record<string, { count: number }>

const expressionEntries = expressionEntriesData as Record<
  string,
  { id: string; cefr: string; category: string; meaning_ko?: string }
>

function round1(value: number) {
  return Math.round(value * 10) / 10
}

export function computeExpressionXp(entries: FamiliarityEntries): number {
  let total = 0

  for (const [exprId, entry] of Object.entries(entries)) {
    if (exprId.startsWith('word:')) continue

    const data = expressionEntries[exprId]
    if (!data) continue

    const cefrWeight = CEFR_WEIGHTS[data.cefr?.toUpperCase()] ?? 1
    const categoryMultiplier = CATEGORY_MULTIPLIERS[data.category] ?? 1.0

    let progress = 0
    if (entry.count >= 3) progress = 1.0
    else if (entry.count === 2) progress = 0.6
    else if (entry.count === 1) progress = 0.3

    total += cefrWeight * categoryMultiplier * progress
  }

  return round1(total)
}

export function computeVideoXpTotal(videoXp: Record<string, number>) {
  return round1(Object.values(videoXp).reduce((sum, count) => sum + count * 3, 0))
}

export function computeRewardXp(params: {
  totalXpEarned: number
  level: number
  xp: number
}) {
  const { totalXpEarned, level, xp } = params

  if (totalXpEarned === 0 && (level > 1 || xp > 0)) {
    let migratedTotal = 0
    for (let currentLevel = 1; currentLevel < level; currentLevel += 1) {
      migratedTotal += currentLevel * 100
    }
    return migratedTotal + xp
  }

  return totalXpEarned
}

export function computeLearningXpSummary(params: {
  familiarityEntries: FamiliarityEntries
  videoXp: Record<string, number>
  totalXpEarned: number
  level: number
  xp: number
}) {
  const expressionXp = computeExpressionXp(params.familiarityEntries)
  const videoXp = computeVideoXpTotal(params.videoXp)
  const rewardXp = computeRewardXp(params)

  return {
    expressionXp,
    videoXp,
    rewardXp,
    totalXp: round1(expressionXp + videoXp + rewardXp),
  }
}
