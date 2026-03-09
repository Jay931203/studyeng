#!/usr/bin/env node
/**
 * batch-tag-expressions.mjs
 *
 * Batch-tags subtitle sentences using GPT-4o-mini for the Shortee English learning app.
 * Classifies each sentence across 9 dimensions using the expression taxonomy.
 *
 * Usage:
 *   OPENAI_API_KEY=xxx node scripts/batch-tag-expressions.mjs
 *   OPENAI_API_KEY=xxx node scripts/batch-tag-expressions.mjs --sample
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// ─── Config ───────────────────────────────────────────────────────────────────
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error('ERROR: OPENAI_API_KEY environment variable is required.');
  process.exit(1);
}

const MODEL = 'gpt-4o-mini';
const BATCH_SIZE = 25;
const MAX_CONCURRENCY = 5;
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

const TRANSCRIPTS_DIR = path.join(ROOT, 'public', 'transcripts');
const OUTPUT_DIR = path.join(ROOT, 'public', 'expression-tags');
const PROGRESS_FILE = path.join(ROOT, 'logs', 'tag-progress.json');
const SEED_VIDEOS_PATH = path.join(ROOT, 'src', 'data', 'seed-videos.ts');

const IS_SAMPLE = process.argv.includes('--sample');
const SAMPLE_COUNT = 5;

// ─── Valid Tag Sets (for validation) ──────────────────────────────────────────
const VALID = {
  functions: new Set(Array.from({ length: 65 }, (_, i) => `F${String(i + 1).padStart(2, '0')}`)),
  situation: new Set(Array.from({ length: 50 }, (_, i) => `S${String(i + 1).padStart(2, '0')}`)),
  cefr: new Set(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  register: new Set(['R1', 'R2', 'R3', 'R4', 'R5']),
  emotions: new Set(Array.from({ length: 16 }, (_, i) => `E${String(i + 1).padStart(2, '0')}`)),
  expression_types: new Set(Array.from({ length: 8 }, (_, i) => `X${String(i + 1).padStart(2, '0')}`)),
  vibe: new Set(Array.from({ length: 18 }, (_, i) => `V${String(i + 1).padStart(2, '0')}`)),
  power: new Set(Array.from({ length: 12 }, (_, i) => `P${String(i + 1).padStart(2, '0')}`)),
  grammar_intent: new Set(Array.from({ length: 25 }, (_, i) => `G${String(i + 1).padStart(2, '0')}`)),
  flags: new Set(['is_lyrics', 'is_narration', 'is_period', 'contains_profanity', 'is_fragment']),
};

// ─── System Prompt ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a sentence classifier for an English learning app called Shortee. Classify each sentence across 9 dimensions using the taxonomy below. Output ONLY a JSON array — no markdown, no explanation, no code fences.

## TAXONOMY

### Dimension 1: Communicative Function (functions) — Array of 1-3 IDs
INFORMATION: F01=stating_fact, F02=describing, F03=narrating, F04=explaining, F05=reporting, F06=asking_information, F07=confirming, F08=correcting
OPINIONS: F09=expressing_opinion, F10=agreeing, F11=disagreeing, F12=evaluating_judging, F13=comparing, F14=speculating
EMOTIONS: F15=expressing_happiness, F16=expressing_sadness, F17=expressing_anger, F18=expressing_surprise, F19=expressing_fear_worry, F20=expressing_disappointment, F21=expressing_frustration, F22=expressing_love_affection, F23=expressing_disgust, F24=expressing_hope
SOCIAL: F25=greeting, F26=introducing, F27=thanking, F28=apologizing, F29=congratulating, F30=complimenting, F31=consoling_comforting, F32=saying_goodbye, F33=small_talk
GETTING THINGS DONE: F34=requesting, F35=ordering_commanding, F36=suggesting, F37=advising, F38=inviting, F39=offering, F40=warning, F41=promising, F42=threatening, F43=refusing, F44=accepting, F45=persuading, F46=permission_asking, F47=permission_granting
CONVERSATION MGMT: F48=changing_topic, F49=interrupting, F50=clarifying, F51=checking_understanding, F52=buying_time, F53=backchanneling, F54=summarizing
CONFLICT: F55=accusing, F56=denying, F57=defending, F58=insulting, F59=sarcasm_irony, F60=confronting, F61=forgiving
DECLARATIONS: F62=announcing, F63=deciding, F64=confessing, F65=vowing

### Dimension 2: Situation (situation) — Single ID
DAILY: S01=home_family, S02=cooking_meals, S03=morning_routine, S04=shopping, S05=restaurant_cafe, S06=driving_commuting, S07=neighborhood_errands
RELATIONSHIPS: S08=romantic_dating, S09=friendship, S10=family_conflict, S11=breakup_divorce, S12=wedding_proposal, S13=reunion_reconciliation
WORK: S14=workplace_office, S15=job_interview, S16=meeting_presentation, S17=boss_employee, S18=startup_business
SCHOOL: S19=school_classroom, S20=college_campus, S21=tutoring_study
TRAVEL: S22=airport_travel, S23=hotel_accommodation, S24=phone_call, S25=bank_finance, S26=public_transport
HEALTH: S27=hospital_doctor, S28=emergency_medical, S29=therapy_counseling, S30=fitness_gym
SOCIAL: S31=party_celebration, S32=bar_nightlife, S33=sports_game, S34=concert_show, S35=online_social_media
HIGH STAKES: S36=legal_courtroom, S37=police_investigation, S38=emergency_crisis, S39=confrontation_argument, S40=confession_secret, S41=funeral_grief, S42=military_war
SPECIAL: S43=fantasy_scifi, S44=period_historical, S45=animation_cartoon, S46=music_lyrics, S47=news_documentary, S48=self_help_motivation
CATCH-ALL: S49=how_to_tutorial, S50=general

### Dimension 3: CEFR (cefr) — Single string: A1, A2, B1, B2, C1, C2
Profanity/slang does NOT automatically mean C-level. "Shut up" = A2. Period/archaic = C2. Song lyrics: tag literal grammar level.
Expected: A1-A2 ~15%, B1-B2 ~55%, C1-C2 ~30%

### Dimension 4: Register (register) — Single ID
R1=frozen (ritualized: "I do solemnly swear"), R2=formal (professional), R3=consultative (respectful standard), R4=casual (among peers), R5=intimate (close relationships)
Expected: R4 ~50%, R3 ~25%, R2 ~10%, R5 ~13%, R1 ~2%

### Dimension 5: Emotion/Tone (emotions) — Array of 1-2 IDs
E01=joy, E02=sadness, E03=anger, E04=fear, E05=surprise, E06=anticipation, E07=trust, E08=disgust, E09=neutral, E10=sarcastic, E11=romantic, E12=threatening, E13=pleading, E14=playful, E15=desperate, E16=bitter
IMPORTANT: neutral (E09) should be the most common emotion tag — use it for any purely informational sentence. Sarcastic (E10) can combine with any other emotion.

### Dimension 6: Expression Type (expression_types) — Array of 1-3 IDs
X01=phrasal_verb, X02=idiom, X03=collocation, X04=fixed_expression, X05=slang, X06=filler_discourse_marker, X07=hedging, X08=plain
plain (X08) is the default when no special pattern.

### Dimension 7: Vibe (vibe) — Single ID
V01=sassy, V02=wholesome, V03=savage, V04=cringe, V05=motivational, V06=dark_humor, V07=romantic_sweet, V08=badass, V09=emotional_heavy, V10=funny, V11=awkward, V12=intense, V13=chill, V14=nostalgic, V15=petty, V16=wise, V17=chaotic, V18=neutral_plain
IMPORTANT: V18 (neutral_plain) should be used for educational/tutorial content. V10 (funny) should only be used when the sentence is genuinely humorous. Vibe is about the FEELING the content gives the viewer.

### Dimension 8: Power Tag (power) — Array of 0-2 IDs
P01=native_only, P02=interview_killer, P03=daily_essential, P04=movie_famous, P05=slang_alert, P06=culture_key, P07=comeback_ready, P08=debate_weapon, P09=flirt_line, P10=emotional_punch, P11=business_pro, P12=test_likely
IMPORTANT: Most sentences (60%+) should have NO power tags. Only tag standout expressions.

### Dimension 9: Grammar Intent (grammar_intent) — Array of 0-2 IDs
G01=거절할_때, G02=부탁할_때, G03=칭찬할_때, G04=사과할_때, G05=위로할_때, G06=화낼_때, G07=놀랐을_때, G08=약속할_때, G09=제안할_때, G10=비교할_때, G11=후회할_때, G12=가정할_때, G13=허락_구할_때, G14=인_척_할_때, G15=원하는_걸_말할_때, G16=확신할_때, G17=불확실할_때, G18=설명할_때, G19=불평할_때, G20=동의할_때, G21=반대할_때, G22=고백할_때, G23=응원할_때, G24=경고할_때, G25=작별할_때
IMPORTANT: Most sentences (50%+) should have NO grammar_intent. Only tag when a clear, learnable pattern is present.

### Special Flags (flags) — Array of 0-3 strings
is_lyrics, is_narration, is_period, contains_profanity, is_fragment
Tag contains_profanity generously. is_fragment for interjections/exclamations only.

## OUTPUT FORMAT
For each input sentence, output one JSON object with:
- "idx": the sentence index from the input (integer)
- "tags": object with keys: functions, situation, cefr, register, emotions, expression_types, vibe, power, grammar_intent, flags

## GOLD-STANDARD EXAMPLES

Example 1 — Casual persuasion (drama):
Input: "Come on, it'll be fun, I promise!"
Output: {"idx":0,"tags":{"functions":["F45","F41"],"situation":"S31","cefr":"A2","register":"R4","emotions":["E01","E06"],"expression_types":["X08"],"vibe":"V13","power":["P03"],"grammar_intent":["G09"],"flags":[]}}

Example 2 — Dramatic confrontation (drama):
Input: "You lied to me! You've been lying this whole time!"
Output: {"idx":0,"tags":{"functions":["F55","F60"],"situation":"S39","cefr":"B1","register":"R4","emotions":["E03","E08"],"expression_types":["X08"],"vibe":"V12","power":[],"grammar_intent":["G06"],"flags":[]}}

Example 3 — Educational narration (tutorial):
Input: "Today we're going to learn three easy ways to start a conversation."
Output: {"idx":0,"tags":{"functions":["F62","F04"],"situation":"S49","cefr":"A2","register":"R3","emotions":["E09"],"expression_types":["X08"],"vibe":"V18","power":["P03"],"grammar_intent":[],"flags":["is_narration"]}}

## RULES
- When uncertain, prefer the more common/general tag.
- Output ONLY a valid JSON array of objects. No markdown fences, no explanation.
- Every object MUST have "idx" (integer) and "tags" (object with all 10 keys).`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Parse seed-videos.ts to build youtubeId -> category map */
function buildCategoryMap() {
  const src = fs.readFileSync(SEED_VIDEOS_PATH, 'utf-8');
  const map = {};

  // Match each video entry block: { ... youtubeId: 'XXX', ... category: 'YYY', ... }
  // The video entries are inside seedVideos array
  const seedSection = src.slice(src.indexOf('seedVideos'));
  // Simple regex: capture youtubeId and category from each object block
  const entryRegex = /\{\s*[^}]*?youtubeId:\s*'([^']+)'[^}]*?category:\s*'([^']+)'[^}]*?\}/gs;
  let match;
  while ((match = entryRegex.exec(seedSection)) !== null) {
    map[match[1]] = match[2];
  }

  // Also try reversed order (category before youtubeId)
  const entryRegex2 = /\{\s*[^}]*?category:\s*'([^']+)'[^}]*?youtubeId:\s*'([^']+)'[^}]*?\}/gs;
  while ((match = entryRegex2.exec(seedSection)) !== null) {
    if (!map[match[2]]) {
      map[match[2]] = match[1];
    }
  }

  return map;
}

