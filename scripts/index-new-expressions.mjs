#!/usr/bin/env node
/**
 * index-new-expressions.mjs
 *
 * Match expressions from expression-entries-v2.json against 203 new transcript files
 * and update expression-index-v3.json with the results.
 *
 * Programmatic matching with inflection support, word-boundary checks,
 * and quality filters to reject overly generic single-word matches.
 */

import fs from 'fs'
import path from 'path'

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------
const ROOT = path.resolve('.')
const ENTRIES_PATH = path.join(ROOT, 'src/data/expression-entries-v2.json')
const INDEX_PATH = path.join(ROOT, 'src/data/expression-index-v3.json')
const NEW_IDS_PATH = path.join(ROOT, 'output/new-video-ids.json')
const TRANSCRIPTS_DIR = path.join(ROOT, 'public/transcripts')

const MAX_MATCHES_PER_VIDEO = 20

// ---------------------------------------------------------------------------
// Common words to reject as single-word expression matches
// ---------------------------------------------------------------------------
const REJECT_SINGLE_WORDS = new Set([
  // verbs
  'get', 'go', 'take', 'make', 'do', 'have', 'be', 'is', 'are', 'was', 'were',
  'been', 'being', 'has', 'had', 'did', 'does', 'got', 'went', 'gone', 'took',
  'taken', 'made', 'done', 'come', 'came', 'say', 'said', 'see', 'saw', 'seen',
  'know', 'knew', 'known', 'think', 'thought', 'want', 'need', 'use', 'used',
  'find', 'found', 'give', 'gave', 'given', 'tell', 'told', 'feel', 'felt',
  'try', 'tried', 'leave', 'left', 'call', 'called', 'keep', 'kept', 'let',
  'put', 'seem', 'help', 'show', 'hear', 'heard', 'play', 'run', 'ran',
  'move', 'live', 'believe', 'bring', 'brought', 'happen', 'set', 'sit', 'sat',
  'stand', 'stood', 'lose', 'lost', 'pay', 'paid', 'meet', 'met', 'hold', 'held',
  'learn', 'change', 'lead', 'led', 'begin', 'began', 'begun', 'grow', 'grew',
  'open', 'walk', 'win', 'won', 'teach', 'taught', 'offer', 'remember', 'love',
  'consider', 'appear', 'buy', 'bought', 'wait', 'serve', 'die', 'send', 'sent',
  'build', 'built', 'stay', 'fall', 'fell', 'cut', 'reach', 'kill', 'remain',
  'look', 'listen',
  // prepositions / conjunctions / articles / pronouns / determiners
  'a', 'an', 'the', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from',
  'up', 'about', 'into', 'over', 'after', 'and', 'but', 'or', 'if', 'when',
  'than', 'because', 'as', 'until', 'while', 'that', 'this', 'these', 'those',
  'it', 'its', 'he', 'she', 'they', 'them', 'we', 'us', 'you', 'your', 'my',
  'his', 'her', 'our', 'their', 'me', 'him', 'i',
  // adverbs / adjectives (too common)
  'just', 'also', 'very', 'often', 'not', 'all', 'many', 'some', 'any', 'few',
  'more', 'most', 'other', 'new', 'old', 'big', 'small', 'long', 'great',
  'good', 'bad', 'first', 'last', 'next', 'right', 'only', 'still', 'even',
  'much', 'back', 'here', 'there', 'now', 'then', 'so', 'no', 'yes',
  'how', 'what', 'which', 'who', 'where', 'why',
  // misc common
  'like', 'well', 'time', 'way', 'thing', 'day', 'man', 'woman', 'world',
  'life', 'hand', 'part', 'place', 'case', 'work', 'point', 'home', 'water',
  'room', 'mother', 'people', 'money', 'story', 'fact', 'night', 'kind',
  'head', 'far', 'start', 'end', 'off', 'own',
])

