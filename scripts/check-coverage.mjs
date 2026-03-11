import fs from 'fs'

const dir = './public/expression-tags'
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'))

let withExpr = 0
let withoutExpr = 0
let fillersOnly = 0
const noExprVideos = []
const fillerOnlyVideos = []

for (const file of files) {
  const data = JSON.parse(fs.readFileSync(dir + '/' + file, 'utf8'))

  const hasAnyExpr = data.sentences.some(s => {
    const t = s.tags?.expression_types || []
    return t.some(x => ['X01','X02','X03','X04','X05','X06','X07'].includes(x))
  })

  const hasRealExpr = data.sentences.some(s => {
    const t = s.tags?.expression_types || []
    return t.some(x => ['X01','X02','X03','X04'].includes(x))
  })

  if (hasAnyExpr) {
    withExpr++
  } else {
    withoutExpr++
    noExprVideos.push(`${data.videoId} - ${data.title}`)
  }

  if (hasAnyExpr && !hasRealExpr) {
    fillersOnly++
    fillerOnlyVideos.push(`${data.videoId} - ${data.title}`)
  }
}

console.log(`=== Per-Video Expression Coverage ===`)
console.log(`Videos WITH expression (X01-X07): ${withExpr} / ${files.length} (${(withExpr/files.length*100).toFixed(1)}%)`)
console.log(`Videos WITHOUT any expression: ${withoutExpr}`)
console.log(`Videos with ONLY fillers (X05-X07, no X01-X04): ${fillersOnly}`)
console.log(`Videos with REAL expressions (X01-X04): ${withExpr - fillersOnly} / ${files.length} (${((withExpr - fillersOnly)/files.length*100).toFixed(1)}%)`)

if (withoutExpr > 0) {
  console.log(`\nNo-expression videos (first 10):`)
  noExprVideos.slice(0, 10).forEach(v => console.log(`  ${v}`))
}

if (fillersOnly > 0) {
  console.log(`\nFiller-only videos (first 10):`)
  fillerOnlyVideos.slice(0, 10).forEach(v => console.log(`  ${v}`))
}

// Check total video count vs expression-tag coverage
const seedVideos = (await import('../src/data/seed-videos.ts')).default
console.log(`\n=== Overall Coverage ===`)
console.log(`seed-videos.ts: ${seedVideos.length} videos`)
console.log(`expression-tags: ${files.length} files`)
console.log(`Missing tags: ${seedVideos.length - files.length} videos have NO expression-tag file at all`)
