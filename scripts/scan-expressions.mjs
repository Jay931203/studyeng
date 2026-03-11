/**
 * Scan all transcript files for idioms and collocations.
 * Outputs:
 *   scripts/idiom-matches.json
 *   scripts/collocation-matches.json
 */

import fs from 'fs';
import path from 'path';

const TRANSCRIPTS_DIR = path.resolve('public/transcripts');

// ── Idiom list ──────────────────────────────────────────────────────
const IDIOMS = [
  "break the ice", "piece of cake", "cup of tea", "no big deal", "big deal",
  "a piece of work", "get the hang of", "get over it", "get a grip",
  "get on someone's nerves", "give it a shot", "give it a try",
  "go the extra mile", "hang in there", "hit the nail on the head",
  "in a nutshell", "it's not rocket science", "keep it up", "let it go",
  "long story short", "miss the boat", "no wonder", "once in a blue moon",
  "on the same page", "out of the blue", "out of nowhere", "the last straw",
  "time flies", "under the weather", "worth it", "for real", "for good",
  "for sure", "up to you", "make sense", "makes sense", "that makes sense",
  "what's the point", "the bottom line", "at the end of the day",
  "easier said than done", "better late than never", "better safe than sorry",
  "to be honest", "to be fair", "believe it or not", "how dare you",
  "never mind", "rain check", "from scratch", "behind the scenes",
  "all of a sudden", "by all means", "for the record", "in the long run",
  "in the meantime", "on purpose", "rule of thumb", "sick and tired",
  "take for granted", "for the sake of", "speak of the devil",
  "the whole nine yards", "back to square one", "blessing in disguise",
  "burn bridges", "cost an arm and a leg", "cut to the chase", "hit the road",
  "kill two birds with one stone", "let the cat out of the bag", "spill the beans",
  "stab in the back", "wrap your head around", "a breath of fresh air",
  "add insult to injury", "bite the bullet", "break a leg", "cross that bridge",
  "face the music", "get out of hand", "go with the flow", "have a blast",
  "in the same boat", "it takes two to tango", "keep your chin up",
  "leave no stone unturned", "make a long story short", "on thin ice",
  "pull someone's leg", "read between the lines", "see eye to eye",
  "take it easy", "the tip of the iceberg", "throw in the towel",
  "turn a blind eye", "two cents", "when pigs fly", "whole new ball game",
  "wouldn't hurt a fly", "you can say that again", "a dime a dozen",
  "actions speak louder than words", "barking up the wrong tree",
  "beat around the bush", "best of both worlds",
  "bite off more than you can chew", "caught red-handed",
  "cry over spilled milk", "devil's advocate",
  "every cloud has a silver lining", "get cold feet", "get the ball rolling",
  "go down in flames", "have second thoughts", "in hot water",
  "jump on the bandwagon", "keep an eye on", "let sleeping dogs lie",
  "lose track of", "make ends meet", "miss the point",
  "off the top of my head", "on the bright side", "once and for all",
  "play it by ear", "put all your eggs in one basket", "ring a bell",
  "sit tight", "sleep on it", "take it or leave it", "take the plunge",
  "that ship has sailed", "the elephant in the room",
  "thinking outside the box", "up in the air",
  "what goes around comes around", "win-win"
];

// ── Collocation list ────────────────────────────────────────────────
const COLLOCATIONS = [
  "make a decision", "make a difference", "make a mistake", "make an effort",
  "make progress", "make money", "make friends", "make sure", "make room",
  "make time", "make a point", "take a break", "take a look", "take a chance",
  "take a seat", "take action", "take advantage of", "take care of",
  "take notes", "take place", "take time", "take turns", "take a step",
  "pay attention", "pay a visit", "pay a compliment", "pay the price",
  "pay respect", "do homework", "do business", "do a favor", "do your best",
  "do the right thing", "have a good time", "have a point", "have no idea",
  "have a seat", "have a word", "have no choice", "keep in mind",
  "keep a secret", "keep an eye on", "keep in touch", "keep track of",
  "keep a straight face", "catch up", "catch fire", "catch a cold",
  "catch someone's eye", "come to a conclusion", "come to terms with",
  "run a business", "run errands", "run late", "run out of", "run into",
  "play a role", "play it safe", "save time", "save money", "spend time",
  "waste time", "kill time", "tell the truth", "tell a lie", "tell a joke",
  "tell a story", "raise a question", "raise awareness", "set a goal",
  "meet a deadline", "reach a goal", "heavy rain", "strong wind",
  "deep breath", "bright future", "strong opinion", "common sense",
  "close call", "close friend", "golden opportunity", "narrow escape",
  "sharp mind", "tough decision", "fair enough", "broad daylight",
  "dead end", "wild guess"
];

// ── Hand-crafted regex patterns ─────────────────────────────────────
// Every expression gets a carefully crafted regex to:
//   1) Handle verb tense variations (irregular + regular)
//   2) Allow 0-3 filler words between key tokens (separated particles)
//   3) Handle pronoun/possessive substitutions
//   4) Minimize false positives with word boundaries + negative lookaheads

function buildPatterns(expressions) {
  return expressions.map(expr => ({
    expr,
    re: getPattern(expr),
  }));
}

