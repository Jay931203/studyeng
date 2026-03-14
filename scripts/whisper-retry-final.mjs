import { readFileSync, writeFileSync, mkdtempSync, rmSync, readdirSync, existsSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { execFileSync } from 'child_process'
import { loadEnv } from './lib/load-env.mjs'

loadEnv()

const OPENAI_KEY = process.env.OPENAI_API_KEY || process.env.OPEN_API_KEY
if (!OPENAI_KEY) { console.error('No OPENAI_API_KEY'); process.exit(1) }

const allIds = JSON.parse(readFileSync('output/whisper-final-retry.json', 'utf-8'))
// Filter out unavailable videos
const unavailable = new Set(['HeKbP9BCZXQ', 't5v2qBBD-gE'])
const ids = allIds.filter(id => !unavailable.has(id))
const seedContent = readFileSync('src/data/seed-videos.ts', 'utf-8')

console.log(`Retrying ${ids.length} videos with worstaudio format\n`)

let success = 0, failed = 0

for (const id of ids) {
  const clipMatch = seedContent.match(new RegExp(`youtubeId: '${id}'[\\s\\S]*?clipStart: (\\d+)[\\s\\S]*?clipEnd: (\\d+)`))
  const clipStart = clipMatch ? parseInt(clipMatch[1]) : 0
  const clipEnd = clipMatch ? parseInt(clipMatch[2]) : 0

  const tmpDir = mkdtempSync(join(tmpdir(), 'wr-'))
  try {
    execFileSync('yt-dlp', [
      '--js-runtimes', 'node', '--remote-components', 'ejs:github',
      '-f', '18/worstaudio/bestaudio', '--no-post-overwrites',
      '-o', join(tmpDir, `${id}.%(ext)s`),
      `https://www.youtube.com/watch?v=${id}`
    ], { stdio: 'pipe', timeout: 120000 })

    const files = readdirSync(tmpDir).filter(f => f.startsWith(id))
    if (files.length === 0) { console.log(`  ${id} - NO FILE`); failed++; continue }
    const audioPath = join(tmpDir, files[0])

    const audioBuffer = readFileSync(audioPath)
    const formData = new FormData()
    formData.append('file', new Blob([audioBuffer]), 'audio.webm')
    formData.append('model', 'whisper-1')
    formData.append('response_format', 'verbose_json')
    formData.append('timestamp_granularities[]', 'word')
    formData.append('timestamp_granularities[]', 'segment')
    formData.append('language', 'en')

    const resp = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${OPENAI_KEY}` },
      body: formData
    })

    if (!resp.ok) {
      const txt = await resp.text()
      console.log(`  ${id} [${clipStart}-${clipEnd}s] - WHISPER ${resp.status}: ${txt.slice(0, 100)}`)
      failed++
      continue
    }

    const result = await resp.json()
    const isClip = clipStart > 0 || clipEnd > 0

    const segments = (result.segments || [])
      .filter(s => !isClip || (s.start >= clipStart - 1 && s.start <= clipEnd + 1))
      .map(s => ({
        start: Math.round(s.start * 100) / 100,
        end: Math.round(s.end * 100) / 100,
        en: s.text.trim(),
        ko: ''
      }))
      .filter(s => s.en)

    writeFileSync(`public/transcripts/${id}.json`, JSON.stringify(segments, null, 2) + '\n')
    console.log(`  ${id} [${clipStart}-${clipEnd}s] - OK ${segments.length} entries`)
    success++

    await new Promise(r => setTimeout(r, 2000))
  } catch (e) {
    console.log(`  ${id} [${clipStart}-${clipEnd}s] - FAIL: ${String(e.message || e).slice(0, 120)}`)
    failed++
  } finally {
    rmSync(tmpDir, { recursive: true, force: true })
  }
}

console.log(`\nDone: ${success} OK, ${failed} failed`)
