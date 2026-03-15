/**
 * Inline translations for error/billing pages.
 *
 * These pages include error boundaries ('use client') and server components.
 * We read the persisted Zustand locale from localStorage synchronously
 * so no React hooks are needed.
 */

import type { SupportedLocale } from '@/stores/useLocaleStore'

// ---------------------------------------------------------------------------
// Locale detection (client-side, no hooks needed)
// ---------------------------------------------------------------------------

export function getPersistedLocale(): SupportedLocale {
  if (typeof window === 'undefined') return 'ko'
  try {
    const raw = localStorage.getItem('studyeng-locale')
    if (!raw) return 'ko'
    const parsed = JSON.parse(raw) as { state?: { locale?: string } }
    const locale = parsed?.state?.locale
    const valid: SupportedLocale[] = ['ko', 'ja', 'zh-TW', 'vi']
    if (locale && valid.includes(locale as SupportedLocale)) {
      return locale as SupportedLocale
    }
  } catch {
    // ignore parse errors
  }
  return 'ko'
}

// ---------------------------------------------------------------------------
// Translation maps
// ---------------------------------------------------------------------------

type T = Record<SupportedLocale, string>

export const ERROR_STRINGS = {
  title: {
    ko: '문제가 발생했어요',
    ja: '問題が発生しました',
    'zh-TW': '發生了問題',
    vi: 'Đã xảy ra lỗi',
  } satisfies T,
  description: {
    ko: '일시적인 오류가 발생했습니다',
    ja: '一時的なエラーが発生しました',
    'zh-TW': '發生了暫時性的錯誤',
    vi: 'Đã xảy ra lỗi tạm thời',
  } satisfies T,
  retry: {
    ko: '다시 시도',
    ja: '再試行',
    'zh-TW': '重試',
    vi: 'Thử lại',
  } satisfies T,
  home: {
    ko: '홈으로',
    ja: 'ホームへ',
    'zh-TW': '回首頁',
    vi: 'Về trang chủ',
  } satisfies T,
}

export const AUTH_ERROR_STRINGS = {
  title: {
    ko: '로그인에 실패했어요',
    ja: 'ログインに失敗しました',
    'zh-TW': '登入失敗',
    vi: 'Đăng nhập thất bại',
  } satisfies T,
  description: {
    ko: '인증 과정에서 문제가 발생했습니다',
    ja: '認証中に問題が発生しました',
    'zh-TW': '驗證過程中發生了問題',
    vi: 'Đã xảy ra lỗi trong quá trình xác thực',
  } satisfies T,
  retry: ERROR_STRINGS.retry,
}

export const NOT_FOUND_STRINGS = {
  message: {
    ko: '페이지를 찾을 수 없습니다',
    ja: 'ページが見つかりません',
    'zh-TW': '找不到頁面',
    vi: 'Không tìm thấy trang',
  } satisfies T,
  goHome: {
    ko: '홈으로 돌아가기',
    ja: 'ホームに戻る',
    'zh-TW': '返回首頁',
    vi: 'Quay về trang chủ',
  } satisfies T,
}

export const BILLING_CANCEL_STRINGS = {
  title: {
    ko: '결제가 취소되었습니다',
    ja: '決済がキャンセルされました',
    'zh-TW': '付款已取消',
    vi: 'Thanh toán đã bị hủy',
  } satisfies T,
  description: {
    ko: '다시 살펴본 뒤 원할 때 언제든 구독을 시작할 수 있습니다.',
    ja: 'もう一度ご検討いただき、いつでもサブスクリプションを開始できます。',
    'zh-TW': '您可以再考慮一下，隨時開始訂閱。',
    vi: 'Bạn có thể xem lại và bắt đầu đăng ký bất cứ lúc nào.',
  } satisfies T,
  goBack: {
    ko: '돌아가기',
    ja: '戻る',
    'zh-TW': '返回',
    vi: 'Quay lại',
  } satisfies T,
  continueWatching: {
    ko: '계속 보기',
    ja: '視聴を続ける',
    'zh-TW': '繼續觀看',
    vi: 'Tiếp tục xem',
  } satisfies T,
}

export const BILLING_SUCCESS_STRINGS = {
  titleSyncing: {
    ko: '구독을 확인하고 있습니다',
    ja: 'サブスクリプションを確認しています',
    'zh-TW': '正在確認訂閱',
    vi: 'Đang xác nhận đăng ký',
  } satisfies T,
  titleError: {
    ko: '결제 확인이 지연되고 있습니다',
    ja: '決済の確認が遅れています',
    'zh-TW': '付款確認延遲中',
    vi: 'Xác nhận thanh toán đang bị chậm trễ',
  } satisfies T,
  descSyncing: {
    ko: '결제 완료 후 프리미엄 권한을 계정에 반영하는 중입니다.',
    ja: '決済完了後、プレミアム権限をアカウントに反映しています。',
    'zh-TW': '付款完成後，正在將高級權限套用至您的帳戶。',
    vi: 'Đang cập nhật quyền premium vào tài khoản sau khi thanh toán.',
  } satisfies T,
  descDone: {
    ko: '프리미엄 권한 반영이 끝났습니다. 잠시 후 프로필로 이동합니다.',
    ja: 'プレミアム権限の反映が完了しました。まもなくプロフィールに移動します。',
    'zh-TW': '高級權限已套用完成。即將跳轉至個人資料頁面。',
    vi: 'Quyền premium đã được cập nhật. Sẽ chuyển đến trang cá nhân.',
  } satisfies T,
  descError: {
    ko: '권한 반영이 늦어질 수 있습니다. 잠시 후 프로필에서 상태를 다시 확인해 주세요.',
    ja: '権限の反映が遅れる場合があります。しばらく後にプロフィールで状態をご確認ください。',
    'zh-TW': '權限套用可能會延遲。請稍後在個人資料中確認狀態。',
    vi: 'Việc cập nhật quyền có thể bị chậm. Vui lòng kiểm tra lại trạng thái trong trang cá nhân.',
  } satisfies T,
  goToProfile: {
    ko: '프로필로 이동',
    ja: 'プロフィールへ',
    'zh-TW': '前往個人資料',
    vi: 'Đi đến trang cá nhân',
  } satisfies T,
  fallbackTitle: {
    ko: '구독 상태를 확인하는 중입니다',
    ja: 'サブスクリプション状態を確認中です',
    'zh-TW': '正在確認訂閱狀態',
    vi: 'Đang kiểm tra trạng thái đăng ký',
  } satisfies T,
}

export const MEMBERSHIP_STRINGS = {
  label: {
    ko: '구독',
    ja: 'サブスクリプション',
    'zh-TW': '訂閱',
    vi: 'Đăng ký',
  } satisfies T,
}
