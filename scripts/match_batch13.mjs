import { readFileSync, writeFileSync, mkdirSync } from 'fs';

const batch = JSON.parse(readFileSync('src/data/transcript-batches/batch-13.json', 'utf8'));
const canonicalRaw = readFileSync('src/data/canonical-list.txt', 'utf8');
const canonical = canonicalRaw.split('\n').map(l => l.trim()).filter(Boolean);

function normalize(s) {
  return s.toLowerCase().replace(/['']/g, "'").trim();
}

const IRREGULARS = {
  went:'go',gone:'go',going:'go',goes:'go',
  thought:'think',thinking:'think',thinks:'think',
  was:'be',were:'be',been:'be',being:'be',is:'be',am:'be',are:'be',
  had:'have',having:'have',has:'have',
  did:'do',done:'do',doing:'do',does:'do',
  said:'say',saying:'say',says:'say',
  got:'get',gotten:'get',getting:'get',gets:'get',
  came:'come',coming:'come',comes:'come',
  took:'take',taken:'take',taking:'take',takes:'take',
  gave:'give',given:'give',giving:'give',gives:'give',
  made:'make',making:'make',makes:'make',
  knew:'know',known:'know',knowing:'know',knows:'know',
  saw:'see',seen:'see',seeing:'see',sees:'see',
  ran:'run',running:'run',runs:'run',
  kept:'keep',keeping:'keep',keeps:'keep',
  fell:'fall',fallen:'fall',falling:'fall',falls:'fall',
  broke:'break',broken:'break',breaking:'break',breaks:'break',
  told:'tell',telling:'tell',tells:'tell',
  felt:'feel',feeling:'feel',feels:'feel',
  left:'leave',leaving:'leave',leaves:'leave',
  lost:'lose',losing:'lose',loses:'lose',
  brought:'bring',bringing:'bring',brings:'bring',
  found:'find',finding:'find',finds:'find',
  stood:'stand',standing:'stand',stands:'stand',
  sat:'sit',sitting:'sit',sits:'sit',
  held:'hold',holding:'hold',holds:'hold',
  heard:'hear',hearing:'hear',hears:'hear',
  caught:'catch',catching:'catch',catches:'catch',
  threw:'throw',thrown:'throw',throwing:'throw',throws:'throw',
  sent:'send',sending:'send',sends:'send',
  met:'meet',meeting:'meet',meets:'meet',
  hit:'hit',hitting:'hit',hits:'hit',
  cut:'cut',cutting:'cut',cuts:'cut',
  led:'lead',leading:'lead',leads:'lead',
  wore:'wear',worn:'wear',wearing:'wear',wears:'wear',
  lit:'light',lighting:'light',lights:'light',
  hung:'hang',hanging:'hang',hangs:'hang',
  dug:'dig',digging:'dig',digs:'dig',
  shot:'shoot',shooting:'shoot',shoots:'shoot',
  shook:'shake',shaken:'shake',shaking:'shake',
  blew:'blow',blown:'blow',blowing:'blow',blows:'blow',
  grew:'grow',grown:'grow',growing:'grow',grows:'grow',
  wrote:'write',written:'write',writing:'write',writes:'write',
  bought:'buy',buying:'buy',buys:'buy',
  built:'build',building:'build',builds:'build',
  paid:'pay',paying:'pay',pays:'pay',
  laid:'lay',laying:'lay',lays:'lay',
  drew:'draw',drawn:'draw',drawing:'draw',draws:'draw',
  drove:'drive',driven:'drive',driving:'drive',drives:'drive',
  spoke:'speak',spoken:'speak',speaking:'speak',speaks:'speak',
  chose:'choose',chosen:'choose',choosing:'choose',chooses:'choose',
  fought:'fight',fighting:'fight',fights:'fight',
  won:'win',winning:'win',wins:'win',
  meant:'mean',meaning:'mean',means:'mean',
  dealt:'deal',dealing:'deal',deals:'deal',
  woke:'wake',woken:'wake',waking:'wake',wakes:'wake',
  rode:'ride',ridden:'ride',riding:'ride',rides:'ride',
};

function getForms(word) {
  const forms = new Set([word]);
  if (IRREGULARS[word]) forms.add(IRREGULARS[word]);
  if (word.endsWith('ed')) {
    forms.add(word.slice(0,-2));
    forms.add(word.slice(0,-1));
    if (word.endsWith('ied') && word.length > 4) forms.add(word.slice(0,-3)+'y');
  }
  if (word.endsWith('ing')) {
    forms.add(word.slice(0,-3));
    forms.add(word.slice(0,-3)+'e');
    if (word.length > 5 && word[word.length-4] === word[word.length-5]) forms.add(word.slice(0,-4));
  }
  if (word.endsWith('s') && !word.endsWith('ss') && word.length > 3) {
    forms.add(word.slice(0,-1));
    if (word.endsWith('ies') && word.length > 4) forms.add(word.slice(0,-3)+'y');
  }
  return forms;
}