/** Load progress state */
function loadProgress() {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
    }
  } catch (e) {
    console.warn('Warning: Could not load progress file, starting fresh.');
  }
  return {
    completed: [],
    failed: [],
    stats: {
      totalSentences: 0,
      totalBatches: 0,
      totalTokensInput: 0,
      totalTokensOutput: 0,
      validationErrors: 0,
      startTime: Date.now(),
    },
  };
}

/** Save progress state */
function saveProgress(progress) {
  const logsDir = path.dirname(PROGRESS_FILE);
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

/** Call OpenAI API with retry + exponential backoff */
async function callOpenAI(messages, retryCount = 0) {
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.1,
        max_tokens: 4096,
        response_format: { type: 'json_object' },
      }),
    });

    if (res.status === 429 || res.status >= 500) {
      if (retryCount >= MAX_RETRIES) {
        throw new Error(`API returned ${res.status} after ${MAX_RETRIES} retries`);
      }
      const backoff = INITIAL_BACKOFF_MS * Math.pow(2, retryCount);
      const jitter = Math.random() * backoff * 0.5;
      console.warn(`  Rate limited (${res.status}), retrying in ${Math.round(backoff + jitter)}ms...`);
      await sleep(backoff + jitter);
      return callOpenAI(messages, retryCount + 1);
    }

    if (!res.ok) {
      const body = await res.text();
      // Don't retry auth errors
      if (res.status === 401 || res.status === 403) {
        console.error(`FATAL: Authentication error (${res.status}). Check your OPENAI_API_KEY.`);
        process.exit(1);
      }
      throw new Error(`API error ${res.status}: ${body.slice(0, 500)}`);
    }

    const data = await res.json();
    return {
      content: data.choices[0].message.content,
      usage: data.usage || { prompt_tokens: 0, completion_tokens: 0 },
    };
  } catch (err) {
    if (retryCount < MAX_RETRIES && (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT' || err.message?.includes('fetch failed'))) {
      const backoff = INITIAL_BACKOFF_MS * Math.pow(2, retryCount);
      console.warn(`  Network error, retrying in ${backoff}ms: ${err.message}`);
      await sleep(backoff);
      return callOpenAI(messages, retryCount + 1);
    }
    throw err;
  }
}

