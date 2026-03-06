interface SentencePuzzle {
  correctOrder: string[]
  shuffledWords: string[]
  checkAnswer: (attempt: string[]) => boolean
}

export function generateSentencePuzzle(sentence: string): SentencePuzzle {
  const correctOrder = sentence.split(/\s+/).filter((w) => w.length > 0)

  let shuffledWords = [...correctOrder]
  for (let attempts = 0; attempts < 10; attempts++) {
    shuffledWords = shuffle(shuffledWords)
    if (shuffledWords.some((w, i) => w !== correctOrder[i])) break
  }

  return {
    correctOrder,
    shuffledWords,
    checkAnswer: (attempt: string[]) => {
      if (attempt.length !== correctOrder.length) return false
      return attempt.every((word, i) => word === correctOrder[i])
    },
  }
}

function shuffle<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
