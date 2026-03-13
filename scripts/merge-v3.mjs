import fs from 'fs'

const outDir = 'src/data/match-results-v3'
const allResults = []

for (let i = 0; i < 10; i++) {
  const batch = JSON.parse(fs.readFileSync(`${outDir}/batch-${i}.json`, 'utf-8'))
  allResults.push(...batch)
}

// Group by videoId
const videoMap = {}
for (const r of allResults) {
  if (!videoMap[r.videoId]) videoMap[r.videoId] = []
  videoMap[r.videoId].push({
    exprId: r.exprId,
    sentenceIdx: r.sentenceIdx,
    en: r.en,
    ko: r.ko,
    surfaceForm: r.surfaceForm,
  })
}

fs.writeFileSync('src/data/expression-index-v3.json', JSON.stringify(videoMap, null, 2))

// Stats
const entries = JSON.parse(fs.readFileSync('src/data/expression-entries-v2.json', 'utf-8'))
const uniqueExprs = new Set(allResults.map(r => r.exprId))
const uniqueVideos = Object.keys(videoMap)
let inflected = 0
for (const r of allResults) {
  const canonical = (entries[r.exprId]?.canonical || '').toLowerCase()
  if (r.surfaceForm && r.surfaceForm.toLowerCase() !== canonical) inflected++
}

console.log('Total matches:', allResults.length)
console.log('Unique expressions:', uniqueExprs.size)
console.log('Unique videos:', uniqueVideos.length)
console.log('Inflected forms:', inflected, `(${(inflected/allResults.length*100).toFixed(1)}%)`)
console.log('Written to src/data/expression-index-v3.json')
