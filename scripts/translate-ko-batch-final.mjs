import fs from 'fs';
import { config } from 'dotenv';
config({ path: '.env.local', override: true });

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const dir = 'public/transcripts';

const shortPhrases = {
  'Thank you': '감사합니다', 'Thank you.': '감사합니다.', 'Thanks': '고마워요', 'Thanks.': '고마워요.',
  'Yes': '네', 'Yes.': '네.', 'No': '아니요', 'No.': '아니요.', 'Yeah': '응', 'Yeah.': '응.',
  'Okay': '알겠어', 'OK': '알겠어', 'Sure': '물론', 'Right': '맞아', 'Right.': '맞아.',
  'Sorry': '미안해', 'Sorry.': '미안해.', 'Bye': '안녕', 'Bye.': '안녕.',
  'Hello': '안녕하세요', 'Hello.': '안녕하세요.', 'Hi': '안녕', 'Hi.': '안녕.',
  'Wow': '와', 'Wow.': '와.', 'What': '뭐', 'What?': '뭐?', 'Why': '왜', 'Why?': '왜?',
  'Please': '제발', 'Please.': '제발.', 'Stop': '그만', 'Stop.': '그만.', 'Stop!': '그만!',
  'Wait': '잠깐', 'Wait.': '잠깐.', 'Come on': '어서', 'Come on.': '어서.',
  'Go ahead': '말해봐', 'Go ahead.': '말해봐.', 'Good morning': '좋은 아침',
  'Good night': '잘 자', 'Good luck': '행운을 빌어', 'Congratulations': '축하해',
  'Exactly': '맞아', 'Exactly.': '맞아.', 'Welcome': '환영해요', 'Welcome.': '환영해요.',
  'Goodbye': '안녕히 가세요', 'Goodbye.': '안녕히 가세요.',
  'Good job': '잘했어', 'Well done': '잘했어',
  'Thank you so much': '정말 감사합니다', 'Thank you so much.': '정말 감사합니다.',
  'Thank you very much': '대단히 감사합니다', 'Thank you very much.': '대단히 감사합니다.',
  'No way': '말도 안 돼', 'No way.': '말도 안 돼.', 'No way!': '말도 안 돼!',
  'Of course': '물론', 'Of course.': '물론.', 'Absolutely': '당연하지', 'Absolutely.': '당연하지.',
  'Really': '정말', 'Really?': '정말?', 'Really.': '정말.',
  "Let's go": '가자', "Let's go.": '가자.', "Let's go!": '가자!',
  'Oh my God': '세상에', 'Oh my God.': '세상에.', 'Oh my God!': '세상에!',
  'I know': '알아', 'I know.': '알아.',
  'Here we go': '자 시작이야', 'Here we go.': '자 시작이야.',
  'Thank you Thank you': '감사합니다, 감사합니다',
  'Thank you for coming': '와주셔서 감사합니다',
  'Thank you for your time': '시간 내주셔서 감사합니다',
  'Good evening': '좋은 저녁이에요',
  'Good afternoon': '좋은 오후예요',
  "You're welcome": '천만에요',
  'Damn': '젠장',
  'To be continued': '계속',
  'Goodness': '세상에',
};

function isNonTranslatable(en) {
  if (/^[♪♫\s]+$/.test(en)) return true;
  if (/^(MUSIC|APPLAUSE|LAUGHTER|CHEERING|CROWD)$/i.test(en)) return true;
  if (/^(Oh|Ah|Ha|Hmm|Whoa|Huh|Ugh|Ooh|Yay|Phew|Shh|Psst|Boom|Oops|Wow|Uh|Um|Mm|Eh)[.!]*$/i.test(en)) return true;
  if (/^©/.test(en)) return true;
  if (/^Transcriber/i.test(en) || /^Translator/i.test(en)) return true;
  return false;
}

async function translateBatch(segments) {
  const numbered = segments.map((s, i) => `${i+1}. ${s.en}`).join('\n');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content: `You are a professional English to Korean subtitle translator. Translate each numbered English line to natural Korean. Rules:
- Output ONLY the numbered Korean translations, one per line
- Keep the same numbering (1. 2. 3. etc.)
- Use natural spoken Korean (match the tone - casual/formal as appropriate)
- Keep names/proper nouns in English
- Do NOT add explanations
- For song lyrics, translate poetically
- For very short utterances (single words, exclamations), keep them brief`
        },
        { role: 'user', content: numbered }
      ]
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const text = data.choices[0].message.content.trim();
  const lines = text.split('\n').filter(l => l.trim());

  const translations = {};
  for (const line of lines) {
    const m = line.match(/^(\d+)\.\s*(.+)/);
    if (m) {
      translations[parseInt(m[1]) - 1] = m[2].trim();
    }
  }
  return translations;
}

async function main() {
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

  const toTranslate = [];
  let totalHandledByShortPhrase = 0;

  for (const f of files) {
    const filepath = dir + '/' + f;
    const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
    let changed = false;
    const needsApi = [];

    for (let i = 0; i < data.length; i++) {
      const seg = data[i];
      if (seg.ko && seg.ko.trim().length > 0) continue;

      const en = (seg.en || '').trim();
      if (!en) { seg.ko = ''; changed = true; continue; }

      if (isNonTranslatable(en)) {
        seg.ko = '';
        changed = true;
        continue;
      }

      if (shortPhrases[en] !== undefined) {
        seg.ko = shortPhrases[en];
        changed = true;
        totalHandledByShortPhrase++;
        continue;
      }

      needsApi.push({ idx: i, en });
    }

    if (changed) {
      fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    }

    if (needsApi.length > 0) {
      toTranslate.push({ file: f, segments: needsApi });
    }
  }

  console.log(`Handled by short phrases: ${totalHandledByShortPhrase}`);
  console.log(`Files needing API translation: ${toTranslate.length}`);
  const totalSegs = toTranslate.reduce((s, t) => s + t.segments.length, 0);
  console.log(`Total segments needing API: ${totalSegs}`);

  const BATCH_SIZE = 40;
  let processed = 0;
  let errors = 0;
  let filesProcessed = 0;
  let apiCalls = 0;

  for (const item of toTranslate) {
    const filepath = dir + '/' + item.file;
    const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));

    for (let batchStart = 0; batchStart < item.segments.length; batchStart += BATCH_SIZE) {
      const batch = item.segments.slice(batchStart, batchStart + BATCH_SIZE);

      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const translations = await translateBatch(batch);
          apiCalls++;

          for (let j = 0; j < batch.length; j++) {
            if (translations[j]) {
              data[batch[j].idx].ko = translations[j];
              processed++;
            }
          }
          break;
        } catch (e) {
          console.error(`  Error (attempt ${attempt+1}) translating ${item.file}: ${e.message}`);
          errors++;
          if (attempt < 2) {
            await new Promise(r => setTimeout(r, 5000 * (attempt + 1)));
          }
        }
      }

      // Rate limit
      if (apiCalls % 10 === 0) {
        await new Promise(r => setTimeout(r, 1000));
      } else {
        await new Promise(r => setTimeout(r, 200));
      }
    }

    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    filesProcessed++;

    if (filesProcessed % 25 === 0) {
      console.log(`Progress: ${filesProcessed}/${toTranslate.length} files, ${processed}/${totalSegs} segments, ${apiCalls} API calls`);
    }
  }

  console.log(`\n=== DONE ===`);
  console.log(`Files processed: ${filesProcessed}`);
  console.log(`Segments translated: ${processed}`);
  console.log(`API calls: ${apiCalls}`);
  console.log(`Errors: ${errors}`);
}

main().catch(console.error);
