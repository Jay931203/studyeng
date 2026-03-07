/**
 * Pre-bake all seed video subtitles using yt-dlp (SRT format).
 * Downloads English subtitles, groups into natural sentence/phrase blocks,
 * translates to Korean via Groq API.
 *
 * Prerequisites: pip install yt-dlp
 * Usage:
 *   node scripts/prebake-all.js           # Download + group + translate all
 *   node scripts/prebake-all.js --force   # Re-process even if exists
 *   node scripts/prebake-all.js --translate-only  # Only translate existing
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', 'public', 'transcripts');
const TMP_DIR = path.join(__dirname, '..', 'tmp');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
if (!GROQ_API_KEY) {
  console.error('Error: GROQ_API_KEY environment variable is required');
  process.exit(1);
}

const FORCE = process.argv.includes('--force');
const TRANSLATE_ONLY = process.argv.includes('--translate-only');

// ============================================================
// Video info extraction
// ============================================================

function extractVideoInfo() {
  const seedPath = path.join(__dirname, '..', 'src', 'data', 'seed-videos.ts');
  const content = fs.readFileSync(seedPath, 'utf-8');
  const videos = [];
  const blocks = content.split(/\{[\s\n]*id:/g).slice(1);

  for (const block of blocks) {
    const idMatch = block.match(/youtubeId:\s*'([^']+)'/);
    const startMatch = block.match(/clipStart:\s*(\d+)/);
    const endMatch = block.match(/clipEnd:\s*(\d+)/);
    if (idMatch) {
      videos.push({
        youtubeId: idMatch[1],
        clipStart: startMatch ? parseInt(startMatch[1]) : 0,
        clipEnd: endMatch ? parseInt(endMatch[1]) : 60,
      });
    }
  }

  const seen = new Set();
  return videos.filter(v => {
    if (seen.has(v.youtubeId)) return false;
    seen.add(v.youtubeId);
    return true;
  });
}

// ============================================================
// SRT Download & Parse
// ============================================================

function downloadSrt(videoId) {
  const outPath = path.join(TMP_DIR, videoId);
  try {
    execSync(
      `yt-dlp --write-auto-sub --sub-lang en --skip-download --sub-format srt -o "${outPath}" "https://www.youtube.com/watch?v=${videoId}"`,
      { timeout: 30000, stdio: 'pipe' }
    );
    const srtPath = path.join(TMP_DIR, `${videoId}.en.srt`);
    if (fs.existsSync(srtPath)) {
      return fs.readFileSync(srtPath, 'utf8');
    }
  } catch (err) {
    console.error(`  yt-dlp failed for ${videoId}:`, err.message?.substring(0, 100));
  }
  return null;
}

function parseSrt(srtContent) {
  const blocks = srtContent.trim().split(/\n\n+/);
  const entries = [];

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 3) continue;

    const timeLine = lines[1];
    const timeMatch = timeLine.match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/);
    if (!timeMatch) continue;

    const start = parseInt(timeMatch[1]) * 3600 + parseInt(timeMatch[2]) * 60 + parseInt(timeMatch[3]) + parseInt(timeMatch[4]) / 1000;
    const end = parseInt(timeMatch[5]) * 3600 + parseInt(timeMatch[6]) * 60 + parseInt(timeMatch[7]) + parseInt(timeMatch[8]) / 1000;

    const text = lines.slice(2).join(' ')
      .replace(/<[^>]+>/g, '')  // Strip HTML tags
      .replace(/\[.*?\]/g, '')  // Remove [Music], [Applause]
      .replace(/\(.*?\)/g, '')  // Remove (inaudible)
      .replace(/♪[^♪]*♪?/g, '') // Remove music notes
      .replace(/\s+/g, ' ')
      .trim();

    if (text && text.length >= 2) {
      entries.push({ text, start: round2(start), end: round2(end) });
    }
  }

  return entries;
}

// ============================================================
// Smart Sentence Grouping
// ============================================================

/**
 * Groups SRT entries into natural sentence/phrase blocks.
 *
 * Strategy:
 * 1. Filter to clip range
 * 2. Deduplicate overlapping entries (SRT auto-subs show text in pairs)
 * 3. Build continuous text stream
 * 4. Split into 5-10 second groups at natural boundaries
 */
