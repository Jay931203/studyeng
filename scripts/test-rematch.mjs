import fs from 'fs'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const entries = JSON.parse(fs.readFileSync('src/data/expression-entries-v2.json', 'utf-8'))
const exprList = Object.values(entries)

function preFilter(sentence, expressions) {
  const sentLower = sentence.toLowerCase()
  const sentWords = new Set(sentLower.split(/\s+/).map(w => w.replace(/[^a-z']/g, '')))

  return expressions.filter(expr => {
    const exprWords = expr.canonical.toLowerCase().split(/\s+/)
    const contentMatches = exprWords.filter(w => w.length >= 3 && sentWords.has(w))
    return contentMatches.length >= 1
  })
}

const data = JSON.parse(fs.readFileSync('public/transcripts/-c7kOHThKHY.json', 'utf-8'))

// Test a few sentences
const testSentences = [
  data[12], // "Oh, man. Oh my god"
  data[16], // "Unbelievable"
]

for (const sent of testSentences) {
  const candidates = preFilter(sent.en, exprList)
  console.log(`\nSentence: "${sent.en}"`)
  console.log(`Pre-filter candidates (${candidates.length}):`, candidates.map(c => c.canonical))

  const candidateList = candidates.map(c => c.canonical).join('\n')
  const prompt = `Determine which expressions from the candidate list are ACTUALLY PRESENT in this sentence (in any conjugated/inflected form).

STRICT RULES:
- The COMPLETE expression must be present as a phrase, not just partial word overlap
- "oh my god" matches "Oh my god" (exact)
- "go for it" matches "went for it" (conjugation)
- "take a look" matches "took a look" (past tense)
- DO NOT match if only one word overlaps accidentally
- When in doubt, do NOT match

Sentence: "${sent.en}"

Candidate expressions:
${candidateList}

Return JSON: {"matches":[{"canonical":"expression","surface":"exact text from sentence"}]}
Only return confirmed complete-phrase matches.`

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      max_tokens: 1024,
      response_format: { type: 'json_object' },
    }),
  })

  const d = await res.json()
  console.log('API result:', d.choices[0].message.content)
}
