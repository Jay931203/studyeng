import fs from 'fs';
import path from 'path';

const DIR = 'C:/Users/hyunj/studyeng/public/transcripts';

// ─── Manual punctuation fixes ──────────────────────────────────────
// For segments where Whisper missed punctuation between sentences.
// Format: { fileId: { segIndex: { en: "fixed en", ko: "fixed ko" } } }
// The segIndex is the 0-based index in the original array.

const MANUAL_FIXES = {
  'kb60HrggbeQ': {
    2:  { en: "It's like classic, truly classic." },
    3:  { en: "Oh, cute cat! Zoe's here to see you." },
    4:  { en: "Oh, yeah, come on in. Hey, Zoe." },
    6:  { en: "Hey, guys! What? We lost the cat!", ko: "야 얘들아! 뭐? 고양이를 잃어버렸어!" },
    9:  { en: "Did anything small and cat-like run by your legs out the door? Wait, what?" },
    13: { en: "It's classic. It's like our thing, okay?" },
    14: { en: "We got Ant-Man a man ant. So come on, help us look!" },
    15: { en: "Wait, stop, no, stop. This is insane.", ko: "잠깐, 멈춰, 그만. 이건 미친 짓이야." },
    17: { en: "The cat's name is Snugglebucket and it looks like this. Oh my god." },
    18: { en: "Let's find this cat! It's not under there. I got him!" },
    21: { en: "Just keep looking. Why did we ask for the smallest and fastest cat they had?" },
    22: { en: "Ben, is it in your desk?" },
    23: { en: "No, it's just a stupid dog. Oh!" },
    24: { en: "Oh my god! John, check the shelf! Checking the shelf!" },
    25: { en: "It's not on the shelf. Oh my god, I found her! Yay!" },
    26: { en: "Thank god. Little sweetie must have been so scared. But the good thing is we found her." },
    28: { en: "Oh my god! Come on, come on!" },
    30: { en: "Just some crumbs, a coin, and a man. Hey, guys. Paul Dato?", ko: "부스러기, 동전, 그리고 사람 한 명. 안녕 얘들아. 폴 다토?" },
    33: { en: "I'm researching a new movie I'm doing. It's about three guys who suck." },
    34: { en: "Come on, man. Three guys? Dude, it's just so crazy, man. The cat!" },
    37: { en: "I don't see it. John, behind you!" },
    39: { en: "Me again. Guys, this is insane, okay?" },
    40: { en: "We're not gonna find the... Oh my god! It's horrible." },
    41: { en: "No, no! My Lego set! You were so hard on me." },
    42: { en: "Hey guys, I found the cat! Yay! Alright, well, you're welcome for your gift." },
    43: { en: "We'll see you later. That's it? Yeah." },
    44: { en: "Paul, you should probably head out too, man. Alright, see ya." },
    45: { en: "No, no, no, not, not, don't! Goodnight, guys. Bye, guys." },
    46: { en: "What a crazy adventure we had! Hey, I'm gonna miss that crazy cat. And I'll miss you, dudes." },
  },

  '0A20vfx-sO0': {
    // idx4: "Apparently this one is good. What do you mean it's good? I don't know." -> already has punct, split will handle
    // idx66: "I repeat, Pokemon have stormed the Capitol. Oh my God. Oh wait, oh hold up, y'all." -> fix
    66: { en: "I repeat, Pokemon have stormed the Capitol. Oh my God! Oh wait, oh hold up, y'all!" },
  },

  '3ik6EwMNvXg': {
    // These are continuation fragments - don't add punct, just leave as-is
  },

  'TOq0dzxouts': {
    37: { en: "We promise, never..." },
  },

  'sNrBSslS5RE': {
    // These are continuation fragments that span across segments - leave alone
  },
};

// ─── Helpers ───────────────────────────────────────────────────────
const TERMINAL = new Set(['.','?','!','"',"'",'\u201D','\u2019']);
function hasEndPunct(t) {
  t = t.trim();
  if (!t) return true;
  const last = t[t.length-1];
  if (TERMINAL.has(last)) return true;
  // Ellipsis
  if (t.endsWith('...')) return true;
  return false;
}

// Detect if a segment is a continuation fragment (sentence split mid-phrase)
// These end with prepositions, articles, conjunctions, or partial words
function isContinuationFragment(t) {
  t = t.trim();
  if (!t) return false;
  // Ends with common continuation words
  const contWords = /\b(the|a|an|of|to|in|for|on|with|at|by|from|my|your|his|her|its|our|their|and|but|or|not|was|were|is|are|be|been|being|have|has|had|having|do|does|did|will|would|shall|should|can|could|may|might|must|that|this|these|those|than|so|if|as|about|into|through|during|before|after|above|below|between|under|over|up|I|we|you|he|she|it|they|who|which|what|where|when|how|because|although|while|since|until|unless|only|just|also|already|even|still|very|too|most|more|much|many|some|any|no|all|both|each|every|either|neither|another|other|own|same|such|quite|rather|pretty|absolutely|especially|mainly|particularly|gonna|gotta|wanna)$/i;
  if (contWords.test(t)) return true;
  // Ends with comma (clause continues)
  if (t.endsWith(',')) return true;
  return false;
}

