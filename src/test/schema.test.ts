import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Prisma Schema', () => {
  const schema = fs.readFileSync(
    path.join(process.cwd(), 'prisma/schema.prisma'),
    'utf-8'
  )

  it('defines all required models', () => {
    expect(schema).toContain('model User')
    expect(schema).toContain('model Video')
    expect(schema).toContain('model SavedPhrase')
    expect(schema).toContain('model GameResult')
    expect(schema).toContain('model UserProgress')
  })

  it('User has gamification fields', () => {
    expect(schema).toContain('level')
    expect(schema).toContain('xp')
    expect(schema).toContain('streakDays')
  })

  it('Video has subtitle data as JSON', () => {
    expect(schema).toContain('subtitleData Json')
  })

  it('UserProgress has unique constraint on userId+videoId', () => {
    expect(schema).toContain('@@unique([userId, videoId])')
  })
})
