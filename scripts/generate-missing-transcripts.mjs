#!/usr/bin/env node

/**
 * Generate static transcript files for videos missing from public/transcripts/.
 *
 * Uses YouTube InnerTube API to fetch auto-captions (English),
 * groups into ~4s segments, translates to Korean via Claude Haiku,
 * and saves as public/transcripts/{youtubeId}.json.
 *
 * Usage: node scripts/generate-missing-transcripts.mjs
 */

import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// Load environment variables from .env.local
dotenv.config({ path: path.join(ROOT, '.env.local') });
dotenv.config({ path: path.join(ROOT, '.env') });

const TRANSCRIPTS_DIR = path.join(ROOT, 'public', 'transcripts');
const MANIFEST_PATH = path.join(ROOT, 'scripts', 'whisper-manifest.json');
const MISSING_PATH = path.join(ROOT, 'output', 'missing-transcripts.json');

const CONCURRENCY = 3;
const BATCH_SIZE = 50;
const TRANSCRIPT_FETCH_TIMEOUT_MS = 15000;

const INNERTUBE_URL = 'https://www.youtube.com/youtubei/v1/player?prettyPrint=false';
const ANDROID_UA = 'com.google.android.youtube/20.10.38 (Linux; U; Android 14)';
const INNERTUBE_CONTEXT = {
  client: {
    clientName: 'ANDROID',
    clientVersion: '20.10.38',
  },
};

// ── HTML entity decoding ──

function decodeHTMLEntities(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/\n/g, ' ');
}

// ── Grouping logic (copied from src/app/api/transcript/route.ts) ──

