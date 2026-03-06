const commonWords = [
  'the', 'a', 'is', 'are', 'was', 'were', 'have', 'has', 'do', 'does',
  'will', 'would', 'could', 'should', 'can', 'may', 'might', 'must',
  'go', 'come', 'make', 'take', 'get', 'give', 'know', 'think', 'see',
  'want', 'look', 'use', 'find', 'tell', 'ask', 'work', 'seem', 'feel',
  'try', 'leave', 'call', 'good', 'new', 'first', 'last', 'long', 'great',
  'little', 'just', 'like', 'time', 'very', 'when', 'what', 'your', 'about',
]

interface FillBlankInput {
  en: string
  ko: string
}

interface FillBlankQuestion {
  sentence: string
  correctAnswer: string
  options: string[]
  koreanHint: string
}

export function generateFillBlank(input: FillBlankInput): FillBlankQuestion {
  const words = input.en.split(/\s+/).filter((w) => w.length > 0)

  const candidates = words.filter((w) => w.replace(/[^a-zA-Z]/g, '').length >= 3)
  const targetWord = candidates.length > 0
    ? candidates[Math.floor(Math.random() * candidates.length)]
    : words[Math.floor(Math.random() * words.length)]

  const cleanTarget = targetWord.replace(/[^a-zA-Z']/g, '').toLowerCase()

  const sentence = input.en.replace(targetWord, '___')

  const distractors = generateDistractors(cleanTarget, 3)
  const options = shuffle([cleanTarget, ...distractors])

  return {
    sentence,
    correctAnswer: cleanTarget,
    options,
    koreanHint: input.ko,
  }
}

function generateDistractors(correct: string, count: number): string[] {
  const pool = commonWords.filter(
    (w) => w !== correct.toLowerCase() && Math.abs(w.length - correct.length) <= 3
  )

  const selected: string[] = []
  const used = new Set<string>([correct.toLowerCase()])

  while (selected.length < count && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length)
    const word = pool[idx]
    if (!used.has(word)) {
      selected.push(word)
      used.add(word)
    }
    pool.splice(idx, 1)
  }

  while (selected.length < count) {
    const fallback = `word${selected.length + 1}`
    selected.push(fallback)
  }

  return selected
}

function shuffle<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
