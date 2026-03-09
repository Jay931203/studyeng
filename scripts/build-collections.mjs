#!/usr/bin/env node
/**
 * build-collections.mjs
 *
 * Reads expression-tags JSON files and collection templates,
 * then generates:
 *   - public/collections-manifest.json  (summary of all 50 collections)
 *   - public/collections/{collectionId}.json  (detail per collection)
 *
 * Run: node scripts/build-collections.mjs
 */

import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { existsSync } from 'node:fs'

const ROOT = resolve(import.meta.dirname, '..')
const TAGS_DIR = join(ROOT, 'public', 'expression-tags')
const COLLECTIONS_DIR = join(ROOT, 'public', 'collections')
const MANIFEST_PATH = join(ROOT, 'public', 'collections-manifest.json')

// ─── Collection Templates (mirrored from src/data/collection-templates.ts) ───

const collectionTemplates = [
  // Situation
  { id: 'cafe-english', name: '카페 영어', description: '카페에서 주문하고 대화할 때', group: 'situation', filter: { situation: ['S05'], register: ['R3', 'R4'] }, sortPriority: 1 },
  { id: 'hospital-english', name: '병원 영어', description: '아플 때 쓰는 필수 표현', group: 'situation', filter: { situation: ['S27', 'S28'] }, sortPriority: 2 },
  { id: 'interview-english', name: '면접 영어', description: '영어 면접 완벽 대비', group: 'situation', filter: { situation: ['S15'], power: ['P02'] }, sortPriority: 3 },
  { id: 'airport-english', name: '공항 영어', description: '출국부터 입국까지', group: 'situation', filter: { situation: ['S22'] }, sortPriority: 4 },
  { id: 'hotel-english', name: '호텔 영어', description: '체크인부터 컴플레인까지', group: 'situation', filter: { situation: ['S23'] }, sortPriority: 5 },
  { id: 'office-english', name: '사무실 영어', description: '직장에서 매일 쓰는 표현', group: 'situation', filter: { situation: ['S14'], register: ['R2', 'R3'] }, sortPriority: 6 },
  { id: 'school-english', name: '학교 영어', description: '수업, 과제, 캠퍼스 라이프', group: 'situation', filter: { situation: ['S19', 'S20'] }, sortPriority: 7 },
  { id: 'restaurant-english', name: '식당 영어', description: '주문하고, 불만 말하고, 계산하기', group: 'situation', filter: { situation: ['S05'] }, sortPriority: 8 },
  { id: 'shopping-english', name: '쇼핑 영어', description: '할인, 교환, 환불 완전 정복', group: 'situation', filter: { situation: ['S04'] }, sortPriority: 9 },
  { id: 'phone-english', name: '전화 영어', description: '전화 받고 걸고 끊기', group: 'situation', filter: { situation: ['S24'] }, sortPriority: 10 },
  // Vibe
  { id: 'sarcastic-english', name: '비꼬는 영어', description: '네이티브가 돌려까는 법', group: 'vibe', filter: { vibe: ['V01', 'V15'], emotions: ['E10'] }, sortPriority: 1 },
  { id: 'wholesome-english', name: '따뜻한 영어', description: '마음이 따뜻해지는 표현들', group: 'vibe', filter: { vibe: ['V02'] }, sortPriority: 2 },
  { id: 'savage-english', name: '작살 한마디', description: '입 다물게 만드는 한방', group: 'vibe', filter: { vibe: ['V03'], power: ['P07'] }, sortPriority: 3 },
  { id: 'cringe-english', name: '오글 영어', description: '들으면 오그라드는 표현', group: 'vibe', filter: { vibe: ['V04'] }, sortPriority: 4 },
  { id: 'motivational-english', name: '동기부여 영어', description: '힘이 되는 한마디', group: 'vibe', filter: { vibe: ['V05'], power: ['P10'] }, sortPriority: 5 },
  { id: 'dark-humor-english', name: '블랙코미디 영어', description: '웃기지만 좀 어두운', group: 'vibe', filter: { vibe: ['V06'] }, sortPriority: 6 },
  { id: 'sweet-english', name: '달달한 영어', description: '연인끼리 쓰는 달콤 표현', group: 'vibe', filter: { vibe: ['V07'], emotions: ['E11'] }, sortPriority: 7 },
  { id: 'badass-english', name: '간지 영어', description: '쿨한 한마디, 보스 에너지', group: 'vibe', filter: { vibe: ['V08'] }, sortPriority: 8 },
  { id: 'emotional-english', name: '먹먹한 영어', description: '눈물 나는 명대사', group: 'vibe', filter: { vibe: ['V09'], power: ['P10'] }, sortPriority: 9 },
  { id: 'funny-english', name: '웃긴 영어', description: '코미디 대사 모음', group: 'vibe', filter: { vibe: ['V10'] }, sortPriority: 10 },
  // Function
  { id: 'apologizing', name: '사과하는 법', description: '진심 담아 사과하는 영어', group: 'function', filter: { functions: ['F28'] }, sortPriority: 1 },
  { id: 'refusing', name: '거절하는 법', description: '부드럽게/단호하게 거절', group: 'function', filter: { functions: ['F43'], grammarIntent: ['G01'] }, sortPriority: 2 },
  { id: 'complimenting', name: '칭찬하는 법', description: '센스있게 칭찬하기', group: 'function', filter: { functions: ['F30'], grammarIntent: ['G03'] }, sortPriority: 3 },
  { id: 'consoling', name: '위로하는 법', description: '힘든 친구에게 하는 말', group: 'function', filter: { functions: ['F31'], grammarIntent: ['G05'] }, sortPriority: 4 },
  { id: 'persuading', name: '설득하는 법', description: '상대를 내 편으로', group: 'function', filter: { functions: ['F45'], power: ['P08'] }, sortPriority: 5 },
  { id: 'suggesting', name: '제안하는 법', description: '자연스럽게 제안하기', group: 'function', filter: { functions: ['F36'], grammarIntent: ['G09'] }, sortPriority: 6 },
  { id: 'expressing-anger', name: '화내는 법', description: '참다 폭발할 때', group: 'function', filter: { functions: ['F17', 'F55'], grammarIntent: ['G06'] }, sortPriority: 7 },
  { id: 'backchanneling', name: '맞장구치는 법', description: '대화를 이어가는 기술', group: 'function', filter: { functions: ['F53'], expressionTypes: ['X06'] }, sortPriority: 8 },
  { id: 'confessing', name: '고백하는 법', description: '마음을 전하는 표현', group: 'function', filter: { functions: ['F64', 'F22'], grammarIntent: ['G22'] }, sortPriority: 9 },
  { id: 'encouraging', name: '응원하는 법', description: '힘내! 할 수 있어!', group: 'function', filter: { functions: ['F31'], grammarIntent: ['G23'] }, sortPriority: 10 },
  // Level
  { id: 'beginner-daily', name: '왕초보 일상 영어', description: '가장 쉬운 매일 표현', group: 'level', filter: { cefr: ['A1', 'A2'], power: ['P03'] }, sortPriority: 1 },
  { id: 'intermediate-idioms', name: '중급자 관용구', description: '중급에서 고급으로 가는 다리', group: 'level', filter: { cefr: ['B1', 'B2'], expressionTypes: ['X02', 'X01'] }, sortPriority: 2 },
  { id: 'advanced-business', name: '고급 비즈니스 영어', description: '프로페셔널 표현 모음', group: 'level', filter: { cefr: ['C1'], register: ['R2'], power: ['P11'] }, sortPriority: 3 },
  { id: 'native-like', name: '원어민처럼 말하기', description: '교과서에 없는 진짜 영어', group: 'level', filter: { power: ['P01'], register: ['R4', 'R5'] }, sortPriority: 4 },
  { id: 'test-prep', name: '시험 대비 표현', description: 'TOEIC/TOEFL에 나오는 패턴', group: 'level', filter: { power: ['P12'], register: ['R2', 'R3'] }, sortPriority: 5 },
  // Grammar
  { id: 'would-mastery', name: 'would 정복', description: 'would의 모든 쓰임', group: 'grammar', filter: { grammarIntent: ['G12'] }, sortPriority: 1 },
  { id: 'conditionals', name: '가정법 모음', description: 'If I were you, What if...', group: 'grammar', filter: { grammarIntent: ['G12'] }, sortPriority: 2 },
  { id: 'phrasal-verbs', name: '구동사 마스터', description: 'take off, run into, give up...', group: 'grammar', filter: { expressionTypes: ['X01'] }, sortPriority: 3 },
  { id: 'regret-expressions', name: '후회 표현 모음', description: 'should have, could have, if only', group: 'grammar', filter: { grammarIntent: ['G11'] }, sortPriority: 4 },
  { id: 'hedging-politeness', name: '겸손하게 말하기', description: '완곡 표현의 기술', group: 'grammar', filter: { expressionTypes: ['X07'], register: ['R3'] }, sortPriority: 5 },
  // Theme
  { id: 'netflix-quotes', name: '넷플릭스 명대사', description: '드라마에서 건진 명대사', group: 'theme', filter: { power: ['P04'], vibe: ['V08', 'V09'] }, sortPriority: 1 },
  { id: 'disney-quotes', name: '디즈니 명대사', description: '애니메이션 감동 대사', group: 'theme', filter: { situation: ['S45'], power: ['P04'] }, sortPriority: 2 },
  { id: 'drama-fights', name: '드라마 싸움 장면', description: '말싸움에서 쓰는 영어', group: 'theme', filter: { situation: ['S39'], functions: ['F55', 'F58', 'F60'] }, sortPriority: 3 },
  { id: 'courtroom-english', name: '법정 영어', description: '재판/법률 드라마 표현', group: 'theme', filter: { situation: ['S36'] }, sortPriority: 4 },
  { id: 'flirting-english', name: '썸 타는 영어', description: '밀당의 기술', group: 'theme', filter: { power: ['P09'], emotions: ['E11'] }, sortPriority: 5 },
  { id: 'boss-talk', name: '직장 상사에게 하는 말', description: '사내 정치 서바이벌', group: 'theme', filter: { situation: ['S17'], register: ['R2', 'R3'] }, sortPriority: 6 },
  { id: 'profanity-dictionary', name: '비속어 사전', description: '드라마에서 듣는 욕 (주의!)', group: 'theme', filter: { flags: ['contains_profanity'] }, sortPriority: 7 },
  { id: 'learn-from-songs', name: '노래로 배우는 영어', description: '가사 속 표현 모음', group: 'theme', filter: { flags: ['is_lyrics'] }, sortPriority: 8 },
  { id: 'slang-collection', name: '슬랭 총정리', description: '교과서에 없는 유행어', group: 'theme', filter: { expressionTypes: ['X05'], power: ['P05'] }, sortPriority: 9 },
  { id: 'emergency-english', name: '위기 상황 영어', description: '긴급할 때 쓰는 필수 표현', group: 'theme', filter: { situation: ['S28', 'S38'], emotions: ['E04', 'E15'] }, sortPriority: 10 },
]