function endsWithSentenceBoundary(text) {
  return /[.!?]["']?\s*$/.test(text);
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function normalizeComparableText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function isLikelyProgressiveDuplicate(previous, next) {
  const prevText = normalizeComparableText(previous.en);
  const nextText = normalizeComparableText(next.en);
  if (!prevText || !nextText) return false;
  if (next.start > previous.end + 0.15) return false;
  if (prevText === nextText) return true;
  const shorter = prevText.length <= nextText.length ? prevText : nextText;
  const longer = prevText.length <= nextText.length ? nextText : prevText;
  return shorter.length >= 12 && longer.includes(shorter);
}

function pickMoreCompleteTimedEntry(previous, next) {
  const prevText = normalizeComparableText(previous.en);
  const nextText = normalizeComparableText(next.en);
  const keepNext = nextText.length >= prevText.length;
  const chosen = keepNext ? next : previous;
  return {
    ...chosen,
    start: round2(Math.min(previous.start, next.start)),
    end: round2(Math.max(previous.end, next.end)),
  };
}

function normalizeGeneratedEntries(entries) {
  if (entries.length === 0) return [];
  const normalized = [];
  const sorted = [...entries].sort((a, b) => a.start - b.start || a.end - b.end);

  for (const raw of sorted) {
    const entry = {
      ...raw,
      start: round2(Math.max(0, raw.start)),
      end: round2(Math.max(raw.end, raw.start + 0.25)),
    };
    const prev = normalized[normalized.length - 1];
    if (!prev) {
      normalized.push(entry);
      continue;
    }
    if (isLikelyProgressiveDuplicate(prev, entry)) {
      normalized[normalized.length - 1] = pickMoreCompleteTimedEntry(prev, entry);
      continue;
    }
    if (entry.start < prev.end) {
      const boundary = round2((prev.end + entry.start) / 2);
      prev.end = round2(Math.max(prev.start + 0.25, boundary));
      entry.start = prev.end;
    }
    if (entry.end <= entry.start) {
      entry.end = round2(entry.start + 0.25);
    }
    normalized.push(entry);
  }
  return normalized;
}

function groupTranscriptEntries(raw) {
  if (raw.length === 0) return [];
  const TARGET_DURATION = 4;
  const MAX_DURATION = 6;
  const MAX_TEXT_LENGTH = 120;
  const subtitles = [];
  let currentTexts = [];
  let segmentStart = raw[0].offset / 1000;
  let segmentEnd = segmentStart;

  for (let i = 0; i < raw.length; i++) {
    const entry = raw[i];
    const entryStart = entry.offset / 1000;
    const entryEnd = entryStart + entry.duration / 1000;
    const text = decodeHTMLEntities(entry.text).trim();
    if (!text) continue;

    if (currentTexts.length === 0) {
      segmentStart = entryStart;
      segmentEnd = entryEnd;
      currentTexts.push(text);
    } else {
      const potentialDuration = entryEnd - segmentStart;
      const potentialText = [...currentTexts, text].join(' ');

      if (potentialDuration <= TARGET_DURATION && potentialText.length <= MAX_TEXT_LENGTH) {
        currentTexts.push(text);
        segmentEnd = entryEnd;
      } else if (
        potentialDuration <= MAX_DURATION &&
        potentialText.length <= MAX_TEXT_LENGTH &&
        !endsWithSentenceBoundary(currentTexts[currentTexts.length - 1])
      ) {
        currentTexts.push(text);
        segmentEnd = entryEnd;
      } else {
        subtitles.push({
          start: round2(segmentStart),
          end: round2(segmentEnd),
          en: currentTexts.join(' '),
          ko: '',
        });
        segmentStart = entryStart;
        segmentEnd = entryEnd;
        currentTexts = [text];
      }
    }
  }

  if (currentTexts.length > 0) {
    subtitles.push({
      start: round2(segmentStart),
      end: round2(segmentEnd),
      en: currentTexts.join(' '),
      ko: '',
    });
  }

  return normalizeGeneratedEntries(subtitles);
}

// ── Fetch transcript via YouTube InnerTube API ──

function parseTranscriptXml(xml) {
  const entries = [];

  // Try new format: <p t="ms" d="ms">text</p>
  const pRegex = /<p\s+t="(\d+)"\s+d="(\d+)"[^>]*>([\s\S]*?)<\/p>/g;
  let match;
  while ((match = pRegex.exec(xml)) !== null) {
    const offset = parseInt(match[1], 10);
    const duration = parseInt(match[2], 10);
    let rawText = match[3];

    // Extract text from <s> tags if present, otherwise strip tags
    let text = '';
    const sRegex = /<s[^>]*>([^<]*)<\/s>/g;
    let sMatch;
    while ((sMatch = sRegex.exec(rawText)) !== null) {
      text += sMatch[1];
    }
    if (!text) {
      text = rawText.replace(/<[^>]+>/g, '');
    }
    text = decodeHTMLEntities(text).trim();
    if (text) {
      entries.push({ text, offset, duration });
    }
  }

  // Fallback: old format <text start="sec" dur="sec">text</text>
  if (entries.length === 0) {
    const textRegex = /<text start="([^"]*)" dur="([^"]*)">([^<]*)<\/text>/g;
    while ((match = textRegex.exec(xml)) !== null) {
      const offset = parseFloat(match[1]) * 1000;
      const duration = parseFloat(match[2]) * 1000;
      const text = decodeHTMLEntities(match[3]).trim();
      if (text) {
        entries.push({ text, offset, duration });
      }
    }
  }

  return entries;
}

async function fetchTranscriptInnerTube(videoId) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TRANSCRIPT_FETCH_TIMEOUT_MS);

  try {
    // Step 1: Get caption tracks via InnerTube API
    const playerResp = await fetch(INNERTUBE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': ANDROID_UA,
      },
      body: JSON.stringify({
        context: INNERTUBE_CONTEXT,
        videoId,
      }),
      signal: controller.signal,
    });

    if (!playerResp.ok) return null;

    const playerData = await playerResp.json();
    const tracks = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

    if (!Array.isArray(tracks) || tracks.length === 0) return null;

    // Prefer English track, fallback to first available
    const enTrack = tracks.find(t => t.languageCode === 'en' && !t.kind) ||
                    tracks.find(t => t.languageCode === 'en') ||
                    tracks[0];

    if (!enTrack?.baseUrl) return null;

    // Step 2: Fetch the transcript XML
    const xmlResp = await fetch(enTrack.baseUrl, {
      headers: { 'User-Agent': ANDROID_UA },
      signal: controller.signal,
    });

    if (!xmlResp.ok) return null;

    const xml = await xmlResp.text();
    if (!xml || xml.length === 0) return null;

    return parseTranscriptXml(xml);
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ── Translate with Claude ──

async function translateSubtitles(client, entries) {
  if (entries.length === 0) return entries;

  const translated = [...entries];

  for (let batchStart = 0; batchStart < entries.length; batchStart += BATCH_SIZE) {
    const batchEnd = Math.min(batchStart + BATCH_SIZE, entries.length);
    const batch = entries.slice(batchStart, batchEnd);

    const englishTexts = batch.map((e, i) => `${i}: ${e.en}`).join('\n');

    let retries = 2;
    while (retries >= 0) {
      try {
        const response = await client.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 4096,
          messages: [
            {
              role: 'user',
              content: `Translate each numbered English sentence to natural, conversational Korean. Return ONLY the translations, one per line, with the same number prefix. Do not add any explanation.\n\n${englishTexts}`,
            },
          ],
        });

        const text = response.content[0].type === 'text' ? response.content[0].text : '';
        const lines = text.split('\n').filter((l) => l.trim());

        for (let i = 0; i < batch.length; i++) {
          const line = lines.find((l) => l.startsWith(`${i}:`));
          if (line) {
            translated[batchStart + i] = {
              ...translated[batchStart + i],
              ko: line.replace(/^\d+:\s*/, '').trim(),
            };
          }
        }
        break; // success
      } catch (err) {
        if (retries > 0 && (err.status === 429 || err.status === 529)) {
          console.log(`    Rate limited, waiting 30s before retry...`);
          await sleep(30000);
          retries--;
        } else {
          console.error(`    Translation error:`, err.message || err);
          break;
        }
      }
    }
  }

  return translated;
}

