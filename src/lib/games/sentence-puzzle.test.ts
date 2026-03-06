import { describe, it, expect } from 'vitest'
import { generateSentencePuzzle } from './sentence-puzzle'

describe('generateSentencePuzzle', () => {
  it('shuffles words from the original sentence', () => {
    const result = generateSentencePuzzle('Can I get a coffee please')

    expect(result.correctOrder).toEqual(['Can', 'I', 'get', 'a', 'coffee', 'please'])
    expect(result.shuffledWords).toHaveLength(6)
    expect(new Set(result.shuffledWords)).toEqual(new Set(result.correctOrder))
  })

  it('validates correct answer', () => {
    const result = generateSentencePuzzle('Hello world')
    expect(result.checkAnswer(['Hello', 'world'])).toBe(true)
    expect(result.checkAnswer(['world', 'Hello'])).toBe(false)
  })
})
