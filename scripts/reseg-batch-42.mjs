import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const TRANSCRIPTS_DIR = 'C:/Users/hyunj/studyeng/public/transcripts';
const RESULTS_DIR = 'C:/Users/hyunj/studyeng/src/data/reseg-results';

const VIDEO_IDS = [
  'VeZ3vJyW_DQ','VFMaq3DuMTE','VFUos9sYbHs','VG78fq6KAPA','vhhgI4tSMwc',
  'VHZI9_we5GQ','vi0Lbjs5ECI','ViEjSgM4hIs','-ViPmcdlfbQ','VJ62EfUKI3w',
  'VKnNUYknsuQ','VLgvY9gZIEk','VlSkPA60ujQ','vlWBa7iqEZg','vmAuKm4OGW8',
  'VNJN1aV8YWI','vooZITJoPaQ','votcOf5cYCM','v-pbGAts_Fg','vPidnzJXxjI',
  'vpvaXmi4G6I','VQRjouwKDlU','VqWIZGbtZAk','vso2nP4edrk','vSukWUG4Amc',
  'VsYmwBOYfW8','vt0i6nuqNEo','Vt83zQdunBo','VtpzSXuBHac','Vu9gzndeCLM',
  'vvLZ2t5cm0Y','vVPT0JT1dOw','vVqCU0iWlFM','VVQX5fegiqs','VwI6gvZXgMc',
  'vx2u5uUu3DE'
];

const ABBREVS = /(?:Dr|Mr|Mrs|Ms|U\.S|St|Jr|Sr|vs|etc|Prof|Gen|Gov|Sgt|Lt|Col|Maj|Capt|Rev|Vol|Inc|Corp|Ltd)\./gi;

function isMusic(seg) {
  const en = seg.en.trim();
  return /^[♪\-\s]*$/.test(en) || (/^-?♪/.test(en) && en.replace(/[♪\-\s]/g, '').length < 5);
}

function isLyrics(seg) {
  const en = seg.en.trim();
  return en.includes('♪') && en.replace(/[♪\-\s]/g, '').length > 5;
}

function dur(seg) {
  return +(seg.end - seg.start).toFixed(2);
}

function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function maskAbbrevs(text) {
  return text.replace(ABBREVS, (m) => m.replace(/\./g, '\u0000'));
}

function unmaskAbbrevs(text) {
  return text.replace(/\u0000/g, '.');
}

function countSentences(text) {
  const masked = maskAbbrevs(text);
  const sents = masked.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
  return sents.length;
}

function splitSentences(text) {
  const masked = maskAbbrevs(text);
  const parts = masked.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
  return parts.map(p => unmaskAbbrevs(p.trim()));
}

function proportionalSplit(start, end, texts) {
  const totalChars = texts.reduce((sum, t) => sum + t.length, 0);
  const totalDur = end - start;
  const result = [];
  let cursor = start;
  for (let i = 0; i < texts.length; i++) {
    const ratio = texts[i].length / totalChars;
    const segEnd = i === texts.length - 1 ? end : +(cursor + totalDur * ratio).toFixed(2);
    result.push({ start: +cursor.toFixed(2), end: +segEnd.toFixed(2) });
    cursor = segEnd;
  }
  return result;
}

function splitKo(ko, enParts) {
  if (enParts.length <= 1) return [ko];
  const koSents = splitSentences(ko);
  if (koSents.length === enParts.length) {
    return koSents;
  }
  if (koSents.length > 1 && koSents.length >= enParts.length) {
    const result = [];
    const ratio = koSents.length / enParts.length;
    for (let i = 0; i < enParts.length; i++) {
      const startIdx = Math.round(i * ratio);
      const endIdx = Math.round((i + 1) * ratio);
      result.push(koSents.slice(startIdx, endIdx).join(' '));
    }
    return result;
  }
  const result = [ko];
  for (let i = 1; i < enParts.length; i++) result.push('');
  return result;
}

function splitAtClause(text) {
  const masked = maskAbbrevs(text);
  // Try conjunction-based splits
  const parts = masked.split(/,\s+(?=(?:and|but|or|so|because|when|while|if|that|which|who|where|then|yet)\s)/i);
  if (parts.length >= 2) return parts.map(p => unmaskAbbrevs(p.trim()));
  // Try semicolons or colons
  const parts2 = masked.split(/[;:]\s+/);
  if (parts2.length >= 2) return parts2.map(p => unmaskAbbrevs(p.trim()));
  // Try any comma
  const parts3 = masked.split(/,\s+/);
  if (parts3.length >= 2) return parts3.map(p => unmaskAbbrevs(p.trim()));
  return [text];
}

