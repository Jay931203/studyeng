#!/usr/bin/env node
/**
 * check-duplicates.mjs
 * Checks the Shortee video catalog for duplicate/conflicting entries.
 *
 * Checks performed:
 * 1. Duplicate youtubeId (same YouTube video added twice)
 * 2. Duplicate/very similar titles within a series
 * 3. Episode number conflicts (same seriesId + same episodeNumber)
 * 4. Title quality (auto-generated patterns, redundant series names)
 * 5. Category consistency (video category vs series category mismatch)
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const seedPath = resolve(__dirname, '../src/data/seed-videos.ts');

// ---------------------------------------------------------------------------
// 1. Parse seed-videos.ts
// ---------------------------------------------------------------------------
const raw = readFileSync(seedPath, 'utf-8');

// Parse the series array
function parseSeries(src) {
  const match = src.match(/export\s+const\s+series:\s*Series\[\]\s*=\s*\[([\s\S]*?)\n\]/);
  if (!match) { console.error('Could not find series array'); return []; }
  const body = match[1];
  const entries = [];
  const re = /\{([^}]+)\}/g;
  let m;
  while ((m = re.exec(body)) !== null) {
    const block = m[1];
    const get = (key) => {
      const r = new RegExp(`${key}:\\s*(?:'([^']*)'|"([^"]*)"|(\d+))`);
      const mm = block.match(r);
      if (!mm) return undefined;
      return mm[1] ?? mm[2] ?? mm[3];
    };
    entries.push({
      id: get('id'),
      title: get('title'),
      category: get('category'),
      episodeCount: Number(get('episodeCount') ?? 0),
    });
  }
  return entries;
}

// Parse the seedVideos array
function parseVideos(src) {
  // Find the start of the seedVideos array
  const startIdx = src.indexOf('export const seedVideos');
  if (startIdx === -1) { console.error('Could not find seedVideos'); return []; }

  const videoSection = src.slice(startIdx);
  const lines = videoSection.split('\n');
  const videos = [];
  let current = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect start of a video object block by "id:" field
    const idMatch = trimmed.match(/^id:\s*'([^']+)'/);
    if (idMatch) {
      current = { id: idMatch[1] };
      continue;
    }
    if (!current) continue;

    // youtubeId
    const ytMatch = trimmed.match(/^youtubeId:\s*'([^']+)'/);
    if (ytMatch) { current.youtubeId = ytMatch[1]; continue; }

    // title - extract everything between the first ' and the last ',
    const titleMatch = trimmed.match(/^title:\s*'(.+)',?\s*$/);
    if (titleMatch) {
      let t = titleMatch[1];
      // Remove trailing quote if present
      if (t.endsWith("'")) t = t.slice(0, -1);
      current.title = t.replace(/\\'/g, "'");
      continue;
    }

    // category
    const catMatch = trimmed.match(/^category:\s*'([^']+)'/);
    if (catMatch) { current.category = catMatch[1]; continue; }

    // difficulty
    const diffMatch = trimmed.match(/^difficulty:\s*(\d+)/);
    if (diffMatch) { current.difficulty = Number(diffMatch[1]); continue; }

    // seriesId
    const seriesMatch = trimmed.match(/^seriesId:\s*'([^']+)'/);
    if (seriesMatch) { current.seriesId = seriesMatch[1]; continue; }

    // episodeNumber
    const epMatch = trimmed.match(/^episodeNumber:\s*(\d+)/);
    if (epMatch) { current.episodeNumber = Number(epMatch[1]); continue; }

    // End of block
    if (trimmed === 'subtitles: [],') {
      if (current.youtubeId) {
        videos.push(current);
      }
      current = null;
    }
  }

  return videos;
}

const seriesList = parseSeries(raw);
const videos = parseVideos(raw);

console.log(`Parsed ${seriesList.length} series, ${videos.length} videos`);

// Build series lookup
const seriesMap = new Map();
for (const s of seriesList) {
  seriesMap.set(s.id, s);
}

// ---------------------------------------------------------------------------
// 2. Check 1: Duplicate youtubeId
// ---------------------------------------------------------------------------
const youtubeIdMap = new Map(); // youtubeId -> [video entries]
for (const v of videos) {
  if (!youtubeIdMap.has(v.youtubeId)) youtubeIdMap.set(v.youtubeId, []);
  youtubeIdMap.get(v.youtubeId).push(v);
}

const duplicateYoutubeIds = [];
for (const [ytId, vids] of youtubeIdMap) {
  if (vids.length > 1) {
    duplicateYoutubeIds.push({
      youtubeId: ytId,
      count: vids.length,
      entries: vids.map(v => ({ id: v.id, title: v.title, seriesId: v.seriesId, episodeNumber: v.episodeNumber })),
    });
  }
}

console.log(`\n=== CHECK 1: Duplicate youtubeIds ===`);
console.log(`Found ${duplicateYoutubeIds.length} duplicate youtubeIds`);
for (const d of duplicateYoutubeIds) {
  console.log(`  ${d.youtubeId} (${d.count}x):`);
  for (const e of d.entries) {
    console.log(`    - ${e.id} | "${e.title}" | series=${e.seriesId} ep=${e.episodeNumber}`);
  }
}

// ---------------------------------------------------------------------------
// 3. Check 2: Duplicate/similar titles within series
// ---------------------------------------------------------------------------
function normalizeTitle(t) {
  return t.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function similarity(a, b) {
  // Simple Jaccard-like approach on words
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter(Boolean));
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter(Boolean));
  if (wordsA.size === 0 && wordsB.size === 0) return 1;
  let intersection = 0;
  for (const w of wordsA) if (wordsB.has(w)) intersection++;
  const union = new Set([...wordsA, ...wordsB]).size;
  return union === 0 ? 0 : intersection / union;
}

const seriesVideos = new Map(); // seriesId -> [videos]
for (const v of videos) {
  if (!v.seriesId) continue;
  if (!seriesVideos.has(v.seriesId)) seriesVideos.set(v.seriesId, []);
  seriesVideos.get(v.seriesId).push(v);
}

const duplicateTitlesInSeries = [];
for (const [sid, vids] of seriesVideos) {
  // Check exact duplicates (normalized)
  const seen = new Map(); // normalized -> [videos]
  for (const v of vids) {
    const norm = normalizeTitle(v.title);
    if (!seen.has(norm)) seen.set(norm, []);
    seen.get(norm).push(v);
  }
  for (const [norm, group] of seen) {
    if (group.length > 1) {
      duplicateTitlesInSeries.push({
        seriesId: sid,
        type: 'exact_duplicate',
        title: group[0].title,
        entries: group.map(v => ({ id: v.id, episodeNumber: v.episodeNumber, youtubeId: v.youtubeId })),
      });
    }
  }

  // Check very similar titles (Jaccard > 0.8 and different normalized)
  for (let i = 0; i < vids.length; i++) {
    for (let j = i + 1; j < vids.length; j++) {
      const normA = normalizeTitle(vids[i].title);
      const normB = normalizeTitle(vids[j].title);
      if (normA === normB) continue; // already caught above
      const sim = similarity(vids[i].title, vids[j].title);
      if (sim >= 0.8) {
        duplicateTitlesInSeries.push({
          seriesId: sid,
          type: 'very_similar',
          similarity: Math.round(sim * 100) + '%',
          titleA: vids[i].title,
          titleB: vids[j].title,
          entries: [
            { id: vids[i].id, episodeNumber: vids[i].episodeNumber, youtubeId: vids[i].youtubeId },
            { id: vids[j].id, episodeNumber: vids[j].episodeNumber, youtubeId: vids[j].youtubeId },
          ],
        });
      }
    }
  }
}

console.log(`\n=== CHECK 2: Duplicate/similar titles within series ===`);
console.log(`Found ${duplicateTitlesInSeries.length} issues`);
for (const d of duplicateTitlesInSeries) {
  if (d.type === 'exact_duplicate') {
    console.log(`  [EXACT] series=${d.seriesId} title="${d.title}" (${d.entries.length}x)`);
  } else {
    console.log(`  [SIMILAR ${d.similarity}] series=${d.seriesId} "${d.titleA}" vs "${d.titleB}"`);
  }
}

// ---------------------------------------------------------------------------
// 4. Check 3: Episode number conflicts
// ---------------------------------------------------------------------------
const episodeConflicts = [];
for (const [sid, vids] of seriesVideos) {
  const epMap = new Map(); // episodeNumber -> [videos]
  for (const v of vids) {
    if (v.episodeNumber === undefined) continue;
    const ep = v.episodeNumber;
    if (!epMap.has(ep)) epMap.set(ep, []);
    epMap.get(ep).push(v);
  }
  for (const [ep, group] of epMap) {
    if (group.length > 1) {
      episodeConflicts.push({
        seriesId: sid,
        episodeNumber: ep,
        count: group.length,
        entries: group.map(v => ({ id: v.id, title: v.title, youtubeId: v.youtubeId })),
      });
    }
  }
}

console.log(`\n=== CHECK 3: Episode number conflicts ===`);
console.log(`Found ${episodeConflicts.length} conflicts`);
for (const c of episodeConflicts) {
  console.log(`  series=${c.seriesId} ep=${c.episodeNumber} (${c.count}x):`);
  for (const e of c.entries) {
    console.log(`    - ${e.id} | "${e.title}" | ytId=${e.youtubeId}`);
  }
}

// ---------------------------------------------------------------------------
// 5. Check 4: Title quality issues
// ---------------------------------------------------------------------------
const titleQualityIssues = [];

for (const v of videos) {
  const s = v.seriesId ? seriesMap.get(v.seriesId) : null;
  const issues = [];

  // Check for redundant series name in title
  if (s) {
    const seriesTitle = s.title.toLowerCase();
    const videoTitle = v.title.toLowerCase();
    // Pattern: "SeriesName - Something" or "SeriesName: Something" or "SeriesName S1E1"
    if (videoTitle.startsWith(seriesTitle + ' -') ||
        videoTitle.startsWith(seriesTitle + ':') ||
        videoTitle.startsWith(seriesTitle + ' s') ||
        videoTitle.startsWith(seriesTitle + ' |')) {
      issues.push('redundant_series_name');
    }
    // Also check if the title is basically just the series name
    if (normalizeTitle(v.title) === normalizeTitle(s.title)) {
      issues.push('title_is_just_series_name');
    }
  }

  // Check for auto-generated patterns
  if (/^(ep|episode)\s*\d+$/i.test(v.title.trim())) {
    issues.push('auto_generated_episode_only');
  }
  if (/^(clip|scene|part)\s*\d+$/i.test(v.title.trim())) {
    issues.push('auto_generated_generic');
  }
  // Check for empty or very short titles
  if (v.title.trim().length < 3) {
    issues.push('title_too_short');
  }
  // Check for YouTube-style auto titles
  if (/^https?:\/\//i.test(v.title)) {
    issues.push('title_is_url');
  }

  if (issues.length > 0) {
    titleQualityIssues.push({
      id: v.id,
      youtubeId: v.youtubeId,
      title: v.title,
      seriesId: v.seriesId,
      seriesTitle: s?.title,
      issues,
    });
  }
}

console.log(`\n=== CHECK 4: Title quality issues ===`);
console.log(`Found ${titleQualityIssues.length} issues`);
for (const t of titleQualityIssues) {
  console.log(`  ${t.id} | "${t.title}" | issues=${t.issues.join(', ')}`);
}

// ---------------------------------------------------------------------------
// 6. Check 5: Category consistency
// ---------------------------------------------------------------------------
const categoryMismatches = [];
for (const v of videos) {
  if (!v.seriesId) continue;
  const s = seriesMap.get(v.seriesId);
  if (!s) {
    categoryMismatches.push({
      id: v.id,
      youtubeId: v.youtubeId,
      title: v.title,
      seriesId: v.seriesId,
      videoCategory: v.category,
      seriesCategory: null,
      issue: 'series_not_found',
    });
    continue;
  }
  if (v.category !== s.category) {
    categoryMismatches.push({
      id: v.id,
      youtubeId: v.youtubeId,
      title: v.title,
      seriesId: v.seriesId,
      videoCategory: v.category,
      seriesCategory: s.category,
      issue: 'category_mismatch',
    });
  }
}

console.log(`\n=== CHECK 5: Category consistency ===`);
console.log(`Found ${categoryMismatches.length} mismatches`);
for (const m of categoryMismatches) {
  console.log(`  ${m.id} | series=${m.seriesId} | video=${m.videoCategory} vs series=${m.seriesCategory} | ${m.issue}`);
}

// ---------------------------------------------------------------------------
// 7. Build and write report
// ---------------------------------------------------------------------------
const report = {
  timestamp: new Date().toISOString(),
  totalVideos: videos.length,
  totalSeries: seriesList.length,
  checks: {
    duplicateYoutubeIds: {
      count: duplicateYoutubeIds.length,
      items: duplicateYoutubeIds,
    },
    duplicateTitlesInSeries: {
      count: duplicateTitlesInSeries.length,
      items: duplicateTitlesInSeries,
    },
    episodeNumberConflicts: {
      count: episodeConflicts.length,
      items: episodeConflicts,
    },
    titleQualityIssues: {
      count: titleQualityIssues.length,
      items: titleQualityIssues,
    },
    categoryMismatches: {
      count: categoryMismatches.length,
      items: categoryMismatches,
    },
  },
  summary: {
    duplicateYoutubeIds: duplicateYoutubeIds.length,
    duplicateTitlesInSeries: duplicateTitlesInSeries.length,
    episodeNumberConflicts: episodeConflicts.length,
    titleQualityIssues: titleQualityIssues.length,
    categoryMismatches: categoryMismatches.length,
  },
};

const reportPath = resolve(__dirname, '../logs/duplicate-check-report.json');
writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`\nReport written to ${reportPath}`);
console.log(`\n=== SUMMARY ===`);
console.log(JSON.stringify(report.summary, null, 2));
