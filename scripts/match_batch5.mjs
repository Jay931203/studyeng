import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// Read inputs
const canonicalRaw = readFileSync(join(projectRoot, 'src/data/canonical-list.txt'), 'utf8');
const canonicals = canonicalRaw.trim().split('\n').map(l => l.trim()).filter(Boolean);

const batch = JSON.parse(readFileSync(join(projectRoot, 'src/data/transcript-batches/batch-5.json'), 'utf8'));

console.log('Canonicals:', canonicals.length, '| Videos:', Object.keys(batch).length);

function expandContractions(text) {
  return text
    .replace(/\bi'm\b/gi, "i am")
    .replace(/\bi've\b/gi, "i have")
    .replace(/\bi'll\b/gi, "i will")
    .replace(/\bi'd\b/gi, "i would")
    .replace(/\bdon't\b/gi, "do not")
    .replace(/\bdoesn't\b/gi, "does not")
    .replace(/\bdidn't\b/gi, "did not")
    .replace(/\bcan't\b/gi, "cannot")
    .replace(/\bcouldn't\b/gi, "could not")
    .replace(/\bwouldn't\b/gi, "would not")
    .replace(/\bshouldn't\b/gi, "should not")
    .replace(/\bwon't\b/gi, "will not")
    .replace(/\bwe're\b/gi, "we are")
    .replace(/\byou're\b/gi, "you are")
    .replace(/\bthey're\b/gi, "they are")
    .replace(/\bhe's\b/gi, "he is")
    .replace(/\bshe's\b/gi, "she is")
    .replace(/\bit's\b/gi, "it is")
    .replace(/\bthat's\b/gi, "that is")
    .replace(/\bthere's\b/gi, "there is")
    .replace(/\bthere're\b/gi, "there are")
    .replace(/\bwhat's\b/gi, "what is")
    .replace(/\bhow's\b/gi, "how is")
    .replace(/\bwho's\b/gi, "who is")
    .replace(/\bwhere's\b/gi, "where is")
    .replace(/\bwhen's\b/gi, "when is")
    .replace(/\byou've\b/gi, "you have")
    .replace(/\bwe've\b/gi, "we have")
    .replace(/\bthey've\b/gi, "they have")
    .replace(/\byou'll\b/gi, "you will")
    .replace(/\bwe'll\b/gi, "we will")
    .replace(/\bthey'll\b/gi, "they will")
    .replace(/\bhe'll\b/gi, "he will")
    .replace(/\bshe'll\b/gi, "she will")
    .replace(/\byou'd\b/gi, "you would")
    .replace(/\bwe'd\b/gi, "we would")
    .replace(/\bthey'd\b/gi, "they would")
    .replace(/\bhe'd\b/gi, "he would")
    .replace(/\bshe'd\b/gi, "she would")
    .replace(/\bthat'd\b/gi, "that would")
    .replace(/\bisn't\b/gi, "is not")
    .replace(/\baren't\b/gi, "are not")
    .replace(/\bwasn't\b/gi, "was not")
    .replace(/\bweren't\b/gi, "were not")
    .replace(/\bhaven't\b/gi, "have not")
    .replace(/\bhasn't\b/gi, "has not")
    .replace(/\bhadn't\b/gi, "had not")
    .replace(/\blet's\b/gi, "let us")
    .replace(/\bgonna\b/gi, "going to")
    .replace(/\bwanna\b/gi, "want to")
    .replace(/\bgotta\b/gi, "got to")
    .replace(/\bkinda\b/gi, "kind of")
    .replace(/\bsorta\b/gi, "sort of")
    .replace(/\blotta\b/gi, "lot of")
    .replace(/\blemme\b/gi, "let me")
    .replace(/\bgimme\b/gi, "give me")
    .replace(/\bain't\b/gi, "am not");
}

const verbForms = {
  think: ['thinks','thinking','thought'],
  go: ['goes','going','went','gone'],
  get: ['gets','getting','got','gotten'],
  make: ['makes','making','made'],
  take: ['takes','taking','took','taken'],
  come: ['comes','coming','came'],
  give: ['gives','giving','gave','given'],
  know: ['knows','knowing','knew','known'],
  see: ['sees','seeing','saw','seen'],
  say: ['says','saying','said'],
  look: ['looks','looking','looked'],
  find: ['finds','finding','found'],
  feel: ['feels','feeling','felt'],
  tell: ['tells','telling','told'],
  ask: ['asks','asking','asked'],
  try: ['tries','trying','tried'],
  call: ['calls','calling','called'],
  keep: ['keeps','keeping','kept'],
  let: ['lets','letting'],
  put: ['puts','putting'],
  run: ['runs','running','ran'],
  turn: ['turns','turning','turned'],
  set: ['sets','setting'],
  lose: ['loses','losing','lost'],
  stand: ['stands','standing','stood'],
  work: ['works','working','worked'],
  move: ['moves','moving','moved'],
  live: ['lives','living','lived'],
  hold: ['holds','holding','held'],
  bring: ['brings','bringing','brought'],
  write: ['writes','writing','wrote','written'],
  sit: ['sits','sitting','sat'],
  break: ['breaks','breaking','broke','broken'],
  pick: ['picks','picking','picked'],
  cut: ['cuts','cutting'],
  play: ['plays','playing','played'],
  carry: ['carries','carrying','carried'],
  catch: ['catches','catching','caught'],
  fall: ['falls','falling','fell','fallen'],
  miss: ['misses','missing','missed'],
  pay: ['pays','paying','paid'],
  send: ['sends','sending','sent'],
  hit: ['hits','hitting'],
  show: ['shows','showing','showed','shown'],
  pull: ['pulls','pulling','pulled'],
  push: ['pushes','pushing','pushed'],
  draw: ['draws','drawing','drew','drawn'],
  check: ['checks','checking','checked'],
  figure: ['figures','figuring','figured'],
  talk: ['talks','talking','talked'],
  walk: ['walks','walking','walked'],
  pass: ['passes','passing','passed'],
  spend: ['spends','spending','spent'],
  build: ['builds','building','built'],
  start: ['starts','starting','started'],
  stop: ['stops','stopping','stopped'],
  open: ['opens','opening','opened'],
  close: ['closes','closing','closed'],
  leave: ['leaves','leaving','left'],
  read: ['reads','reading'],
  hear: ['hears','hearing','heard'],
  grow: ['grows','growing','grew','grown'],
  wait: ['waits','waiting','waited'],
  blow: ['blows','blowing','blew','blown'],
  throw: ['throws','throwing','threw','thrown'],
  hang: ['hangs','hanging','hung'],
  buy: ['buys','buying','bought'],
  sell: ['sells','selling','sold'],
  raise: ['raises','raising','raised'],
  beat: ['beats','beating','beaten'],
  burn: ['burns','burning','burned','burnt'],
  stick: ['sticks','sticking','stuck'],
  wear: ['wears','wearing','wore','worn'],
  drive: ['drives','driving','drove','driven'],
  ride: ['rides','riding','rode','ridden'],
  drink: ['drinks','drinking','drank','drunk'],
  eat: ['eats','eating','ate','eaten'],
  speak: ['speaks','speaking','spoke','spoken'],
  fight: ['fights','fighting','fought'],
  begin: ['begins','beginning','began','begun'],
  choose: ['chooses','choosing','chose','chosen'],
  wake: ['wakes','waking','woke','woken'],
  shake: ['shakes','shaking','shook','shaken'],
  deal: ['deals','dealing','dealt'],
  meet: ['meets','meeting','met'],
  lead: ['leads','leading','led'],
  lay: ['lays','laying','laid'],
  lie: ['lies','lying','lay','lain'],
  light: ['lights','lighting','lit'],
  bite: ['bites','biting','bit','bitten'],
  strike: ['strikes','striking','struck'],
  shoot: ['shoots','shooting','shot'],
  steal: ['steals','stealing','stole','stolen'],
  swim: ['swims','swimming','swam','swum'],
  fly: ['flies','flying','flew','flown'],
  freeze: ['freezes','freezing','froze','frozen'],
  forget: ['forgets','forgetting','forgot','forgotten'],
  hide: ['hides','hiding','hid','hidden'],
  arise: ['arises','arising','arose','arisen'],
  bend: ['bends','bending','bent'],
  bind: ['binds','binding','bound'],
  bleed: ['bleeds','bleeding','bled'],
  cast: ['casts','casting'],
  cost: ['costs','costing'],
  creep: ['creeps','creeping','crept'],
  dig: ['digs','digging','dug'],
  feed: ['feeds','feeding','fed'],
  fit: ['fits','fitting'],
  flee: ['flees','fleeing','fled'],
  fling: ['flings','flinging','flung'],
  grind: ['grinds','grinding','ground'],
  hurt: ['hurts','hurting'],
  lean: ['leans','leaning','leant','leaned'],
  leap: ['leaps','leaping','leapt','leaped'],
  lend: ['lends','lending','lent'],
  mean: ['means','meaning','meant'],
  overcome: ['overcomes','overcoming','overcame'],
  prove: ['proves','proving','proved','proven'],
  rid: ['rids','ridding'],
  rise: ['rises','rising','rose','risen'],
  seek: ['seeks','seeking','sought'],
  shed: ['sheds','shedding'],
  shine: ['shines','shining','shone','shined'],
  shrink: ['shrinks','shrinking','shrank','shrunk'],
  sing: ['sings','singing','sang','sung'],
  sleep: ['sleeps','sleeping','slept'],
  slide: ['slides','sliding','slid'],
  smell: ['smells','smelling','smelt','smelled'],
  speed: ['speeds','speeding','sped'],
  spell: ['spells','spelling','spelt','spelled'],
  split: ['splits','splitting'],
  spread: ['spreads','spreading'],
  spring: ['springs','springing','sprang','sprung'],
  strive: ['strives','striving','strove','striven'],
  swear: ['swears','swearing','swore','sworn'],
  sweep: ['sweeps','sweeping','swept'],
  teach: ['teaches','teaching','taught'],
  tear: ['tears','tearing','tore','torn'],
  weep: ['weeps','weeping','wept'],
  win: ['wins','winning','won'],
  withdraw: ['withdraws','withdrawing','withdrew','withdrawn'],
  become: ['becomes','becoming','became'],
  have: ['has','having','had'],
  do: ['does','doing','did','done'],
  be: ['is','am','are','was','were','been','being'],
  freak: ['freaks','freaking','freaked'],
  wind: ['winds','winding','wound'],
  wrap: ['wraps','wrapping','wrapped'],
  step: ['steps','stepping','stepped'],
  face: ['faces','facing','faced'],
  add: ['adds','adding','added'],
  allow: ['allows','allowing','allowed'],
  avoid: ['avoids','avoiding','avoided'],
  believe: ['believes','believing','believed'],
  care: ['cares','caring','cared'],
  change: ['changes','changing','changed'],
  count: ['counts','counting','counted'],
  cover: ['covers','covering','covered'],
  decide: ['decides','deciding','decided'],
  drop: ['drops','dropping','dropped'],
  end: ['ends','ending','ended'],
  enjoy: ['enjoys','enjoying','enjoyed'],
  explain: ['explains','explaining','explained'],
  follow: ['follows','following','followed'],
  handle: ['handles','handling','handled'],
  hate: ['hates','hating','hated'],
  help: ['helps','helping','helped'],
  hope: ['hopes','hoping','hoped'],
  imagine: ['imagines','imagining','imagined'],
  include: ['includes','including','included'],
  join: ['joins','joining','joined'],
  jump: ['jumps','jumping','jumped'],
  kill: ['kills','killing','killed'],
  learn: ['learns','learning','learned','learnt'],
  listen: ['listens','listening','listened'],
  love: ['loves','loving','loved'],
  manage: ['manages','managing','managed'],
  matter: ['matters','mattering','mattered'],
  need: ['needs','needing','needed'],
  notice: ['notices','noticing','noticed'],
  offer: ['offers','offering','offered'],
  plan: ['plans','planning','planned'],
  point: ['points','pointing','pointed'],
  prepare: ['prepares','preparing','prepared'],
  pretend: ['pretends','pretending','pretended'],
  reach: ['reaches','reaching','reached'],
  realize: ['realizes','realizing','realized'],
  remember: ['remembers','remembering','remembered'],
  return: ['returns','returning','returned'],
  save: ['saves','saving','saved'],
  share: ['shares','sharing','shared'],
  solve: ['solves','solving','solved'],
  stay: ['stays','staying','stayed'],
  suggest: ['suggests','suggesting','suggested'],
  support: ['supports','supporting','supported'],
  trust: ['trusts','trusting','trusted'],
  understand: ['understands','understanding','understood'],
  use: ['uses','using','used'],
  visit: ['visits','visiting','visited'],
  want: ['wants','wanting','wanted'],
  waste: ['wastes','wasting','wasted'],
  watch: ['watches','watching','watched'],
  wish: ['wishes','wishing','wished'],
  wonder: ['wonders','wondering','wondered'],
  worry: ['worries','worrying','worried'],
};

const altToBase = new Map();
for (const [base, alts] of Object.entries(verbForms)) {
  for (const alt of alts) {
    if (!altToBase.has(alt)) altToBase.set(alt, base);
  }
}

const determiners = new Set(['a','an','the','my','your','his','her','its','our','their','this','that','these','those','some','any','one','another','every','each','no']);

function wordsMatch(cw, sw) {
  if (cw === sw) return true;
  const forms = verbForms[cw];
  if (forms && forms.includes(sw)) return true;
  const base = altToBase.get(sw);
  if (base === cw) return true;
  if (determiners.has(cw) && determiners.has(sw)) return true;
  if (cw === "one's" && (sw === 'my' || sw === 'your' || sw === 'his' || sw === 'her' || sw === 'their' || sw === 'its' || sw === 'our')) return true;
  return false;
}

function tokenize(text) {
  return text.replace(/[^\w\s]/g, ' ').split(/\s+/).filter(Boolean);
}

function flexMatchStrict(canWords, sentWords) {
  for (let start = 0; start <= sentWords.length - 1; start++) {
    let ci = 0;
    let si = start;
    let totalGap = 0;
    while (ci < canWords.length && si < sentWords.length) {
      if (wordsMatch(canWords[ci], sentWords[si])) {
        ci++;
        si++;
      } else {
        si++;
        totalGap++;
        if (totalGap > 4) break;
      }
    }
    if (ci === canWords.length && totalGap <= 4) return true;
  }
  return false;
}

function matchesExpression(canonical, sentLow, sentExpanded) {
  const canLow = canonical.toLowerCase().trim();

  if (sentLow.includes(canLow)) return true;
  if (sentExpanded.includes(canLow)) return true;

  const canExpanded = expandContractions(canLow);
  if (canExpanded !== canLow) {
    if (sentLow.includes(canExpanded)) return true;
    if (sentExpanded.includes(canExpanded)) return true;
  }

  const canWords = tokenize(canLow);
  if (canWords.length === 0) return false;

  if (canWords.length === 1) {
    const word = canWords[0];
    const sentWords = tokenize(sentExpanded);
    for (const sw of sentWords) {
      if (sw === word) return true;
      const forms = verbForms[word];
      if (forms && forms.includes(sw)) return true;
      const base = altToBase.get(sw);
      if (base === word) return true;
    }
    return false;
  }

  const sentWordsSrc = tokenize(sentLow);
  const sentWordsExp = tokenize(sentExpanded);

  return flexMatchStrict(canWords, sentWordsSrc) || flexMatchStrict(canWords, sentWordsExp);
}

// Process all videos
const results = {};
let videoCount = 0;
const totalVideos = Object.keys(batch).length;

for (const [videoId, sentences] of Object.entries(batch)) {
  const matches = [];
  const seen = new Set();

  for (const [idxStr, sentence] of Object.entries(sentences)) {
    const idx = parseInt(idxStr, 10);
    const sentLow = sentence.toLowerCase()
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"');
    const sentExpanded = expandContractions(sentLow);

    for (const canonical of canonicals) {
      const key = idx + '::' + canonical;
      if (seen.has(key)) continue;
      if (matchesExpression(canonical, sentLow, sentExpanded)) {
        matches.push({ canonical, sentenceIdx: idx });
        seen.add(key);
      }
    }
  }

  if (matches.length > 0) {
    results[videoId] = matches;
  }

  videoCount++;
  if (videoCount % 10 === 0) {
    process.stderr.write('Progress: ' + videoCount + '/' + totalVideos + ' videos\n');
  }
}

// Write results
const outDir = join(projectRoot, 'src/data/match-results');
try { mkdirSync(outDir, { recursive: true }); } catch(e) {}
writeFileSync(join(outDir, 'batch-5.json'), JSON.stringify(results, null, 2), 'utf8');

const totalMatches = Object.values(results).reduce((s, v) => s + v.length, 0);
console.log('Done. Videos matched: ' + Object.keys(results).length + '/' + totalVideos);
console.log('Total matches: ' + totalMatches);
for (const [vid, matches] of Object.entries(results)) {
  console.log('  ' + vid + ': ' + matches.length + ' matches');
}
