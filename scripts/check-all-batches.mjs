import fs from 'fs'

for (let i = 0; i <= 9; i++) {
  const f = `src/data/match-results-v3/batch-${i}.json`
  if (!fs.existsSync(f)) { console.log(`Batch ${i}: NOT DONE`); continue }
  const data = JSON.parse(fs.readFileSync(f, 'utf-8'))
  const withSF = data.filter(d => d.surfaceForm != null && d.surfaceForm !== null).length
  const nullSF = data.length - withSF
  console.log(`Batch ${i}: ${data.length} matches, ${withSF} SF found, ${nullSF} null`)
}