// ── Helpers ──

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Main ──

async function main() {
  // Load missing IDs
  const missingData = JSON.parse(fs.readFileSync(MISSING_PATH, 'utf-8'));
  const allIds = [];
  for (const cat of Object.values(missingData.byCategory)) {
    allIds.push(...cat.youtubeIds);
  }

  // Filter out already-existing files
  const missingIds = allIds.filter((id) => !fs.existsSync(path.join(TRANSCRIPTS_DIR, `${id}.json`)));

  console.log(`Total missing: ${allIds.length}, already generated: ${allIds.length - missingIds.length}, to process: ${missingIds.length}`);

  if (missingIds.length === 0) {
    console.log('Nothing to do!');
    return;
  }

  // Init Claude client (optional - will skip translation if no key)
  const apiKey = process.env.ANTHROPIC_API_KEY;
  let client = null;
  if (apiKey) {
    client = new Anthropic({ apiKey });
    console.log('Anthropic API key found - will translate to Korean');
  } else {
    console.log('WARNING: No ANTHROPIC_API_KEY - will save English-only transcripts (ko will be empty)');
  }

  // Load manifest
  let manifest = {};
  if (fs.existsSync(MANIFEST_PATH)) {
    manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
  }

  let successCount = 0;
  let failCount = 0;
  let noTranscriptCount = 0;
  const failures = [];

  // Process with concurrency
  let index = 0;

  async function processOne() {
    while (index < missingIds.length) {
      const currentIndex = index++;
      const videoId = missingIds[currentIndex];
      const num = currentIndex + 1;

      try {
        // Fetch transcript via InnerTube API
        const rawTranscript = await fetchTranscriptInnerTube(videoId);

        if (!rawTranscript || rawTranscript.length === 0) {
          console.log(`Processing ${num}/${missingIds.length}: ${videoId} - NO CAPTIONS`);
          noTranscriptCount++;
          failures.push({ id: videoId, reason: 'no captions' });
          continue;
        }

        // Group entries
        const grouped = groupTranscriptEntries(rawTranscript);

        // Translate (if API key available)
        const subtitles = client ? await translateSubtitles(client, grouped) : grouped;

        // Save file
        const outputPath = path.join(TRANSCRIPTS_DIR, `${videoId}.json`);
        fs.writeFileSync(outputPath, JSON.stringify(subtitles, null, 2));

        // Update manifest
        manifest[videoId] = {
          provider: 'youtube-innertube',
          model: 'youtube-auto-captions',
          processedAt: new Date().toISOString(),
          cost: 0,
        };

        successCount++;
        console.log(`Processing ${num}/${missingIds.length}: ${videoId} - OK (${subtitles.length} segments)`);
      } catch (err) {
        failCount++;
        failures.push({ id: videoId, reason: err.message || String(err) });
        console.log(`Processing ${num}/${missingIds.length}: ${videoId} - FAIL: ${err.message || err}`);
      }

      // Small delay to avoid hammering YouTube
      await sleep(500);
    }
  }

  // Run concurrent workers
  const workers = [];
  for (let i = 0; i < CONCURRENCY; i++) {
    workers.push(processOne());
  }
  await Promise.all(workers);

  // Save updated manifest
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

  console.log('\n=== SUMMARY ===');
  console.log(`Success: ${successCount}`);
  console.log(`No captions: ${noTranscriptCount}`);
  console.log(`Failed: ${failCount}`);
  console.log(`Total: ${successCount + noTranscriptCount + failCount}`);

  if (failures.length > 0) {
    console.log('\nFailures:');
    for (const f of failures) {
      console.log(`  ${f.id}: ${f.reason}`);
    }
    // Save failures for reference
    fs.writeFileSync(
      path.join(ROOT, 'output', 'transcript-generation-failures.json'),
      JSON.stringify({ generatedAt: new Date().toISOString(), failures }, null, 2)
    );
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
