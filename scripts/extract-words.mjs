import fs from 'fs'
import path from 'path'

const transcriptsDir = 'public/transcripts'
const files = fs.readdirSync(transcriptsDir).filter(f => f.endsWith('.json'))

// Stopwords - too common to be useful for learning
const STOPWORDS = new Set([
  'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves',
  'you', 'your', 'yours', 'yourself', 'yourselves',
  'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself',
  'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves',
  'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those',
  'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing',
  'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as',
  'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about',
  'against', 'between', 'through', 'during', 'before', 'after',
  'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out',
  'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once',
  'here', 'there', 'when', 'where', 'why', 'how', 'all', 'both',
  'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
  'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too',
  'very', 's', 't', 'can', 'will', 'just', 'don', 'should',
  'now', 'd', 'll', 'm', 'o', 're', 've', 'y', 'ain',
  'aren', 'couldn', 'didn', 'doesn', 'hadn', 'hasn', 'haven',
  'isn', 'ma', 'mightn', 'mustn', 'needn', 'shan', 'shouldn',
  'wasn', 'weren', 'won', 'wouldn',
  // Additional common words not worth teaching
  'oh', 'uh', 'um', 'ah', 'yeah', 'yes', 'no', 'ok', 'okay',
  'like', 'well', 'just', 'really', 'right', 'gonna', 'wanna',
  'gotta', 'got', 'get', 'go', 'come', 'know', 'think', 'say',
  'make', 'take', 'see', 'look', 'want', 'give', 'use', 'find',
  'tell', 'ask', 'work', 'seem', 'feel', 'try', 'leave', 'call',
  'good', 'new', 'first', 'last', 'long', 'great', 'little',
  'big', 'old', 'also', 'back', 'even', 'still', 'way', 'thing',
  'man', 'day', 'would', 'could', 'may', 'might', 'shall', 'must',
  'let', 'put', 'keep', 'much', 'one', 'two', 'three',
])

const wordFreq = {}
const wordInVideos = {} // word -> Set of videoIds

for (const file of files) {
  const videoId = file.replace('.json', '')
  try {
    const data = JSON.parse(fs.readFileSync(path.join(transcriptsDir, file), 'utf-8'))
    for (const seg of data) {
      if (!seg.en) continue
      const words = seg.en.toLowerCase().match(/[a-z']+/g) || []
      for (const w of words) {
        const clean = w.replace(/^'+|'+$/g, '') // trim leading/trailing apostrophes
        if (clean.length < 3) continue
        if (STOPWORDS.has(clean)) continue
        if (/^\d+$/.test(clean)) continue
        if (clean.includes("'")) continue // skip contractions like don't, can't

        wordFreq[clean] = (wordFreq[clean] || 0) + 1
        if (!wordInVideos[clean]) wordInVideos[clean] = new Set()
        wordInVideos[clean].add(videoId)
      }
    }
  } catch {}
}

// Sort by frequency
const sorted = Object.entries(wordFreq)
  .map(([word, freq]) => ({ word, freq, videos: wordInVideos[word].size }))
  .sort((a, b) => b.freq - a.freq)

console.log(`Total unique words: ${sorted.length}`)
console.log(`Top 20:`)
sorted.slice(0, 20).forEach((w, i) => console.log(`  ${i+1}. ${w.word}: ${w.freq} times, ${w.videos} videos`))

// Filter: at least 5 occurrences, in at least 3 videos
const filtered = sorted.filter(w => w.freq >= 5 && w.videos >= 3)
console.log(`\nAfter filter (freq>=5, videos>=3): ${filtered.length}`)

// Save
fs.writeFileSync('src/data/word-frequencies.json', JSON.stringify(filtered, null, 2))
console.log('Written to src/data/word-frequencies.json')
