import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  getAutomatedSupportReply,
  getSupportWorkingHoursLabel,
  type SupportLocale,
  type SupportMessageRecord,
  type SupportThreadRecord,
  type SupportThreadStatus,
} from '@/lib/supportChat'

export const runtime = 'nodejs'
export const maxDuration = 30

interface SupportThreadRow {
  id: string
  user_id: string
  user_name: string | null
  user_email: string | null
  status: SupportThreadStatus
  needs_human: boolean | null
  last_message_preview: string | null
  last_message_at: string
  user_last_read_at: string | null
  admin_last_read_at: string | null
  created_at: string
  updated_at: string
}

interface SupportMessageRow {
  id: string
  thread_id: string
  sender_role: 'user' | 'assistant' | 'admin'
  sender_user_id: string | null
  content: string
  metadata: Record<string, unknown> | null
  created_at: string
}

type SupportChatRequestBody =
  | {
      message: string
      locale?: SupportLocale
      mode?: 'user'
    }
  | {
      mode: 'admin-reply'
      threadId: string
      message: string
    }
  | {
      mode: 'update-status'
      threadId: string
      status: SupportThreadStatus
    }

const MAX_MESSAGE_LENGTH = 2000

function trimMessage(input: string) {
  return input.replace(/\s+/g, ' ').trim()
}

function toThreadRecord(row: SupportThreadRow): SupportThreadRecord {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    userEmail: row.user_email,
    status: row.status,
    needsHuman: Boolean(row.needs_human),
    lastMessagePreview: row.last_message_preview ?? '',
    lastMessageAt: row.last_message_at,
    userLastReadAt: row.user_last_read_at,
    adminLastReadAt: row.admin_last_read_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toMessageRecord(row: SupportMessageRow): SupportMessageRecord {
  return {
    id: row.id,
    threadId: row.thread_id,
    senderRole: row.sender_role,
    senderUserId: row.sender_user_id,
    content: row.content,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
  }
}

async function isAdminUser(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  userId: string,
) {
  const { data, error } = await supabase
    .from('admin_accounts')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.warn('[support-chat] admin lookup failed:', error.message)
    return false
  }

  return Boolean(data)
}

async function getOrCreateThread(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> | null },
) {
  const existing = await supabase
    .from('support_threads')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing.error) {
    throw existing.error
  }

  if (existing.data) {
    const userName =
      typeof user.user_metadata?.full_name === 'string'
        ? user.user_metadata.full_name
        : typeof user.user_metadata?.name === 'string'
          ? user.user_metadata.name
          : null

    const patch: Partial<SupportThreadRow> = {}
    if (user.email && existing.data.user_email !== user.email) {
      patch.user_email = user.email
    }
    if (userName && existing.data.user_name !== userName) {
      patch.user_name = userName
    }

    if (Object.keys(patch).length > 0) {
      const { data, error } = await supabase
        .from('support_threads')
        .update(patch)
        .eq('id', existing.data.id)
        .select('*')
        .single()

      if (error) throw error
      return data as SupportThreadRow
    }

    return existing.data as SupportThreadRow
  }

  const userName =
    typeof user.user_metadata?.full_name === 'string'
      ? user.user_metadata.full_name
      : typeof user.user_metadata?.name === 'string'
        ? user.user_metadata.name
        : null

  const { data, error } = await supabase
    .from('support_threads')
    .insert({
      user_id: user.id,
      user_email: user.email ?? null,
      user_name: userName,
      status: 'open',
    })
    .select('*')
    .single()

  if (error) throw error
  return data as SupportThreadRow
}

