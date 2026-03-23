'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useLocaleStore } from '@/stores/useLocaleStore'
import { useAuth } from '@/hooks/useAuth'
import type {
  SupportLocale,
  SupportMessageRecord,
  SupportThreadRecord,
} from '@/lib/supportChat'

const SUPPORT_EMAIL = 'support@shortee.app'
const POLL_INTERVAL_MS = 15000

const STRINGS: Record<
  SupportLocale,
  {
    chatTitle: string
    chatSubtitle: string
    welcomeMessage: string
    inputPlaceholder: string
    send: string
    thinking: string
    close: string
    loginNeeded: string
    loginAction: string
    emailFallback: string
    humanBadge: string
    autoBadge: string
    adminBadge: string
    officeHours: string
    waitingAdmin: string
    waitingUser: string
    resolved: string
    open: string
    loadError: string
    sendError: string
    queuedForHuman: string
  }
> = {
  ko: {
    chatTitle: '문의 채팅',
    chatSubtitle: 'Shortee 지원',
    welcomeMessage: '문의 내용을 남겨주시면 자동 안내가 먼저 답하고, 필요하면 관리자가 이어서 확인해요.',
    inputPlaceholder: '문의 내용을 입력해 주세요',
    send: '보내기',
    thinking: '답변 준비 중...',
    close: '닫기',
    loginNeeded: '1:1 문의는 로그인 후 사용할 수 있어요.',
    loginAction: '로그인하기',
    emailFallback: '이메일 문의',
    humanBadge: '담당자 확인 필요',
    autoBadge: '자동 안내',
    adminBadge: '관리자 답변',
    officeHours: '관리자 답변 시간',
    waitingAdmin: '답변 대기',
    waitingUser: '안내 완료',
    resolved: '해결됨',
    open: '접수됨',
    loadError: '\uBB38\uC758 \uB0B4\uC5ED\uC744 \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC5B4\uC694. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694.',
    sendError: '\uBB38\uC758 \uC804\uC1A1\uC5D0 \uC2E4\uD328\uD588\uC5B4\uC694. \uC785\uB825\uD55C \uB0B4\uC6A9\uC740 \uADF8\uB300\uB85C \uB0A8\uACA8\uB450\uC5C8\uC5B4\uC694.',
    queuedForHuman: '\uC790\uB3D9 \uC548\uB0B4\uAC00 \uC9C0\uAE08 \uC800\uC7A5\uB418\uC9C0 \uC54A\uC544 \uAD00\uB9AC\uC790 \uD655\uC778 \uD050\uC5D0 \uC811\uC218\uD588\uC5B4\uC694.',
  },
  ja: {
    chatTitle: 'お問い合わせ',
    chatSubtitle: 'Shortee サポート',
    welcomeMessage: '問い合わせを送ると自動案内が先に返答し、必要なら担当者が続けて確認します。',
    inputPlaceholder: 'お問い合わせ内容を入力してください',
    send: '送信',
    thinking: '返信を準備中...',
    close: '閉じる',
    loginNeeded: '1:1サポートはログイン後に利用できます。',
    loginAction: 'ログイン',
    emailFallback: 'メール問い合わせ',
    humanBadge: '担当者確認',
    autoBadge: '自動案内',
    adminBadge: '担当者返信',
    officeHours: '担当者返信時間',
    waitingAdmin: '返信待ち',
    waitingUser: '案内済み',
    resolved: '解決済み',
    open: '受付済み',
    loadError: 'Failed to load support messages. Please try again.',
    sendError: 'Failed to send your message. Your draft is still here.',
    queuedForHuman: 'Auto-reply is unavailable. Your message was queued for human review.',
  },
  'zh-TW': {
    chatTitle: '客服對話',
    chatSubtitle: 'Shortee 支援',
    welcomeMessage: '送出問題後會先收到自動引導，必要時客服會接著回覆。',
    inputPlaceholder: '請輸入問題內容',
    send: '送出',
    thinking: '正在準備回覆...',
    close: '關閉',
    loginNeeded: '登入後才能使用 1:1 客服。',
    loginAction: '登入',
    emailFallback: '電子郵件',
    humanBadge: '需要人工確認',
    autoBadge: '自動引導',
    adminBadge: '客服回覆',
    officeHours: '客服回覆時間',
    waitingAdmin: '等待回覆',
    waitingUser: '已引導',
    resolved: '已解決',
    open: '已受理',
    loadError: 'Failed to load support messages. Please try again.',
    sendError: 'Failed to send your message. Your draft is still here.',
    queuedForHuman: 'Auto-reply is unavailable. Your message was queued for human review.',
  },
  vi: {
    chatTitle: 'Chat ho tro',
    chatSubtitle: 'Ho tro Shortee',
    welcomeMessage: 'Hay de lai noi dung. He thong se tra loi tu dong truoc, sau do nhan vien se tiep tuc neu can.',
    inputPlaceholder: 'Nhap noi dung can ho tro',
    send: 'Gui',
    thinking: 'Dang chuan bi tra loi...',
    close: 'Dong',
    loginNeeded: 'Ho tro 1:1 can dang nhap.',
    loginAction: 'Dang nhap',
    emailFallback: 'Email',
    humanBadge: 'Can nhan vien xem',
    autoBadge: 'Tra loi tu dong',
    adminBadge: 'Nhan vien tra loi',
    officeHours: 'Gio tra loi',
    waitingAdmin: 'Dang cho tra loi',
    waitingUser: 'Da huong dan',
    resolved: 'Da xu ly',
    open: 'Da tiep nhan',
    loadError: 'Khong the tai noi dung ho tro. Vui long thu lai.',
    sendError: 'Khong gui duoc tin nhan. Noi dung da duoc giu lai.',
    queuedForHuman: 'Tra loi tu dong dang khong kha dung. Tin nhan da duoc chuyen cho nhan vien.',
  },
}