/** Validate a single tagged result */
function validateResult(result, sentenceCount) {
  const errors = [];

  if (result.idx == null || typeof result.idx !== 'number') {
    errors.push('missing or invalid idx');
  }
  if (!result.tags || typeof result.tags !== 'object') {
    errors.push('missing tags object');
    return errors;
  }

  const t = result.tags;

  // functions: array of 1-3
  if (!Array.isArray(t.functions) || t.functions.length < 1 || t.functions.length > 3) {
    errors.push(`functions: expected array of 1-3, got ${JSON.stringify(t.functions)}`);
  } else {
    for (const f of t.functions) {
      if (!VALID.functions.has(f)) errors.push(`functions: invalid ID "${f}"`);
    }
  }

  // situation: single string
  if (typeof t.situation !== 'string' || !VALID.situation.has(t.situation)) {
    errors.push(`situation: invalid "${t.situation}"`);
  }

  // cefr: single string
  if (!VALID.cefr.has(t.cefr)) {
    errors.push(`cefr: invalid "${t.cefr}"`);
  }

  // register: single string
  if (!VALID.register.has(t.register)) {
    errors.push(`register: invalid "${t.register}"`);
  }

  // emotions: array of 1-2
  if (!Array.isArray(t.emotions) || t.emotions.length < 1 || t.emotions.length > 2) {
    errors.push(`emotions: expected array of 1-2, got ${JSON.stringify(t.emotions)}`);
  } else {
    for (const e of t.emotions) {
      if (!VALID.emotions.has(e)) errors.push(`emotions: invalid ID "${e}"`);
    }
  }

  // expression_types: array of 1-3
  if (!Array.isArray(t.expression_types) || t.expression_types.length < 1 || t.expression_types.length > 3) {
    errors.push(`expression_types: expected array of 1-3, got ${JSON.stringify(t.expression_types)}`);
  } else {
    for (const x of t.expression_types) {
      if (!VALID.expression_types.has(x)) errors.push(`expression_types: invalid ID "${x}"`);
    }
  }

  // vibe: single string
  if (!VALID.vibe.has(t.vibe)) {
    errors.push(`vibe: invalid "${t.vibe}"`);
  }

  // power: array of 0-2
  if (!Array.isArray(t.power) || t.power.length > 2) {
    errors.push(`power: expected array of 0-2, got ${JSON.stringify(t.power)}`);
  } else {
    for (const p of t.power) {
      if (!VALID.power.has(p)) errors.push(`power: invalid ID "${p}"`);
    }
  }

  // grammar_intent: array of 0-2
  if (!Array.isArray(t.grammar_intent) || t.grammar_intent.length > 2) {
    errors.push(`grammar_intent: expected array of 0-2, got ${JSON.stringify(t.grammar_intent)}`);
  } else {
    for (const g of t.grammar_intent) {
      if (!VALID.grammar_intent.has(g)) errors.push(`grammar_intent: invalid ID "${g}"`);
    }
  }

  // flags: array of 0-3
  if (!Array.isArray(t.flags) || t.flags.length > 3) {
    errors.push(`flags: expected array of 0-3, got ${JSON.stringify(t.flags)}`);
  } else {
    for (const f of t.flags) {
      if (!VALID.flags.has(f)) errors.push(`flags: invalid flag "${f}"`);
    }
  }

  return errors;
}