async function loadThreadMessages(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  threadId: string,
) {
  const { data, error } = await supabase
    .from('support_messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return ((data ?? []) as SupportMessageRow[]).map(toMessageRecord)
}

async function loadThreadById(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  threadId: string,
) {
  const { data, error } = await supabase
    .from('support_threads')
    .select('*')
    .eq('id', threadId)
    .single()

  if (error) throw error
  return toThreadRecord(data as SupportThreadRow)
}

export async function GET(request: Request) {
  const supabase = await createClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Support chat is unavailable' }, { status: 503 })
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const scope = url.searchParams.get('scope')
  const threadId = url.searchParams.get('threadId')
  const isAdmin = await isAdminUser(supabase, user.id)

  try {
    if (scope === 'inbox') {
      if (!isAdmin) {
        return NextResponse.json({ error: 'forbidden' }, { status: 403 })
      }

      const { data, error } = await supabase
        .from('support_threads')
        .select('*')
        .order('last_message_at', { ascending: false })
        .limit(100)

      if (error) throw error

      return NextResponse.json({
        threads: ((data ?? []) as SupportThreadRow[]).map(toThreadRecord),
        workingHours: getSupportWorkingHoursLabel('ko'),
      })
    }

    const resolvedThread =
      threadId && isAdmin ? await loadThreadById(supabase, threadId) : toThreadRecord(await getOrCreateThread(supabase, user))

    const messages = await loadThreadMessages(supabase, resolvedThread.id)

    await supabase
      .from('support_threads')
      .update(
        isAdmin
          ? { admin_last_read_at: new Date().toISOString() }
          : { user_last_read_at: new Date().toISOString() },
      )
      .eq('id', resolvedThread.id)

    return NextResponse.json({
      thread: resolvedThread,
      messages,
      isAdmin,
      workingHours: getSupportWorkingHoursLabel('ko'),
    })
  } catch (error) {
    console.error('[support-chat] GET error:', error)
    return NextResponse.json({ error: 'Failed to load support chat' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Support chat is unavailable' }, { status: 503 })
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = (await request.json()) as SupportChatRequestBody
  const isAdmin = await isAdminUser(supabase, user.id)

  try {
    if (body.mode === 'admin-reply') {
      if (!isAdmin) {
        return NextResponse.json({ error: 'forbidden' }, { status: 403 })
      }

      const message = typeof body.message === 'string' ? trimMessage(body.message) : ''
      if (!body.threadId || !message || message.length > MAX_MESSAGE_LENGTH) {
        return NextResponse.json({ error: 'invalid-message' }, { status: 400 })
      }

      const { error: insertError } = await supabase.from('support_messages').insert({
        thread_id: body.threadId,
        sender_role: 'admin',
        sender_user_id: user.id,
        content: message,
        metadata: { manual: true },
      })
      if (insertError) throw insertError

      const nowIso = new Date().toISOString()
      const { error: updateError } = await supabase
        .from('support_threads')
        .update({
          status: 'waiting_user',
          needs_human: false,
          last_message_preview: message.slice(0, 120),
          last_message_at: nowIso,
          admin_last_read_at: nowIso,
        })
        .eq('id', body.threadId)
      if (updateError) throw updateError

      const thread = await loadThreadById(supabase, body.threadId)
      const messages = await loadThreadMessages(supabase, body.threadId)

      return NextResponse.json({ ok: true, thread, messages })
    }

    if (body.mode === 'update-status') {
      if (!isAdmin) {
        return NextResponse.json({ error: 'forbidden' }, { status: 403 })
      }

      if (!body.threadId || !body.status) {
        return NextResponse.json({ error: 'invalid-status' }, { status: 400 })
      }

      const { error } = await supabase
        .from('support_threads')
        .update({ status: body.status })
        .eq('id', body.threadId)

      if (error) throw error

      const thread = await loadThreadById(supabase, body.threadId)
      return NextResponse.json({ ok: true, thread })
    }

    const message = typeof body.message === 'string' ? trimMessage(body.message) : ''
    if (!message || message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ error: 'invalid-message' }, { status: 400 })
    }

    const locale = body.locale ?? 'ko'
    const thread = await getOrCreateThread(supabase, user)

    const { error: userInsertError } = await supabase.from('support_messages').insert({
      thread_id: thread.id,
      sender_role: 'user',
      sender_user_id: user.id,
      content: message,
      metadata: {
        automated: false,
      },
    })
    if (userInsertError) throw userInsertError

    const autoReply = getAutomatedSupportReply(message, locale)
    const nowIso = new Date().toISOString()

    const adminClient = createAdminClient()
    if (adminClient) {
      const adminDb = adminClient as unknown as {
        from: (table: string) => {
          insert: (value: Record<string, unknown>) => Promise<{ error: { message: string } | null }>
        }
      }

      const { error: assistantInsertError } = await adminDb.from('support_messages').insert({
        thread_id: thread.id,
        sender_role: 'assistant',
        sender_user_id: null,
        content: autoReply.reply,
        metadata: {
          automated: true,
          category: autoReply.category,
          needsHuman: autoReply.needsHuman,
        },
      })

      if (assistantInsertError) {
        console.warn('[support-chat] assistant insert failed:', assistantInsertError.message)
      }
    }

    const { error: threadUpdateError } = await supabase
      .from('support_threads')
      .update({
        status: autoReply.needsHuman ? 'waiting_admin' : 'waiting_user',
        needs_human: autoReply.needsHuman,
        last_message_preview: message.slice(0, 120),
        last_message_at: nowIso,
        user_last_read_at: nowIso,
        admin_last_read_at: null,
      })
      .eq('id', thread.id)
    if (threadUpdateError) throw threadUpdateError

    const nextThread = await loadThreadById(supabase, thread.id)
    const messages = await loadThreadMessages(supabase, thread.id)

    return NextResponse.json({
      ok: true,
      thread: nextThread,
      messages,
      autoReply,
      persistedAssistant: Boolean(adminClient),
    })
  } catch (error) {
    console.error('[support-chat] POST error:', error)
    return NextResponse.json({ error: 'Failed to process support message' }, { status: 500 })
  }
}
