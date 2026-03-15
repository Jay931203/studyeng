import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const runtime = 'nodejs'
export const maxDuration = 30

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ChatRequest {
  message: string
  locale: string
  history: ChatMessage[]
}

const LANGUAGE_MAP: Record<string, string> = {
  ko: 'Korean',
  ja: 'Japanese',
  'zh-TW': 'Traditional Chinese',
  vi: 'Vietnamese',
}

function buildSystemPrompt(locale: string): string {
  const lang = LANGUAGE_MAP[locale] || 'Korean'

  return `You are Shortee's customer support assistant. Shortee is an English learning app that uses YouTube Shorts and series videos. You MUST respond entirely in ${lang}.

## App Information
- Name: Shortee ("Learn English with Shorts")
- Platform: Web app (PWA-capable), accessible via mobile browser
- Login: Google and Kakao social login only (no email/password)
- Content: 3,000+ videos in 200+ series across 6 categories (Daily, Movie, Entertainment, Drama, Animation, Music)
- Difficulty: 6 CEFR levels (A1-C2)

## Subscription Plans
- Free: 10 videos/day, basic features
- PRO: 7-day free trial, then paid subscription
  - Unlimited video watching
  - All learning games
  - Ad-free experience
- XP Tier discounts: Learner(10%) / Regular(20%) / Dedicated(30%) / Champion(40%)
- Payment: Stripe (credit/debit cards)
- Manage subscription: Profile > Subscription Management

## Common Issues & Solutions
1. Video not playing: Check internet, refresh app, YouTube may be blocked
2. Login issues: Close app completely, reopen, try again. Clear browser cache if needed.
3. Subtitle not showing: Some videos may be preparing subtitles. Check "Guide" option in settings.
4. Subscription restore: Log in with same account, subscription syncs automatically
5. Account deletion: Profile tab > "Delete Account" button at bottom
6. Streak reset: Must watch at least 1 video or complete a game daily
7. Payment failed: Check card info and balance, try different payment method

## Support Email
support@shortee.app

## Rules
1. ALWAYS respond in ${lang}. Never respond in English unless quoting an English phrase from the app.
2. Be helpful, concise, and friendly but professional. No emojis.
3. If the user's issue requires human intervention (billing disputes, bug reports requiring investigation, account recovery, refund requests, or anything you cannot resolve through information alone), respond with your best guidance AND include the exact string [NEEDS_HUMAN] at the very end of your message.
4. Do not make up features that don't exist.
5. For technical issues, suggest basic troubleshooting first.
6. Keep responses concise - 2-4 sentences for simple questions, up to a short paragraph for complex ones.`
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Support chat is not configured' },
        { status: 503 },
      )
    }

    const body = (await request.json()) as ChatRequest
    const { message, locale = 'ko', history = [] } = body

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 },
      )
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { error: 'Message too long' },
        { status: 400 },
      )
    }

    // Limit history to last 20 messages to control token usage
    const recentHistory = history.slice(-20)

    const anthropic = new Anthropic({ apiKey })

    const messages: Anthropic.MessageParam[] = [
      ...recentHistory.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user', content: message },
    ]

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: buildSystemPrompt(locale),
      messages,
    })

    const textBlock = response.content.find((block) => block.type === 'text')
    const fullText = textBlock?.type === 'text' ? textBlock.text : ''

    // Check if Claude flagged this as needing human support
    const needsHuman = fullText.includes('[NEEDS_HUMAN]')
    const reply = fullText.replace('[NEEDS_HUMAN]', '').trim()

    return NextResponse.json({
      reply,
      needsHuman,
      suggestEmail: needsHuman,
    })
  } catch (error) {
    console.error('Support chat error:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 },
    )
  }
}