/** Parse the AI response, handling quirks */
function parseAIResponse(content) {
  let text = content.trim();

  // Remove markdown code fences if present
  text = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');

  const parsed = JSON.parse(text);

  // If the response is a json_object with a wrapper key (e.g., {"results": [...]})
  if (!Array.isArray(parsed)) {
    // Look for the first array property
    for (const key of Object.keys(parsed)) {
      if (Array.isArray(parsed[key])) {
        return parsed[key];
      }
    }
    throw new Error('Response is not an array and contains no array property');
  }

  return parsed;
}

/** Process a single batch of sentences */
async function processBatch(sentences, videoId, category, batchIdx) {
  const userContent = sentences
    .map((s, i) => `${i}. [en] ${s.en}\n   [ko] ${s.ko}`)
    .join('\n');

  const contextLine = `Video: ${videoId} | Category: ${category} | Sentences ${batchIdx * BATCH_SIZE}-${batchIdx * BATCH_SIZE + sentences.length - 1}`;

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `Context: ${contextLine}\n\nClassify these ${sentences.length} sentences. Output a JSON object with key "results" containing an array of ${sentences.length} objects, each with "idx" (matching the number before the sentence) and "tags".\n\n${userContent}`,
    },
  ];

  const { content, usage } = await callOpenAI(messages);
  let results;
  try {
    results = parseAIResponse(content);
  } catch (parseErr) {
    throw new Error(`JSON parse error: ${parseErr.message}\nRaw: ${content.slice(0, 300)}`);
  }

  if (!Array.isArray(results)) {
    throw new Error(`Expected array, got ${typeof results}`);
  }

  // Validate each result
  let validationErrors = 0;
  const validated = [];

  for (let i = 0; i < sentences.length; i++) {
    // Find the matching result by idx
    let result = results.find(r => r.idx === i);
    if (!result && results[i]) {
      // Fallback: use positional mapping
      result = results[i];
      result.idx = i;
    }
    if (!result) {
      validationErrors++;
      console.warn(`    Missing result for idx ${i}`);
      continue;
    }

    const errors = validateResult(result, sentences.length);
    if (errors.length > 0) {
      validationErrors++;
      // Attempt to fix minor issues
      if (result.tags) {
        // Fix missing arrays
        if (!Array.isArray(result.tags.power)) result.tags.power = [];
        if (!Array.isArray(result.tags.grammar_intent)) result.tags.grammar_intent = [];
        if (!Array.isArray(result.tags.flags)) result.tags.flags = [];
        // Re-validate after fix
        const errors2 = validateResult(result, sentences.length);
        if (errors2.length > 0) {
          console.warn(`    Validation errors for idx ${i}: ${errors2.join(', ')}`);
        }
      }
    }

    validated.push(result);
  }

  return { results: validated, usage, validationErrors };
}

