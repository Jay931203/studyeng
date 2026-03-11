import { createHash } from 'crypto';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const TRANSCRIPTS_DIR = 'C:/Users/hyunj/studyeng/public/transcripts';
const TAGS_DIR = 'C:/Users/hyunj/studyeng/public/expression-tags';

function computeHash(sentences) {
  const text = sentences.map(s => s.en).join('|');
  return createHash('sha256').update(text).digest('hex').slice(0, 16);
}

function buildFile(videoId, category, title, sentenceTags) {
  const transcriptPath = join(TRANSCRIPTS_DIR, `${videoId}.json`);
  const transcript = JSON.parse(readFileSync(transcriptPath, 'utf-8'));

  // Filter out music-only entries
  const validSentences = transcript.filter(s => s.en && !s.en.match(/^-?♪+$/));

  const sentences = validSentences.map((s, i) => {
    const tags = sentenceTags[i] || {
      functions: ["F01"],
      situation: "S19",
      cefr: "A2",
      register: "R4",
      emotions: ["E09"],
      expression_types: ["X08"],
      vibe: "V12",
      power: [],
      grammar_intent: [],
      flags: []
    };
    return {
      id: `${videoId}-${i}`,
      en: s.en,
      ko: s.ko,
      tags
    };
  });

  const hash = computeHash(validSentences);

  const result = {
    videoId,
    category,
    title,
    sentenceCount: sentences.length,
    taggedCount: sentences.length,
    transcriptHash: hash,
    sentences
  };

  const outPath = join(TAGS_DIR, `${videoId}.json`);
  writeFileSync(outPath, JSON.stringify(result, null, 2));
  console.log(`Wrote ${outPath} (${sentences.length} sentences)`);
}

