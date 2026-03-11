import { readFileSync, writeFileSync } from 'fs';

const ROOT = 'C:/Users/hyunj/studyeng';
const REPORT_FILE = `${ROOT}/logs/fullcheck-report-batch1.json`;

const report = JSON.parse(readFileSync(REPORT_FILE, 'utf-8'));

// Reclassify false positives
let reclassified = 0;

for (const item of report.issues) {
  const newProblems = [];
  for (const p of item.problems) {
    // Music notation entries are not real issues
    if (p.type === 'en_garbled' && p.detail.includes('♪')) {
      reclassified++;
      continue; // skip this false positive
    }
    if (p.type === 'ko_is_en_copy' && (p.detail.includes('♪') || p.detail.includes('Jump! Jump!'))) {
      reclassified++;
      continue;
    }
    // ko_mostly_latin for proper names in award ceremonies, etc. is acceptable
    // Keep for reporting but mark severity as low
    newProblems.push(p);
  }
  item.problems = newProblems;
}

// Remove items with no remaining problems
report.issues = report.issues.filter(i => i.problems.length > 0);
report.clean = report.totalChecked - report.issues.length;

// Create severity classification
const critical = []; // Files that are broken/unusable
const needsTranslation = []; // Files with missing ko translations
const needsRewhisper = []; // Files with bad/minimal Whisper output
const minor = []; // Minor issues that don't affect usability

for (const item of report.issues) {
  const types = new Set(item.problems.map(p => p.type));

  if (types.has('too_few_subtitles')) {
    const subCount = item.problems.find(p => p.type === 'too_few_subtitles');
    if (subCount && subCount.detail.includes('0 subtitle')) {
      critical.push({ videoId: item.videoId, reason: 'Empty transcript (0 subtitles)' });
    } else {
      needsRewhisper.push({ videoId: item.videoId, reason: subCount?.detail || 'Too few subtitles' });
    }
  } else if (types.has('ko_empty')) {
    const count = item.problems.filter(p => p.type === 'ko_empty').length;
    needsTranslation.push({ videoId: item.videoId, count });
  } else if (types.has('ko_suspiciously_short') || types.has('ko_suspiciously_long')) {
    minor.push({ videoId: item.videoId, problems: item.problems });
  } else {
    minor.push({ videoId: item.videoId, problems: item.problems });
  }
}

// Write refined report
const refined = {
  totalChecked: report.totalChecked,
  clean: report.clean,
  reclassifiedFalsePositives: reclassified,
  summary: {
    critical: critical.length,
    needsTranslation: needsTranslation.length,
    needsRewhisper: needsRewhisper.length,
    minor: minor.length,
  },
  critical,
  needsTranslation: needsTranslation.sort((a, b) => b.count - a.count),
  needsRewhisper,
  minor,
  issues: report.issues,
};

writeFileSync(REPORT_FILE, JSON.stringify(refined, null, 2), 'utf-8');

console.log('=== REFINED QA REPORT ===');
console.log(`Total checked: ${refined.totalChecked}`);
console.log(`Clean files: ${refined.clean}`);
console.log(`Reclassified false positives: ${reclassified}`);
console.log();
console.log('--- Severity Breakdown ---');
console.log(`CRITICAL (broken/empty): ${critical.length}`);
for (const c of critical) console.log(`  ${c.videoId}: ${c.reason}`);
console.log();
console.log(`NEEDS TRANSLATION (ko_empty): ${needsTranslation.length} files, ${needsTranslation.reduce((s, t) => s + t.count, 0)} subtitles`);
for (const t of needsTranslation) console.log(`  ${t.videoId}: ${t.count} empty ko`);
console.log();
console.log(`NEEDS RE-WHISPER (too few subtitles): ${needsRewhisper.length} files`);
for (const r of needsRewhisper) console.log(`  ${r.videoId}: ${r.reason}`);
console.log();
console.log(`MINOR issues: ${minor.length} files`);
for (const m of minor) {
  const types = [...new Set(m.problems.map(p => p.type))].join(', ');
  console.log(`  ${m.videoId}: ${types}`);
}
