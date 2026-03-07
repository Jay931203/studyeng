/**
 * Pre-bake all seed video subtitles using yt-dlp.
 * Downloads English subtitles and saves as static JSON files.
 *
 * Prerequisites: pip install yt-dlp
 * Usage: node scripts/prebake-all.js
 * With translation: ANTHROPIC_API_KEY=sk-... node scripts/prebake-all.js
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', 'public', 'transcripts');
const TMP_DIR = path.join(__dirname, '..', 'tmp');

// Grouping config
const TARGET_DURATION = 4;
const MAX_DURATION = 6;

function extractYoutubeIds() {
  const seedPath = path.join(__dirname, '..', 'src', 'data', 'seed-videos.ts');
  const content = fs.readFileSync(seedPath, 'utf-8');
  const matches = [...content.matchAll(/youtubeId:\s*'([^']+)'/g)];
  return [...new Set(matches.map(m => m[1]))];
}

function downloadSubtitles(videoId) {
  const outPath = path.join(TMP_DIR, videoId);
  try {
    execSync(
      `yt-dlp --write-auto-sub --sub-lang en --skip-download --sub-format json3 -o "${outPath}" "https://www.youtube.com/watch?v=${videoId}"`,
      { timeout: 30000, stdio: 'pipe' }
    );
    const json3Path = path.join(TMP_DIR, `${videoId}.en.json3`);
    if (fs.existsSync(json3Path)) {
      return JSON.parse(fs.readFileSync(json3Path, 'utf8'));
    }
  } catch (err) {
    console.error(`  yt-dlp failed for ${videoId}:`, err.message?.substring(0, 100));
  }
  return null;
}

function groupEntries(events) {
  const raw = events
    .filter(e => e.segs)
    .map(e => ({
      text: e.segs.map(s => s.utf8 || '').join('').trim(),
      start: (e.tStartMs || 0) / 1000,
      duration: (e.dDurationMs || 0) / 1000,
    }))
    .filter(e => e.text && e.text !== '\n');

  if (raw.length === 0) return [];

  const subtitles = [];
  let currentTexts = [];
  let segStart = raw[0].start;
  let segEnd = segStart;

  for (const entry of raw) {
    const entryEnd = entry.start + entry.duration;

    if (currentTexts.length === 0) {
      segStart = entry.start;
      segEnd = entryEnd;
      currentTexts.push(entry.text);
    } else {
      const potDur = entryEnd - segStart;
      if (potDur <= TARGET_DURATION) {
        currentTexts.push(entry.text);
        segEnd = entryEnd;
      } else if (potDur <= MAX_DURATION && !/[.!?]["']?\s*$/.test(currentTexts[currentTexts.length - 1])) {
        currentTexts.push(entry.text);
        segEnd = entryEnd;
      } else {
        subtitles.push({
          start: round2(segStart),
          end: round2(segEnd),
          en: currentTexts.join(' '),
          ko: '',
        });
        segStart = entry.start;
        segEnd = entryEnd;
        currentTexts = [entry.text];
      }
    }
  }

  if (currentTexts.length > 0) {
    subtitles.push({
      start: round2(segStart),
      end: round2(segEnd),
      en: currentTexts.join(' '),
      ko: '',
    });
  }

  return subtitles;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

async function translateBatch(entries, apiKey) {
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic.default({ apiKey });
  const BATCH_SIZE = 50;

  for (let batchStart = 0; batchStart < entries.length; batchStart += BATCH_SIZE) {
    const batchEnd = Math.min(batchStart + BATCH_SIZE, entries.length);
    const batch = entries.slice(batchStart, batchEnd);
    const englishTexts = batch.map((e, i) => `${i}: ${e.en}`).join('\n');

    try {
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: `Translate each numbered English sentence to natural, conversational Korean. Return ONLY the translations, one per line, with the same number prefix.\n\n${englishTexts}`,
        }],
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '';
      const lines = text.split('\n').filter(l => l.trim());

      for (let i = 0; i < batch.length; i++) {
        const line = lines.find(l => l.startsWith(`${i}:`));
        if (line) {
          entries[batchStart + i].ko = line.replace(/^\d+:\s*/, '').trim();
        }
      }
    } catch (err) {
      console.error('  Translation batch failed:', err.message?.substring(0, 100));
    }
  }
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(TMP_DIR, { recursive: true });

  const videoIds = extractYoutubeIds();
  console.log(`Found ${videoIds.length} unique videos\n`);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  let success = 0, skip = 0, fail = 0;

  for (const id of videoIds) {
    const outFile = path.join(OUT_DIR, `${id}.json`);

    // Skip if already exists with content
    if (fs.existsSync(outFile)) {
      try {
        const existing = JSON.parse(fs.readFileSync(outFile, 'utf8'));
        if (Array.isArray(existing) && existing.length > 0) {
          console.log(`SKIP ${id} (${existing.length} entries)`);
          skip++;
          continue;
        }
      } catch {}
    }

    console.log(`FETCH ${id}...`);
    const data = downloadSubtitles(id);

    if (!data || !data.events) {
      console.log(`  FAIL ${id}: No subtitle data`);
      fail++;
      continue;
    }

    const grouped = groupEntries(data.events);
    console.log(`  OK ${id}: ${grouped.length} entries`);

    if (apiKey && grouped.length > 0) {
      console.log(`  TRANSLATE ${id}...`);
      await translateBatch(grouped, apiKey);
    }

    fs.writeFileSync(outFile, JSON.stringify(grouped, null, 2), 'utf8');
    console.log(`  SAVED ${outFile}`);
    success++;
  }

  // Clean up tmp files
  try {
    const tmpFiles = fs.readdirSync(TMP_DIR);
    for (const f of tmpFiles) {
      fs.unlinkSync(path.join(TMP_DIR, f));
    }
    fs.rmdirSync(TMP_DIR);
  } catch {}

  console.log(`\nDone! Success: ${success}, Skipped: ${skip}, Failed: ${fail}`);
}

main().catch(console.error);