function groupIntoSentences(srtEntries, clipStart, clipEnd) {
  // Filter to clip range (with 1s buffer)
  let filtered = srtEntries.filter(e => e.start >= clipStart - 1 && e.start <= clipEnd + 1);

  // If nothing in clip range, try first 65 seconds
  if (filtered.length === 0) {
    filtered = srtEntries.filter(e => e.start <= 65);
  }
  if (filtered.length === 0) return [];

  // Deduplicate: SRT auto-subs pair lines, take only unique phrase segments
  // Each SRT entry represents a unique phrase even though time ranges overlap
  // We use each entry's text once, with its START time
  const phrases = filtered.map((e, i) => ({
    text: e.text,
    start: e.start,
    // End = next entry's start, or this entry's end if last
    end: i + 1 < filtered.length ? filtered[i + 1].start : e.end,
  }));

  // Merge phrases into groups targeting 5-10 seconds
  const TARGET_MIN_SEC = 4;
  const TARGET_MAX_SEC = 10;
  const groups = [];
  let currentTexts = [phrases[0].text];
  let groupStart = phrases[0].start;
  let groupEnd = phrases[0].end;

  for (let i = 1; i < phrases.length; i++) {
    const phrase = phrases[i];
    const currentDur = groupEnd - groupStart;
    const potentialDur = phrase.end - groupStart;

    // Check if adding this phrase would create a good group
    const currentText = currentTexts.join(' ');
    const endsWithSentence = /[.!?]["']?\s*$/.test(currentText);

    if (endsWithSentence && currentDur >= TARGET_MIN_SEC) {
      // Current group ends at a sentence boundary and is long enough - flush it
      groups.push(makeGroup(currentTexts, groupStart, groupEnd));
      currentTexts = [phrase.text];
      groupStart = phrase.start;
      groupEnd = phrase.end;
    } else if (potentialDur <= TARGET_MAX_SEC) {
      // Can still add to current group
      currentTexts.push(phrase.text);
      groupEnd = phrase.end;
    } else if (currentDur >= TARGET_MIN_SEC) {
      // Current group is long enough, start new
      groups.push(makeGroup(currentTexts, groupStart, groupEnd));
      currentTexts = [phrase.text];
      groupStart = phrase.start;
      groupEnd = phrase.end;
    } else {
      // Current group is too short but adding would exceed max - add anyway
      currentTexts.push(phrase.text);
      groupEnd = phrase.end;
      // Flush if now over target
      if (groupEnd - groupStart >= TARGET_MIN_SEC) {
        groups.push(makeGroup(currentTexts, groupStart, groupEnd));
        currentTexts = [];
        if (i + 1 < phrases.length) {
          groupStart = phrases[i + 1].start;
          groupEnd = phrases[i + 1].end;
        }
      }
    }
  }

  // Flush remaining
  if (currentTexts.length > 0) {
    groups.push(makeGroup(currentTexts, groupStart, groupEnd));
  }

  // Post-process: merge very short groups with neighbors
  const result = [];
  for (let i = 0; i < groups.length; i++) {
    const g = groups[i];
    const dur = g.end - g.start;
    if (dur < 2 && result.length > 0) {
      // Merge with previous group
      const prev = result[result.length - 1];
      prev.en = prev.en + ' ' + g.en;
      prev.end = g.end;
    } else {
      result.push(g);
    }
  }

  return result;
}

function makeGroup(texts, start, end) {
  let text = texts.join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Capitalize first letter
  text = text.charAt(0).toUpperCase() + text.slice(1);

  return {
    start: round2(start),
    end: round2(end),
    en: text,
    ko: '',
  };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

// ============================================================
// Groq Translation
// ============================================================

async function translateWithGroq(entries) {
  const BATCH_SIZE = 25;

  for (let batchStart = 0; batchStart < entries.length; batchStart += BATCH_SIZE) {
    const batchEnd = Math.min(batchStart + BATCH_SIZE, entries.length);
    const batch = entries.slice(batchStart, batchEnd);
    const englishTexts = batch.map((e, i) => `${i}: ${e.en}`).join('\n');

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{
            role: 'system',
            content: 'You are a professional English-to-Korean translator for a language learning app. Translate each numbered English sentence to natural, conversational Korean. Return ONLY the translations, one per line, with the same number prefix. Do not add explanations or extra text.'
          }, {
            role: 'user',
            content: englishTexts,
          }],
          temperature: 0.3,
          max_tokens: 4096,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        if (response.status === 429) {
          console.log('  Rate limited, waiting 60s...');
          await new Promise(r => setTimeout(r, 60000));
          batchStart -= BATCH_SIZE; // retry
          continue;
        }
        console.error(`  Groq error (${response.status}):`, errText.substring(0, 150));
        continue;
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '';
      const lines = text.split('\n').filter(l => l.trim());

      for (let i = 0; i < batch.length; i++) {
        const line = lines.find(l => l.startsWith(`${i}:`));
        if (line) {
          entries[batchStart + i].ko = line.replace(/^\d+:\s*/, '').trim();
        }
      }

      // Delay between batches
      if (batchEnd < entries.length) {
        await new Promise(r => setTimeout(r, 2000));
      }
    } catch (err) {
      console.error('  Translation failed:', err.message?.substring(0, 100));
    }
  }
}