// ============================================================
// 1. tLs9wDZKP-s - Vampire comedy skit
// ============================================================
buildFile("tLs9wDZKP-s", "entertainment", "Vampire Comedy Skit - Thirstiest Human", [
  { functions: ["F19"], situation: "S09", cefr: "B1", register: "R4", emotions: ["E05"], expression_types: ["X08"], vibe: "V08", power: [], grammar_intent: ["G08"], flags: [] },
  { functions: ["F19"], situation: "S09", cefr: "B1", register: "R4", emotions: ["E05"], expression_types: ["X02"], vibe: "V02", power: [], grammar_intent: ["G04"], flags: [] },
  { functions: ["F34"], situation: "S09", cefr: "B1", register: "R4", emotions: ["E09"], expression_types: ["X01"], vibe: "V12", power: [], grammar_intent: ["G02"], flags: [] },
  { functions: ["F06"], situation: "S09", cefr: "A2", register: "R4", emotions: ["E03"], expression_types: ["X06"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  { functions: ["F25"], situation: "S09", cefr: "A2", register: "R4", emotions: ["E01"], expression_types: ["X06"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  { functions: ["F06"], situation: "S09", cefr: "A2", register: "R4", emotions: ["E03"], expression_types: ["X06"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S09", cefr: "A2", register: "R4", emotions: ["E01"], expression_types: ["X06"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  { functions: ["F19"], situation: "S09", cefr: "B1", register: "R4", emotions: ["E04"], expression_types: ["X02"], vibe: "V02", power: ["P01"], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S09", cefr: "B2", register: "R4", emotions: ["E05"], expression_types: ["X07"], vibe: "V06", power: [], grammar_intent: ["G17"], flags: [] },
  { functions: ["F14"], situation: "S09", cefr: "B1", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V02", power: [], grammar_intent: ["G17"], flags: [] },
  { functions: ["F01"], situation: "S09", cefr: "B1", register: "R4", emotions: ["E06"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  { functions: ["F43"], situation: "S09", cefr: "B2", register: "R4", emotions: ["E15"], expression_types: ["X05"], vibe: "V13", power: ["P01"], grammar_intent: ["G18"], flags: [] },
  { functions: ["F06"], situation: "S09", cefr: "A2", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V02", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S09", cefr: "A2", register: "R4", emotions: ["E01"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  { functions: ["F43"], situation: "S09", cefr: "A1", register: "R4", emotions: ["E15"], expression_types: ["X06"], vibe: "V09", power: [], grammar_intent: [], flags: [] },
]);

// ============================================================
// 2. 21Ki96Lsxhc - SNL Three Sad Virgins
// ============================================================
buildFile("21Ki96Lsxhc", "entertainment", "SNL - Three Sad Virgins (Pete Davidson)", [
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E16"], expression_types: ["X06"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  { functions: ["F25"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E01"], expression_types: ["X06"], vibe: "V01", power: [], grammar_intent: [], flags: [] },
  { functions: ["F25"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E10"], expression_types: ["X06"], vibe: "V15", power: [], grammar_intent: [], flags: [] },
  { functions: ["F06"], situation: "S14", cefr: "A1", register: "R4", emotions: ["E09"], expression_types: ["X08"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E01"], expression_types: ["X01"], vibe: "V01", power: [], grammar_intent: ["G21"], flags: [] },
  { functions: ["F27"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E01"], expression_types: ["X01"], vibe: "V01", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E10"], expression_types: ["X06"], vibe: "V03", power: [], grammar_intent: ["G17"], flags: [] },
  { functions: ["F06"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F53"], situation: "S14", cefr: "A1", register: "R4", emotions: ["E09"], expression_types: ["X08"], vibe: "V12", power: [], grammar_intent: [], flags: ["is_fragment"] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E10"], expression_types: ["X06"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  { functions: ["F05"], situation: "S14", cefr: "B1", register: "R5", emotions: ["E01"], expression_types: ["X06"], vibe: "V03", power: [], grammar_intent: [], flags: ["is_lyrics"] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R5", emotions: ["E11"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: ["is_lyrics"] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R5", emotions: ["E11"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: ["is_lyrics"] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R5", emotions: ["E10"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: ["is_lyrics"] },
  { functions: ["F01"], situation: "S14", cefr: "B2", register: "R5", emotions: ["E04"], expression_types: ["X05"], vibe: "V03", power: [], grammar_intent: [], flags: ["is_lyrics"] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R5", emotions: ["E10"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: ["is_lyrics"] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R5", emotions: ["E10"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: ["is_lyrics"] },
  { functions: ["F06"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E15"], expression_types: ["X06"], vibe: "V13", power: [], grammar_intent: [], flags: [] },
  { functions: ["F06"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E15"], expression_types: ["X06"], vibe: "V13", power: [], grammar_intent: [], flags: [] },
  { functions: ["F06"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E15"], expression_types: ["X06"], vibe: "V13", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E07"], expression_types: ["X06"], vibe: "V06", power: [], grammar_intent: [], flags: [] },
  { functions: ["F38"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F43"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R5", emotions: ["E04"], expression_types: ["X05"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R5", emotions: ["E08"], expression_types: ["X05"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R5", emotions: ["E08"], expression_types: ["X05"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R5", emotions: ["E04"], expression_types: ["X05"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E10"], expression_types: ["X06"], vibe: "V15", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F06"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R5", emotions: ["E10"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: ["is_lyrics"] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R5", emotions: ["E10"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: ["is_lyrics"] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R5", emotions: ["E10"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: ["is_lyrics"] },
  { functions: ["F06"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E04"], expression_types: ["X06"], vibe: "V13", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E15"], expression_types: ["X06"], vibe: "V09", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E15"], expression_types: ["X06"], vibe: "V13", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E04"], expression_types: ["X06"], vibe: "V09", power: [], grammar_intent: [], flags: [] },
  { functions: ["F06"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V11", power: [], grammar_intent: [], flags: [] },
  { functions: ["F11"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E07"], expression_types: ["X03"], vibe: "V01", power: [], grammar_intent: [], flags: [] },
  { functions: ["F27"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E01"], expression_types: ["X06"], vibe: "V01", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R5", emotions: ["E04"], expression_types: ["X05"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R5", emotions: ["E08"], expression_types: ["X05"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R5", emotions: ["E08"], expression_types: ["X05"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B2", register: "R5", emotions: ["E16"], expression_types: ["X05"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  { functions: ["F53"], situation: "S14", cefr: "A1", register: "R4", emotions: ["E09"], expression_types: ["X08"], vibe: "V12", power: [], grammar_intent: [], flags: ["is_fragment"] },
]);

// ============================================================
// 3. TOq0dzxouts - SNL Rami Malek skit (Good behavior/treats)
// ============================================================
buildFile("TOq0dzxouts", "entertainment", "SNL - Rami Malek Wants Treats", [
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  { functions: ["F06"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F25"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E01"], expression_types: ["X06"], vibe: "V01", power: [], grammar_intent: [], flags: [] },
  { functions: ["F25"], situation: "S14", cefr: "A1", register: "R4", emotions: ["E01"], expression_types: ["X06"], vibe: "V01", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E10"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F53"], situation: "S14", cefr: "A1", register: "R4", emotions: ["E09"], expression_types: ["X08"], vibe: "V12", power: [], grammar_intent: [], flags: ["is_fragment"] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E11"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: ["G21"], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E01"], expression_types: ["X01"], vibe: "V01", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F06"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F06"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: ["G04"], flags: [] },
  { functions: ["F06"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X08"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E01"], expression_types: ["X06"], vibe: "V01", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E01"], expression_types: ["X06"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F19"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E04"], expression_types: ["X02"], vibe: "V02", power: ["P01"], grammar_intent: ["G04"], flags: [] },
  { functions: ["F06"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E03"], expression_types: ["X06"], vibe: "V09", power: [], grammar_intent: [], flags: [] },
  { functions: ["F19"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E04"], expression_types: ["X02"], vibe: "V09", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E04"], expression_types: ["X02"], vibe: "V09", power: [], grammar_intent: [], flags: [] },
  { functions: ["F19"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E04"], expression_types: ["X02"], vibe: "V09", power: [], grammar_intent: [], flags: [] },
  { functions: ["F06"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E04"], expression_types: ["X06"], vibe: "V09", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V11", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V11", power: [], grammar_intent: [], flags: [] },
  { functions: ["F38"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E02"], expression_types: ["X03"], vibe: "V01", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E06"], expression_types: ["X03"], vibe: "V01", power: [], grammar_intent: [], flags: [] },
  { functions: ["F38"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E02"], expression_types: ["X03"], vibe: "V01", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E04"], expression_types: ["X06"], vibe: "V09", power: [], grammar_intent: [], flags: [] },
]);

// ============================================================
// 4. iBpgqRbEFVg - SNL JCPenney Hard Seltzer
// ============================================================
buildFile("iBpgqRbEFVg", "entertainment", "SNL - JCPenney Hard Seltzer", [
  { functions: ["F01"], situation: "S01", cefr: "A2", register: "R4", emotions: ["E10"], expression_types: ["X06"], vibe: "V10", power: [], grammar_intent: ["G02"], flags: [] },
  { functions: ["F06"], situation: "S01", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S01", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F06"], situation: "S01", cefr: "A2", register: "R4", emotions: ["E03"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F02"], situation: "S01", cefr: "B1", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F06"], situation: "S01", cefr: "A2", register: "R4", emotions: ["E03"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F43"], situation: "S01", cefr: "B1", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S01", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F06"], situation: "S01", cefr: "A2", register: "R4", emotions: ["E03"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S01", cefr: "A2", register: "R4", emotions: ["E04"], expression_types: ["X05"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  { functions: ["F06"], situation: "S01", cefr: "A2", register: "R4", emotions: ["E03"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F25"], situation: "S01", cefr: "A2", register: "R4", emotions: ["E01"], expression_types: ["X06"], vibe: "V01", power: [], grammar_intent: [], flags: [] },
  { functions: ["F06"], situation: "S01", cefr: "B1", register: "R4", emotions: ["E03"], expression_types: ["X06"], vibe: "V09", power: [], grammar_intent: [], flags: [] },
  { functions: ["F02"], situation: "S01", cefr: "B1", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S01", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S01", cefr: "B1", register: "R4", emotions: ["E08"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S01", cefr: "B1", register: "R4", emotions: ["E15"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S01", cefr: "B1", register: "R4", emotions: ["E05"], expression_types: ["X05"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S01", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S01", cefr: "B1", register: "R4", emotions: ["E03"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S01", cefr: "A2", register: "R4", emotions: ["E15"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S01", cefr: "B1", register: "R4", emotions: ["E06"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  { functions: ["F06"], situation: "S01", cefr: "A2", register: "R4", emotions: ["E03"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S01", cefr: "B1", register: "R4", emotions: ["E03"], expression_types: ["X06"], vibe: "V09", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S01", cefr: "A2", register: "R4", emotions: ["E02"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S01", cefr: "A2", register: "R4", emotions: ["E03"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S01", cefr: "A2", register: "R4", emotions: ["E01"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S01", cefr: "A1", register: "R4", emotions: ["E01"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S01", cefr: "A1", register: "R4", emotions: ["E01"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: ["is_fragment"] },
]);

// ============================================================
// 5. Y6IUuxM_qlw - SNL Three Normal Goths
// ============================================================
buildFile("Y6IUuxM_qlw", "entertainment", "SNL - Three Normal Goths", [
  { functions: ["F06"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E10"], expression_types: ["X06"], vibe: "V01", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E01"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E01"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  { functions: ["F38"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E03"], expression_types: ["X03"], vibe: "V01", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R5", emotions: ["E09"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: ["is_lyrics"] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R5", emotions: ["E09"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: ["is_lyrics"] },
  { functions: ["F01"], situation: "S14", cefr: "A1", register: "R5", emotions: ["E09"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: ["is_lyrics"] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E01"], expression_types: ["X06"], vibe: "V10", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E01"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E01"], expression_types: ["X06"], vibe: "V10", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R5", emotions: ["E09"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: ["is_lyrics"] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R5", emotions: ["E09"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: ["is_lyrics"] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E06"], expression_types: ["X06"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  { functions: ["F04"], situation: "S14", cefr: "B2", register: "R4", emotions: ["E04"], expression_types: ["X02"], vibe: "V13", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E01"], expression_types: ["X06"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  { functions: ["F25"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E01"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E01"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F06"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E03"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E08"], expression_types: ["X05"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R5", emotions: ["E09"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: ["is_lyrics"] },
  { functions: ["F06"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E03"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E03"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E01"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  { functions: ["F05"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E14"], expression_types: ["X06"], vibe: "V10", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R5", emotions: ["E09"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: ["is_lyrics"] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R5", emotions: ["E09"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: ["is_lyrics"] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R5", emotions: ["E09"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: ["is_lyrics"] },
  { functions: ["F53"], situation: "S14", cefr: "A1", register: "R4", emotions: ["E09"], expression_types: ["X08"], vibe: "V12", power: [], grammar_intent: [], flags: ["is_fragment"] },
]);

// ============================================================
// 6. AIuWQ41m7ys - SNL Angie phone call
// ============================================================
buildFile("AIuWQ41m7ys", "entertainment", "SNL - Calling Angie After Breakup", [
  { functions: ["F06"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E03"], expression_types: ["X06"], vibe: "V01", power: [], grammar_intent: [], flags: [] },
  { functions: ["F43"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E15"], expression_types: ["X02"], vibe: "V02", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E06"], expression_types: ["X06"], vibe: "V14", power: [], grammar_intent: ["G04"], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E07"], expression_types: ["X06"], vibe: "V14", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B2", register: "R4", emotions: ["E07"], expression_types: ["X06"], vibe: "V14", power: [], grammar_intent: ["G17"], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E01"], expression_types: ["X03"], vibe: "V01", power: [], grammar_intent: [], flags: [] },
  { functions: ["F53"], situation: "S14", cefr: "A1", register: "R4", emotions: ["E09"], expression_types: ["X08"], vibe: "V12", power: [], grammar_intent: [], flags: ["is_fragment"] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E09"], expression_types: ["X03"], vibe: "V01", power: [], grammar_intent: ["G17"], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X03"], vibe: "V01", power: [], grammar_intent: [], flags: [] },
  { functions: ["F25"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E06"], expression_types: ["X06"], vibe: "V14", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E03"], expression_types: ["X06"], vibe: "V09", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V09", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V09", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V09", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V09", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E04"], expression_types: ["X06"], vibe: "V09", power: [], grammar_intent: [], flags: [] },
  { functions: ["F06"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V09", power: [], grammar_intent: [], flags: [] },
  { functions: ["F11"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E07"], expression_types: ["X06"], vibe: "V09", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E04"], expression_types: ["X02"], vibe: "V13", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E04"], expression_types: ["X06"], vibe: "V09", power: [], grammar_intent: [], flags: [] },
  { functions: ["F11"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E07"], expression_types: ["X06"], vibe: "V09", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E15"], expression_types: ["X06"], vibe: "V09", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E05"], expression_types: ["X05"], vibe: "V09", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E06"], expression_types: ["X06"], vibe: "V14", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E06"], expression_types: ["X06"], vibe: "V14", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E06"], expression_types: ["X06"], vibe: "V14", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V11", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B2", register: "R4", emotions: ["E02"], expression_types: ["X06"], vibe: "V05", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E04"], expression_types: ["X06"], vibe: "V11", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A1", register: "R4", emotions: ["E04"], expression_types: ["X06"], vibe: "V11", power: [], grammar_intent: [], flags: ["is_fragment"] },
]);

// ============================================================
// 7. fYcDQ11vI0M - SNL Botox/cosmetic surgery
// ============================================================
buildFile("fYcDQ11vI0M", "entertainment", "SNL - Botox and Cosmetic Surgery", [
  { functions: ["F01"], situation: "S14", cefr: "A1", register: "R4", emotions: ["E03"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: ["is_fragment"] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E01"], expression_types: ["X06"], vibe: "V01", power: [], grammar_intent: [], flags: [] },
  { functions: ["F06"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E03"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F11","F25"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F06"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E03"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E03"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E08"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  { functions: ["F06"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E03"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E11"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F06"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E03"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E06"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F06"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E03"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E03"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E04"], expression_types: ["X05"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  { functions: ["F19"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E04"], expression_types: ["X02"], vibe: "V13", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E04"], expression_types: ["X05"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E11"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E11"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F06"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E01"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F06"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E03"], expression_types: ["X06"], vibe: "V09", power: [], grammar_intent: [], flags: [] },
  { functions: ["F06"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E03"], expression_types: ["X06"], vibe: "V09", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E08"], expression_types: ["X06"], vibe: "V09", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E09"], expression_types: ["X03"], vibe: "V01", power: [], grammar_intent: [], flags: [] },
  { functions: ["F53"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E02"], expression_types: ["X03"], vibe: "V01", power: [], grammar_intent: [], flags: [] },
]);

// ============================================================
// 8. pT6It4rnh_o - SNL New Personality skit
// ============================================================
buildFile("pT6It4rnh_o", "entertainment", "SNL - New Year New Personality", [
  { functions: ["F25"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F06"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E03"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E13"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E06"], expression_types: ["X06"], vibe: "V14", power: [], grammar_intent: [], flags: [] },
  { functions: ["F06"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E06"], expression_types: ["X06"], vibe: "V06", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E10"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E04"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E10"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E04"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F19"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E04"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E06"], expression_types: ["X06"], vibe: "V14", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E15"], expression_types: ["X06"], vibe: "V06", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E10"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E10"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E10"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E03"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F53"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E10"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  { functions: ["F06"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E03"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E10"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E10"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E10"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E10"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F06"], situation: "S14", cefr: "A1", register: "R4", emotions: ["E03"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
]);

// ============================================================
// 9. kb60HrggbeQ - SNL Catwoman Cat skit
// ============================================================
buildFile("kb60HrggbeQ", "entertainment", "SNL - Getting Catwoman a Cat", [
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E01"], expression_types: ["X06"], vibe: "V01", power: [], grammar_intent: [], flags: [] },
  { functions: ["F25"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E01"], expression_types: ["X06"], vibe: "V01", power: [], grammar_intent: [], flags: [] },
  { functions: ["F02"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V09", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E05"], expression_types: ["X02"], vibe: "V09", power: [], grammar_intent: [], flags: [] },
  { functions: ["F06"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V09", power: [], grammar_intent: [], flags: [] },
  { functions: ["F06"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E04"], expression_types: ["X06"], vibe: "V09", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E09"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E01"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E03"], expression_types: ["X06"], vibe: "V09", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E03"], expression_types: ["X06"], vibe: "V09", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E10"], expression_types: ["X06"], vibe: "V09", power: [], grammar_intent: [], flags: [] },
  { functions: ["F06"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E03"], expression_types: ["X06"], vibe: "V09", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E01"], expression_types: ["X06"], vibe: "V09", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E12"], expression_types: ["X06"], vibe: "V01", power: [], grammar_intent: [], flags: [] },
  { functions: ["F06"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V09", power: [], grammar_intent: [], flags: [] },
  { functions: ["F06"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E03"], expression_types: ["X06"], vibe: "V09", power: [], grammar_intent: [], flags: [] },
  { functions: ["F06"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E03"], expression_types: ["X06"], vibe: "V09", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V09", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E01"], expression_types: ["X06"], vibe: "V01", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E03"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E06"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E01"], expression_types: ["X06"], vibe: "V01", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E14"], expression_types: ["X06"], vibe: "V01", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A1", register: "R4", emotions: ["E10"], expression_types: ["X06"], vibe: "V01", power: [], grammar_intent: [], flags: [] },
]);

// ============================================================
// 10. qCzWL9OPpwE - SNL Scarlett Johansson First Class Flight
// ============================================================
buildFile("qCzWL9OPpwE", "entertainment", "SNL - First Class Flight to Newark", [
  { functions: ["F25"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F06"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E06"], expression_types: ["X06"], vibe: "V14", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E06"], expression_types: ["X06"], vibe: "V14", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E03"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F06"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E10"], expression_types: ["X06"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R5", emotions: ["E10"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: ["is_lyrics"] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R5", emotions: ["E10"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: ["is_lyrics"] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R5", emotions: ["E10"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: ["is_lyrics"] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R5", emotions: ["E10"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: ["is_lyrics"] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R5", emotions: ["E10"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: ["is_lyrics"] },
  { functions: ["F06"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E03"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F06"], situation: "S14", cefr: "A1", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F06"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V02", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F06"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V02", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R5", emotions: ["E10"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: ["is_lyrics"] },
  { functions: ["F06"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V02", power: [], grammar_intent: [], flags: [] },
  { functions: ["F06"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V02", power: [], grammar_intent: [], flags: [] },
  { functions: ["F02"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V02", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V02", power: [], grammar_intent: [], flags: [] },
  { functions: ["F06"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V02", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R5", emotions: ["E10"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: ["is_lyrics"] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V16", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V16", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E05"], expression_types: ["X05"], vibe: "V16", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V16", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R5", emotions: ["E10"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: ["is_lyrics"] },
  { functions: ["F02"], situation: "S14", cefr: "B2", register: "R3", emotions: ["E09"], expression_types: ["X01"], vibe: "V16", power: ["P01"], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R3", emotions: ["E09"], expression_types: ["X07"], vibe: "V16", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R3", emotions: ["E05"], expression_types: ["X08"], vibe: "V16", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V16", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V16", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V16", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V11", power: [], grammar_intent: [], flags: [] },
  { functions: ["F06"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V16", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B2", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V16", power: [], grammar_intent: [], flags: [] },
  { functions: ["F06"], situation: "S14", cefr: "A1", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V16", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V16", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E03"], expression_types: ["X06"], vibe: "V02", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E04"], expression_types: ["X02"], vibe: "V11", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E04"], expression_types: ["X02"], vibe: "V11", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V11", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V11", power: [], grammar_intent: [], flags: [] },
  { functions: ["F06"], situation: "S14", cefr: "A2", register: "R3", emotions: ["E09"], expression_types: ["X01"], vibe: "V16", power: ["P01"], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V16", power: [], grammar_intent: [], flags: [] },
  { functions: ["F06"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V16", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V16", power: [], grammar_intent: [], flags: [] },
  { functions: ["F02"], situation: "S14", cefr: "B1", register: "R3", emotions: ["E09"], expression_types: ["X08"], vibe: "V16", power: ["P01"], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E03"], expression_types: ["X06"], vibe: "V11", power: [], grammar_intent: [], flags: [] },
  { functions: ["F06"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V11", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V02", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E13"], expression_types: ["X06"], vibe: "V11", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E13"], expression_types: ["X06"], vibe: "V11", power: [], grammar_intent: [], flags: [] },
  { functions: ["F02"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E13"], expression_types: ["X06"], vibe: "V11", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E01"], expression_types: ["X06"], vibe: "V15", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E01"], expression_types: ["X06"], vibe: "V15", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E01"], expression_types: ["X06"], vibe: "V15", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A1", register: "R4", emotions: ["E06"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E13"], expression_types: ["X07"], vibe: "V07", power: [], grammar_intent: [], flags: [] },
]);

// ============================================================
// 11. 4hX9o6ghEGI - Embarrassing Skincare on Flight
// ============================================================
buildFile("4hX9o6ghEGI", "lifestyle", "Embarrassing Skincare on the Flight", [
  { functions: ["F05"], situation: "S19", cefr: "B1", register: "R4", emotions: ["E10"], expression_types: ["X06"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S19", cefr: "B1", register: "R4", emotions: ["E10"], expression_types: ["X06"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S19", cefr: "A2", register: "R4", emotions: ["E01"], expression_types: ["X06"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S19", cefr: "B1", register: "R4", emotions: ["E01"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S19", cefr: "B1", register: "R4", emotions: ["E01"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F05"], situation: "S19", cefr: "B1", register: "R4", emotions: ["E01"], expression_types: ["X06"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  { functions: ["F05"], situation: "S19", cefr: "B1", register: "R4", emotions: ["E03"], expression_types: ["X06"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S19", cefr: "B1", register: "R4", emotions: ["E01"], expression_types: ["X06"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S19", cefr: "A2", register: "R4", emotions: ["E08"], expression_types: ["X06"], vibe: "V06", power: [], grammar_intent: [], flags: [] },
]);

// ============================================================
// 12. vvLZ2t5cm0Y - Gym Workout Fitness
// ============================================================
buildFile("vvLZ2t5cm0Y", "fitness", "Upper Body Workout - Back and Biceps", [
  { functions: ["F19"], situation: "S19", cefr: "B1", register: "R4", emotions: ["E04"], expression_types: ["X04"], vibe: "V07", power: ["P01"], grammar_intent: ["G04"], flags: [] },
  { functions: ["F01"], situation: "S19", cefr: "A2", register: "R4", emotions: ["E01"], expression_types: ["X06"], vibe: "V10", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S19", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S19", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: ["is_fragment"] },
  { functions: ["F01"], situation: "S19", cefr: "A2", register: "R4", emotions: ["E01"], expression_types: ["X06"], vibe: "V10", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S19", cefr: "B1", register: "R4", emotions: ["E05"], expression_types: ["X04"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S19", cefr: "A2", register: "R4", emotions: ["E01"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  { functions: ["F02"], situation: "S19", cefr: "B1", register: "R4", emotions: ["E09"], expression_types: ["X08"], vibe: "V17", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S19", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S19", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F02"], situation: "S19", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X08"], vibe: "V17", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S19", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X08"], vibe: "V17", power: [], grammar_intent: [], flags: [] },
  { functions: ["F02"], situation: "S19", cefr: "B1", register: "R4", emotions: ["E09"], expression_types: ["X08"], vibe: "V17", power: [], grammar_intent: [], flags: [] },
  { functions: ["F06"], situation: "S19", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F02"], situation: "S19", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X08"], vibe: "V17", power: [], grammar_intent: [], flags: [] },
]);

// ============================================================
// 13. en37fxk4ccM - Shape-shifting puzzle (fly mouse)
// ============================================================
buildFile("en37fxk4ccM", "education", "Shape-Shifting Fly Mouse Puzzle", [
  { functions: ["F01"], situation: "S19", cefr: "B1", register: "R4", emotions: ["E03"], expression_types: ["X06"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  { functions: ["F02"], situation: "S19", cefr: "B1", register: "R4", emotions: ["E09"], expression_types: ["X08"], vibe: "V17", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S19", cefr: "A2", register: "R4", emotions: ["E01"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  { functions: ["F02"], situation: "S19", cefr: "B1", register: "R4", emotions: ["E09"], expression_types: ["X08"], vibe: "V17", power: [], grammar_intent: [], flags: [] },
  { functions: ["F05"], situation: "S19", cefr: "B1", register: "R4", emotions: ["E09"], expression_types: ["X08"], vibe: "V17", power: [], grammar_intent: ["G21"], flags: [] },
  { functions: ["F01"], situation: "S19", cefr: "A2", register: "R4", emotions: ["E01"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S19", cefr: "B1", register: "R4", emotions: ["E05"], expression_types: ["X08"], vibe: "V17", power: [], grammar_intent: [], flags: [] },
  { functions: ["F02"], situation: "S19", cefr: "B2", register: "R4", emotions: ["E09"], expression_types: ["X08"], vibe: "V17", power: [], grammar_intent: ["G04"], flags: [] },
  { functions: ["F05"], situation: "S19", cefr: "B1", register: "R4", emotions: ["E09"], expression_types: ["X08"], vibe: "V17", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S19", cefr: "A2", register: "R4", emotions: ["E01"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
]);

// ============================================================
// 14. 3ik6EwMNvXg - Simon Sinek What's In My Bag
// ============================================================
buildFile("3ik6EwMNvXg", "lifestyle", "Simon Sinek - What's In My Bag", [
  { functions: ["F25"], situation: "S19", cefr: "A2", register: "R3", emotions: ["E09"], expression_types: ["X01"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S19", cefr: "A2", register: "R3", emotions: ["E09"], expression_types: ["X08"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F02"], situation: "S19", cefr: "B1", register: "R3", emotions: ["E09"], expression_types: ["X08"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S19", cefr: "B1", register: "R3", emotions: ["E09"], expression_types: ["X08"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F02"], situation: "S19", cefr: "B1", register: "R3", emotions: ["E09"], expression_types: ["X08"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S19", cefr: "B1", register: "R3", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S19", cefr: "A2", register: "R3", emotions: ["E09"], expression_types: ["X08"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F02"], situation: "S19", cefr: "B1", register: "R3", emotions: ["E09"], expression_types: ["X08"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S19", cefr: "A2", register: "R3", emotions: ["E09"], expression_types: ["X08"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S19", cefr: "A2", register: "R3", emotions: ["E09"], expression_types: ["X08"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S19", cefr: "A2", register: "R3", emotions: ["E09"], expression_types: ["X08"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S19", cefr: "B1", register: "R3", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S19", cefr: "B1", register: "R3", emotions: ["E09"], expression_types: ["X08"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S19", cefr: "B1", register: "R3", emotions: ["E01"], expression_types: ["X06"], vibe: "V10", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S19", cefr: "A2", register: "R3", emotions: ["E09"], expression_types: ["X08"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S19", cefr: "A2", register: "R3", emotions: ["E09"], expression_types: ["X08"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S19", cefr: "A2", register: "R3", emotions: ["E09"], expression_types: ["X08"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S19", cefr: "B1", register: "R3", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S19", cefr: "B1", register: "R3", emotions: ["E09"], expression_types: ["X04"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S19", cefr: "A2", register: "R3", emotions: ["E09"], expression_types: ["X08"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S19", cefr: "A2", register: "R3", emotions: ["E09"], expression_types: ["X08"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S19", cefr: "B1", register: "R3", emotions: ["E09"], expression_types: ["X08"], vibe: "V17", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S19", cefr: "B1", register: "R3", emotions: ["E09"], expression_types: ["X08"], vibe: "V17", power: [], grammar_intent: ["G04"], flags: [] },
  { functions: ["F01"], situation: "S19", cefr: "A2", register: "R3", emotions: ["E03"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S19", cefr: "B1", register: "R3", emotions: ["E09"], expression_types: ["X08"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S19", cefr: "A2", register: "R3", emotions: ["E03"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S19", cefr: "A2", register: "R3", emotions: ["E09"], expression_types: ["X08"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S19", cefr: "B1", register: "R3", emotions: ["E15"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S19", cefr: "B1", register: "R3", emotions: ["E09"], expression_types: ["X08"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S19", cefr: "A2", register: "R3", emotions: ["E09"], expression_types: ["X08"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
]);

// ============================================================
// 15. V6bPomtNnis - How to escape buried alive
// ============================================================
buildFile("V6bPomtNnis", "education", "How to Escape If Buried Alive", [
  { functions: ["F02"], situation: "S19", cefr: "B2", register: "R3", emotions: ["E09"], expression_types: ["X08"], vibe: "V04", power: [], grammar_intent: ["G04"], flags: [] },
  { functions: ["F02"], situation: "S19", cefr: "B1", register: "R3", emotions: ["E09"], expression_types: ["X08"], vibe: "V04", power: [], grammar_intent: ["G02"], flags: [] },
  { functions: ["F02"], situation: "S19", cefr: "B2", register: "R3", emotions: ["E09"], expression_types: ["X08"], vibe: "V04", power: [], grammar_intent: ["G04"], flags: [] },
  { functions: ["F02"], situation: "S19", cefr: "B2", register: "R3", emotions: ["E09"], expression_types: ["X08"], vibe: "V04", power: [], grammar_intent: ["G02"], flags: [] },
  { functions: ["F02"], situation: "S19", cefr: "B1", register: "R3", emotions: ["E09"], expression_types: ["X08"], vibe: "V04", power: [], grammar_intent: ["G02"], flags: [] },
  { functions: ["F02"], situation: "S19", cefr: "B1", register: "R3", emotions: ["E09"], expression_types: ["X08"], vibe: "V04", power: [], grammar_intent: ["G21"], flags: [] },
]);

// ============================================================
// 16. YpecVts2qqc - Spine as whip (dark facts)
// ============================================================
buildFile("YpecVts2qqc", "education", "Could You Use a Spine as a Whip?", [
  { functions: ["F06"], situation: "S19", cefr: "B2", register: "R3", emotions: ["E09"], expression_types: ["X08"], vibe: "V08", power: [], grammar_intent: ["G04"], flags: [] },
  { functions: ["F02"], situation: "S19", cefr: "B1", register: "R3", emotions: ["E09"], expression_types: ["X08"], vibe: "V08", power: [], grammar_intent: [], flags: [] },
  { functions: ["F02"], situation: "S19", cefr: "B2", register: "R3", emotions: ["E09"], expression_types: ["X08"], vibe: "V08", power: [], grammar_intent: ["G17"], flags: [] },
  { functions: ["F02"], situation: "S19", cefr: "B2", register: "R3", emotions: ["E09"], expression_types: ["X08"], vibe: "V08", power: [], grammar_intent: ["G17"], flags: [] },
  { functions: ["F14"], situation: "S19", cefr: "B1", register: "R3", emotions: ["E09"], expression_types: ["X08"], vibe: "V08", power: [], grammar_intent: [], flags: [] },
  { functions: ["F02"], situation: "S19", cefr: "B2", register: "R3", emotions: ["E09"], expression_types: ["X08"], vibe: "V08", power: [], grammar_intent: ["G04"], flags: [] },
  { functions: ["F01"], situation: "S19", cefr: "B1", register: "R3", emotions: ["E09"], expression_types: ["X08"], vibe: "V08", power: [], grammar_intent: [], flags: [] },
]);

// ============================================================
// 17. wLaM_GLdZto - SNL Good COVID Variant
// ============================================================
buildFile("wLaM_GLdZto", "entertainment", "SNL - The Good COVID Variant", [
  { functions: ["F06"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E03"], expression_types: ["X06"], vibe: "V09", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E03"], expression_types: ["X06"], vibe: "V09", power: [], grammar_intent: [], flags: [] },
  { functions: ["F06"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E15"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F02"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E03"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F02"], situation: "S14", cefr: "B2", register: "R2", emotions: ["E03"], expression_types: ["X08"], vibe: "V11", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E03"], expression_types: ["X06"], vibe: "V09", power: [], grammar_intent: [], flags: [] },
  { functions: ["F02"], situation: "S14", cefr: "B1", register: "R3", emotions: ["E09"], expression_types: ["X08"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E01"], expression_types: ["X06"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E01"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  { functions: ["F02"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E01"], expression_types: ["X06"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E10"], expression_types: ["X06"], vibe: "V15", power: [], grammar_intent: [], flags: [] },
  { functions: ["F25"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E06"], expression_types: ["X06"], vibe: "V11", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E03"], expression_types: ["X06"], vibe: "V09", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E10"], expression_types: ["X06"], vibe: "V09", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E10"], expression_types: ["X06"], vibe: "V09", power: [], grammar_intent: [], flags: ["is_fragment"] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E10"], expression_types: ["X06"], vibe: "V09", power: [], grammar_intent: [], flags: ["is_fragment"] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E10"], expression_types: ["X06"], vibe: "V09", power: [], grammar_intent: [], flags: ["is_fragment"] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E10"], expression_types: ["X06"], vibe: "V09", power: [], grammar_intent: [], flags: ["is_fragment"] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E10"], expression_types: ["X06"], vibe: "V09", power: [], grammar_intent: [], flags: ["is_fragment"] },
  { functions: ["F06"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V09", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E10"], expression_types: ["X06"], vibe: "V15", power: [], grammar_intent: [], flags: [] },
  { functions: ["F02"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F06"], situation: "S14", cefr: "A1", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E01"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E01"], expression_types: ["X06"], vibe: "V15", power: [], grammar_intent: [], flags: [] },
  { functions: ["F02"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E03"], expression_types: ["X06"], vibe: "V09", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E10"], expression_types: ["X06"], vibe: "V09", power: [], grammar_intent: [], flags: [] },
  { functions: ["F02"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E03"], expression_types: ["X04"], vibe: "V09", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E10"], expression_types: ["X06"], vibe: "V15", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E10"], expression_types: ["X06"], vibe: "V15", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E10"], expression_types: ["X06"], vibe: "V15", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E10"], expression_types: ["X06"], vibe: "V09", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E10"], expression_types: ["X06"], vibe: "V09", power: [], grammar_intent: [], flags: [] },
  { functions: ["F02"], situation: "S14", cefr: "B1", register: "R3", emotions: ["E03"], expression_types: ["X08"], vibe: "V09", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E01"], expression_types: ["X06"], vibe: "V15", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E10"], expression_types: ["X06"], vibe: "V15", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E01"], expression_types: ["X06"], vibe: "V15", power: [], grammar_intent: [], flags: [] },
  { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E10"], expression_types: ["X06"], vibe: "V15", power: [], grammar_intent: [], flags: [] },
]);

// ============================================================
// 18. 0A20vfx-sO0 - Grenade story (dark facts)
// ============================================================
buildFile("0A20vfx-sO0", "education", "The Man Who Pulled a Grenade Pin for a Selfie", [
  { functions: ["F05"], situation: "S19", cefr: "B2", register: "R3", emotions: ["E09"], expression_types: ["X08"], vibe: "V16", power: [], grammar_intent: ["G18"], flags: [] },
  { functions: ["F05"], situation: "S19", cefr: "B1", register: "R3", emotions: ["E09"], expression_types: ["X08"], vibe: "V16", power: [], grammar_intent: ["G18"], flags: [] },
  { functions: ["F05"], situation: "S19", cefr: "B1", register: "R3", emotions: ["E05"], expression_types: ["X08"], vibe: "V02", power: [], grammar_intent: ["G18"], flags: [] },
  { functions: ["F02"], situation: "S19", cefr: "B1", register: "R3", emotions: ["E09"], expression_types: ["X08"], vibe: "V16", power: [], grammar_intent: ["G17"], flags: [] },
  { functions: ["F05"], situation: "S19", cefr: "B1", register: "R3", emotions: ["E09"], expression_types: ["X08"], vibe: "V16", power: [], grammar_intent: ["G18"], flags: [] },
  { functions: ["F05"], situation: "S19", cefr: "B1", register: "R3", emotions: ["E09"], expression_types: ["X08"], vibe: "V11", power: [], grammar_intent: ["G21"], flags: [] },
  { functions: ["F05"], situation: "S19", cefr: "B2", register: "R3", emotions: ["E09"], expression_types: ["X08"], vibe: "V11", power: [], grammar_intent: ["G21"], flags: [] },
]);

console.log('\nAll 18 files processed successfully!');