function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// Irregular verb forms
const V = {
  break: '(?:break|breaks|broke|broken|breaking)',
  get: '(?:get|gets|got|gotten|getting)',
  give: '(?:give|gives|gave|given|giving)',
  go: '(?:go|goes|went|gone|going)',
  hang: '(?:hang|hangs|hung|hanged|hanging)',
  hit: '(?:hit|hits|hitting)',
  keep: '(?:keep|keeps|kept|keeping)',
  let: '(?:let|lets|letting)',
  make: '(?:make|makes|made|making)',
  miss: '(?:miss|misses|missed|missing)',
  take: '(?:take|takes|took|taken|taking)',
  throw: '(?:throw|throws|threw|thrown|throwing)',
  run: '(?:run|runs|ran|running)',
  have: '(?:have|has|had|having)',
  do: '(?:do|does|did|doing|done)',
  pay: '(?:pay|pays|paid|paying)',
  tell: '(?:tell|tells|told|telling)',
  catch: '(?:catch|catches|caught|catching)',
  come: '(?:come|comes|came|coming)',
  set: '(?:set|sets|setting)',
  meet: '(?:meet|meets|met|meeting)',
  reach: '(?:reach|reaches|reached|reaching)',
  raise: '(?:raise|raises|raised|raising)',
  see: '(?:see|sees|saw|seen|seeing)',
  say: '(?:say|says|said|saying)',
  speak: '(?:speak|speaks|spoke|spoken|speaking)',
  sleep: '(?:sleep|sleeps|slept|sleeping)',
  sit: '(?:sit|sits|sat|sitting)',
  read: '(?:read|reads|reading)',
  play: '(?:play|plays|played|playing)',
  pull: '(?:pull|pulls|pulled|pulling)',
  put: '(?:put|puts|putting)',
  lose: '(?:lose|loses|lost|losing)',
  leave: '(?:leave|leaves|left|leaving)',
  kill: '(?:kill|kills|killed|killing)',
  jump: '(?:jump|jumps|jumped|jumping)',
  fly: '(?:fly|flies|flew|flown|flying)',
  cry: '(?:cry|cries|cried|crying)',
  cut: '(?:cut|cuts|cutting)',
  cost: '(?:cost|costs|costing)',
  burn: '(?:burn|burns|burned|burnt|burning)',
  bite: '(?:bite|bites|bit|bitten|biting)',
  beat: '(?:beat|beats|beaten|beating)',
  add: '(?:add|adds|added|adding)',
  spend: '(?:spend|spends|spent|spending)',
  save: '(?:save|saves|saved|saving)',
  waste: '(?:waste|wastes|wasted|wasting)',
  ring: '(?:ring|rings|rang|rung|ringing)',
  turn: '(?:turn|turns|turned|turning)',
  wrap: '(?:wrap|wraps|wrapped|wrapping)',
  think: '(?:think|thinks|thought|thinking)',
  bark: '(?:bark|barks|barked|barking)',
  stab: '(?:stab|stabs|stabbed|stabbing)',
  spill: '(?:spill|spills|spilled|spilt|spilling)',
  figure: '(?:figure|figures|figured|figuring)',
  face: '(?:face|faces|faced|facing)',
  cross: '(?:cross|crosses|crossed|crossing)',
  hold: '(?:hold|holds|held|holding)',
  stand: '(?:stand|stands|stood|standing)',
  bring: '(?:bring|brings|brought|bringing)',
  build: '(?:build|builds|built|building)',
  buy: '(?:buy|buys|bought|buying)',
  drive: '(?:drive|drives|drove|driven|driving)',
  eat: '(?:eat|eats|ate|eaten|eating)',
  fall: '(?:fall|falls|fell|fallen|falling)',
  feel: '(?:feel|feels|felt|feeling)',
  find: '(?:find|finds|found|finding)',
  grow: '(?:grow|grows|grew|grown|growing)',
  hear: '(?:hear|hears|heard|hearing)',
  know: '(?:know|knows|knew|known|knowing)',
  lead: '(?:lead|leads|led|leading)',
  lend: '(?:lend|lends|lent|lending)',
  lie: '(?:lie|lies|lay|lain|lying)',
  ride: '(?:ride|rides|rode|ridden|riding)',
  rise: '(?:rise|rises|rose|risen|rising)',
  sell: '(?:sell|sells|sold|selling)',
  send: '(?:send|sends|sent|sending)',
  show: '(?:show|shows|showed|shown|showing)',
  sing: '(?:sing|sings|sang|sung|singing)',
  sink: '(?:sink|sinks|sank|sunk|sinking)',
  slide: '(?:slide|slides|slid|sliding)',
  stick: '(?:stick|sticks|stuck|sticking)',
  strike: '(?:strike|strikes|struck|striking)',
  swim: '(?:swim|swims|swam|swum|swimming)',
  teach: '(?:teach|teaches|taught|teaching)',
  tear: '(?:tear|tears|tore|torn|tearing)',
  wake: '(?:wake|wakes|woke|woken|waking)',
  wear: '(?:wear|wears|wore|worn|wearing)',
  win: '(?:win|wins|won|winning)',
  write: '(?:write|writes|wrote|written|writing)',
};

const POSS = "(?:my|your|his|her|our|their|its|\\w+'s)";
const OBJ = "(?:me|you|him|her|us|them|it|\\w+)";
const GAP = "(?:\\s+\\w+){0,3}?\\s+"; // 0-3 filler words then space
const GAP0 = "(?:\\s+\\w+){0,2}?\\s+"; // 0-2 filler words (tighter)