// ============================================================
// Main
// ============================================================

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(TMP_DIR, { recursive: true });

  const videos = extractVideoInfo();
  console.log(`Found ${videos.length} unique videos\n`);

  let success = 0, skip = 0, fail = 0, translated = 0;

  for (const video of videos) {
    const { youtubeId: id, clipStart, clipEnd } = video;
    const outFile = path.join(OUT_DIR, `${id}.json`);

    // Translate-only mode
    if (TRANSLATE_ONLY) {
      if (!fs.existsSync(outFile)) { skip++; continue; }
      const existing = JSON.parse(fs.readFileSync(outFile, 'utf8'));
      if (!Array.isArray(existing) || existing.length === 0) { skip++; continue; }
      if (existing.some(e => e.ko && e.ko.trim() !== '')) {
        console.log(`SKIP ${id} (already translated)`);
        skip++;
        continue;
      }
      console.log(`TRANSLATE ${id} (${existing.length} entries)...`);
      await translateWithGroq(existing);
      fs.writeFileSync(outFile, JSON.stringify(existing, null, 2), 'utf8');
      translated++;
      continue;
    }

    // Skip if exists with good content
    if (!FORCE && fs.existsSync(outFile)) {
      try {
        const existing = JSON.parse(fs.readFileSync(outFile, 'utf8'));
        if (Array.isArray(existing) && existing.length > 0) {
          console.log(`SKIP ${id} (${existing.length} entries)`);
          skip++;
          continue;
        }
      } catch {}
    }

    console.log(`FETCH ${id} [clip: ${clipStart}-${clipEnd}s]...`);
    const srtContent = downloadSrt(id);

    if (!srtContent) {
      console.log(`  FAIL ${id}: No subtitles`);
      fail++;
      continue;
    }

    const srtEntries = parseSrt(srtContent);
    if (srtEntries.length === 0) {
      console.log(`  FAIL ${id}: Empty after parsing`);
      fail++;
      continue;
    }

    const grouped = groupIntoSentences(srtEntries, clipStart, clipEnd);
    console.log(`  OK ${id}: ${grouped.length} groups (from ${srtEntries.length} SRT entries)`);

    if (grouped.length > 0) {
      console.log(`  TRANSLATE ${id}...`);
      await translateWithGroq(grouped);
      translated++;
    }

    fs.writeFileSync(outFile, JSON.stringify(grouped, null, 2), 'utf8');
    console.log(`  SAVED ${outFile}`);
    success++;
  }

  // Clean up
  try {
    const tmpFiles = fs.readdirSync(TMP_DIR);
    for (const f of tmpFiles) fs.unlinkSync(path.join(TMP_DIR, f));
    fs.rmdirSync(TMP_DIR);
  } catch {}

  console.log(`\nDone! Success: ${success}, Skipped: ${skip}, Failed: ${fail}, Translated: ${translated}`);
}

main().catch(console.error);