interface ChatPayload {
  thread: SupportThreadRecord
  messages: SupportMessageRecord[]
  workingHours: string
  autoReply?: {
    reply: string
  }
  persistedAssistant?: boolean
  assistantDeferredToHuman?: boolean
}

function formatTime(timestamp: string, locale: SupportLocale) {
  return new Intl.DateTimeFormat(locale === 'zh-TW' ? 'zh-Hant-TW' : locale, {
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(timestamp))
}

export function SupportChat() {
  const locale = useLocaleStore((state) => state.locale)
  const safeLocale = (locale === 'ja' || locale === 'zh-TW' || locale === 'vi' || locale === 'ko'
    ? locale
    : 'ko') as SupportLocale
  const t = STRINGS[safeLocale]
  const { user, authAvailable, signInWithGoogle } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [thread, setThread] = useState<SupportThreadRecord | null>(null)
  const [messages, setMessages] = useState<SupportMessageRecord[]>([])
  const workingHoursDefaults: Record<SupportLocale, string> = {
    ko: '평일 10:00-18:00 (KST)',
    ja: '平日 10:00-18:00 (KST)',
    'zh-TW': '週一至週五 10:00-18:00 (KST)',
    vi: 'T2-T6 10:00-18:00 (KST)',
  }
  const [workingHours, setWorkingHours] = useState(workingHoursDefaults[safeLocale])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const loadThread = useCallback(async () => {
    if (!user) return

    try {
      const response = await fetch(`/api/support/chat?locale=${encodeURIComponent(safeLocale)}`, {
        cache: 'no-store',
      })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = (await response.json()) as ChatPayload
      setThread(data.thread)
      setMessages(data.messages)
      setWorkingHours(data.workingHours)
      setErrorMessage(null)
    } catch (error) {
      console.error('[support-chat] load failed:', error)
      setErrorMessage(t.loadError)
    }
  }, [safeLocale, t.loadError, user])

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (!isOpen || !user) return

    void loadThread()
    const timer = window.setInterval(() => {
      void loadThread()
    }, POLL_INTERVAL_MS)

    return () => window.clearInterval(timer)
  }, [isOpen, loadThread, user])

  useEffect(() => {
    if (!isOpen) return
    const timer = window.setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      inputRef.current?.focus()
    }, 120)
    return () => window.clearTimeout(timer)
  }, [isOpen, messages.length])

  const statusLabel = useMemo(() => {
    if (!thread) return t.open
    if (thread.status === 'waiting_admin') return t.waitingAdmin
    if (thread.status === 'waiting_user') return t.waitingUser
    if (thread.status === 'resolved') return t.resolved
    return t.open
  }, [t, thread])

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim()
    if (!trimmed || isLoading || !user) return

    setIsLoading(true)
    setErrorMessage(null)
    setNoticeMessage(null)

    try {
      const response = await fetch('/api/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          locale: safeLocale,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = (await response.json()) as ChatPayload
      setThread(data.thread)
      setMessages(data.messages)
      setWorkingHours(data.workingHours)
      setInput('')
      if (data.assistantDeferredToHuman) {
        setNoticeMessage(t.queuedForHuman)
      }
    } catch (error) {
      console.error('[support-chat] send failed:', error)
      setErrorMessage(t.sendError)
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, safeLocale, t.queuedForHuman, t.sendError, user])

  if (!isHydrated) return null

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+80px)] right-4 z-[180] flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg lg:bottom-6 lg:right-6"
            style={{ backgroundColor: 'var(--accent-primary)' }}
            aria-label={t.chatTitle}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
              <path
                fillRule="evenodd"
                d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97z"
                clipRule="evenodd"
              />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-black/65 lg:hidden"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: 28, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 28, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 280, damping: 26 }}
              className="fixed inset-x-0 bottom-0 z-[210] mx-auto flex max-h-[min(88vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-t-[24px] border lg:inset-auto lg:bottom-6 lg:right-6 lg:left-auto lg:w-[420px] lg:rounded-[24px]"
              style={{
                borderColor: 'var(--border-card)',
                backgroundColor: 'var(--bg-primary)',
                boxShadow: '0 20px 48px rgba(0,0,0,0.45)',
              }}
            >
              <div
                className="flex items-start justify-between gap-3 border-b px-5 py-4"
                style={{ borderColor: 'var(--border-card)' }}
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--accent-text)]">
                    {t.chatSubtitle}
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-[var(--text-primary)]">{t.chatTitle}</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-secondary)]">
                    <span>{t.officeHours}</span>
                    <span className="rounded-full px-2 py-1" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                      {workingHours}
                    </span>
                    <span className="rounded-full px-2 py-1" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                      {statusLabel}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full"
                  style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)' }}
                  aria-label={t.close}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                  </svg>
                </button>
              </div>

              {!user ? (
                <div className="flex flex-1 flex-col justify-between px-5 py-5">
                  <div className="rounded-2xl px-4 py-4 text-sm leading-relaxed text-[var(--text-primary)]" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    {t.loginNeeded}
                  </div>
                  <div className="mt-4 flex flex-col gap-3">
                    {authAvailable && (
                      <button
                        type="button"
                        onClick={() => signInWithGoogle('/support')}
                        className="rounded-xl px-4 py-3 text-sm font-semibold text-white"
                        style={{ backgroundColor: 'var(--accent-primary)' }}
                      >
                        {t.loginAction}
                      </button>
                    )}
                    <a
                      href={`mailto:${SUPPORT_EMAIL}`}
                      className="rounded-xl border px-4 py-3 text-center text-sm font-semibold text-[var(--text-primary)]"
                      style={{ borderColor: 'var(--border-card)', backgroundColor: 'var(--bg-secondary)' }}
                    >
                      {t.emailFallback}
                    </a>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                    {errorMessage && (
                      <div
                        className="rounded-2xl border px-4 py-3 text-sm leading-relaxed text-[var(--text-primary)]"
                        style={{
                          borderColor: 'rgba(245, 158, 11, 0.28)',
                          backgroundColor: 'rgba(245, 158, 11, 0.12)',
                        }}
                      >
                        {errorMessage}
                      </div>
                    )}

                    {noticeMessage && (
                      <div
                        className="rounded-2xl border px-4 py-3 text-sm leading-relaxed text-[var(--text-primary)]"
                        style={{
                          borderColor: 'rgba(var(--accent-primary-rgb), 0.28)',
                          backgroundColor: 'rgba(var(--accent-primary-rgb), 0.12)',
                        }}
                      >
                        {noticeMessage}
                      </div>
                    )}

                    {messages.length === 0 && (
                      <div className="rounded-2xl px-4 py-4 text-sm leading-relaxed text-[var(--text-primary)]" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                        {t.welcomeMessage}
                      </div>
                    )}

                    {messages.map((message) => {
                      const isUser = message.senderRole === 'user'
                      const label =
                        message.senderRole === 'assistant'
                          ? t.autoBadge
                          : message.senderRole === 'admin'
                            ? t.adminBadge
                            : null

                      return (
                        <div
                          key={message.id}
                          className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className="max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
                            style={{
                              backgroundColor: isUser ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                              color: isUser ? '#ffffff' : 'var(--text-primary)',
                            }}
                          >
                            {label && (
                              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] opacity-80">
                                {label}
                              </p>
                            )}
                            <p className="whitespace-pre-wrap">{message.content}</p>
                            <p className="mt-2 text-[10px] opacity-70">
                              {formatTime(message.createdAt, safeLocale)}
                            </p>
                          </div>
                        </div>
                      )
                    })}

                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="rounded-2xl px-4 py-3 text-xs text-[var(--text-secondary)]" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                          {t.thinking}
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="border-t px-4 pb-[max(env(safe-area-inset-bottom,10px),10px)] pt-3" style={{ borderColor: 'var(--border-card)' }}>
                    {thread?.needsHuman && (
                      <div
                        className="mb-3 rounded-xl border px-3 py-2 text-xs text-[var(--text-primary)]"
                        style={{
                          borderColor: 'rgba(var(--accent-primary-rgb), 0.28)',
                          backgroundColor: 'rgba(var(--accent-primary-rgb), 0.12)',
                        }}
                      >
                        {t.humanBadge}
                      </div>
                    )}
                    <div className="flex items-end gap-2">
                      <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(event) => setInput(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' && !event.shiftKey) {
                            event.preventDefault()
                            void sendMessage()
                          }
                        }}
                        placeholder={t.inputPlaceholder}
                        rows={1}
                        className="max-h-28 min-h-[44px] flex-1 resize-none rounded-xl border px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
                        style={{
                          borderColor: 'var(--border-card)',
                          backgroundColor: 'var(--bg-secondary)',
                        }}
                      />
                      <button
                        onClick={() => void sendMessage()}
                        disabled={!input.trim() || isLoading}
                        className="flex h-11 w-11 items-center justify-center rounded-xl text-white transition-opacity disabled:opacity-40"
                        style={{ backgroundColor: 'var(--accent-primary)' }}
                        aria-label={t.send}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                          <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