/** Process a single video file */
async function processVideo(videoId, category, progress) {
  const transcriptPath = path.join(TRANSCRIPTS_DIR, `${videoId}.json`);
  if (!fs.existsSync(transcriptPath)) {
    console.warn(`  Transcript not found: ${videoId}`);
    return null;
  }

  let sentences;
  try {
    sentences = JSON.parse(fs.readFileSync(transcriptPath, 'utf-8'));
  } catch (e) {
    console.warn(`  Invalid JSON in ${videoId}: ${e.message}`);
    return null;
  }

  if (!Array.isArray(sentences) || sentences.length === 0) {
    console.warn(`  Empty or invalid transcript: ${videoId}`);
    return null;
  }

  // Filter out sentences with empty en text
  sentences = sentences.filter(s => s.en && s.en.trim().length > 0);
  if (sentences.length === 0) {
    console.warn(`  No valid sentences in: ${videoId}`);
    return null;
  }

  console.log(`  Processing ${videoId} (${sentences.length} sentences, category: ${category})`);

  // Split into batches
  const batches = [];
  for (let i = 0; i < sentences.length; i += BATCH_SIZE) {
    batches.push(sentences.slice(i, i + BATCH_SIZE));
  }

  const allResults = [];
  let totalTokensIn = 0;
  let totalTokensOut = 0;
  let totalValErrors = 0;

  for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
    const batch = batches[batchIdx];
    let success = false;
    let lastError;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const { results, usage, validationErrors } = await processBatch(
          batch,
          videoId,
          category,
          batchIdx
        );

        totalTokensIn += usage.prompt_tokens;
        totalTokensOut += usage.completion_tokens;
        totalValErrors += validationErrors;

        // Map results back to sentence format
        for (const r of results) {
          const globalIdx = batchIdx * BATCH_SIZE + r.idx;
          const sentence = sentences[globalIdx];
          if (sentence) {
            allResults.push({
              id: `${videoId}-${globalIdx}`,
              en: sentence.en,
              ko: sentence.ko,
              tags: r.tags,
            });
          }
        }

        success = true;
        break;
      } catch (err) {
        lastError = err;
        if (attempt === 0) {
          console.warn(`    Batch ${batchIdx + 1}/${batches.length} failed, retrying: ${err.message}`);
          await sleep(2000);
        }
      }
    }

    if (!success) {
      console.error(`    Batch ${batchIdx + 1}/${batches.length} FAILED after retry: ${lastError.message}`);
      totalValErrors++;
    }

    // Brief pause between batches within same video
    if (batchIdx < batches.length - 1) {
      await sleep(200);
    }
  }

  // Update progress stats
  progress.stats.totalSentences += allResults.length;
  progress.stats.totalBatches += batches.length;
  progress.stats.totalTokensInput += totalTokensIn;
  progress.stats.totalTokensOutput += totalTokensOut;
  progress.stats.validationErrors += totalValErrors;

  return allResults;
}

