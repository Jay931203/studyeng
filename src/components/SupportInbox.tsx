'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAdminStore } from '@/stores/useAdminStore'
import { useLocaleStore } from '@/stores/useLocaleStore'
import type {
  SupportLocale,
  SupportMessageRecord,
  SupportThreadRecord,
  SupportThreadStatus,
} from '@/lib/supportChat'

const POLL_INTERVAL_MS = 15000

const STRINGS: Record<
  SupportLocale,
  {
    title: string
    subtitle: string
    empty: string
    replyPlaceholder: string
    send: string
    markResolved: string
    reopen: string
    waitingAdmin: string
    waitingUser: string
    resolved: string
    open: string
    human: string
  }
> = {
  ko: {
    title: '문의함',
    subtitle: '관리자 답변',
    empty: '아직 접수된 문의가 없어요.',
    replyPlaceholder: '관리자 답변을 입력해 주세요',
    send: '답변 보내기',
    markResolved: '해결 처리',
    reopen: '다시 열기',
    waitingAdmin: '답변 대기',
    waitingUser: '사용자 확인 대기',
    resolved: '해결됨',
    open: '접수됨',
    human: '담당자 확인 필요',
  },
  ja: {
    title: '問い合わせ一覧',
    subtitle: '管理者返信',
    empty: 'まだ受付された問い合わせがありません。',
    replyPlaceholder: '管理者返信を入力してください',
    send: '返信送信',
    markResolved: '解決済みにする',
    reopen: '再オープン',
    waitingAdmin: '返信待ち',
    waitingUser: 'ユーザー確認待ち',
    resolved: '解決済み',
    open: '受付済み',
    human: '担当者確認',
  },
  'zh-TW': {
    title: '客服收件匣',
    subtitle: '管理員回覆',
    empty: '目前還沒有新的 문의。',
    replyPlaceholder: '請輸入管理員回覆',
    send: '送出回覆',
    markResolved: '標示已解決',
    reopen: '重新開啟',
    waitingAdmin: '等待回覆',
    waitingUser: '等待使用者確認',
    resolved: '已解決',
    open: '已受理',
    human: '需要人工確認',
  },
  vi: {
    title: 'Hop thu ho tro',
    subtitle: 'Tra loi quan tri',
    empty: 'Chua co hoi thoai moi.',
    replyPlaceholder: 'Nhap cau tra loi cua quan tri',
    send: 'Gui tra loi',
    markResolved: 'Danh dau da xong',
    reopen: 'Mo lai',
    waitingAdmin: 'Dang cho tra loi',
    waitingUser: 'Cho nguoi dung xac nhan',
    resolved: 'Da xu ly',
    open: 'Da tiep nhan',
    human: 'Can nhan vien xem',
  },
}

interface InboxResponse {
  threads: SupportThreadRecord[]
}

interface ThreadResponse {
  thread: SupportThreadRecord
  messages: SupportMessageRecord[]
}

function formatStatusLabel(status: SupportThreadStatus, t: (typeof STRINGS)[SupportLocale]) {
  if (status === 'waiting_admin') return t.waitingAdmin
  if (status === 'waiting_user') return t.waitingUser
  if (status === 'resolved') return t.resolved
  return t.open
}

