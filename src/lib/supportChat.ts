export type SupportLocale = 'ko' | 'ja' | 'zh-TW' | 'vi'
export type SupportThreadStatus = 'open' | 'waiting_admin' | 'waiting_user' | 'resolved'
export type SupportSenderRole = 'user' | 'assistant' | 'admin'

export interface SupportMessageRecord {
  id: string
  threadId: string
  senderRole: SupportSenderRole
  senderUserId: string | null
  content: string
  metadata: Record<string, unknown>
  createdAt: string
}

export interface SupportThreadRecord {
  id: string
  userId: string
  userName: string | null
  userEmail: string | null
  status: SupportThreadStatus
  needsHuman: boolean
  lastMessagePreview: string
  lastMessageAt: string
  userLastReadAt: string | null
  adminLastReadAt: string | null
  createdAt: string
  updatedAt: string
}

export interface AutomatedSupportReply {
  category: 'billing' | 'account' | 'video' | 'subtitles' | 'generic'
  reply: string
  needsHuman: boolean
}

const LOCALE_FALLBACK: SupportLocale = 'ko'

const WORKING_HOURS = {
  timeZone: 'Asia/Seoul',
  startHour: 10,
  endHour: 18,
}

function normalizeLocale(locale?: string): SupportLocale {
  if (locale === 'ja' || locale === 'zh-TW' || locale === 'vi' || locale === 'ko') {
    return locale
  }
  return LOCALE_FALLBACK
}

function getSeoulClockParts(now = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: WORKING_HOURS.timeZone,
    weekday: 'short',
    hour: '2-digit',
    hour12: false,
  })

  const parts = formatter.formatToParts(now)
  const weekday = parts.find((part) => part.type === 'weekday')?.value ?? 'Mon'
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0')
  return { weekday, hour }
}

export function isWithinSupportWorkingHours(now = new Date()) {
  const { weekday, hour } = getSeoulClockParts(now)
  const isWeekday = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(weekday)
  return isWeekday && hour >= WORKING_HOURS.startHour && hour < WORKING_HOURS.endHour
}

export function getSupportWorkingHoursLabel(locale?: string) {
  const safeLocale = normalizeLocale(locale)
  switch (safeLocale) {
    case 'ja':
      return '平日 10:00-18:00 (KST)'
    case 'zh-TW':
      return '平日 10:00-18:00（KST）'
    case 'vi':
      return 'Ngay thuong 10:00-18:00 (KST)'
    case 'ko':
    default:
      return '평일 10:00-18:00 (KST)'
  }
}

function buildGenericHumanNotice(locale?: string) {
  const label = getSupportWorkingHoursLabel(locale)
  const workingNow = isWithinSupportWorkingHours()
  const safeLocale = normalizeLocale(locale)

  if (safeLocale === 'ja') {
    return workingNow
      ? `担当者がこのチャットで順番に確認しています。必要であれば ${label} 内に返信します。`
      : `担当者の返信は ${label} に行われます。内容を残しておいてください。`
  }

  if (safeLocale === 'zh-TW') {
    return workingNow
      ? `客服會依序查看這個聊天室，必要時會在 ${label} 內回覆。`
      : `客服會在 ${label} 內回覆，請先把問題留在這個聊天室。`
  }

  if (safeLocale === 'vi') {
    return workingNow
      ? `Nhan vien se kiem tra cuoc tro chuyen nay theo thu tu va se tra loi trong ${label} neu can.`
      : `Nhan vien tra loi trong ${label}. Hay de lai noi dung tai day.`
  }

  return workingNow
    ? `담당자가 이 채팅을 순서대로 확인하고 있고, 필요하면 ${label} 안에 답변드려요.`
    : `관리자 답변은 ${label} 안에 드려요. 내용을 남겨두시면 이어서 확인할게요.`
}

function includesAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword))
}