// Distinctive single-word expressions we DO want to match
const ALLOW_SINGLE_WORDS = new Set([
  'awesome', 'dude', 'bro', 'bruh', 'savage', 'cringe', 'slay', 'vibe',
  'chill', 'legit', 'lowkey', 'highkey', 'fam', 'goat', 'lit', 'salty',
  'shook', 'woke', 'flex', 'yolo', 'fomo', 'ghosting', 'catfish',
  'binge', 'stan', 'karen', 'simp', 'boomer', 'zoomer', 'triggered',
  'iconic', 'clutch', 'bussin', 'snatched', 'periodt', 'tea', 'shade',
  'glow-up', 'deadass', 'cap', 'sus', 'bet', 'rizz', 'slay',
  'unbelievable', 'ridiculous', 'incredible', 'absolutely', 'gorgeous',
  'magnificent', 'spectacular', 'phenomenal', 'outrageous', 'hilarious',
  'disgusting', 'fascinating', 'devastating', 'overwhelming', 'breathtaking',
  'astonishing', 'remarkable', 'extraordinary', 'tremendous', 'gorgeous',
  'whatsoever', 'nonetheless', 'regardless', 'obviously', 'apparently',
  'definitely', 'literally', 'basically', 'seriously', 'honestly',
  'exactly', 'totally', 'absolutely', 'indeed', 'certainly',
  'oops', 'yikes', 'geez', 'gosh', 'dang', 'darn', 'yay', 'hooray',
  'bravo', 'bingo', 'cheers', 'touche', 'voila', 'kudos',
])

// ---------------------------------------------------------------------------
// Inflection generation
// ---------------------------------------------------------------------------
function getInflections(phrase) {
  const words = phrase.split(/\s+/)
  if (words.length === 0) return [phrase]

  // For multi-word expressions, inflect the first verb-like word
  const firstWord = words[0]
  const verbForms = inflectVerb(firstWord)

  if (words.length === 1) {
    return verbForms
  }

  // Generate all forms by replacing the first word
  const rest = words.slice(1).join(' ')
  const forms = new Set()
  for (const form of verbForms) {
    forms.add(form + ' ' + rest)
  }
  return [...forms]
}