const CONTRACTION_MAP = [
  ["i'm","i am"],["i've","i have"],["i'll","i will"],["i'd","i would"],
  ["you're","you are"],["you've","you have"],["you'll","you will"],["you'd","you would"],
  ["he's","he is"],["he'll","he will"],["he'd","he would"],
  ["she's","she is"],["she'll","she will"],["she'd","she would"],
  ["it's","it is"],["it'll","it will"],
  ["we're","we are"],["we've","we have"],["we'll","we will"],["we'd","we would"],
  ["they're","they are"],["they've","they have"],["they'll","they will"],["they'd","they would"],
  ["that's","that is"],["there's","there is"],["here's","here is"],
  ["who's","who is"],["what's","what is"],["where's","where is"],["how's","how is"],
  ["isn't","is not"],["aren't","are not"],["wasn't","was not"],["weren't","were not"],
  ["haven't","have not"],["hasn't","has not"],["hadn't","had not"],
  ["won't","will not"],["wouldn't","would not"],["can't","cannot"],["couldn't","could not"],
  ["shouldn't","should not"],["don't","do not"],["doesn't","does not"],["didn't","did not"],
  ["let's","let us"],["gonna","going to"],["wanna","want to"],["gotta","got to"],
  ["'ve"," have"],["'ll"," will"],["'re"," are"],["'d"," would"],["'m"," am"],["'s"," is"],
];

function expand(text) {
  let t = normalize(text);
  for (const [c,e] of CONTRACTION_MAP) t = t.replaceAll(c,e);
  return t;
}

function cleanWord(w) { return w.replace(/[^\w']/g,''); }

function wordsOf(text) { return text.split(/\s+/).map(cleanWord).filter(Boolean); }

function wordsMatch(ew, sw) {
  if (!ew || !sw) return false;
  const ef = getForms(ew);
  const sf = getForms(sw);
  for (const f of ef) if (sf.has(f)) return true;
  return false;
}

const DETERMINERS = new Set(['a','an','the','my','your','his','her','its','our','their','this','that','another','some','any','one']);
const FUNC = new Set(['a','an','the','in','on','at','to','for','of','with','by','from','up','out','off',
  'is','am','are','be','my','your','his','her','its','our','their','i','you','he','she','it','we','they',
  'this','that','these','those','and','or','but','not','no','do','does','did','have','has','had',
  'will','would','could','should','may','might','must','one',"s","one's","over","down","into","onto"]);

function sentenceMatches(sentence, expr) {
  const sNorm = normalize(sentence);
  const eNorm = normalize(expr);

  if (sNorm.includes(eNorm)) return true;

  const sExp = expand(sentence);
  const eExp = expand(expr);

  if (sExp.includes(eNorm) || sNorm.includes(eExp) || sExp.includes(eExp)) return true;

  const eWords = wordsOf(eNorm);
  const eWordsExp = wordsOf(eExp);
  const sWords = wordsOf(sExp);
  const sWordsNorm = wordsOf(sNorm);

  if (eWords.length === 0) return false;

  // Single word
  if (eWords.length === 1) {
    const w = eWords[0];
    for (const sw of [...sWords, ...sWordsNorm]) {
      if (wordsMatch(w, sw)) return true;
    }
    return false;
  }

  // Consecutive window match with lemmatization + determiner flexibility
  for (const eWds of [eWords, eWordsExp]) {
    for (const sWds of [sWords, sWordsNorm]) {
      const n = eWds.length;
      for (let i = 0; i <= sWds.length - n; i++) {
        const window = sWds.slice(i, i+n);
        let ok = true;
        for (let j = 0; j < n; j++) {
          const ew = eWds[j], sw = window[j];
          if (!wordsMatch(ew, sw)) {
            if (DETERMINERS.has(ew) || DETERMINERS.has(sw)) continue;
            ok = false;
            break;
          }
        }
        if (ok) return true;
      }
    }
  }

  // Gap match: all content words present anywhere in sentence
  const allSWords = [...new Set([...sWords, ...sWordsNorm])];
  const keyWords = eWordsExp.filter(w => !FUNC.has(w) && w.length > 2);
  if (keyWords.length >= 2) {
    let allFound = true;
    for (const kw of keyWords) {
      let found = false;
      for (const sw of allSWords) {
        if (wordsMatch(kw, sw)) { found = true; break; }
      }
      if (!found) { allFound = false; break; }
    }
    if (allFound) return true;
  }

  return false;
}

mkdirSync('src/data/match-results', { recursive: true });

const results = {};
let totalMatches = 0;

for (const [videoId, sentences] of Object.entries(batch)) {
  const matches = [];
  const seen = new Set();
  for (const [sentIdxStr, sentence] of Object.entries(sentences)) {
    const sentIdx = parseInt(sentIdxStr, 10);
    for (const expr of canonical) {
      if (sentenceMatches(sentence, expr)) {
        const key = `${expr}|||${sentIdx}`;
        if (!seen.has(key)) {
          seen.add(key);
          matches.push({ canonical: expr, sentenceIdx: sentIdx });
        }
      }
    }
  }
  if (matches.length > 0) {
    results[videoId] = matches;
    totalMatches += matches.length;
  }
}

console.log(`Videos with matches: ${Object.keys(results).length}/${Object.keys(batch).length}`);
console.log(`Total matches: ${totalMatches}`);

writeFileSync('src/data/match-results/batch-13.json', JSON.stringify(results, null, 2), 'utf8');
console.log('Written to src/data/match-results/batch-13.json');
