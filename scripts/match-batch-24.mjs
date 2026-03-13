import fs from 'fs';
import path from 'path';

// Load data
const canonicalRaw = fs.readFileSync('C:/Users/hyunj/studyeng/src/data/canonical-list.txt', 'utf8');
const canonical = canonicalRaw.split('\n').map(l => l.trim()).filter(l => l.length > 0);
const batch = JSON.parse(fs.readFileSync('C:/Users/hyunj/studyeng/src/data/transcript-batches/batch-24.json', 'utf8'));

console.log('Canonical expressions:', canonical.length);
console.log('Videos in batch:', Object.keys(batch).length);

// Expand contractions for normalization
function expandContractions(text) {
  return text
    .replace(/\bi'm\b/gi, 'i am')
    .replace(/\bi've\b/gi, 'i have')
    .replace(/\bi'd\b/gi, 'i would')
    .replace(/\bi'll\b/gi, 'i will')
    .replace(/\byou're\b/gi, 'you are')
    .replace(/\byou've\b/gi, 'you have')
    .replace(/\byou'd\b/gi, 'you would')
    .replace(/\byou'll\b/gi, 'you will')
    .replace(/\bhe's\b/gi, 'he is')
    .replace(/\bshe's\b/gi, 'she is')
    .replace(/\bit's\b/gi, 'it is')
    .replace(/\bwe're\b/gi, 'we are')
    .replace(/\bwe've\b/gi, 'we have')
    .replace(/\bwe'd\b/gi, 'we would')
    .replace(/\bwe'll\b/gi, 'we will')
    .replace(/\bthey're\b/gi, 'they are')
    .replace(/\bthey've\b/gi, 'they have')
    .replace(/\bthey'd\b/gi, 'they would')
    .replace(/\bthey'll\b/gi, 'they will')
    .replace(/\bthat's\b/gi, 'that is')
    .replace(/\bthere's\b/gi, 'there is')
    .replace(/\bhere's\b/gi, 'here is')
    .replace(/\bwhat's\b/gi, 'what is')
    .replace(/\bwho's\b/gi, 'who is')
    .replace(/\bhow's\b/gi, 'how is')
    .replace(/\bwhere's\b/gi, 'where is')
    .replace(/\bcan't\b/gi, 'cannot')
    .replace(/\bcannot\b/gi, 'cannot')
    .replace(/\bdon't\b/gi, 'do not')
    .replace(/\bdoesn't\b/gi, 'does not')
    .replace(/\bdidn't\b/gi, 'did not')
    .replace(/\bwon't\b/gi, 'will not')
    .replace(/\bwouldn't\b/gi, 'would not')
    .replace(/\bshouldn't\b/gi, 'should not')
    .replace(/\bcouldn't\b/gi, 'could not')
    .replace(/\bmustn't\b/gi, 'must not')
    .replace(/\bmightn't\b/gi, 'might not')
    .replace(/\bisn't\b/gi, 'is not')
    .replace(/\baren't\b/gi, 'are not')
    .replace(/\bwasn't\b/gi, 'was not')
    .replace(/\bweren't\b/gi, 'were not')
    .replace(/\bhaven't\b/gi, 'have not')
    .replace(/\bhasn't\b/gi, 'has not')
    .replace(/\bhadn't\b/gi, 'had not')
    .replace(/\blet's\b/gi, 'let us')
    .replace(/\bthat'd\b/gi, 'that would')
    .replace(/\bthey'd\b/gi, 'they would')
    .replace(/\bwho'd\b/gi, 'who would')
    .replace(/\bhe'd\b/gi, 'he would')
    .replace(/\bshe'd\b/gi, 'she would');
}

function normalize(text) {
  return expandContractions(text)
    .toLowerCase()
    .replace(/[''`]/g, "'")
    .replace(/[^a-z0-9 ']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Basic lemmatizer
const irregulars = {
  went:'go',gone:'go',going:'go',goes:'go',
  was:'be',were:'be',been:'be',being:'be',is:'be',are:'be',am:'be',
  had:'have',has:'have',having:'have',
  did:'do',done:'do',doing:'do',does:'do',
  said:'say',says:'say',saying:'say',
  got:'get',gotten:'get',gets:'get',getting:'get',
  made:'make',makes:'make',making:'make',
  took:'take',taken:'take',takes:'take',taking:'take',
  came:'come',comes:'come',coming:'come',
  knew:'know',known:'know',knows:'know',knowing:'know',
  thought:'think',thinks:'think',thinking:'think',
  saw:'see',seen:'see',sees:'see',seeing:'see',
  told:'tell',tells:'tell',telling:'tell',
  found:'find',finds:'find',finding:'find',
  left:'leave',leaves:'leave',leaving:'leave',
  kept:'keep',keeps:'keep',keeping:'keep',
  brought:'bring',brings:'bring',bringing:'bring',
  gave:'give',given:'give',gives:'give',giving:'give',
  felt:'feel',feels:'feel',feeling:'feel',
  meant:'mean',means:'mean',meaning:'mean',
  put:'put',puts:'put',putting:'put',
  ran:'run',runs:'run',running:'run',
  began:'begin',begun:'begin',begins:'begin',beginning:'begin',
  became:'become',becomes:'become',becoming:'become',
  showed:'show',shown:'show',shows:'show',showing:'show',
  heard:'hear',hears:'hear',hearing:'hear',
  tried:'try',tries:'try',trying:'try',
  called:'call',calls:'call',calling:'call',
  asked:'ask',asks:'ask',asking:'ask',
  seemed:'seem',seems:'seem',seeming:'seem',
  looked:'look',looks:'look',looking:'look',
  turned:'turn',turns:'turn',turning:'turn',
  moved:'move',moves:'move',moving:'move',
  lived:'live',lives:'live',living:'live',
  talked:'talk',talks:'talk',talking:'talk',
  worked:'work',works:'work',working:'work',
  played:'play',plays:'play',playing:'play',
  pulled:'pull',pulls:'pull',pulling:'pull',
  pushed:'push',pushes:'push',pushing:'push',
  started:'start',starts:'start',starting:'start',
  stopped:'stop',stops:'stop',stopping:'stop',
  walked:'walk',walks:'walk',walking:'walk',
  helped:'help',helps:'help',helping:'help',
  needed:'need',needs:'need',needing:'need',
  wanted:'want',wants:'want',wanting:'want',
  used:'use',uses:'use',using:'use',
  blown:'blow',blew:'blow',blows:'blow',blowing:'blow',
  broken:'break',broke:'break',breaks:'break',breaking:'break',
  chosen:'choose',chose:'choose',chooses:'choose',choosing:'choose',
  fallen:'fall',fell:'fall',falls:'fall',falling:'fall',
  grown:'grow',grew:'grow',grows:'grow',growing:'grow',
  held:'hold',holds:'hold',holding:'hold',
  hit:'hit',hits:'hit',hitting:'hit',
  lost:'lose',loses:'lose',losing:'lose',
  met:'meet',meets:'meet',meeting:'meet',
  paid:'pay',pays:'pay',paying:'pay',
  rode:'ride',ridden:'ride',rides:'ride',riding:'ride',
  rose:'rise',risen:'rise',rises:'rise',rising:'rise',
  sent:'send',sends:'send',sending:'send',
  sat:'sit',sits:'sit',sitting:'sit',
  spent:'spend',spends:'spend',spending:'spend',
  stood:'stand',stands:'stand',standing:'stand',
  stuck:'stick',sticks:'stick',sticking:'stick',
  sold:'sell',sells:'sell',selling:'sell',
  taught:'teach',teaches:'teach',teaching:'teach',
  threw:'throw',thrown:'throw',throws:'throw',throwing:'throw',
  won:'win',wins:'win',winning:'win',
  wrote:'write',written:'write',writes:'write',writing:'write',
  caught:'catch',catches:'catch',catching:'catch',
  cut:'cut',cuts:'cut',cutting:'cut',
  dealt:'deal',deals:'deal',dealing:'deal',
  drew:'draw',drawn:'draw',draws:'draw',drawing:'draw',
  drove:'drive',driven:'drive',drives:'drive',driving:'drive',
  ate:'eat',eaten:'eat',eats:'eat',eating:'eat',
  flew:'fly',flown:'fly',flies:'fly',flying:'fly',
  forgot:'forget',forgotten:'forget',forgets:'forget',forgetting:'forget',
  hung:'hang',hangs:'hang',hanging:'hang',
  hurt:'hurt',hurts:'hurt',hurting:'hurt',
  led:'lead',leads:'lead',leading:'lead',
  lit:'light',lights:'light',lighting:'light',
  sang:'sing',sung:'sing',sings:'sing',singing:'sing',
  spoke:'speak',spoken:'speak',speaks:'speak',speaking:'speak',
  spread:'spread',spreads:'spread',spreading:'spread',
  stole:'steal',stolen:'steal',steals:'steal',stealing:'steal',
  swore:'swear',sworn:'swear',swears:'swear',swearing:'swear',
  wore:'wear',worn:'wear',wears:'wear',wearing:'wear',
  woke:'wake',woken:'wake',wakes:'wake',waking:'wake',
  built:'build',builds:'build',building:'build',
  bought:'buy',buys:'buy',buying:'buy',
  fed:'feed',feeds:'feed',feeding:'feed',
  fought:'fight',fights:'fight',fighting:'fight',
  hid:'hide',hidden:'hide',hides:'hide',hiding:'hide',
  shot:'shoot',shoots:'shoot',shooting:'shoot',
  shut:'shut',shuts:'shut',shutting:'shut',
  slept:'sleep',sleeps:'sleep',sleeping:'sleep',
  struck:'strike',strikes:'strike',striking:'strike',
  tore:'tear',torn:'tear',tears:'tear',tearing:'tear',
  wept:'weep',weeps:'weep',weeping:'weep',
  bled:'bleed',bleeds:'bleed',bleeding:'bleed',
  bound:'bind',binds:'bind',binding:'bind',
  let:'let',lets:'let',letting:'let',
  read:'read',reads:'read',reading:'read',
  set:'set',sets:'set',setting:'set',
  lent:'lend',lends:'lend',lending:'lend',
  split:'split',splits:'split',splitting:'split',
  spread:'spread',
};

function lemmatize(word) {
  if (irregulars[word]) return irregulars[word];
  if (word.endsWith('ies') && word.length > 4) return word.slice(0, -3) + 'y';
  if (word.endsWith('ied') && word.length > 4) return word.slice(0, -3) + 'y';
  if (word.endsWith('ying') && word.length > 5) return word.slice(0, -4) + 'y';
  if (word.endsWith('ing') && word.length > 6) {
    const stem = word.slice(0, -3);
    if (stem.length >= 3 && stem[stem.length - 1] === stem[stem.length - 2]) return stem.slice(0, -1);
    return stem;
  }
  if (word.endsWith('ed') && word.length > 5) {
    const stem = word.slice(0, -2);
    if (stem.length >= 3 && stem[stem.length - 1] === stem[stem.length - 2]) return stem.slice(0, -1);
    if (stem.endsWith('e')) return stem;
    return stem;
  }
  if (word.endsWith('es') && word.length > 4) return word.slice(0, -2);
  if (word.endsWith('s') && word.length > 3 && !word.endsWith('ss')) return word.slice(0, -1);
  return word;
}

function tokenize(text) {
  return normalize(text).split(' ').filter(w => w.length > 0);
}

function lemmatizeArr(tokens) {
  return tokens.map(t => lemmatize(t));
}

// Pre-process canonical expressions
const canonicalProcessed = canonical.map(expr => {
  const norm = normalize(expr);
  const tokens = norm.split(' ').filter(w => w.length > 0);
  const lemmas = lemmatizeArr(tokens);
  return { expr, norm, tokens, lemmas };
});

// Find with gaps (for phrasal verbs)
function findWithGaps(sentLemmas, exprLemmas, maxGap) {
  function helper(si, ei) {
    if (ei === exprLemmas.length) return true;
    const remaining = exprLemmas.length - ei - 1;
    for (let i = si; i <= sentLemmas.length - remaining - 1; i++) {
      if (sentLemmas[i] === exprLemmas[ei]) {
        if (helper(i + 1, ei + 1)) return true;
      }
    }
    return false;
  }
  return helper(0, 0);
}

function matchesExpression(sentNorm, sentLemmas, exprProcessed) {
  const { norm: exprNorm, tokens: exprTokens, lemmas: exprLemmas } = exprProcessed;

  // 1. Direct substring match after normalization
  if (sentNorm.includes(exprNorm)) return true;

  if (exprLemmas.length === 0) return false;

  // 2. Single word: lemma match
  if (exprLemmas.length === 1) {
    return sentLemmas.includes(exprLemmas[0]);
  }

  // 3. Multi-word: exact lemma sequence
  const sentLen = sentLemmas.length;
  const exprLen = exprLemmas.length;
  for (let i = 0; i <= sentLen - exprLen; i++) {
    let match = true;
    for (let j = 0; j < exprLen; j++) {
      if (sentLemmas[i + j] !== exprLemmas[j]) {
        match = false;
        break;
      }
    }
    if (match) return true;
  }

  // 4. Gap matching for short expressions (phrasal verbs etc.)
  if (exprLen >= 2 && exprLen <= 5) {
    if (findWithGaps(sentLemmas, exprLemmas, 6)) return true;
  }

  return false;
}

// Run matching
const results = {};
let totalMatches = 0;
let videoCount = 0;

for (const [videoId, sentences] of Object.entries(batch)) {
  videoCount++;
  if (videoCount % 10 === 0) console.log(`Processing video ${videoCount}/${Object.keys(batch).length}...`);

  const videoMatches = [];

  for (const [idxStr, sentence] of Object.entries(sentences)) {
    const idx = parseInt(idxStr);
    const sentNorm = normalize(sentence);
    const sentTokens = sentNorm.split(' ').filter(w => w.length > 0);
    const sentLemmas = lemmatizeArr(sentTokens);

    for (const exprProc of canonicalProcessed) {
      if (matchesExpression(sentNorm, sentLemmas, exprProc)) {
        videoMatches.push({ canonical: exprProc.expr, sentenceIdx: idx });
      }
    }
  }

  if (videoMatches.length > 0) {
    results[videoId] = videoMatches;
    totalMatches += videoMatches.length;
  }
}

console.log('\n=== RESULTS ===');
console.log('Videos with matches:', Object.keys(results).length, '/', Object.keys(batch).length);
console.log('Total matches:', totalMatches);

// Ensure output directory exists
const outDir = 'C:/Users/hyunj/studyeng/src/data/match-results';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(path.join(outDir, 'batch-24.json'), JSON.stringify(results, null, 2));
console.log('Written to:', path.join(outDir, 'batch-24.json'));