function inflectVerb(word) {
  const forms = new Set([word])

  // Common irregular verbs
  const irregulars = {
    'be': ['am', 'is', 'are', 'was', 'were', 'been', 'being'],
    'have': ['has', 'had', 'having'],
    'do': ['does', 'did', 'done', 'doing'],
    'go': ['goes', 'went', 'gone', 'going'],
    'get': ['gets', 'got', 'gotten', 'getting'],
    'take': ['takes', 'took', 'taken', 'taking'],
    'make': ['makes', 'made', 'making'],
    'come': ['comes', 'came', 'coming'],
    'give': ['gives', 'gave', 'given', 'giving'],
    'break': ['breaks', 'broke', 'broken', 'breaking'],
    'know': ['knows', 'knew', 'known', 'knowing'],
    'think': ['thinks', 'thought', 'thinking'],
    'see': ['sees', 'saw', 'seen', 'seeing'],
    'say': ['says', 'said', 'saying'],
    'tell': ['tells', 'told', 'telling'],
    'find': ['finds', 'found', 'finding'],
    'put': ['puts', 'putting'],
    'keep': ['keeps', 'kept', 'keeping'],
    'let': ['lets', 'letting'],
    'run': ['runs', 'ran', 'running'],
    'feel': ['feels', 'felt', 'feeling'],
    'leave': ['leaves', 'left', 'leaving'],
    'bring': ['brings', 'brought', 'bringing'],
    'begin': ['begins', 'began', 'begun', 'beginning'],
    'show': ['shows', 'showed', 'shown', 'showing'],
    'hear': ['hears', 'heard', 'hearing'],
    'play': ['plays', 'played', 'playing'],
    'write': ['writes', 'wrote', 'written', 'writing'],
    'stand': ['stands', 'stood', 'standing'],
    'lose': ['loses', 'lost', 'losing'],
    'pay': ['pays', 'paid', 'paying'],
    'meet': ['meets', 'met', 'meeting'],
    'set': ['sets', 'setting'],
    'learn': ['learns', 'learned', 'learnt', 'learning'],
    'hold': ['holds', 'held', 'holding'],
    'live': ['lives', 'lived', 'living'],
    'fall': ['falls', 'fell', 'fallen', 'falling'],
    'drive': ['drives', 'drove', 'driven', 'driving'],
    'sit': ['sits', 'sat', 'sitting'],
    'speak': ['speaks', 'spoke', 'spoken', 'speaking'],
    'rise': ['rises', 'rose', 'risen', 'rising'],
    'grow': ['grows', 'grew', 'grown', 'growing'],
    'draw': ['draws', 'drew', 'drawn', 'drawing'],
    'blow': ['blows', 'blew', 'blown', 'blowing'],
    'throw': ['throws', 'threw', 'thrown', 'throwing'],
    'fly': ['flies', 'flew', 'flown', 'flying'],
    'eat': ['eats', 'ate', 'eaten', 'eating'],
    'drink': ['drinks', 'drank', 'drunk', 'drinking'],
    'sing': ['sings', 'sang', 'sung', 'singing'],
    'swim': ['swims', 'swam', 'swum', 'swimming'],
    'win': ['wins', 'won', 'winning'],
    'wear': ['wears', 'wore', 'worn', 'wearing'],
    'buy': ['buys', 'bought', 'buying'],
    'send': ['sends', 'sent', 'sending'],
    'build': ['builds', 'built', 'building'],
    'spend': ['spends', 'spent', 'spending'],
    'cut': ['cuts', 'cutting'],
    'catch': ['catches', 'caught', 'catching'],
    'turn': ['turns', 'turned', 'turning'],
    'pick': ['picks', 'picked', 'picking'],
    'hang': ['hangs', 'hung', 'hanging'],
    'lead': ['leads', 'led', 'leading'],
    'read': ['reads', 'reading'],
    'lay': ['lays', 'laid', 'laying'],
    'lie': ['lies', 'lied', 'lay', 'lain', 'lying'],
    'sell': ['sells', 'sold', 'selling'],
    'fight': ['fights', 'fought', 'fighting'],
    'teach': ['teaches', 'taught', 'teaching'],
    'hit': ['hits', 'hitting'],
    'pull': ['pulls', 'pulled', 'pulling'],
    'push': ['pushes', 'pushed', 'pushing'],
    'pass': ['passes', 'passed', 'passing'],
    'stick': ['sticks', 'stuck', 'sticking'],
    'shake': ['shakes', 'shook', 'shaken', 'shaking'],
    'spread': ['spreads', 'spreading'],
    'sleep': ['sleeps', 'slept', 'sleeping'],
    'wake': ['wakes', 'woke', 'woken', 'waking'],
    'bite': ['bites', 'bit', 'bitten', 'biting'],
    'shut': ['shuts', 'shutting'],
  }

  if (irregulars[word]) {
    for (const f of irregulars[word]) forms.add(f)
    return [...forms]
  }

  // Regular verb inflections
  // -s form
  if (word.endsWith('s') || word.endsWith('x') || word.endsWith('z') ||
      word.endsWith('ch') || word.endsWith('sh')) {
    forms.add(word + 'es')
  } else if (word.endsWith('y') && word.length > 1 &&
             !'aeiou'.includes(word[word.length - 2])) {
    forms.add(word.slice(0, -1) + 'ies')
  } else {
    forms.add(word + 's')
  }

  // -ed form
  if (word.endsWith('e')) {
    forms.add(word + 'd')
  } else if (word.endsWith('y') && word.length > 1 &&
             !'aeiou'.includes(word[word.length - 2])) {
    forms.add(word.slice(0, -1) + 'ied')
  } else {
    forms.add(word + 'ed')
  }

  // -ing form
  if (word.endsWith('e') && word.length > 1) {
    forms.add(word.slice(0, -1) + 'ing')
  } else {
    forms.add(word + 'ing')
  }

  return [...forms]
}

