import fs from 'fs'
import path from 'path'

// Load word dictionary
const wordEntries = JSON.parse(fs.readFileSync('src/data/word-entries.json', 'utf-8'))
const transcriptsDir = 'public/transcripts'
const files = fs.readdirSync(transcriptsDir).filter(f => f.endsWith('.json'))

console.log(`Words: ${Object.keys(wordEntries).length}`)
console.log(`Transcripts: ${files.length}`)

// Build lookup: for each word, collect all its forms (lowercase)
// wordId -> Set of surface forms to search for
const wordForms = {}
for (const [wordId, entry] of Object.entries(wordEntries)) {
  const forms = new Set()
  forms.add(entry.canonical.toLowerCase())
  if (Array.isArray(entry.forms)) {
    for (const f of entry.forms) {
      forms.add(f.toLowerCase())
    }
  }
  wordForms[wordId] = forms
}

// For fast lookup: form -> wordId mapping
const formToWord = {}
for (const [wordId, forms] of Object.entries(wordForms)) {
  for (const form of forms) {
    // If multiple words share a form, first one wins (rare for single words)
    if (!formToWord[form]) {
      formToWord[form] = wordId
    }
  }
}

console.log(`Total surface forms: ${Object.keys(formToWord).length}`)

// Process each transcript
const wordIndex = {} // videoId -> matches[]
let totalMatches = 0
let videosWithMatches = 0

for (const file of files) {
  const videoId = file.replace('.json', '')

  try {
    const transcript = JSON.parse(fs.readFileSync(path.join(transcriptsDir, file), 'utf-8'))
    const videoMatches = []
    const seenInVideo = new Set() // deduplicate: each word appears at most once per video (first occurrence)

    for (let si = 0; si < transcript.length; si++) {
      const seg = transcript[si]
      if (!seg.en) continue

      // Tokenize: extract words from English text
      const tokens = seg.en.toLowerCase().match(/[a-z']+/g) || []

      for (const token of tokens) {
        const clean = token.replace(/^'+|'+$/g, '')
        if (clean.length < 2) continue

        const wordId = formToWord[clean]
        if (!wordId) continue
        if (seenInVideo.has(wordId)) continue
        seenInVideo.add(wordId)

        // Find the actual surface form position in the original text (case-preserving)
        const idx = seg.en.toLowerCase().indexOf(clean)
        const surfaceForm = idx >= 0 ? seg.en.slice(idx, idx + clean.length) : clean

        videoMatches.push({
          wordId,
          sentenceIdx: si,
          en: seg.en,
          ko: seg.ko || '',
          surfaceForm,
        })
      }
    }

    if (videoMatches.length > 0) {
      wordIndex[videoId] = videoMatches
      totalMatches += videoMatches.length
      videosWithMatches++
    }
  } catch {}
}

// Stats
const wordCoverage = new Set()
for (const matches of Object.values(wordIndex)) {
  for (const m of matches) wordCoverage.add(m.wordId)
}

console.log('\n=== WORD INDEX RESULTS ===')
console.log(`Videos with word matches: ${videosWithMatches}/${files.length}`)
console.log(`Total matches: ${totalMatches}`)
console.log(`Unique words matched: ${wordCoverage.size}/${Object.keys(wordEntries).length}`)
console.log(`Words NOT in any video: ${Object.keys(wordEntries).length - wordCoverage.size}`)

// CEFR distribution of matched words
const cefrMatched = {}
for (const wordId of wordCoverage) {
  const cefr = wordEntries[wordId]?.cefr || 'unknown'
  cefrMatched[cefr] = (cefrMatched[cefr] || 0) + 1
}
console.log('\nCEFR of matched words:')
for (const [k, v] of Object.entries(cefrMatched).sort()) console.log(`  ${k}: ${v}`)

// Average matches per video
console.log(`\nAvg words per video: ${(totalMatches / videosWithMatches).toFixed(1)}`)

// Write
fs.writeFileSync('src/data/word-index.json', JSON.stringify(wordIndex, null, 2))
console.log(`\nWritten: src/data/word-index.json`)
