import fs from 'fs'

const v3 = JSON.parse(fs.readFileSync('src/data/expression-index-v3.json', 'utf-8'))
const entries = JSON.parse(fs.readFileSync('src/data/expression-entries-v2.json', 'utf-8'))

let total = 0, errors = []

for (const [videoId, matches] of Object.entries(v3)) {
  // 1. transcript 파일 존재 확인
  const tPath = `public/transcripts/${videoId}.json`
  if (!fs.existsSync(tPath)) {
    errors.push(`MISSING TRANSCRIPT: ${videoId}`)
    continue
  }
  const transcript = JSON.parse(fs.readFileSync(tPath, 'utf-8'))

  for (const m of matches) {
    total++

    // 2. 필수 필드 확인
    if (!m.exprId || m.sentenceIdx == null || !m.en || !m.surfaceForm) {
      errors.push(`MISSING FIELD: video=${videoId} expr=${m.exprId} idx=${m.sentenceIdx}`)
      continue
    }

    // 3. exprId가 사전에 존재하는지
    if (!entries[m.exprId]) {
      errors.push(`UNKNOWN EXPR: "${m.exprId}" in ${videoId}`)
      continue
    }

    // 4. sentenceIdx가 transcript 범위 안인지
    if (m.sentenceIdx >= transcript.length) {
      errors.push(`IDX OUT OF RANGE: ${videoId}[${m.sentenceIdx}] (max ${transcript.length-1})`)
      continue
    }

    // 5. en 필드가 transcript과 일치하는지
    const actual = transcript[m.sentenceIdx]
    if (actual.en !== m.en) {
      // 부분 일치라도 확인
      if (!actual.en.includes(m.en.substring(0, 30)) && !m.en.includes(actual.en.substring(0, 30))) {
        errors.push(`EN MISMATCH: video=${videoId}[${m.sentenceIdx}] stored="${m.en.substring(0,40)}" actual="${actual.en.substring(0,40)}"`)
      }
    }

    // 6. surfaceForm이 en 문장에 실제로 있는지
    if (!m.en.toLowerCase().includes(m.surfaceForm.toLowerCase())) {
      errors.push(`SF NOT IN EN: expr="${m.exprId}" sf="${m.surfaceForm}" en="${m.en.substring(0,50)}"`)
    }

    // 7. surfaceForm이 canonical과 관련이 있는지 (최소 1개 단어 공유)
    const sfWords = new Set(m.surfaceForm.toLowerCase().split(/\s+/).map(w => w.replace(/[^a-z']/g, '')))
    const exprWords = m.exprId.toLowerCase().split(/\s+/).map(w => w.replace(/[^a-z']/g, ''))
    const overlap = exprWords.filter(w => sfWords.has(w))
    if (overlap.length === 0 && exprWords.length > 1) {
      errors.push(`NO WORD OVERLAP: expr="${m.exprId}" sf="${m.surfaceForm}"`)
    }
  }
}

// 8. v2 대비 커버리지
const v2 = JSON.parse(fs.readFileSync('src/data/expression-index-v2.json', 'utf-8'))
const v2Total = Object.values(v2).reduce((sum, arr) => sum + arr.length, 0)

console.log('=== 최종 검증 ===')
console.log(`v3 total: ${total}`)
console.log(`v2 total: ${v2Total}`)
console.log(`차이: ${v2Total - total} (${total < v2Total ? '손실' : '정상'})`)
console.log(`v3 videos: ${Object.keys(v3).length}`)
console.log(`Errors: ${errors.length}`)

if (errors.length > 0) {
  console.log('\n--- Errors ---')
  errors.slice(0, 30).forEach(e => console.log('  ' + e))
  if (errors.length > 30) console.log(`  ... and ${errors.length - 30} more`)
} else {
  console.log('\n문제 없음. 완벽합니다.')
}

// 9. 랜덤 샘플 10개 출력
console.log('\n--- 랜덤 샘플 10개 ---')
const allMatches = []
for (const [vid, ms] of Object.entries(v3)) {
  for (const m of ms) allMatches.push({ videoId: vid, ...m })
}
for (let i = 0; i < 10; i++) {
  const idx = Math.floor(Math.random() * allMatches.length)
  const s = allMatches[idx]
  console.log(`  [${s.exprId}] sf="${s.surfaceForm}" | ${s.en.substring(0, 70)}`)
}
