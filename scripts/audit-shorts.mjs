import fs from 'fs'
import path from 'path'

const ids = [
  'se50viFJ0AQ','2ONo4fpnhII','iMIZCpINHCc','wXsNIFK8z7I','CtAFtLaIN1k',
  'MmfmCR4Kta4','fh3_g8NJc58','4ZK8Z8hulFg','ImmaMjeQAqI','yH6C3JbCXxo',
  'sdgvyJ7R23Y','QPig73PjDF0','pYAnIBWl8z0','ZfaK6ncKynE','sNrBSslS5RE',
  'HwW0RdDjqks','LZNr8XGqByw','Q5bA9iv_X04','tLs9wDZKP-s','21Ki96Lsxhc',
  'TOq0dzxouts','iBpgqRbEFVg','Y6IUuxM_qlw','AIuWQ41m7ys','fYcDQ11vI0M',
  'pT6It4rnh_o','kb60HrggbeQ','qCzWL9OPpwE','4hX9o6ghEGI','vvLZ2t5cm0Y',
  'en37fxk4ccM','3ik6EwMNvXg','V6bPomtNnis','YpecVts2qqc','wLaM_GLdZto',
  '0A20vfx-sO0'
]

let totalSegs = 0, totalMulti = 0, totalMissingKo = 0, totalNoPunct = 0
const problems = []

for (const id of ids) {
  const fp = path.join('public/transcripts', id + '.json')
  if (!fs.existsSync(fp)) { console.log(`MISSING: ${id}`); continue }
  const d = JSON.parse(fs.readFileSync(fp, 'utf8'))
  let multi = 0, missingKo = 0, noPunct = 0
  const multiExamples = []
  for (const s of d) {
    const en = s.en || ''
    const parts = en.split(/(?<=[.!?])\s+(?=[A-Z])/)
    if (parts.length >= 2) { multi++; multiExamples.push(en.substring(0, 80)) }
    if (!(s.ko || '').trim()) missingKo++
    if (en.length > 10 && !/[.!?]$/.test(en.trim())) noPunct++
  }
  totalSegs += d.length; totalMulti += multi; totalMissingKo += missingKo; totalNoPunct += noPunct
  if (multi > 0 || missingKo > 0 || noPunct > 0) {
    console.log(`${id}: ${d.length} segs, ${multi} multi-sentence, ${missingKo} missing ko, ${noPunct} no punctuation`)
    if (multiExamples.length > 0) {
      multiExamples.slice(0, 3).forEach(e => console.log(`  -> "${e}"`))
    }
    problems.push(id)
  }
}
console.log('---')
console.log(`Total: ${ids.length} files, ${totalSegs} segs, ${totalMulti} multi-sentence, ${totalMissingKo} missing ko, ${totalNoPunct} no end punctuation`)
console.log(`Problem files: ${problems.length}/${ids.length}`)
