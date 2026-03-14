#!/usr/bin/env node
/**
 * Batch Korean translation using OpenAI API for transcript files
 * Translates en -> ko for all segments with empty ko
 */
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'public', 'transcripts');
const API_KEY = process.env.OPENAI_API_KEY || fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8').match(/OPENAI_API_KEY=(.+)/)?.[1];

const DONE = new Set(['tH90bAkHoKU.json','vG8rOAi6Q2g.json','Vn6MHmDo_Ck.json','VPaOy3G1-2A.json','wOrJT-Q8CKE.json','XO77YuyMOek.json','XoyZmu0IOKc.json','ZK3O402wf1c.json','_bBRVNkAfkQ.json','_Yhyp-_hX2s.json','SgXpsZa8_i4.json','txdUE10OopA.json','YsKKuCUYUMU.json','ZOfisAF09AA.json','ZrX1XKtShSI.json','zvY-EPgYB4Y.json','TeQ_TTyLGMs.json','Yo-Xp1avRYk.json','TIPgh1WJqzg.json','yqc9zX04DXs.json','sXkmrD_oTVA.json','wM6exo00T5I.json','v5pWL7xxLss.json','YQlTYi8HbFY.json','zhVoAC9cViA.json','SARmbOtChGg.json']);

async function translateBatch(segments) {
  const prompt = `Translate the following English subtitle segments to natural Korean.

Rules:
- Casual dialogue: use 반말 (informal speech)
- Formal speech/presentations: use 존댓말 (polite speech)
- [Music], sound effects, song lyrics, non-English text: return empty string ""
- Keep translations concise (subtitle length)
- Return ONLY a JSON array of Korean strings, one per input segment
- The array MUST have EXACTLY ${segments.length} elements - no more, no less
- Each element corresponds to the input segment at the same index

Input (${segments.length} segments):
${JSON.stringify(segments)}`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 16000,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API error ${res.status}: ${err}`);
  }

  const json = await res.json();
  const content = json.choices[0].message.content;

  // Extract JSON array from response
  const match = content.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('No JSON array in response: ' + content.substring(0, 200));

  const translations = JSON.parse(match[0]);
  if (translations.length !== segments.length) {
    // Try to pad or truncate
    if (translations.length < segments.length) {
      while (translations.length < segments.length) translations.push('');
    } else {
      translations.length = segments.length;
    }
    console.warn(`    WARNING: adjusted length from ${JSON.parse(match[0]).length} to ${segments.length}`);
  }

  return translations;
}

async function processFile(filename) {
  const filepath = path.join(DIR, filename);
  const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));

  // Find segments that need translation
  const needsTranslation = [];
  const indices = [];

  for (let i = 0; i < data.length; i++) {
    if (data[i].ko === '' && data[i].en.trim().length > 3) {
      needsTranslation.push(data[i].en);
      indices.push(i);
    }
  }

  if (needsTranslation.length === 0) {
    console.log(`[SKIP] ${filename}: no segments need translation`);
    return;
  }

  console.log(`[START] ${filename}: ${needsTranslation.length} segments to translate`);

  // Process in batches of 20 segments (smaller for reliability)
  const BATCH_SIZE = 20;
  for (let b = 0; b < needsTranslation.length; b += BATCH_SIZE) {
    const batch = needsTranslation.slice(b, b + BATCH_SIZE);
    const batchIndices = indices.slice(b, b + BATCH_SIZE);

    try {
      const translations = await translateBatch(batch);

      for (let j = 0; j < translations.length; j++) {
        data[batchIndices[j]].ko = translations[j];
      }

      // Save after each batch
      fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
      console.log(`  batch ${Math.floor(b/BATCH_SIZE)+1}/${Math.ceil(needsTranslation.length/BATCH_SIZE)}: ${batch.length} segments translated`);

      // Rate limiting
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.error(`  ERROR in batch ${Math.floor(b/BATCH_SIZE)+1}: ${err.message}`);
      // Try smaller batches on error
      for (let j = 0; j < batch.length; j++) {
        try {
          const [translation] = await translateBatch([batch[j]]);
          data[batchIndices[j]].ko = translation;
          fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
        } catch (e2) {
          console.error(`    Failed single segment ${batchIndices[j]}: ${e2.message}`);
        }
        await new Promise(r => setTimeout(r, 200));
      }
    }
  }

  console.log(`[DONE] ${filename}`);
}

async function main() {
  const files = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'output', 'ko-resume-3.json'), 'utf8'));
  const remaining = files.filter(f => !DONE.has(f));

  console.log(`Processing ${remaining.length} files...`);

  for (const f of remaining) {
    await processFile(f);
  }

  console.log('\nAll done!');
}

main().catch(console.error);