function addEndPunct(t) {
  t = t.trim();
  if (!t || hasEndPunct(t)) return t;
  if (isContinuationFragment(t)) return t; // Don't add punct to fragments
  if (/^(who|what|where|when|why|how|is|are|was|were|do|does|did|can|could|would|should|will|shall|have|has|had)\b/i.test(t)) return t + '?';
  if (/^(oh|wow|hey|no|yes|yeah|yay|come on|let's|stop|wait|dude|bro|shut)\b/i.test(t) && t.length < 35) return t + '!';
  return t + '.';
}

const ABBREVS = ['Mr.','Mrs.','Ms.','Dr.','Jr.','Sr.','St.','vs.','U.S.','U.K.','a.m.','p.m.'];
function isAbbrev(text, idx) {
  for (const a of ABBREVS) {
    const s = idx - a.length + 1;
    if (s >= 0 && text.substring(s, idx+1) === a) return true;
  }
  if (idx >= 1 && /^[A-Z]$/.test(text[idx-1]) && (idx < 2 || /[\s(]/.test(text[idx-2]))) return true;
  return false;
}

function splitSentences(text) {
  const bounds = [];
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch !== '.' && ch !== '?' && ch !== '!') continue;
    if (ch === '.' && isAbbrev(text, i)) continue;
    if (ch === '.' && i+1 < text.length && text[i+1] === '.') { while (i < text.length && text[i] === '.') i++; i--; continue; }
    let j = i + 1;
    while (j < text.length && (text[j] === '"' || text[j] === '\u201D' || text[j] === "'")) j++;
    if (j < text.length && text[j] === ' ' && j+1 < text.length && /[A-Z"\u201C0-9']/.test(text[j+1])) {
      bounds.push(j + 1);
    }
  }
  if (!bounds.length) return [text];
  const parts = [];
  let start = 0;
  for (const b of bounds) { const p = text.substring(start, b).trim(); if (p) parts.push(p); start = b; }
  const last = text.substring(start).trim();
  if (last) parts.push(last);
  return parts;
}

function splitKo(ko, enParts) {
  if (enParts.length <= 1) return [ko];
  const kp = ko.split(/(?<=[.?!])\s+/);
  if (kp.length === enParts.length) return kp;
  if (kp.length > enParts.length) {
    const r = []; const ratio = kp.length / enParts.length; let ki = 0;
    for (let i = 0; i < enParts.length; i++) { const end = i === enParts.length-1 ? kp.length : Math.round((i+1)*ratio); r.push(kp.slice(ki, end).join(' ')); ki = end; }
    return r;
  }
  const totalEn = enParts.reduce((s,p) => s+p.length, 0);
  const r = []; let ki = 0;
  for (let i = 0; i < enParts.length; i++) {
    if (i === enParts.length-1) { r.push(ko.substring(ki).trim()); }
    else {
      const ratio = enParts[i].length / totalEn;
      let target = ki + Math.round(ratio * (ko.length - ki));
      let best = target;
      for (let d = 0; d <= 15; d++) {
        if (target+d < ko.length && ko[target+d] === ' ') { best = target+d+1; break; }
        if (target-d >= ki && ko[target-d] === ' ') { best = target-d+1; break; }
      }
      r.push(ko.substring(ki, best).trim()); ki = best;
    }
  }
  return r;
}

function r2(n) { return Math.round(n*100)/100; }

function doSplit(seg, enParts, ko, output) {
  const dur = seg.end - seg.start;
  const tot = enParts.reduce((s,p) => s+p.length, 0);
  const koParts = splitKo(ko, enParts);
  let cs = seg.start;
  for (let i = 0; i < enParts.length; i++) {
    const ratio = enParts[i].length / tot;
    const se = i === enParts.length-1 ? seg.end : r2(cs + ratio*dur);
    output.push({ start: r2(cs), end: se, en: addEndPunct(enParts[i]), ko: (koParts[i]||'').trim() });
    cs = se;
  }
}

// ─── Process file ──────────────────────────────────────────────────
function processFile(filename) {
  const fileId = filename.replace('.json', '');
  const filepath = path.join(DIR, filename);
  const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
  const fixes = MANUAL_FIXES[fileId] || {};

  let splitCount = 0, punctCount = 0;
  const output = [];

  for (let idx = 0; idx < data.length; idx++) {
    const seg = data[idx];
    const dur = seg.end - seg.start;

    // Apply manual fix if any
    let en = (fixes[idx]?.en ?? seg.en).trim();
    let ko = (fixes[idx]?.ko ?? seg.ko).trim();

    // Fix end punctuation
    const fixed = addEndPunct(en);
    if (fixed !== en) { punctCount++; en = fixed; }

    // Skip short segments (<=3s)
    if (dur <= 3) {
      output.push({ start: seg.start, end: seg.end, en, ko });
      continue;
    }

    // Try sentence split
    const sents = splitSentences(en);
    if (sents.length >= 2) {
      const tot = sents.reduce((s,p) => s+p.length, 0);
      const minDur = Math.min(...sents.map(s => (s.length/tot)*dur));

      if (minDur < 1) {
        // Merge short parts with neighbors
        const merged = [];
        for (let i = 0; i < sents.length; i++) {
          const partDur = (sents[i].length/tot)*dur;
          if (partDur < 1.0 && merged.length > 0) {
            // Merge with previous
            merged[merged.length-1] += ' ' + sents[i];
          } else if (partDur < 1.0 && i+1 < sents.length) {
            // First part too short - merge with next
            merged.push(sents[i] + ' ' + sents[i+1]);
            i++; // skip next
          } else {
            merged.push(sents[i]);
          }
        }
        if (merged.length >= 2) { doSplit(seg, merged, ko, output); splitCount++; }
        else output.push({ start: seg.start, end: seg.end, en: addEndPunct(merged[0]), ko });
      } else {
        doSplit(seg, sents, ko, output);
        splitCount++;
      }
      continue;
    }

    // Long single sentence >8s: clause split
    if (dur > 8) {
      const pats = [', and ',', but ',', because ',', which ',', so ',', or '];
      let bestIdx = -1, bestBal = Infinity;
      for (const p of pats) {
        const i = en.indexOf(p);
        if (i > 0) {
          const lr = (i+1)/en.length;
          const bal = Math.abs(lr - 0.5);
          if (lr*dur >= 3 && (1-lr)*dur >= 3 && bal < bestBal) { bestBal = bal; bestIdx = i; }
        }
      }
      if (bestIdx >= 0) {
        const l = en.substring(0, bestIdx+1).trim();
        const r = en.substring(bestIdx+2).trim();
        doSplit({...seg}, [addEndPunct(l), addEndPunct(r)], ko, output);
        splitCount++;
        continue;
      }
    }

    output.push({ start: seg.start, end: seg.end, en, ko });
  }

  // Fix overlaps
  for (let i = 1; i < output.length; i++) {
    if (output[i].start < output[i-1].end) output[i].start = output[i-1].end;
  }

  // Final punct pass
  for (const s of output) {
    const f = addEndPunct(s.en);
    if (f !== s.en) { s.en = f; punctCount++; }
  }

  fs.writeFileSync(filepath, JSON.stringify(output, null, 2) + '\n', 'utf8');
  console.log(`${filename}: ${data.length} -> ${output.length} segs (${splitCount} splits, ${punctCount} punct fixes)`);

  // Log splits for verification
  let oi = 0;
  for (let i = 0; i < data.length; i++) {
    const origEn = data[i].en;
    if (oi < output.length && output[oi].start === data[i].start) {
      // Check if this was split
      let count = 0;
      let checkEnd = data[i].end;
      let startOi = oi;
      while (oi < output.length && output[oi].end <= checkEnd + 0.01) { count++; oi++; }
      if (count > 1) {
        console.log(`  SPLIT [${data[i].start}-${data[i].end}] "${origEn.substring(0,70)}"`);
        for (let k = startOi; k < startOi + count; k++) {
          console.log(`    -> [${output[k].start}-${output[k].end}] "${output[k].en.substring(0,60)}"`);
        }
      }
    }
  }

  return { original: data.length, final: output.length, splits: splitCount, puncts: punctCount };
}

// ─── Main ──────────────────────────────────────────────────────────
console.log('=== Subtitle Segmentation (Final) ===\n');
const FILES = ['0A20vfx-sO0.json','3ik6EwMNvXg.json','TOq0dzxouts.json','sNrBSslS5RE.json','kb60HrggbeQ.json'];
let T = { o: 0, f: 0, s: 0, p: 0 };
for (const f of FILES) {
  const r = processFile(f);
  T.o += r.original; T.f += r.final; T.s += r.splits; T.p += r.puncts;
}
console.log(`\nTOTAL: ${T.o} -> ${T.f} segs (${T.s} splits, ${T.p} punct fixes)`);