/** Concurrency limiter */
function createPool(maxConcurrency) {
  let active = 0;
  const queue = [];

  function next() {
    if (queue.length === 0 || active >= maxConcurrency) return;
    active++;
    const { fn, resolve, reject } = queue.shift();
    fn()
      .then(resolve)
      .catch(reject)
      .finally(() => {
        active--;
        next();
      });
  }

  return {
    add(fn) {
      return new Promise((resolve, reject) => {
        queue.push({ fn, resolve, reject });
        next();
      });
    },
  };
}

/** Print final stats report */
function printReport(progress, tagDistribution) {
  const elapsed = ((Date.now() - progress.stats.startTime) / 1000 / 60).toFixed(1);
  const costInput = (progress.stats.totalTokensInput / 1_000_000) * 0.15;   // gpt-4o-mini input
  const costOutput = (progress.stats.totalTokensOutput / 1_000_000) * 0.60; // gpt-4o-mini output
  const totalCost = costInput + costOutput;

  console.log('\n' + '='.repeat(70));
  console.log('TAGGING REPORT');
  console.log('='.repeat(70));
  console.log(`Total sentences tagged: ${progress.stats.totalSentences}`);
  console.log(`Total batches processed: ${progress.stats.totalBatches}`);
  console.log(`Videos completed: ${progress.completed.length}`);
  console.log(`Videos failed: ${progress.failed.length}`);
  console.log(`Validation errors: ${progress.stats.validationErrors}`);
  console.log(`Time elapsed: ${elapsed} minutes`);
  console.log(`Tokens — Input: ${progress.stats.totalTokensInput.toLocaleString()}, Output: ${progress.stats.totalTokensOutput.toLocaleString()}`);
  console.log(`Estimated cost: $${totalCost.toFixed(4)} (in: $${costInput.toFixed(4)}, out: $${costOutput.toFixed(4)})`);

  if (progress.failed.length > 0) {
    console.log(`\nFailed videos: ${progress.failed.join(', ')}`);
  }

  // Tag distribution (top 10 per dimension)
  console.log('\n--- Tag Distribution (Top 10 per Dimension) ---');
  for (const [dim, counts] of Object.entries(tagDistribution)) {
    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    console.log(`\n${dim}:`);
    for (const [tag, count] of sorted) {
      const pct = ((count / progress.stats.totalSentences) * 100).toFixed(1);
      console.log(`  ${tag}: ${count} (${pct}%)`);
    }
  }
  console.log('\n' + '='.repeat(70));
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Shortee Expression Tagger');
  console.log(`Mode: ${IS_SAMPLE ? 'SAMPLE (5 videos)' : 'FULL'}`);
  console.log(`Model: ${MODEL}`);
  console.log(`Batch size: ${BATCH_SIZE}, Max concurrency: ${MAX_CONCURRENCY}`);
  console.log('');

  // 1. Build category map
  console.log('Building video category map from seed-videos.ts...');
  const categoryMap = buildCategoryMap();
  const knownCount = Object.keys(categoryMap).length;
  console.log(`  Found ${knownCount} videos with category info.`);

  // 2. Get all transcript files
  const transcriptFiles = fs.readdirSync(TRANSCRIPTS_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', ''));

  console.log(`  Found ${transcriptFiles.length} transcript files.`);

  // 3. Load progress
  let progress = loadProgress();
  const completedSet = new Set(progress.completed);
  const failedSet = new Set(progress.failed);

  // 4. Filter out already completed
  let toProcess = transcriptFiles.filter(id => !completedSet.has(id));
  console.log(`  Already completed: ${completedSet.size}, remaining: ${toProcess.length}`);

  // 5. If sample mode, pick 5 random
  if (IS_SAMPLE) {
    // Shuffle and pick
    const shuffled = toProcess.sort(() => Math.random() - 0.5);
    toProcess = shuffled.slice(0, SAMPLE_COUNT);
    console.log(`  Sample mode: selected ${toProcess.length} videos: ${toProcess.join(', ')}`);
  }

  if (toProcess.length === 0) {
    console.log('Nothing to process. All videos already tagged.');
    return;
  }

  // 6. Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // 7. Track tag distribution for report
  const tagDistribution = {
    functions: {},
    situation: {},
    cefr: {},
    register: {},
    emotions: {},
    expression_types: {},
    vibe: {},
    power: {},
    grammar_intent: {},
    flags: {},
  };

  function countTags(taggedSentences) {
    for (const s of taggedSentences) {
      if (!s.tags) continue;
      // Array dimensions
      for (const dim of ['functions', 'emotions', 'expression_types', 'power', 'grammar_intent', 'flags']) {
        if (Array.isArray(s.tags[dim])) {
          for (const val of s.tags[dim]) {
            tagDistribution[dim][val] = (tagDistribution[dim][val] || 0) + 1;
          }
        }
      }
      // Single dimensions
      for (const dim of ['situation', 'cefr', 'register', 'vibe']) {
        if (s.tags[dim]) {
          tagDistribution[dim][s.tags[dim]] = (tagDistribution[dim][s.tags[dim]] || 0) + 1;
        }
      }
    }
  }

  // Also count already-completed files for the report
  if (!IS_SAMPLE) {
    for (const videoId of progress.completed) {
      const tagFile = path.join(OUTPUT_DIR, `${videoId}.json`);
      if (fs.existsSync(tagFile)) {
        try {
          const existing = JSON.parse(fs.readFileSync(tagFile, 'utf-8'));
          countTags(existing);
        } catch (e) {
          // skip
        }
      }
    }
  }

  // 8. Process videos with concurrency pool
  if (!progress.stats.startTime) progress.stats.startTime = Date.now();

  const pool = createPool(MAX_CONCURRENCY);
  let processedCount = 0;

  const tasks = toProcess.map(videoId => {
    return pool.add(async () => {
      const category = categoryMap[videoId] || 'unknown';

      try {
        const results = await processVideo(videoId, category, progress);

        if (results && results.length > 0) {
          // Write output file
          const outPath = path.join(OUTPUT_DIR, `${videoId}.json`);
          fs.writeFileSync(outPath, JSON.stringify(results, null, 2));

          // Count tags
          countTags(results);

          // Mark completed
          progress.completed.push(videoId);
          completedSet.add(videoId);

          // Remove from failed if it was there
          const failIdx = progress.failed.indexOf(videoId);
          if (failIdx >= 0) progress.failed.splice(failIdx, 1);
        } else {
          // Empty/missing transcript
          progress.completed.push(videoId);
          completedSet.add(videoId);
        }
      } catch (err) {
        console.error(`  FAILED ${videoId}: ${err.message}`);
        if (!failedSet.has(videoId)) {
          progress.failed.push(videoId);
          failedSet.add(videoId);
        }
      }

      processedCount++;
      if (processedCount % 10 === 0 || processedCount === toProcess.length) {
        console.log(`\nProgress: ${processedCount}/${toProcess.length} videos processed`);
        saveProgress(progress);
      }
    });
  });

  await Promise.all(tasks);

  // 9. Final save
  saveProgress(progress);

  // 10. Print report
  printReport(progress, tagDistribution);

  console.log('\nDone. Results written to public/expression-tags/');
  console.log(`Progress saved to ${PROGRESS_FILE}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