// ---------------------------------------------------------------------------
// Quality filter: should this single-word expression be matched?
// ---------------------------------------------------------------------------
function shouldMatchSingleWord(exprId) {
  const lower = exprId.toLowerCase()
  if (ALLOW_SINGLE_WORDS.has(lower)) return true
  if (REJECT_SINGLE_WORDS.has(lower)) return false
  // Default: reject if <= 4 chars, accept if longer (likely distinctive)
  return lower.length > 4
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('Loading data...')

  const entries = JSON.parse(fs.readFileSync(ENTRIES_PATH, 'utf-8'))
  const index = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf-8'))
  const newIds = JSON.parse(fs.readFileSync(NEW_IDS_PATH, 'utf-8'))

  const exprList = Object.values(entries)
  console.log(`Expressions: ${exprList.length}`)

  // Pre-build expression data: for each expression, compute all inflected forms
  // and their regex patterns
  const exprData = []
  for (const expr of exprList) {
    const id = expr.id
    const canonical = expr.canonical.toLowerCase()
    const isSingleWord = canonical.indexOf(' ') === -1

    // Quality filter for single-word expressions
    if (isSingleWord && !shouldMatchSingleWord(id)) continue

    const inflections = getInflections(canonical)
    // Build regex: word-boundary match for each inflection
    // Sort by length descending so longer forms match first
    inflections.sort((a, b) => b.length - a.length)

    const patterns = inflections.map(form => {
      const escaped = form.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      return new RegExp('\\b' + escaped + '\\b', 'i')
    })

    // Extract first significant word for fast pre-filter
    const firstWords = new Set()
    for (const form of inflections) {
      const fw = form.split(/\s+/)[0].toLowerCase().replace(/[^a-z']/g, '')
      if (fw.length >= 2) firstWords.add(fw)
    }

    exprData.push({ id, inflections, patterns, firstWords, isSingleWord })
  }

  console.log(`Expressions after filtering: ${exprData.length}`)

  // Process each new video
  let totalMatches = 0
  let videosProcessed = 0
  const matchedExprIds = new Set()

  for (const videoId of newIds) {
    const transcriptPath = path.join(TRANSCRIPTS_DIR, videoId + '.json')
    if (!fs.existsSync(transcriptPath)) continue
    if (index[videoId]) continue // already indexed

    const transcript = JSON.parse(fs.readFileSync(transcriptPath, 'utf-8'))
    if (!Array.isArray(transcript) || transcript.length === 0) continue

    videosProcessed++

    // Build word set from all subtitle text for fast pre-filtering
    const allText = transcript.map(s => (s.en || '').toLowerCase()).join(' ')
    const wordSet = new Set(allText.split(/[^a-z']+/).filter(w => w.length >= 2))

    const matches = []

    for (const expr of exprData) {
      // Fast pre-filter: check if any first word of any inflection exists in transcript
      let hasCandidate = false
      for (const fw of expr.firstWords) {
        if (wordSet.has(fw)) {
          hasCandidate = true
          break
        }
      }
      if (!hasCandidate) continue

      // Search each subtitle
      for (let si = 0; si < transcript.length; si++) {
        const sub = transcript[si]
        const en = sub.en || ''
        if (en.length === 0) continue

        for (let pi = 0; pi < expr.patterns.length; pi++) {
          const match = en.match(expr.patterns[pi])
          if (match) {
            matches.push({
              exprId: expr.id,
              sentenceIdx: si,
              en: en,
              ko: sub.ko || '',
              surfaceForm: match[0],
            })
            break // found a match for this expression in this subtitle, move on
          }
        }

        // Only keep first match per expression per video
        if (matches.length > 0 && matches[matches.length - 1].exprId === expr.id) {
          break
        }
      }

      if (matches.length >= MAX_MATCHES_PER_VIDEO) break
    }

    if (matches.length > 0) {
      index[videoId] = matches.slice(0, MAX_MATCHES_PER_VIDEO)
      totalMatches += index[videoId].length
      for (const m of index[videoId]) matchedExprIds.add(m.exprId)
    } else {
      index[videoId] = []
    }
  }

  // Save updated index
  console.log('\nSaving updated expression-index-v3.json...')
  fs.writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2), 'utf-8')

  console.log('\n--- Results ---')
  console.log(`Videos processed: ${videosProcessed}`)
  console.log(`Total new matches: ${totalMatches}`)
  console.log(`Unique expressions matched: ${matchedExprIds.size}`)
  console.log(`Total videos in index: ${Object.keys(index).length}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