export function SupportInbox() {
  const locale = useLocaleStore((state) => state.locale)
  const safeLocale = (locale === 'ja' || locale === 'zh-TW' || locale === 'vi' || locale === 'ko'
    ? locale
    : 'ko') as SupportLocale
  const t = STRINGS[safeLocale]
  const isAdminActive = useAdminStore((state) => state.isAdmin && state.adminEnabled)
  const [threads, setThreads] = useState<SupportThreadRecord[]>([])
  const [activeThread, setActiveThread] = useState<SupportThreadRecord | null>(null)
  const [messages, setMessages] = useState<SupportMessageRecord[]>([])
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(false)
  const activeThreadId = activeThread?.id ?? null

  const loadInbox = useCallback(async () => {
    if (!isAdminActive) return
    const response = await fetch('/api/support/chat?scope=inbox', { cache: 'no-store' })
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    const data = (await response.json()) as InboxResponse
    setThreads(data.threads)
    if (!activeThread && data.threads[0]) {
      setActiveThread(data.threads[0])
    }
  }, [activeThread, isAdminActive])

  const loadThread = useCallback(async (threadId: string) => {
    const response = await fetch(`/api/support/chat?threadId=${threadId}`, { cache: 'no-store' })
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    const data = (await response.json()) as ThreadResponse
    setActiveThread(data.thread)
    setMessages(data.messages)
  }, [])

  useEffect(() => {
    if (!isAdminActive) return
    void loadInbox()
    const timer = window.setInterval(() => {
      void loadInbox()
      if (activeThreadId) {
        void loadThread(activeThreadId)
      }
    }, POLL_INTERVAL_MS)

    return () => window.clearInterval(timer)
  }, [activeThreadId, isAdminActive, loadInbox, loadThread])

  useEffect(() => {
    if (!activeThreadId) {
      setMessages([])
      return
    }
    void loadThread(activeThreadId)
  }, [activeThreadId, loadThread])

  const activeStatus = useMemo(
    () => (activeThread ? formatStatusLabel(activeThread.status, t) : t.open),
    [activeThread, t],
  )

  const sendReply = useCallback(async () => {
    const trimmed = reply.trim()
    if (!activeThread || !trimmed || loading) return
    setLoading(true)

    try {
      const response = await fetch('/api/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'admin-reply',
          threadId: activeThread.id,
          message: trimmed,
        }),
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = (await response.json()) as ThreadResponse
      setReply('')
      setActiveThread(data.thread)
      setMessages(data.messages)
      await loadInbox()
    } finally {
      setLoading(false)
    }
  }, [activeThread, loadInbox, loading, reply])

  const updateStatus = useCallback(
    async (status: SupportThreadStatus) => {
      if (!activeThread) return
      const response = await fetch('/api/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'update-status',
          threadId: activeThread.id,
          status,
        }),
      })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const data = (await response.json()) as { thread: SupportThreadRecord }
      setActiveThread(data.thread)
      await loadInbox()
    },
    [activeThread, loadInbox],
  )

  if (!isAdminActive) return null

  return (
    <div
      className="mt-8 overflow-hidden rounded-2xl border"
      style={{
        borderColor: 'var(--border-card)',
        backgroundColor: 'var(--bg-primary)',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      <div className="border-b px-5 py-4" style={{ borderColor: 'var(--border-card)' }}>
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--accent-text)]">
          {t.subtitle}
        </p>
        <h2 className="mt-1 text-xl font-bold text-[var(--text-primary)]">{t.title}</h2>
      </div>

      <div className="grid min-h-[520px] lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="border-b p-3 lg:border-r lg:border-b-0" style={{ borderColor: 'var(--border-card)' }}>
          {threads.length === 0 ? (
            <div className="rounded-xl px-4 py-8 text-sm text-[var(--text-secondary)]" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              {t.empty}
            </div>
          ) : (
            <div className="space-y-2">
              {threads.map((thread) => (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => setActiveThread(thread)}
                  className="w-full rounded-xl border px-3 py-3 text-left transition-colors"
                  style={{
                    borderColor:
                      activeThread?.id === thread.id
                        ? 'rgba(var(--accent-primary-rgb), 0.35)'
                        : 'var(--border-card)',
                    backgroundColor:
                      activeThread?.id === thread.id
                        ? 'rgba(var(--accent-primary-rgb), 0.12)'
                        : 'var(--bg-secondary)',
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                      {thread.userName || thread.userEmail || thread.userId.slice(0, 8)}
                    </p>
                    {thread.needsHuman && (
                      <span className="shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold" style={{ backgroundColor: 'rgba(var(--accent-primary-rgb), 0.18)', color: 'var(--accent-text)' }}>
                        {t.human}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">{formatStatusLabel(thread.status, t)}</p>
                  <p className="mt-2 line-clamp-2 text-xs text-[var(--text-muted)]">{thread.lastMessagePreview}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex min-h-[360px] flex-col">
          {activeThread ? (
            <>
              <div className="border-b px-5 py-4" style={{ borderColor: 'var(--border-card)' }}>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-base font-semibold text-[var(--text-primary)]">
                    {activeThread.userName || activeThread.userEmail || activeThread.userId}
                  </p>
                  <span className="rounded-full px-2 py-1 text-[11px] text-[var(--text-secondary)]" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    {activeStatus}
                  </span>
                </div>
                {activeThread.userEmail && (
                  <p className="mt-1 text-xs text-[var(--text-muted)]">{activeThread.userEmail}</p>
                )}
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderRole === 'user' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className="max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
                      style={{
                        backgroundColor:
                          message.senderRole === 'user'
                            ? 'var(--bg-secondary)'
                            : 'rgba(var(--accent-primary-rgb), 0.14)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                        {message.senderRole}
                      </p>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t px-5 py-4" style={{ borderColor: 'var(--border-card)' }}>
                <div className="mb-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void updateStatus(activeThread.status === 'resolved' ? 'waiting_admin' : 'resolved')}
                    className="rounded-xl px-3 py-2 text-xs font-semibold"
                    style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  >
                    {activeThread.status === 'resolved' ? t.reopen : t.markResolved}
                  </button>
                </div>
                <div className="flex items-end gap-2">
                  <textarea
                    value={reply}
                    onChange={(event) => setReply(event.target.value)}
                    rows={2}
                    placeholder={t.replyPlaceholder}
                    className="min-h-[88px] flex-1 resize-none rounded-xl border px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
                    style={{ borderColor: 'var(--border-card)', backgroundColor: 'var(--bg-secondary)' }}
                  />
                  <button
                    type="button"
                    onClick={() => void sendReply()}
                    disabled={!reply.trim() || loading}
                    className="rounded-xl px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                    style={{ backgroundColor: 'var(--accent-primary)' }}
                  >
                    {t.send}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-sm text-[var(--text-secondary)]">
              {t.empty}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