function resegment(segments) {
  if (!segments || segments.length === 0) return segments;
  let result = [];

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const d = dur(seg);
    const en = seg.en.trim();
    const ko = seg.ko.trim();

    // Rule H: Skip pure music segments
    if (isMusic(seg)) continue;

    // Rule I: Keep lyrics as-is
    if (isLyrics(seg)) {
      result.push({ ...seg });
      continue;
    }

    const sentCount = countSentences(en);
    const wc = wordCount(en);

    // Rule G: Tiny segments (<=2 words, <1.5s) - merge with previous if adjacent (gap < 1s)
    if (wc <= 2 && d < 1.5 && result.length > 0) {
      const prev = result[result.length - 1];
      const gap = seg.start - prev.end;
      if (gap < 1) {
        prev.end = seg.end;
        prev.en = prev.en + ' ' + en;
        prev.ko = prev.ko + (ko ? ' ' + ko : '');
        continue;
      }
    }

    // Rule B: Short segments (<=3s) - keep as-is
    if (d <= 3) {
      result.push({ ...seg });
      continue;
    }

    // Rule A: Multi-sentence segments >3s - split
    if (sentCount >= 2 && d > 3) {
      const enSents = splitSentences(en);
      const koSents = splitKo(ko, enSents);
      const times = proportionalSplit(seg.start, seg.end, enSents);
      for (let j = 0; j < enSents.length; j++) {
        result.push({
          start: times[j].start,
          end: times[j].end,
          en: enSents[j],
          ko: koSents[j]
        });
      }
      continue;
    }

    // Rule C: Single sentence >8s - clause split (each >=3s)
    if (sentCount === 1 && d > 8) {
      const clauses = splitAtClause(en);
      if (clauses.length >= 2) {
        const times = proportionalSplit(seg.start, seg.end, clauses);
        const allOk = times.every(t => (t.end - t.start) >= 2.9);
        if (allOk) {
          const koSents = splitKo(ko, clauses);
          for (let j = 0; j < clauses.length; j++) {
            result.push({
              start: times[j].start,
              end: times[j].end,
              en: clauses[j],
              ko: koSents[j]
            });
          }
          continue;
        }
      }
      result.push({ ...seg });
      continue;
    }

    // Rule D: Single sentence 6-8s - split at clause if >=6s
    if (sentCount === 1 && d >= 6 && d <= 8) {
      const clauses = splitAtClause(en);
      if (clauses.length >= 2) {
        const times = proportionalSplit(seg.start, seg.end, clauses);
        const allOk = times.every(t => (t.end - t.start) >= 2.5);
        if (allOk) {
          const koSents = splitKo(ko, clauses);
          for (let j = 0; j < clauses.length; j++) {
            result.push({
              start: times[j].start,
              end: times[j].end,
              en: clauses[j],
              ko: koSents[j]
            });
          }
          continue;
        }
      }
    }

    // Default: keep as-is
    result.push({ ...seg });
  }

  // Post-pass: merge tiny fragments created by splits (<=2 words, <1.5s, adjacent)
  const merged = [];
  for (const seg of result) {
    const d2 = +(seg.end - seg.start).toFixed(2);
    const wc2 = wordCount(seg.en.trim());
    if (wc2 <= 2 && d2 < 1.5 && merged.length > 0) {
      const prev = merged[merged.length - 1];
      const gap = seg.start - prev.end;
      if (gap < 1) {
        prev.end = seg.end;
        prev.en = prev.en + ' ' + seg.en.trim();
        prev.ko = prev.ko + (seg.ko.trim() ? ' ' + seg.ko.trim() : '');
        continue;
      }
    }
    merged.push(seg);
  }

  // Dedup consecutive identical en
  const deduped = [];
  for (const seg of merged) {
    if (deduped.length > 0 && deduped[deduped.length - 1].en.trim() === seg.en.trim()) {
      deduped[deduped.length - 1].end = seg.end;
      continue;
    }
    deduped.push(seg);
  }

  return deduped;
}

const report = {
  batch: 42,
  timestamp: new Date().toISOString(),
  totalFiles: VIDEO_IDS.length,
  changedFiles: 0,
  unchangedFiles: 0,
  skippedFiles: 0,
  videos: {}
};

for (const id of VIDEO_IDS) {
  const filePath = join(TRANSCRIPTS_DIR, `${id}.json`);
  try {
    const raw = readFileSync(filePath, 'utf-8');
    const original = JSON.parse(raw);
    const fixed = resegment(original);

    if (JSON.stringify(original) !== JSON.stringify(fixed)) {
      writeFileSync(filePath, JSON.stringify(fixed, null, 2), 'utf-8');
      report.changedFiles++;
      const info = {
        status: 'changed',
        originalSegments: original.length,
        newSegments: fixed.length,
        changes: []
      };

      const origMusic = original.filter(s => isMusic(s)).length;
      if (origMusic > 0) info.changes.push(`removed ${origMusic} music-only segments`);

      const origMultiSent = original.filter(s => !isMusic(s) && countSentences(s.en.trim()) >= 2 && dur(s) > 3).length;
      if (origMultiSent > 0) info.changes.push(`split ${origMultiSent} multi-sentence segments`);

      const origTiny = original.filter(s => wordCount(s.en.trim()) <= 2 && dur(s) < 1.5).length;
      if (origTiny > 0) info.changes.push(`merged ${origTiny} tiny segments`);

      let origDups = 0;
      for (let i = 1; i < original.length; i++) {
        if (original[i].en.trim() === original[i-1].en.trim()) origDups++;
      }
      if (origDups > 0) info.changes.push(`removed ${origDups} duplicate segments`);

      report.videos[id] = info;
    } else {
      report.unchangedFiles++;
      report.videos[id] = { status: 'unchanged', segments: original.length };
    }
  } catch (err) {
    report.skippedFiles++;
    report.videos[id] = { status: 'error', error: err.message };
  }
}

mkdirSync(RESULTS_DIR, { recursive: true });
writeFileSync(join(RESULTS_DIR, 'batch-42.json'), JSON.stringify(report, null, 2), 'utf-8');
console.log(JSON.stringify(report, null, 2));
