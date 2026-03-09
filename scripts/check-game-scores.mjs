import fs from 'fs'
import path from 'path'

const dir = 'public/expression-tags'
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'))

let totalFiles = 0
let taggedFiles = 0
let filesWithCandidates = 0
let totalSentences = 0
let totalCandidates = 0
const scoreDistribution = {}

function calcScore(tags) {
  let score = 0
  if (tags.power && tags.power.length > 0) score += 3
  if (tags.vibe && tags.vibe !== 'V18') score += 2
  if (tags.expression_types && tags.expression_types.some(x => x !== 'X08')) score += 2
  if (tags.emotions && tags.emotions.some(e => e !== 'E09')) score += 1
  if (tags.grammar_intent && tags.grammar_intent.length > 0) score += 1
  if (tags.flags && tags.flags.includes('is_fragment')) score -= 3
  if (tags.flags && tags.flags.includes('is_narration')) score -= 2
  return score
}

for (const file of files) {
  const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'))
  totalFiles++
  if (data.taggedCount === 0) continue
  taggedFiles++

  let candidates = 0
  for (const s of data.sentences) {
    totalSentences++
    const score = calcScore(s.tags)
    scoreDistribution[score] = (scoreDistribution[score] || 0) + 1
    if (score >= 4) {
      candidates++
      totalCandidates++
    }
  }
  if (candidates > 0) filesWithCandidates++
}

console.log('=== 게임 후보 분석 ===')
console.log('전체 파일:', totalFiles)
console.log('태깅 완료:', taggedFiles)
console.log('게임 후보 있는 영상:', filesWithCandidates, '/', taggedFiles, '(' + Math.round(filesWithCandidates / taggedFiles * 100) + '%)')
console.log('게임 후보 없는 영상:', taggedFiles - filesWithCandidates)
console.log('')
console.log('전체 문장:', totalSentences)
console.log('게임 후보 문장 (score>=4):', totalCandidates, '(' + Math.round(totalCandidates / totalSentences * 100) + '%)')
console.log('')
console.log('점수 분포:')
Object.keys(scoreDistribution).sort((a, b) => Number(a) - Number(b)).forEach(s => {
  const bar = '#'.repeat(Math.round(scoreDistribution[s] / 100))
  console.log('  score ' + s + ': ' + scoreDistribution[s] + ' ' + bar)
})
