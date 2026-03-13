import fs from 'fs'

for (let i = 0; i <= 3; i++) {
  const f = 'src/data/match-results-v3/batch-' + i + '.json'
  if (!fs.existsSync(f)) { console.log('Batch', i, ': NOT FOUND'); continue }
  const data = JSON.parse(fs.readFileSync(f, 'utf-8'))
  const total = data.length
  const withSF = data.filter(d => d.surfaceForm != null).length
  const nullSF = total - withSF
  console.log(`\n=== Batch ${i}: ${total} matches, ${withSF} surfaceForm, ${nullSF} null ===`)

  // Show samples with surfaceForm
  console.log('With surfaceForm:')
  data.filter(d => d.surfaceForm != null).slice(0, 3).forEach(d => {
    console.log(`  ${d.exprId} | "${d.surfaceForm}" | ${(d.en || '').substring(0, 70)}`)
  })

  // Show samples without surfaceForm
  const nulls = data.filter(d => d.surfaceForm == null)
  if (nulls.length > 0) {
    console.log('Without surfaceForm:')
    nulls.slice(0, 5).forEach(d => {
      console.log(`  ${d.exprId} | ${(d.en || '').substring(0, 70)}`)
    })
  }
}
