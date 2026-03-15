'use client'

import { useState } from 'react'
import { clearAccountScopedState } from '@/lib/accountScope'
import { useLocaleStore } from '@/stores/useLocaleStore'

const T = {
  deleteAccount: { ko: '계정 삭제', ja: 'アカウント削除', 'zh-TW': '刪除帳號', vi: 'Xoa tai khoan' },
  confirmText: {
    ko: '정말 삭제하시겠습니까? 모든 데이터가 영구 삭제됩니다.',
    ja: '本当に削除しますか？全てのデータが完全に削除されます。',
    'zh-TW': '確定要刪除嗎？所有資料將永久刪除。',
    vi: 'Ban co chac chan muon xoa? Tat ca du lieu se bi xoa vinh vien.',
  },
  cancel: { ko: '취소', ja: 'キャンセル', 'zh-TW': '取消', vi: 'Huy' },
  delete: { ko: '삭제', ja: '削除', 'zh-TW': '刪除', vi: 'Xoa' },
  deleting: { ko: '삭제 중...', ja: '削除中...', 'zh-TW': '刪除中...', vi: 'Dang xoa...' },
} as const

interface DeleteAccountModalProps {
  onClose: () => void
  onDeleted: () => void
}

export function DeleteAccountModal({ onClose, onDeleted }: DeleteAccountModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const locale = useLocaleStore((s) => s.locale)

  const handleDelete = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/account/delete', { method: 'DELETE' })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Failed to delete account.')
      }

      clearAccountScopedState()

      if (typeof window !== 'undefined') {
        const keysToRemove: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.startsWith('studyeng-')) {
            keysToRemove.push(key)
          }
        }
        keysToRemove.forEach((key) => localStorage.removeItem(key))
      }

      onDeleted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 pb-8 sm:items-center sm:pb-0"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-bold text-[var(--text-primary)]">{T.deleteAccount[locale]}</h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          {T.confirmText[locale]}
        </p>

        {error && (
          <p className="mt-3 rounded-xl bg-red-500/10 px-3 py-2 text-xs font-medium text-red-400">
            {error}
          </p>
        )}

        <div className="mt-5 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-2xl bg-[var(--bg-secondary)] py-3 text-sm font-medium text-[var(--text-primary)] disabled:opacity-50"
          >
            {T.cancel[locale]}
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 rounded-2xl bg-red-500 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? T.deleting[locale] : T.delete[locale]}
          </button>
        </div>
      </div>
    </div>
  )
}