export function getAutomatedSupportReply(message: string, locale?: string): AutomatedSupportReply {
  const safeLocale = normalizeLocale(locale)
  const normalized = message.toLowerCase()
  const humanNotice = buildGenericHumanNotice(safeLocale)

  const refundLike = includesAny(normalized, [
    'refund',
    'charge',
    'billing',
    'payment',
    'card',
    'cancel',
    '환불',
    '결제',
    '구독',
    '카드',
    '중복',
    '취소',
    '청구',
  ])

  if (refundLike) {
    if (safeLocale === 'ja') {
      return {
        category: 'billing',
        needsHuman: true,
        reply: `購読と決済は「プロフィール > 구독」から確認できます。重複請求・返金・決済失敗のような案件は担当者確認が必要なので、このチャットに残しておいてください。 ${humanNotice}`,
      }
    }

    if (safeLocale === 'zh-TW') {
      return {
        category: 'billing',
        needsHuman: true,
        reply: `訂閱與付款資訊可以在「個人檔案 > 구독」查看。若是重複扣款、退款或付款失敗，會需要人工確認，請把情況留在這個聊天室。 ${humanNotice}`,
      }
    }

    if (safeLocale === 'vi') {
      return {
        category: 'billing',
        needsHuman: true,
        reply: `Ban co the xem goi dang ky va thanh toan trong "Ho so > 구독". Neu bi trung phi, can hoan tien hoac thanh toan that bai, nhan vien se can kiem tra thu cong. ${humanNotice}`,
      }
    }

    return {
      category: 'billing',
      needsHuman: true,
      reply: `구독과 결제 정보는 프로필 > 구독에서 확인할 수 있어요. 중복 결제, 환불, 결제 실패 같은 건 담당자 확인이 필요하니 이 채팅에 남겨두시면 이어서 확인할게요. ${humanNotice}`,
    }
  }

  const accountLike = includesAny(normalized, [
    'login',
    'google',
    'kakao',
    'account',
    'delete',
    '로그인',
    '구글',
    '카카오',
    '계정',
    '탈퇴',
    '삭제',
  ])

  if (accountLike) {
    if (safeLocale === 'ko') {
      return {
        category: 'account',
        needsHuman: false,
        reply:
          '로그인 문제는 앱을 완전히 닫았다가 다시 열고, 같은 Google/Kakao 계정으로 다시 로그인해 보시면 대부분 해결돼요. 계정 삭제는 프로필 맨 아래의 "계정 삭제"에서 직접 진행할 수 있어요.',
      }
    }
  }

  const videoLike = includesAny(normalized, [
    'video',
    'youtube',
    'play',
    'load',
    'loading',
    '영상',
    '재생',
    '유튜브',
    '로딩',
    '안 나와',
    '멈춰',
  ])

  if (videoLike) {
    if (safeLocale === 'ko') {
      return {
        category: 'video',
        needsHuman: false,
        reply:
          '영상 재생 문제가 있으면 먼저 새로고침이나 앱 재실행을 해 보세요. 그래도 같은 영상에서 계속 멈추면 영상 제목이나 시리즈 이름을 같이 남겨주시면 확인하기 쉬워요.',
      }
    }
  }

  const subtitleLike = includesAny(normalized, [
    'subtitle',
    'save',
    'freeze',
    'guide',
    'caption',
    '자막',
    '저장',
    '프리즈',
    '안내',
    '가이드',
  ])

  if (subtitleLike) {
    if (safeLocale === 'ko') {
      return {
        category: 'subtitles',
        needsHuman: false,
        reply:
          '자막, 저장, freeze 같은 학습 기능은 영상 화면 안에서 바로 동작해요. 특정 영상에서만 자막이 비거나 안내가 이상하면 영상 제목을 함께 남겨주시면 이어서 확인할게요.',
      }
    }
  }

  if (safeLocale === 'ja') {
    return {
      category: 'generic',
      needsHuman: true,
      reply: `内容を確認しました。すぐ에解決できる項目でなければ担当者がこのチャットを 이어서 확인します。 ${humanNotice}`,
    }
  }

  if (safeLocale === 'zh-TW') {
    return {
      category: 'generic',
      needsHuman: true,
      reply: `已經收到你的內容。如果不是可以立刻處理的項目，客服會接著在這個聊天室查看。 ${humanNotice}`,
    }
  }

  if (safeLocale === 'vi') {
    return {
      category: 'generic',
      needsHuman: true,
      reply: `Chung toi da nhan duoc noi dung cua ban. Neu day la van de can kiem tra them, nhan vien se tiep tuc tra loi trong cuoc tro chuyen nay. ${humanNotice}`,
    }
  }

  return {
    category: 'generic',
    needsHuman: true,
    reply: `문의 내용을 받았어요. 바로 안내할 수 있는 내용이 아니면 담당자가 이 채팅에서 이어서 확인할게요. ${humanNotice}`,
  }
}
