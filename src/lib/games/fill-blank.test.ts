import { describe, it, expect } from 'vitest'
import { generateFillBlank } from './fill-blank'

describe('generateFillBlank', () => {
  it('creates a question from a subtitle', () => {
    const result = generateFillBlank({
      en: 'Can I get a coffee please',
      ko: '커피 한 잔 주실 수 있나요',
    })

    expect(result.sentence).toContain('___')
    expect(result.correctAnswer).toBeTruthy()
    expect(result.options).toContain(result.correctAnswer)
    expect(result.options.length).toBe(4)
  })

  it('removes the blank word from the sentence', () => {
    const result = generateFillBlank({
      en: 'Hello world',
      ko: '안녕 세상',
    })

    expect(result.sentence).not.toContain(result.correctAnswer)
  })

  it('generates 4 unique options', () => {
    const result = generateFillBlank({
      en: 'The quick brown fox jumps over the lazy dog',
      ko: '빠른 갈색 여우가 게으른 개를 뛰어넘다',
    })

    const unique = new Set(result.options)
    expect(unique.size).toBe(4)
  })
})