// ─── Filter Logic ────────────────────────────────────────────────────────────

/**
 * Check if a single tag dimension matches the filter values.
 * Tag value can be a string (single-label) or array (multi-label).
 * Filter values are OR'd: ANY filter value matching ANY tag value counts.
 */
function dimensionMatches(tagValue, filterValues) {
  if (!filterValues || filterValues.length === 0) return true
  if (!tagValue) return false

  if (Array.isArray(tagValue)) {
    // Multi-label: at least one tag value must be in the filter values
    return tagValue.some((v) => filterValues.includes(v))
  }
  // Single-label: the tag value must be in the filter values
  return filterValues.includes(tagValue)
}

/**
 * Check if a sentence matches ALL filter conditions (AND logic).
 * Returns true only if every specified dimension has at least one matching value.
 */
function sentenceMatchesFilter(tags, filter) {
  if (!tags) return false

  // Map filter keys to their corresponding tag keys
  const dimensionMap = [
    ['situation', 'situation'],
    ['vibe', 'vibe'],
    ['functions', 'functions'],
    ['emotions', 'emotions'],
    ['cefr', 'cefr'],
    ['register', 'register'],
    ['expressionTypes', 'expression_types'],
    ['power', 'power'],
    ['grammarIntent', 'grammar_intent'],
    ['flags', 'flags'],
  ]

  for (const [filterKey, tagKey] of dimensionMap) {
    const filterValues = filter[filterKey]
    if (!filterValues || filterValues.length === 0) continue

    const tagValue = tags[tagKey]
    if (!dimensionMatches(tagValue, filterValues)) {
      return false
    }
  }

  return true
}