function getPattern(expr) {
  // ── Special patterns (hand-tuned) ────────────────────────────
  const specials = {
    // === IDIOMS ===
    "break the ice": new RegExp(`\\b${V.break}\\s+the\\s+ice\\b`, 'i'),
    "piece of cake": /\bpiece\s+of\s+cake\b/i,
    "cup of tea": /\bcup\s+of\s+tea\b/i,
    "no big deal": /\bno\s+big\s+deal\b/i,
    "big deal": /\bbig\s+deal\b/i,
    "a piece of work": /\bpiece\s+of\s+work\b/i,
    "get the hang of": new RegExp(`\\b${V.get}\\s+the\\s+hang\\s+of\\b`, 'i'),
    "get over it": new RegExp(`\\b${V.get}\\s+over\\s+(?:it|this|that|yourself|himself|herself|themselves)\\b`, 'i'),
    "get a grip": new RegExp(`\\b${V.get}\\s+a\\s+grip\\b`, 'i'),
    "get on someone's nerves": new RegExp(`\\b${V.get}(?:s|ting)?\\s+on\\s+${POSS}\\s+nerves?\\b`, 'i'),
    "give it a shot": new RegExp(`\\b${V.give}\\s+${OBJ}\\s+a\\s+shot\\b`, 'i'),
    "give it a try": new RegExp(`\\b${V.give}\\s+${OBJ}\\s+a\\s+try\\b`, 'i'),
    "go the extra mile": new RegExp(`\\b${V.go}\\s+the\\s+extra\\s+mile\\b`, 'i'),
    "hang in there": new RegExp(`\\b${V.hang}\\s+in\\s+there\\b`, 'i'),
    "hit the nail on the head": new RegExp(`\\b${V.hit}\\s+the\\s+nail\\s+on\\s+the\\s+head\\b`, 'i'),
    "in a nutshell": /\bin\s+a\s+nutshell\b/i,
    "it's not rocket science": /\b(?:it'?s?\s+not|it\s+is(?:n'?t|\s+not)|not|ain'?t)\s+rocket\s+science\b/i,
    "keep it up": new RegExp(`\\b${V.keep}\\s+it\\s+up\\b`, 'i'),
    "let it go": new RegExp(`\\b${V.let}\\s+(?:it|this|that)\\s+go\\b`, 'i'),
    "long story short": /\blong\s+story\s+short\b/i,
    "miss the boat": new RegExp(`\\b${V.miss}\\s+the\\s+boat\\b`, 'i'),
    "no wonder": /\bno\s+wonder\b/i,
    "once in a blue moon": /\bonce\s+in\s+a\s+blue\s+moon\b/i,
    "on the same page": /\bon\s+the\s+same\s+page\b/i,
    "out of the blue": /\bout\s+of\s+the\s+blue\b/i,
    "out of nowhere": /\bout\s+of\s+nowhere\b/i,
    "the last straw": /\b(?:the\s+)?last\s+straw\b/i,
    "time flies": /\btime\s+(?:flies|flew|flying)\b/i,
    "under the weather": /\bunder\s+the\s+weather\b/i,
    "worth it": /\bworth\s+it\b/i,
    // "for real" - must not be followed by estate, life, etc.
    "for real": /\bfor\s+real(?!\s+(?:estate|life|property|quick|this))\b/i,
    // "for good" - the idiom means "permanently"; filter common "for good X" collocations
    "for good": /\bfor\s+good(?!\s+(?:reason|luck|behavior|behaviour|measure|faith|conscience|cause|morning|evening|night|time|news|old|people|grades|thing))\b/i,
    "for sure": /\bfor\s+sure\b/i,
    "up to you": /\bup\s+to\s+you\b/i,
    // "make sense" family - deduplicate by checking most specific first
    "that makes sense": /\bthat\s+(?:make|makes|made)\s+(?:(?:a\s+lot\s+of|no|total|perfect|complete|some|any)\s+)?sense\b/i,
    "makes sense": /\b(?:make|makes|made)\s+(?:(?:a\s+lot\s+of|no|total|perfect|complete|some|any)\s+)?sense\b/i,
    "make sense": /\b(?:make|makes|made)\s+(?:(?:a\s+lot\s+of|no|total|perfect|complete|some|any)\s+)?sense\b/i,
    "what's the point": /\bwhat(?:'s|\s+is|\s+was)\s+the\s+point\b/i,
    "the bottom line": /\b(?:the\s+)?bottom\s+line\b/i,
    "at the end of the day": /\bat\s+the\s+end\s+of\s+the\s+day\b/i,
    "easier said than done": /\beasier\s+said\s+than\s+done\b/i,
    "better late than never": /\bbetter\s+late\s+than\s+never\b/i,
    "better safe than sorry": /\bbetter\s+(?:safe|to\s+be\s+safe)\s+than\s+sorry\b/i,
    "to be honest": /\bto\s+be\s+(?:completely\s+|totally\s+|perfectly\s+|brutally\s+)?honest\b/i,
    "to be fair": /\bto\s+be\s+fair\b/i,
    "believe it or not": /\bbelieve\s+it\s+or\s+not\b/i,
    "how dare you": /\bhow\s+dare\s+(?:you|he|she|they|we)\b/i,
    "never mind": /\bnever\s*mind\b/i,
    "rain check": /\brain\s*check\b/i,
    "from scratch": /\bfrom\s+scratch\b/i,
    "behind the scenes": /\bbehind\s+the\s+scenes?\b/i,
    "all of a sudden": /\ball\s+of\s+a\s+sudden\b/i,
    "by all means": /\bby\s+all\s+means\b/i,
    "for the record": /\bfor\s+the\s+record\b/i,
    "in the long run": /\bin\s+the\s+long\s+run\b/i,
    "in the meantime": /\bin\s+the\s+meantime\b/i,
    "on purpose": /\bon\s+purpose\b/i,
    "rule of thumb": /\brule\s+of\s+thumb\b/i,
    "sick and tired": /\bsick\s+and\s+tired\b/i,
    "take for granted": new RegExp(`\\b${V.take}\\s+(?:${OBJ}\\s+)?for\\s+granted\\b`, 'i'),
    "for the sake of": /\bfor\s+(?:the\s+)?sake\s+of\b/i,
    "speak of the devil": new RegExp(`\\b${V.speak}(?:ing)?\\s+of\\s+the\\s+devil\\b`, 'i'),
    "the whole nine yards": /\b(?:the\s+)?whole\s+nine\s+yards\b/i,
    "back to square one": /\bback\s+to\s+square\s+one\b/i,
    "blessing in disguise": /\bblessing\s+in\s+disguise\b/i,
    "burn bridges": new RegExp(`\\b${V.burn}\\s+(?:${POSS}\\s+)?(?:the\\s+)?bridges?\\b`, 'i'),
    "cost an arm and a leg": new RegExp(`\\b${V.cost}\\s+(?:${OBJ}\\s+)?an?\\s+arm\\s+and\\s+a\\s+leg\\b`, 'i'),
    "cut to the chase": new RegExp(`\\b${V.cut}\\s+to\\s+the\\s+chase\\b`, 'i'),
    "hit the road": new RegExp(`\\b${V.hit}\\s+the\\s+road\\b`, 'i'),
    "kill two birds with one stone": new RegExp(`\\b${V.kill}\\s+two\\s+birds\\s+with\\s+one\\s+stone\\b`, 'i'),
    "let the cat out of the bag": new RegExp(`\\b${V.let}\\s+the\\s+cat\\s+out\\s+of\\s+the\\s+bag\\b`, 'i'),
    "spill the beans": new RegExp(`\\b${V.spill}\\s+the\\s+beans\\b`, 'i'),
    "stab in the back": new RegExp(`\\b(?:${V.stab}\\s+(?:${OBJ}\\s+)?in\\s+the\\s+back|stab\\s+in\\s+the\\s+back)\\b`, 'i'),
    "wrap your head around": new RegExp(`\\b${V.wrap}\\s+${POSS}\\s+(?:head|mind)\\s+around\\b`, 'i'),
    "a breath of fresh air": /\bbreath\s+of\s+fresh\s+air\b/i,
    "add insult to injury": new RegExp(`\\b${V.add}\\s+(?:(?:more\\s+)?insult\\s+to\\s+injury|insult\\s+to\\s+injury)\\b`, 'i'),
    "bite the bullet": new RegExp(`\\b${V.bite}\\s+the\\s+bullet\\b`, 'i'),
    "break a leg": new RegExp(`\\b${V.break}\\s+a\\s+leg\\b`, 'i'),
    "cross that bridge": new RegExp(`\\b${V.cross}\\s+that\\s+bridge\\b`, 'i'),
    "face the music": new RegExp(`\\b${V.face}\\s+the\\s+music\\b`, 'i'),
    "get out of hand": new RegExp(`\\b${V.get}(?:ting)?\\s+out\\s+of\\s+hand\\b`, 'i'),
    "go with the flow": new RegExp(`\\b${V.go}\\s+with\\s+the\\s+flow\\b`, 'i'),
    "have a blast": new RegExp(`\\b${V.have}\\s+a\\s+blast\\b`, 'i'),
    "in the same boat": /\bin\s+the\s+same\s+boat\b/i,
    "it takes two to tango": /\b(?:it\s+)?${V.take}\\s+two\\s+to\\s+tango\\b/i,
    "keep your chin up": new RegExp(`\\b${V.keep}\\s+${POSS}\\s+chin\\s+up\\b`, 'i'),
    "leave no stone unturned": new RegExp(`\\b${V.leave}\\s+no\\s+stone\\s+unturned\\b`, 'i'),
    "make a long story short": new RegExp(`\\b${V.make}\\s+a\\s+long\\s+story\\s+short\\b`, 'i'),
    "on thin ice": /\bon\s+thin\s+ice\b/i,
    "pull someone's leg": new RegExp(`\\b${V.pull}\\s+${POSS}\\s+leg\\b`, 'i'),
    "read between the lines": new RegExp(`\\b${V.read}\\s+between\\s+the\\s+lines\\b`, 'i'),
    "see eye to eye": new RegExp(`\\b${V.see}\\s+eye\\s+to\\s+eye\\b`, 'i'),
    "take it easy": new RegExp(`\\b${V.take}\\s+it\\s+easy\\b`, 'i'),
    "the tip of the iceberg": /\b(?:the\s+)?tip\s+of\s+the\s+iceberg\b/i,
    "throw in the towel": new RegExp(`\\b${V.throw}\\s+in\\s+the\\s+towel\\b`, 'i'),
    "turn a blind eye": new RegExp(`\\b${V.turn}\\s+a\\s+blind\\s+eye\\b`, 'i'),
    "two cents": /\btwo\s+cents\b/i,
    "when pigs fly": /\bwhen\s+pigs\s+fly\b/i,
    "whole new ball game": /\bwhole\s+new\s+ball\s*game\b/i,
    "wouldn't hurt a fly": /\bwouldn'?t\s+hurt\s+a\s+fly\b/i,
    "you can say that again": /\byou\s+can\s+say\s+that\s+again\b/i,
    "a dime a dozen": /\ba?\s*dime\s+a\s+dozen\b/i,
    "actions speak louder than words": /\bactions?\s+(?:speak|speaks|spoke)\s+louder\s+than\s+words\b/i,
    "barking up the wrong tree": new RegExp(`\\b${V.bark}\\s+up\\s+the\\s+wrong\\s+tree\\b`, 'i'),
    "beat around the bush": new RegExp(`\\b${V.beat}\\s+around\\s+the\\s+bush\\b`, 'i'),
    "best of both worlds": /\bbest\s+of\s+both\s+worlds\b/i,
    "bite off more than you can chew": new RegExp(`\\b${V.bite}\\s+off\\s+more\\s+than\\b`, 'i'),
    "caught red-handed": /\b(?:caught|catch|catches)\s+(?:him|her|them|me|you|us|\\w+\\s+)?red[\\s-]?handed\b/i,
    "cry over spilled milk": new RegExp(`\\b${V.cry}\\s+over\\s+spill(?:ed|t)\\s+milk\\b`, 'i'),
    "devil's advocate": /\bdevil'?s?\s+advocate\b/i,
    "every cloud has a silver lining": /\b(?:every\s+cloud|silver\s+lining)\b/i,
    "get cold feet": new RegExp(`\\b${V.get}\\s+cold\\s+feet\\b`, 'i'),
    "get the ball rolling": new RegExp(`\\b${V.get}\\s+the\\s+ball\\s+rolling\\b`, 'i'),
    "go down in flames": new RegExp(`\\b${V.go}\\s+(?:down|up)\\s+in\\s+flames\\b`, 'i'),
    "have second thoughts": new RegExp(`\\b${V.have}\\s+(?:some\\s+)?second\\s+thoughts?\\b`, 'i'),
    "in hot water": /\bin\s+hot\s+water\b/i,
    "jump on the bandwagon": new RegExp(`\\b${V.jump}\\s+on\\s+the\\s+bandwagon\\b`, 'i'),
    "keep an eye on": new RegExp(`\\b${V.keep}\\s+(?:an?\\s+)?(?:close\\s+)?eye\\s+on\\b`, 'i'),
    "let sleeping dogs lie": new RegExp(`\\b${V.let}\\s+sleeping\\s+dogs\\s+lie\\b`, 'i'),
    "lose track of": new RegExp(`\\b${V.lose}\\s+track\\s+of\\b`, 'i'),
    "make ends meet": new RegExp(`\\b${V.make}\\s+ends\\s+meet\\b`, 'i'),
    "miss the point": new RegExp(`\\b${V.miss}\\s+the\\s+point\\b`, 'i'),
    "off the top of my head": new RegExp(`\\boff\\s+the\\s+top\\s+of\\s+${POSS}\\s+head\\b`, 'i'),
    "on the bright side": /\bon\s+the\s+bright\s+side\b/i,
    "once and for all": /\bonce\s+and\s+for\s+all\b/i,
    "play it by ear": new RegExp(`\\b${V.play}\\s+(?:it\\s+)?by\\s+ear\\b`, 'i'),
    "put all your eggs in one basket": new RegExp(`\\b${V.put}\\s+(?:all\\s+)?${POSS}\\s+eggs\\s+in\\s+one\\s+basket\\b`, 'i'),
    "ring a bell": new RegExp(`\\b${V.ring}\\s+a\\s+bell\\b`, 'i'),
    "sit tight": new RegExp(`\\b${V.sit}\\s+tight\\b`, 'i'),
    "sleep on it": new RegExp(`\\b${V.sleep}\\s+on\\s+it\\b`, 'i'),
    "take it or leave it": new RegExp(`\\b${V.take}\\s+it\\s+or\\s+${V.leave}\\s+it\\b`, 'i'),
    "take the plunge": new RegExp(`\\b${V.take}\\s+the\\s+plunge\\b`, 'i'),
    "that ship has sailed": /\b(?:that\s+)?ship\s+(?:has\s+)?sailed\b/i,
    "the elephant in the room": /\belephant\s+in\s+the\s+room\b/i,
    "thinking outside the box": new RegExp(`\\b${V.think}\\s+outside\\s+(?:the\\s+|of\\s+the\\s+)?box\\b`, 'i'),
    "up in the air": /\bup\s+in\s+the\s+air\b/i,
    "what goes around comes around": /\bwhat\s+goes\s+around\s+comes\s+around\b/i,
    "win-win": /\bwin[\s-]?win\b/i,

    // === COLLOCATIONS ===
    "make a decision": new RegExp(`\\b${V.make}\\s+(?:a|the|this|that|${POSS})\\s+(?:\\w+\\s+)?decision\\b`, 'i'),
    "make a difference": new RegExp(`\\b${V.make}\\s+(?:a|the|no|any|some|all\\s+the)\\s+(?:\\w+\\s+)?difference\\b`, 'i'),
    "make a mistake": new RegExp(`\\b${V.make}\\s+(?:a|the|that|this|${POSS}|any|some|no)\\s+(?:\\w+\\s+)?mistakes?\\b`, 'i'),
    "make an effort": new RegExp(`\\b${V.make}\\s+(?:an?|the|no|any|some|every)\\s+(?:\\w+\\s+)?effort\\b`, 'i'),
    "make progress": new RegExp(`\\b${V.make}\\s+(?:(?:some|any|no|great|good|real|significant)\\s+)?progress\\b`, 'i'),
    "make money": new RegExp(`\\b${V.make}\\s+(?:(?:more|some|any|no|enough|good|a\\s+lot\\s+of)\\s+)?money\\b`, 'i'),
    "make friends": new RegExp(`\\b${V.make}\\s+(?:(?:new|some|any|no|more)\\s+)?friends\\b`, 'i'),
    "make sure": new RegExp(`\\b${V.make}\\s+sure\\b`, 'i'),
    "make room": new RegExp(`\\b${V.make}\\s+(?:some\\s+)?room\\b`, 'i'),
    "make time": new RegExp(`\\b${V.make}\\s+(?:some\\s+)?time(?!\\s+(?:machine|travel|zone|stamp))\\b`, 'i'),
    "make a point": new RegExp(`\\b${V.make}\\s+(?:a|the|${POSS}|that|this)\\s+point\\b`, 'i'),
    "take a break": new RegExp(`\\b${V.take}\\s+a\\s+(?:\\w+\\s+)?break\\b`, 'i'),
    "take a look": new RegExp(`\\b${V.take}\\s+a\\s+(?:\\w+\\s+)?look\\b`, 'i'),
    "take a chance": new RegExp(`\\b${V.take}\\s+(?:a|the|that|this)\\s+(?:\\w+\\s+)?chance\\b`, 'i'),
    "take a seat": new RegExp(`\\b${V.take}\\s+(?:a|${POSS})\\s+seat\\b`, 'i'),
    "take action": new RegExp(`\\b${V.take}\\s+(?:(?:immediate|swift|quick|decisive)\\s+)?action\\b`, 'i'),
    "take advantage of": new RegExp(`\\b${V.take}\\s+(?:full\\s+)?advantage\\b`, 'i'),
    "take care of": new RegExp(`\\b${V.take}\\s+(?:good\\s+)?care\\s+of\\b`, 'i'),
    "take notes": new RegExp(`\\b${V.take}\\s+(?:some\\s+)?notes?\\b`, 'i'),
    "take place": new RegExp(`\\b${V.take}\\s+place\\b`, 'i'),
    "take time": new RegExp(`\\b${V.take}\\s+(?:(?:some|more|a\\s+lot\\s+of|a\\s+little)\\s+)?time\\b`, 'i'),
    "take turns": new RegExp(`\\b${V.take}\\s+turns\\b`, 'i'),
    "take a step": new RegExp(`\\b${V.take}\\s+(?:a|the|that|this|one)\\s+(?:\\w+\\s+)?steps?\\b`, 'i'),
    "pay attention": new RegExp(`\\b${V.pay}\\s+(?:(?:close|careful|more|any|no|special)\\s+)?attention\\b`, 'i'),
    "pay a visit": new RegExp(`\\b${V.pay}\\s+(?:a|${OBJ}\\s+a)\\s+(?:\\w+\\s+)?visit\\b`, 'i'),
    "pay a compliment": new RegExp(`\\b${V.pay}\\s+(?:a|${OBJ}\\s+a)\\s+compliment\\b`, 'i'),
    "pay the price": new RegExp(`\\b${V.pay}\\s+(?:the|a|${POSS})\\s+(?:\\w+\\s+)?price\\b`, 'i'),
    "pay respect": new RegExp(`\\b${V.pay}\\s+(?:(?:${POSS}|our|their)\\s+)?respects?\\b`, 'i'),
    "do homework": new RegExp(`\\b${V.do}\\s+(?:${POSS}\\s+)?homework\\b`, 'i'),
    "do business": new RegExp(`\\b${V.do}\\s+(?:(?:some|any|more)\\s+)?business\\b`, 'i'),
    "do a favor": new RegExp(`\\b${V.do}\\s+(?:${OBJ}\\s+)?a\\s+(?:\\w+\\s+)?favou?r\\b`, 'i'),
    "do your best": new RegExp(`\\b${V.do}\\s+${POSS}\\s+(?:very\\s+)?best\\b`, 'i'),
    "do the right thing": new RegExp(`\\b${V.do}\\s+the\\s+right\\s+thing\\b`, 'i'),
    "have a good time": new RegExp(`\\b${V.have}\\s+(?:a|the)\\s+(?:good|great|wonderful|amazing|fantastic|lovely|nice|best)\\s+time\\b`, 'i'),
    "have a point": new RegExp(`\\b${V.have}\\s+(?:a|the|${POSS})\\s+(?:good|valid|fair|\\w+\\s+)?point\\b`, 'i'),
    "have no idea": new RegExp(`\\b${V.have}\\s+(?:no|absolutely\\s+no)\\s+idea\\b`, 'i'),
    "have a seat": new RegExp(`\\b${V.have}\\s+a\\s+seat\\b`, 'i'),
    "have a word": new RegExp(`\\b${V.have}\\s+a\\s+(?:quick\\s+)?word\\b`, 'i'),
    "have no choice": new RegExp(`\\b${V.have}\\s+no\\s+(?:other\\s+)?choice\\b`, 'i'),
    "keep in mind": new RegExp(`\\b${V.keep}\\s+(?:(?:that|this|it)\\s+)?in\\s+mind\\b`, 'i'),
    "keep a secret": new RegExp(`\\b${V.keep}\\s+(?:a|the|this|that|${POSS})\\s+secret\\b`, 'i'),
    "keep an eye on": new RegExp(`\\b${V.keep}\\s+(?:an?\\s+)?(?:close\\s+)?eye\\s+on\\b`, 'i'),
    "keep in touch": new RegExp(`\\b${V.keep}\\s+in\\s+touch\\b`, 'i'),
    "keep track of": new RegExp(`\\b${V.keep}\\s+track\\s+of\\b`, 'i'),
    "keep a straight face": new RegExp(`\\b${V.keep}\\s+a\\s+straight\\s+face\\b`, 'i'),
    "catch up": new RegExp(`\\b${V.catch}\\s+up\\b`, 'i'),
    "catch fire": new RegExp(`\\b${V.catch}(?:es)?\\s+(?:on\\s+)?fire\\b`, 'i'),
    "catch a cold": new RegExp(`\\b${V.catch}\\s+(?:a\\s+)?(?:bad\\s+)?cold\\b`, 'i'),
    "catch someone's eye": new RegExp(`\\b${V.catch}\\s+${POSS}\\s+eye\\b`, 'i'),
    "come to a conclusion": new RegExp(`\\b${V.come}\\s+to\\s+(?:a|the|that|this)\\s+(?:\\w+\\s+)?conclusion\\b`, 'i'),
    "come to terms with": new RegExp(`\\b${V.come}\\s+to\\s+terms\\s+with\\b`, 'i'),
    "run a business": new RegExp(`\\b${V.run}\\s+(?:a|the|${POSS})\\s+(?:\\w+\\s+)?business\\b`, 'i'),
    "run errands": new RegExp(`\\b${V.run}\\s+(?:some\\s+)?errands?\\b`, 'i'),
    "run late": new RegExp(`\\b${V.run}\\s+(?:a\\s+(?:little|bit)\\s+)?late\\b`, 'i'),
    "run out of": new RegExp(`\\b${V.run}\\s+out\\s+of\\b`, 'i'),
    "run into": new RegExp(`\\b${V.run}\\s+into\\b`, 'i'),
    "play a role": new RegExp(`\\b${V.play}\\s+(?:a|an|the|${POSS})\\s+(?:\\w+\\s+)?roles?\\b`, 'i'),
    "play it safe": new RegExp(`\\b${V.play}\\s+(?:it\\s+)?safe\\b`, 'i'),
    "save time": new RegExp(`\\b${V.save}\\s+(?:(?:some|a\\s+lot\\s+of|more)\\s+)?time\\b`, 'i'),
    "save money": new RegExp(`\\b${V.save}\\s+(?:(?:some|a\\s+lot\\s+of|more|enough)\\s+)?money\\b`, 'i'),
    "spend time": new RegExp(`\\b${V.spend}\\s+(?:(?:more|some|a\\s+lot\\s+of|quality|enough)\\s+)?time\\b`, 'i'),
    "waste time": new RegExp(`\\b${V.waste}\\s+(?:(?:more|any|no|${POSS})\\s+)?time\\b`, 'i'),
    "kill time": new RegExp(`\\b${V.kill}\\s+(?:some\\s+)?time\\b`, 'i'),
    "tell the truth": new RegExp(`\\b${V.tell}\\s+(?:${OBJ}\\s+)?the\\s+truth\\b`, 'i'),
    "tell a lie": new RegExp(`\\b${V.tell}\\s+(?:${OBJ}\\s+)?(?:a|the)\\s+(?:\\w+\\s+)?lies?\\b`, 'i'),
    "tell a joke": new RegExp(`\\b${V.tell}\\s+(?:${OBJ}\\s+)?(?:a|the|some|\\w+)\\s+(?:\\w+\\s+)?jokes?\\b`, 'i'),
    "tell a story": new RegExp(`\\b${V.tell}\\s+(?:${OBJ}\\s+)?(?:a|the|this|that|${POSS})\\s+(?:\\w+\\s+)?stor(?:y|ies)\\b`, 'i'),
    "raise a question": new RegExp(`\\b${V.raise}\\s+(?:a|the|some|any|this|that)\\s+(?:\\w+\\s+)?questions?\\b`, 'i'),
    "raise awareness": new RegExp(`\\b${V.raise}\\s+(?:(?:public|more)\\s+)?awareness\\b`, 'i'),
    "set a goal": new RegExp(`\\b${V.set}\\s+(?:a|the|${POSS}|some|new)\\s+(?:\\w+\\s+)?goals?\\b`, 'i'),
    "meet a deadline": new RegExp(`\\b${V.meet}\\s+(?:a|the|${POSS}|that|this)\\s+(?:\\w+\\s+)?deadlines?\\b`, 'i'),
    "reach a goal": new RegExp(`\\b${V.reach}\\s+(?:a|the|${POSS}|that|this)\\s+(?:\\w+\\s+)?goals?\\b`, 'i'),
    "heavy rain": /\bheavy\s+rain\b/i,
    "strong wind": /\bstrong\s+winds?\b/i,
    "deep breath": /\bdeep\s+breaths?\b/i,
    "heavy rain": /\bheavy\s+rain(?:s|fall)?\b/i,
    "bright future": /\bbright\s+future\b/i,
    "strong opinion": /\bstrong\s+opinions?\b/i,
    "common sense": /\bcommon\s+sense\b/i,
    "close call": /\bclose\s+call\b/i,
    "close friend": /\bclose(?:st)?\s+friends?\b/i,
    "golden opportunity": /\bgolden\s+opportunity\b/i,
    "narrow escape": /\bnarrow(?:ly)?\s+escap(?:e|ed|es|ing)\b/i,
    "sharp mind": /\bsharp\s+minds?\b/i,
    "tough decision": /\btough\s+decisions?\b/i,
    "fair enough": /\bfair\s+enough\b/i,
    "broad daylight": /\bbroad\s+daylight\b/i,
    "dead end": /\bdead[\s-]?end\b/i,
    "wild guess": /\bwild\s+guess\b/i,
  };

  return specials[expr] || defaultPattern(expr);
}

function defaultPattern(expr) {
  const tokens = expr.toLowerCase().split(/\s+/);
  const parts = tokens.map(tok => {
    if (V[tok]) return V[tok];
    if (tok === "someone's") return POSS;
    if (tok === "someone") return OBJ;
    return esc(tok);
  });
  return new RegExp('\\b' + parts.join('\\s+') + '\\b', 'i');
}

// ── Dedup rules ─────────────────────────────────────────────────────
// When multiple idioms match the same sentence, keep only the most specific
const DEDUP_PRIORITY = {
  "that makes sense": 3,
  "makes sense": 2,
  "make sense": 1,
  "no big deal": 2,
  "big deal": 1,
};

function dedup(matches) {
  // Group by (videoId, idx)
  const groups = new Map();
  for (const m of matches) {
    const key = `${m.videoId}::${m.idx}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(m);
  }

  const result = [];
  for (const [, group] of groups) {
    // Check for dedup conflicts
    const exprs = new Set(group.map(g => g.expr));

    // "make sense" family
    if (exprs.has("that makes sense")) {
      // Remove "makes sense" and "make sense" dupes
      for (const g of group) {
        if (g.expr !== "makes sense" && g.expr !== "make sense") {
          result.push(g);
        }
      }
    } else if (exprs.has("makes sense")) {
      for (const g of group) {
        if (g.expr !== "make sense") {
          result.push(g);
        }
      }
    } else {
      result.push(...group);
    }
  }

  // Also dedup "no big deal" vs "big deal"
  const groups2 = new Map();
  for (const m of result) {
    const key = `${m.videoId}::${m.idx}`;
    if (!groups2.has(key)) groups2.set(key, []);
    groups2.get(key).push(m);
  }
  const result2 = [];
  for (const [, group] of groups2) {
    const exprs = new Set(group.map(g => g.expr));
    if (exprs.has("no big deal") && exprs.has("big deal")) {
      for (const g of group) {
        if (g.expr !== "big deal") result2.push(g);
      }
    } else {
      result2.push(...group);
    }
  }

  // Dedup "keep an eye on" appearing in both idiom and collocation lists
  // (that's fine - it should appear in both output files)
  return result2;
}


// ── Main ────────────────────────────────────────────────────────────

console.log('Building patterns...');

const idiomPatterns = buildPatterns(IDIOMS);
const collocationPatterns = buildPatterns(COLLOCATIONS);

console.log(`Idiom patterns: ${idiomPatterns.length}`);
console.log(`Collocation patterns: ${collocationPatterns.length}`);

// Read all transcripts
const files = fs.readdirSync(TRANSCRIPTS_DIR).filter(f => f.endsWith('.json'));
console.log(`Transcript files: ${files.length}`);

let idiomMatches = [];
let collocationMatches = [];

let processed = 0;

for (const file of files) {
  const videoId = file.replace('.json', '');
  const filePath = path.join(TRANSCRIPTS_DIR, file);

  let data;
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    data = JSON.parse(raw);
  } catch {
    continue;
  }

  if (!Array.isArray(data)) continue;

  for (let idx = 0; idx < data.length; idx++) {
    const seg = data[idx];
    if (!seg || !seg.en) continue;
    const en = seg.en;
    const ko = seg.ko || '';

    for (const { expr, re } of idiomPatterns) {
      if (re.test(en)) {
        idiomMatches.push({ expr, videoId, idx, en, ko });
      }
    }

    for (const { expr, re } of collocationPatterns) {
      if (re.test(en)) {
        collocationMatches.push({ expr, videoId, idx, en, ko });
      }
    }
  }

  processed++;
  if (processed % 200 === 0) {
    console.log(`  processed ${processed}/${files.length}...`);
  }
}

console.log(`\nDeduplicating...`);
idiomMatches = dedup(idiomMatches);
collocationMatches = dedup(collocationMatches);

console.log(`Writing output...`);

fs.writeFileSync(
  path.resolve('scripts/idiom-matches.json'),
  JSON.stringify(idiomMatches, null, 2),
  'utf-8'
);
fs.writeFileSync(
  path.resolve('scripts/collocation-matches.json'),
  JSON.stringify(collocationMatches, null, 2),
  'utf-8'
);

// Stats
const uniqueIdioms = new Set(idiomMatches.map(m => m.expr));
const uniqueCollocations = new Set(collocationMatches.map(m => m.expr));

console.log('\n=== RESULTS ===');
console.log(`Idiom matches: ${idiomMatches.length} total, ${uniqueIdioms.size} unique expressions`);
console.log(`Collocation matches: ${collocationMatches.length} total, ${uniqueCollocations.size} unique expressions`);

console.log('\n--- Idiom breakdown (sorted by count) ---');
const idiomCounts = {};
for (const m of idiomMatches) {
  idiomCounts[m.expr] = (idiomCounts[m.expr] || 0) + 1;
}
const sortedIdioms = Object.entries(idiomCounts).sort((a, b) => b[1] - a[1]);
for (const [expr, count] of sortedIdioms) {
  console.log(`  ${expr}: ${count}`);
}

console.log('\n--- Collocation breakdown (sorted by count) ---');
const collCounts = {};
for (const m of collocationMatches) {
  collCounts[m.expr] = (collCounts[m.expr] || 0) + 1;
}
const sortedColls = Object.entries(collCounts).sort((a, b) => b[1] - a[1]);
for (const [expr, count] of sortedColls) {
  console.log(`  ${expr}: ${count}`);
}

// Missing
const missingIdioms = IDIOMS.filter(e => !uniqueIdioms.has(e));
const missingCollocations = COLLOCATIONS.filter(e => !uniqueCollocations.has(e));

if (missingIdioms.length) {
  console.log(`\n--- Idioms with NO matches (${missingIdioms.length}) ---`);
  for (const e of missingIdioms) console.log(`  ${e}`);
}
if (missingCollocations.length) {
  console.log(`\n--- Collocations with NO matches (${missingCollocations.length}) ---`);
  for (const e of missingCollocations) console.log(`  ${e}`);
}
