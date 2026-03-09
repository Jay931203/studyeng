#!/usr/bin/env node
/**
 * generate-tag-templates.mjs
 *
 * Reads all transcript JSON files and generates empty expression-tag
 * template files ready to be filled in by an AI tagger.
 *
 * Usage:  node scripts/generate-tag-templates.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const TRANSCRIPTS_DIR = path.join(ROOT, 'public', 'transcripts');
const TAGS_DIR = path.join(ROOT, 'public', 'expression-tags');
const SEED_FILE = path.join(ROOT, 'src', 'data', 'seed-videos.ts');

// ── Step 0: Parse seed-videos.ts to build videoId → metadata map ──

function parseSeedVideos() {
  const src = fs.readFileSync(SEED_FILE, 'utf-8');

  // We need to extract each video object block from the seedVideos array.
  // The array starts at "export const seedVideos" and contains objects with
  // youtubeId, title, category, seriesId fields.
  //
  // Strategy: find each { ... } block inside the array and extract the fields
  // we care about using per-field regexes.

  const map = new Map(); // youtubeId → { category, title, seriesId }

  // Match each object literal in the seedVideos array section
  const arrayStart = src.indexOf('export const seedVideos');
  if (arrayStart === -1) {
    console.error('Could not find seedVideos in seed-videos.ts');
    process.exit(1);
  }

  const arraySection = src.slice(arrayStart);

  // Use a regex to find each object block (opening { to closing })
  // We look for youtubeId inside each block
  const blockRegex = /\{[^{}]*youtubeId:\s*'([^']+)'[^{}]*\}/gs;
  let match;

  while ((match = blockRegex.exec(arraySection)) !== null) {
    const block = match[0];
    const youtubeId = match[1];

    const titleMatch = block.match(/title:\s*'((?:[^'\\]|\\.)*)'|title:\s*"((?:[^"\\]|\\.)*)"/);
    const categoryMatch = block.match(/category:\s*'([^']+)'/);
    const seriesIdMatch = block.match(/seriesId:\s*'([^']+)'/);

    const rawTitle = titleMatch ? (titleMatch[1] ?? titleMatch[2] ?? '') : '';
    // Unescape backslash-escaped quotes from TypeScript source
    const title = rawTitle.replace(/\\'/g, "'").replace(/\\"/g, '"');

    map.set(youtubeId, {
      category: categoryMatch ? categoryMatch[1] : 'unknown',
      title,
      seriesId: seriesIdMatch ? seriesIdMatch[1] : '',
    });
  }

  console.log(`Parsed ${map.size} videos from seed-videos.ts`);
  return map;
}

// ── Step 1: Clean output directory ──

function prepareOutputDir() {
  if (fs.existsSync(TAGS_DIR)) {
    const existing = fs.readdirSync(TAGS_DIR).filter(f => f.endsWith('.json'));
    for (const f of existing) {
      fs.unlinkSync(path.join(TAGS_DIR, f));
    }
    console.log(`Deleted ${existing.length} existing expression-tag files`);
  } else {
    fs.mkdirSync(TAGS_DIR, { recursive: true });
    console.log('Created expression-tags directory');
  }
}

// ── Step 2: Generate templates ──

function emptyTags() {
  return {
    functions: [],
    situation: '',
    cefr: '',
    register: '',
    emotions: [],
    expression_types: [],
    vibe: '',
    power: [],
    grammar_intent: [],
    flags: [],
  };
}

function generateTemplates(videoMap) {
  const transcriptFiles = fs.readdirSync(TRANSCRIPTS_DIR).filter(f => f.endsWith('.json'));
  console.log(`Found ${transcriptFiles.length} transcript files`);

  let totalFiles = 0;
  let totalSentences = 0;
  let skippedCount = 0;
  let unknownCount = 0;

  for (const file of transcriptFiles) {
    const videoId = path.basename(file, '.json');

    // Read transcript
    let transcript;
    try {
      const raw = fs.readFileSync(path.join(TRANSCRIPTS_DIR, file), 'utf-8');
      transcript = JSON.parse(raw);
    } catch (err) {
      console.warn(`  SKIP (parse error): ${file} — ${err.message}`);
      skippedCount++;
      continue;
    }

    if (!Array.isArray(transcript) || transcript.length === 0) {
      console.warn(`  SKIP (empty/invalid): ${file}`);
      skippedCount++;
      continue;
    }

    // Look up metadata
    const meta = videoMap.get(videoId) || {
      category: 'unknown',
      title: '',
      seriesId: '',
    };

    if (!videoMap.has(videoId)) {
      unknownCount++;
    }

    // Build sentences array
    const sentences = transcript.map((entry, idx) => ({
      id: `${videoId}-${idx}`,
      en: entry.en || '',
      ko: entry.ko || '',
      tags: emptyTags(),
    }));

    const output = {
      videoId,
      category: meta.category,
      title: meta.title,
      seriesId: meta.seriesId,
      sentenceCount: sentences.length,
      taggedCount: 0,
      sentences,
    };

    fs.writeFileSync(
      path.join(TAGS_DIR, `${videoId}.json`),
      JSON.stringify(output, null, 2),
      'utf-8'
    );

    totalFiles++;
    totalSentences += sentences.length;
  }

  return { totalFiles, totalSentences, skippedCount, unknownCount };
}

// ── Main ──

console.log('=== Expression Tag Template Generator ===\n');

const videoMap = parseSeedVideos();
prepareOutputDir();
const { totalFiles, totalSentences, skippedCount, unknownCount } = generateTemplates(videoMap);

console.log('\n=== Summary ===');
console.log(`Total template files created: ${totalFiles}`);
console.log(`Total sentences across all files: ${totalSentences}`);
console.log(`Skipped (parse error / empty): ${skippedCount}`);
console.log(`Videos not in seed-videos (category=unknown): ${unknownCount}`);