/**
 * Check if a sentence has any non-empty tags at all.
 */
function isTagged(tags) {
  if (!tags) return false
  // A sentence is considered tagged if it has at least one non-empty tag value
  return (
    (tags.functions && tags.functions.length > 0) ||
    (tags.situation && tags.situation !== '') ||
    (tags.cefr && tags.cefr !== '') ||
    (tags.register && tags.register !== '') ||
    (tags.emotions && tags.emotions.length > 0) ||
    (tags.expression_types && tags.expression_types.length > 0) ||
    (tags.vibe && tags.vibe !== '') ||
    (tags.power && tags.power.length > 0) ||
    (tags.grammar_intent && tags.grammar_intent.length > 0) ||
    (tags.flags && tags.flags.length > 0)
  )
}

// ─── Main Pipeline ───────────────────────────────────────────────────────────

async function main() {
  const startTime = Date.now()
  console.log('=== Shortee Collection Builder ===\n')

  // 1. Read all expression-tags files
  console.log(`Reading expression-tags from ${TAGS_DIR}...`)

  if (!existsSync(TAGS_DIR)) {
    console.error(`ERROR: expression-tags directory not found: ${TAGS_DIR}`)
    process.exit(1)
  }

  const tagFiles = (await readdir(TAGS_DIR)).filter((f) => f.endsWith('.json'))
  console.log(`Found ${tagFiles.length} tag files`)

  // Load all tag data in parallel (batched to avoid too many open files)
  const BATCH_SIZE = 200
  const allVideoTags = []
  for (let i = 0; i < tagFiles.length; i += BATCH_SIZE) {
    const batch = tagFiles.slice(i, i + BATCH_SIZE)
    const results = await Promise.all(
      batch.map(async (file) => {
        try {
          const raw = await readFile(join(TAGS_DIR, file), 'utf-8')
          return JSON.parse(raw)
        } catch (err) {
          console.warn(`  WARN: Failed to parse ${file}: ${err.message}`)
          return null
        }
      }),
    )
    allVideoTags.push(...results.filter(Boolean))
  }

  console.log(`Loaded ${allVideoTags.length} video tag files\n`)

  // Count total tagged sentences
  let totalTaggedSentences = 0
  let totalSentences = 0
  for (const video of allVideoTags) {
    totalSentences += video.sentenceCount ?? video.sentences?.length ?? 0
    totalTaggedSentences += video.taggedCount ?? 0
  }
  console.log(`Total sentences: ${totalSentences}`)
  console.log(`Tagged sentences: ${totalTaggedSentences}\n`)

  // 2. Build collections
  console.log('Building collections...\n')

  const collectionsManifest = []
  const emptyCollections = []

  for (const template of collectionTemplates) {
    const collectionSentences = []
    /** @type {Map<string, { videoId: string, title: string, category: string, matchedSentences: number[] }>} */
    const videoMatches = new Map()

    for (const video of allVideoTags) {
      // Skip videos with no tagged sentences
      if ((video.taggedCount ?? 0) === 0) continue
      if (!video.sentences || video.sentences.length === 0) continue

      const matchedIndices = []

      for (let idx = 0; idx < video.sentences.length; idx++) {
        const sentence = video.sentences[idx]
        if (!sentence.tags || !isTagged(sentence.tags)) continue

        if (sentenceMatchesFilter(sentence.tags, template.filter)) {
          matchedIndices.push(idx)
          collectionSentences.push({
            videoId: video.videoId,
            sentenceIdx: idx,
            en: sentence.en,
            ko: sentence.ko,
            tags: sentence.tags,
          })
        }
      }

      if (matchedIndices.length > 0) {
        videoMatches.set(video.videoId, {
          videoId: video.videoId,
          title: video.title ?? '',
          category: video.category ?? '',
          matchedSentences: matchedIndices,
        })
      }
    }

    // Manifest entry
    const manifestEntry = {
      id: template.id,
      name: template.name,
      description: template.description,
      group: template.group,
      sentenceCount: collectionSentences.length,
      videoCount: videoMatches.size,
      videos: [...videoMatches.values()],
    }
    collectionsManifest.push(manifestEntry)

    // Track empty collections
    if (collectionSentences.length === 0) {
      emptyCollections.push(template.id)
    }

    // Write individual collection detail file
    const detailData = {
      id: template.id,
      name: template.name,
      description: template.description,
      group: template.group,
      sentences: collectionSentences,
    }

    // Ensure collections directory exists
    if (!existsSync(COLLECTIONS_DIR)) {
      await mkdir(COLLECTIONS_DIR, { recursive: true })
    }

    await writeFile(
      join(COLLECTIONS_DIR, `${template.id}.json`),
      JSON.stringify(detailData, null, 2),
      'utf-8',
    )
  }

  // 3. Write manifest
  const manifest = {
    generatedAt: new Date().toISOString(),
    totalTaggedSentences,
    totalCollections: collectionTemplates.length,
    collections: collectionsManifest,
  }

  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf-8')

  // 4. Summary report
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2)
  console.log('─── Summary Report ───')
  console.log(`Total collections: ${collectionTemplates.length}`)
  console.log(
    `Collections with matches: ${collectionTemplates.length - emptyCollections.length}`,
  )
  console.log(`Collections with 0 sentences: ${emptyCollections.length}`)

  if (emptyCollections.length > 0) {
    console.log(`\nEmpty collections:`)
    for (const id of emptyCollections) {
      const tmpl = collectionTemplates.find((t) => t.id === id)
      console.log(`  - ${id} (${tmpl?.name})`)
    }
  }

  // Non-empty collections summary
  const nonEmpty = collectionsManifest.filter((c) => c.sentenceCount > 0)
  if (nonEmpty.length > 0) {
    console.log(`\nCollections with matches:`)
    for (const c of nonEmpty) {
      console.log(
        `  - ${c.id}: ${c.sentenceCount} sentences across ${c.videoCount} videos`,
      )
    }
  }

  console.log(`\nTotal matched sentences (across all collections): ${collectionsManifest.reduce((sum, c) => sum + c.sentenceCount, 0)}`)
  console.log(`\nOutput:`)
  console.log(`  Manifest: ${MANIFEST_PATH}`)
  console.log(`  Details:  ${COLLECTIONS_DIR}/{id}.json`)
  console.log(`\nDone in ${elapsed}s`)
}

main().catch((err) => {
  console.error('FATAL:', err)
  process.exit(1)
})
