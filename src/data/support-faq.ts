import type { SupportedLocale } from '@/stores/useLocaleStore'

export type FaqCategory = 'account' | 'subscription' | 'video' | 'app' | 'general'

export interface FaqItem {
  id: string
  category: FaqCategory
  question: Record<SupportedLocale, string>
  answer: Record<SupportedLocale, string>
}

export const FAQ_CATEGORY_LABELS: Record<FaqCategory, Record<SupportedLocale, string>> = {
  account: {
    ko: '계정',
    ja: 'アカウント',
    'zh-TW': '帳戶',
    vi: 'Tai khoan',
  },
  subscription: {
    ko: '구독',
    ja: 'サブスクリプション',
    'zh-TW': '訂閱',
    vi: 'Goi dang ky',
  },
  video: {
    ko: '영상',
    ja: '動画',
    'zh-TW': '影片',
    vi: 'Video',
  },
  app: {
    ko: '앱 사용',
    ja: 'アプリ',
    'zh-TW': '應用程式',
    vi: 'Ung dung',
  },
  general: {
    ko: '일반',
    ja: '一般',
    'zh-TW': '一般',
    vi: 'Chung',
  },
}

export const SUPPORT_PAGE_STRINGS: Record<string, Record<SupportedLocale, string>> = {
  pageTitle: {
    ko: '도움말',
    ja: 'ヘルプ',
    'zh-TW': '幫助中心',
    vi: 'Trung tam tro giup',
  },
  pageDescription: {
    ko: '자주 묻는 질문과 고객 지원',
    ja: 'よくある質問とサポート',
    'zh-TW': '常見問題與客服支援',
    vi: 'Cau hoi thuong gap va ho tro',
  },
  searchPlaceholder: {
    ko: '질문을 검색하세요',
    ja: '質問を検索',
    'zh-TW': '搜尋問題',
    vi: 'Tim kiem cau hoi',
  },
  contactUs: {
    ko: '문의하기',
    ja: 'お問い合わせ',
    'zh-TW': '聯繫我們',
    vi: 'Lien he chung toi',
  },
  contactDescription: {
    ko: '원하는 답을 찾지 못하셨나요? AI 상담 또는 이메일로 문의해 주세요.',
    ja: 'お探しの答えが見つかりませんか？AIサポートまたはメールでお問い合わせください。',
    'zh-TW': '找不到您需要的答案嗎？請透過AI客服或電子郵件聯繫我們。',
    vi: 'Khong tim thay cau tra loi? Hay lien he qua AI ho tro hoac email.',
  },
  startChat: {
    ko: 'AI 상담 시작',
    ja: 'AIサポート開始',
    'zh-TW': '開始AI客服',
    vi: 'Bat dau ho tro AI',
  },
  emailSupport: {
    ko: '이메일 문의',
    ja: 'メールで問い合わせ',
    'zh-TW': '電子郵件聯繫',
    vi: 'Lien he qua email',
  },
  allCategories: {
    ko: '전체',
    ja: 'すべて',
    'zh-TW': '全部',
    vi: 'Tat ca',
  },
  noResults: {
    ko: '검색 결과가 없습니다',
    ja: '検索結果がありません',
    'zh-TW': '沒有搜尋結果',
    vi: 'Khong co ket qua',
  },
  back: {
    ko: '뒤로',
    ja: '戻る',
    'zh-TW': '返回',
    vi: 'Quay lai',
  },
}

export const CHAT_STRINGS: Record<string, Record<SupportedLocale, string>> = {
  chatTitle: {
    ko: '고객 지원',
    ja: 'カスタマーサポート',
    'zh-TW': '客服支援',
    vi: 'Ho tro khach hang',
  },
  chatSubtitle: {
    ko: 'AI 상담',
    ja: 'AIサポート',
    'zh-TW': 'AI客服',
    vi: 'Ho tro AI',
  },
  inputPlaceholder: {
    ko: '메시지를 입력하세요...',
    ja: 'メッセージを入力...',
    'zh-TW': '輸入訊息...',
    vi: 'Nhap tin nhan...',
  },
  welcomeMessage: {
    ko: '안녕하세요! Shortee 고객 지원입니다. 무엇을 도와드릴까요?',
    ja: 'こんにちは！Shorteeカスタマーサポートです。何かお手伝いできることはありますか？',
    'zh-TW': '您好！這是Shortee客服支援。有什麼可以幫助您的嗎？',
    vi: 'Xin chao! Day la bo phan ho tro Shortee. Chung toi co the giup gi cho ban?',
  },
  sendButton: {
    ko: '전송',
    ja: '送信',
    'zh-TW': '發送',
    vi: 'Gui',
  },
  thinking: {
    ko: '답변 작성 중...',
    ja: '回答作成中...',
    'zh-TW': '正在回覆...',
    vi: 'Dang tra loi...',
  },
  humanHandoff: {
    ko: '이 문제는 담당자의 도움이 필요합니다. 아래 이메일로 문의해 주세요.',
    ja: 'この問題は担当者のサポートが必要です。下記のメールアドレスまでお問い合わせください。',
    'zh-TW': '此問題需要專人協助。請透過以下電子郵件聯繫我們。',
    vi: 'Van de nay can su ho tro cua nhan vien. Vui long lien he qua email ben duoi.',
  },
  errorMessage: {
    ko: '오류가 발생했습니다. 다시 시도해 주세요.',
    ja: 'エラーが発生しました。もう一度お試しください。',
    'zh-TW': '發生錯誤。請重試。',
    vi: 'Da xay ra loi. Vui long thu lai.',
  },
  clearChat: {
    ko: '대화 초기화',
    ja: 'チャットをクリア',
    'zh-TW': '清除對話',
    vi: 'Xoa cuoc tro chuyen',
  },
}

export const FAQ_ITEMS: FaqItem[] = [
  // === ACCOUNT (10) ===
  {
    id: 'acct-1',
    category: 'account',
    question: {
      ko: '계정을 어떻게 만드나요?',
      ja: 'アカウントの作成方法は？',
      'zh-TW': '如何建立帳戶？',
      vi: 'Lam sao de tao tai khoan?',
    },
    answer: {
      ko: '앱을 열면 Google 또는 Kakao 계정으로 간편하게 가입할 수 있습니다. 별도의 이메일 인증은 필요하지 않습니다.',
      ja: 'アプリを開くと、GoogleまたはKakaoアカウントで簡単に登録できます。メール認証は不要です。',
      'zh-TW': '打開應用程式後，您可以使用Google或Kakao帳戶輕鬆註冊。不需要電子郵件驗證。',
      vi: 'Mo ung dung va dang ky nhanh chong bang tai khoan Google hoac Kakao. Khong can xac minh email.',
    },
  },
  {
    id: 'acct-2',
    category: 'account',
    question: {
      ko: '비밀번호를 잊어버렸어요.',
      ja: 'パスワードを忘れました。',
      'zh-TW': '我忘記密碼了。',
      vi: 'Toi quen mat khau.',
    },
    answer: {
      ko: 'Shortee는 Google/Kakao 소셜 로그인만 지원합니다. 비밀번호 대신 해당 소셜 계정의 비밀번호를 재설정해 주세요.',
      ja: 'Shorteeは Google/Kakao ソーシャルログインのみ対応しています。該当するソーシャルアカウントのパスワードをリセットしてください。',
      'zh-TW': 'Shortee僅支援Google/Kakao社群登入。請重設您社群帳戶的密碼。',
      vi: 'Shortee chi ho tro dang nhap qua Google/Kakao. Vui long dat lai mat khau tai khoan xa hoi cua ban.',
    },
  },
  {
    id: 'acct-3',
    category: 'account',
    question: {
      ko: '계정을 삭제하고 싶어요.',
      ja: 'アカウントを削除したいです。',
      'zh-TW': '我想刪除帳戶。',
      vi: 'Toi muon xoa tai khoan.',
    },
    answer: {
      ko: '프로필 탭 하단의 "계정 삭제" 버튼으로 직접 삭제할 수 있습니다. 삭제 후 데이터는 복구할 수 없으니 신중하게 결정해 주세요.',
      ja: 'プロフィールタブ下部の「アカウント削除」ボタンから直接削除できます。削除後のデータ復旧はできませんのでご注意ください。',
      'zh-TW': '您可以在個人資料頁面底部點擊「刪除帳戶」按鈕。刪除後資料無法恢復，請謹慎操作。',
      vi: 'Ban co the xoa tai khoan tai nut "Xoa tai khoan" o cuoi trang ho so. Du lieu se khong the khoi phuc sau khi xoa.',
    },
  },
  {
    id: 'acct-4',
    category: 'account',
    question: {
      ko: '다른 기기에서도 사용할 수 있나요?',
      ja: '他のデバイスでも使えますか？',
      'zh-TW': '可以在其他裝置上使用嗎？',
      vi: 'Toi co the su dung tren thiet bi khac khong?',
    },
    answer: {
      ko: '네, 같은 Google/Kakao 계정으로 로그인하면 구독 상태와 학습 기록이 동기화됩니다.',
      ja: 'はい、同じGoogle/Kakaoアカウントでログインすれば、サブスクリプション状態と学習記録が同期されます。',
      'zh-TW': '是的，使用相同的Google/Kakao帳戶登入即可同步訂閱狀態和學習記錄。',
      vi: 'Co, dang nhap bang cung tai khoan Google/Kakao de dong bo trang thai dang ky va lich su hoc tap.',
    },
  },
  {
    id: 'acct-5',
    category: 'account',
    question: {
      ko: '로그인이 안 됩니다.',
      ja: 'ログインできません。',
      'zh-TW': '無法登入。',
      vi: 'Toi khong the dang nhap.',
    },
    answer: {
      ko: '앱을 완전히 종료한 뒤 다시 열어보세요. 그래도 안 되면 브라우저 캐시를 삭제하고 다시 시도해 주세요.',
      ja: 'アプリを完全に終了してから再度開いてください。それでもダメな場合は、ブラウザのキャッシュを削除してもう一度お試しください。',
      'zh-TW': '請完全關閉應用程式後重新開啟。若仍無法登入，請清除瀏覽器快取後重試。',
      vi: 'Dong hoan toan ung dung roi mo lai. Neu van khong duoc, xoa bo nho cache trinh duyet va thu lai.',
    },
  },
  {
    id: 'acct-6',
    category: 'account',
    question: {
      ko: '프로필 이름을 변경할 수 있나요?',
      ja: 'プロフィール名は変更できますか？',
      'zh-TW': '可以更改個人資料名稱嗎？',
      vi: 'Toi co the thay doi ten ho so khong?',
    },
    answer: {
      ko: '프로필 이름은 연결된 Google/Kakao 계정의 이름을 사용합니다. 해당 서비스에서 이름을 변경하면 앱에도 반영됩니다.',
      ja: 'プロフィール名は連携したGoogle/Kakaoアカウントの名前を使用します。該当サービスで名前を変更すると、アプリにも反映されます。',
      'zh-TW': '個人資料名稱使用您連結的Google/Kakao帳戶名稱。在該服務中更改名稱後，應用程式也會更新。',
      vi: 'Ten ho so su dung ten tu tai khoan Google/Kakao da lien ket. Thay doi ten tai dich vu do se tu dong cap nhat trong ung dung.',
    },
  },
  {
    id: 'acct-7',
    category: 'account',
    question: {
      ko: '학습 데이터가 초기화됐어요.',
      ja: '学習データがリセットされました。',
      'zh-TW': '學習資料被重置了。',
      vi: 'Du lieu hoc tap da bi dat lai.',
    },
    answer: {
      ko: '로그아웃하거나 브라우저 데이터를 삭제하면 기기에 저장된 학습 기록이 초기화될 수 있습니다. 동일 계정으로 다시 로그인해 보세요.',
      ja: 'ログアウトまたはブラウザデータを削除すると、端末に保存された学習記録がリセットされることがあります。同じアカウントで再ログインしてみてください。',
      'zh-TW': '登出或清除瀏覽器資料可能會重置裝置上的學習記錄。請嘗試使用同一帳戶重新登入。',
      vi: 'Dang xuat hoac xoa du lieu trinh duyet co the dat lai lich su hoc tap. Hay thu dang nhap lai bang cung tai khoan.',
    },
  },
  {
    id: 'acct-8',
    category: 'account',
    question: {
      ko: '소셜 계정을 변경할 수 있나요?',
      ja: 'ソーシャルアカウントを変更できますか？',
      'zh-TW': '可以更換社群帳戶嗎？',
      vi: 'Toi co the thay doi tai khoan xa hoi khong?',
    },
    answer: {
      ko: '현재 계정 연동 변경은 지원하지 않습니다. 기존 계정을 삭제하고 새 소셜 계정으로 가입해 주세요.',
      ja: '現在、アカウント連携の変更には対応していません。既存のアカウントを削除し、新しいソーシャルアカウントで登録してください。',
      'zh-TW': '目前不支援更換帳戶連結。請刪除現有帳戶並使用新的社群帳戶重新註冊。',
      vi: 'Hien tai khong ho tro thay doi lien ket tai khoan. Vui long xoa tai khoan cu va dang ky bang tai khoan xa hoi moi.',
    },
  },
  {
    id: 'acct-9',
    category: 'account',
    question: {
      ko: '게스트 모드로 사용할 수 있나요?',
      ja: 'ゲストモードで利用できますか？',
      'zh-TW': '可以使用訪客模式嗎？',
      vi: 'Toi co the su dung che do khach khong?',
    },
    answer: {
      ko: '로그인 없이 일부 콘텐츠를 체험할 수 있지만, 학습 기록 저장과 구독 기능은 로그인이 필요합니다.',
      ja: 'ログインなしで一部のコンテンツを体験できますが、学習記録の保存やサブスクリプション機能にはログインが必要です。',
      'zh-TW': '您可以在不登入的情況下體驗部分內容，但學習記錄保存和訂閱功能需要登入。',
      vi: 'Ban co the trai nghiem mot so noi dung ma khong can dang nhap, nhung luu lich su hoc tap va dang ky can phai dang nhap.',
    },
  },
  {
    id: 'acct-10',
    category: 'account',
    question: {
      ko: '개인정보는 어떻게 처리되나요?',
      ja: '個人情報はどのように扱われますか？',
      'zh-TW': '個人資訊如何處理？',
      vi: 'Thong tin ca nhan duoc xu ly nhu the nao?',
    },
    answer: {
      ko: '자세한 내용은 개인정보처리방침을 참조해 주세요. 프로필 하단의 "개인정보처리방침" 링크에서 확인할 수 있습니다.',
      ja: '詳細についてはプライバシーポリシーをご参照ください。プロフィール下部の「プライバシーポリシー」リンクからご確認いただけます。',
      'zh-TW': '詳細資訊請參閱隱私權政策。您可以在個人資料頁面底部的「隱私權政策」連結中查看。',
      vi: 'Vui long xem chinh sach bao mat de biet chi tiet. Ban co the tim thay lien ket o cuoi trang ho so.',
    },
  },

  // === SUBSCRIPTION (10) ===
  {
    id: 'sub-1',
    category: 'subscription',
    question: {
      ko: '무료로 사용할 수 있나요?',
      ja: '無料で利用できますか？',
      'zh-TW': '可以免費使用嗎？',
      vi: 'Co the su dung mien phi khong?',
    },
    answer: {
      ko: '하루 10개 영상까지 무료로 시청할 수 있습니다. 무제한 시청과 모든 기능을 사용하려면 PRO 구독이 필요합니다.',
      ja: '1日10本の動画まで無料で視聴できます。無制限の視聴と全機能の利用にはPROサブスクリプションが必要です。',
      'zh-TW': '每天可免費觀看10部影片。無限觀看和使用所有功能需要PRO訂閱。',
      vi: 'Ban co the xem mien phi 10 video moi ngay. Xem khong gioi han va tat ca tinh nang can dang ky PRO.',
    },
  },
  {
    id: 'sub-2',
    category: 'subscription',
    question: {
      ko: '무료 체험 기간이 있나요?',
      ja: '無料トライアル期間はありますか？',
      'zh-TW': '有免費試用期嗎？',
      vi: 'Co thoi gian dung thu mien phi khong?',
    },
    answer: {
      ko: '처음 가입하면 7일간 PRO 기능을 무료로 체험할 수 있습니다. 체험 기간이 끝나기 전에 언제든 취소할 수 있습니다.',
      ja: '初回登録時に7日間のPRO機能無料トライアルをご利用いただけます。トライアル期間終了前にいつでもキャンセルできます。',
      'zh-TW': '首次註冊可享受7天PRO功能免費試用。您可以在試用期結束前隨時取消。',
      vi: 'Dang ky lan dau duoc dung thu PRO mien phi 7 ngay. Ban co the huy bat ky luc nao truoc khi het han.',
    },
  },
  {
    id: 'sub-3',
    category: 'subscription',
    question: {
      ko: '구독을 취소하려면 어떻게 하나요?',
      ja: 'サブスクリプションのキャンセル方法は？',
      'zh-TW': '如何取消訂閱？',
      vi: 'Lam sao de huy dang ky?',
    },
    answer: {
      ko: '프로필 > 구독 관리에서 "구독 관리" 버튼을 누르면 Stripe 결제 포털에서 취소할 수 있습니다. 취소 후에도 결제 기간이 끝날 때까지 PRO 기능을 사용할 수 있습니다.',
      ja: 'プロフィール > サブスクリプション管理で「サブスクリプション管理」ボタンを押すと、Stripe決済ポータルからキャンセルできます。キャンセル後も支払い期間終了まではPRO機能をご利用いただけます。',
      'zh-TW': '在個人資料 > 訂閱管理中點擊「管理訂閱」按鈕，即可在Stripe付款入口取消。取消後仍可使用PRO功能直到付費期限結束。',
      vi: 'Vao Ho so > Quan ly dang ky, nhan "Quan ly dang ky" de huy qua cong thanh toan Stripe. Sau khi huy, ban van su dung duoc PRO cho den het ky thanh toan.',
    },
  },
  {
    id: 'sub-4',
    category: 'subscription',
    question: {
      ko: '결제 수단을 변경하고 싶어요.',
      ja: '支払い方法を変更したいです。',
      'zh-TW': '我想更改付款方式。',
      vi: 'Toi muon thay doi phuong thuc thanh toan.',
    },
    answer: {
      ko: '프로필 > 구독 관리에서 "구독 관리" 버튼을 누르면 Stripe 포털에서 결제 수단을 변경할 수 있습니다.',
      ja: 'プロフィール > サブスクリプション管理で「サブスクリプション管理」ボタンを押すと、Stripeポータルで支払い方法を変更できます。',
      'zh-TW': '在個人資料 > 訂閱管理中點擊「管理訂閱」按鈕，即可在Stripe入口更改付款方式。',
      vi: 'Vao Ho so > Quan ly dang ky, nhan "Quan ly dang ky" de thay doi phuong thuc thanh toan qua Stripe.',
    },
  },
  {
    id: 'sub-5',
    category: 'subscription',
    question: {
      ko: '환불받을 수 있나요?',
      ja: '返金は可能ですか？',
      'zh-TW': '可以退款嗎？',
      vi: 'Toi co the duoc hoan tien khong?',
    },
    answer: {
      ko: '구독 취소는 즉시 가능하지만, 이미 결제된 기간에 대한 환불은 지원하지 않습니다. 환불이 필요하시면 support@shortee.app으로 문의해 주세요.',
      ja: 'サブスクリプションの即時キャンセルは可能ですが、既に支払い済みの期間については返金に対応しておりません。返金が必要な場合はsupport@shortee.appまでお問い合わせください。',
      'zh-TW': '可以立即取消訂閱，但已支付的期間不支援退款。如需退款，請聯繫support@shortee.app。',
      vi: 'Ban co the huy dang ky ngay lap tuc, nhung khong ho tro hoan tien cho ky da thanh toan. Neu can hoan tien, vui long lien he support@shortee.app.',
    },
  },
  {
    id: 'sub-6',
    category: 'subscription',
    question: {
      ko: '구독을 복원하려면 어떻게 하나요?',
      ja: 'サブスクリプションの復元方法は？',
      'zh-TW': '如何恢復訂閱？',
      vi: 'Lam sao de khoi phuc dang ky?',
    },
    answer: {
      ko: '프로필 > 구독 관리에서 구독 상태를 동기화할 수 있습니다. 같은 계정으로 로그인하면 자동으로 구독이 복원됩니다.',
      ja: 'プロフィール > サブスクリプション管理でサブスクリプション状態を同期できます。同じアカウントでログインすると自動的に復元されます。',
      'zh-TW': '在個人資料 > 訂閱管理中可以同步訂閱狀態。使用同一帳戶登入即可自動恢復訂閱。',
      vi: 'Dong bo trang thai dang ky tai Ho so > Quan ly dang ky. Dang nhap bang cung tai khoan se tu dong khoi phuc.',
    },
  },
  {
    id: 'sub-7',
    category: 'subscription',
    question: {
      ko: 'XP 티어 할인이 뭔가요?',
      ja: 'XPティア割引とは何ですか？',
      'zh-TW': '什麼是XP等級折扣？',
      vi: 'Giam gia hang XP la gi?',
    },
    answer: {
      ko: '학습을 계속하면 XP가 쌓이고 티어가 올라갑니다. 티어에 따라 구독료 할인(최대 40%)을 받을 수 있습니다.',
      ja: '学習を続けるとXPが蓄積され、ティアが上がります。ティアに応じてサブスクリプション料金の割引（最大40%）を受けられます。',
      'zh-TW': '持續學習可累積XP並提升等級。根據等級可獲得訂閱費折扣（最高40%）。',
      vi: 'Hoc tap lien tuc de tich luy XP va nang hang. Tuy theo hang, ban co the duoc giam gia dang ky (toi da 40%).',
    },
  },
  {
    id: 'sub-8',
    category: 'subscription',
    question: {
      ko: '리딤 코드가 있어요.',
      ja: 'リディームコードがあります。',
      'zh-TW': '我有兌換碼。',
      vi: 'Toi co ma doi.',
    },
    answer: {
      ko: '프로필 > 구독 관리에서 리딤 코드를 입력할 수 있습니다. 유효한 코드를 입력하면 즉시 PRO가 활성화됩니다.',
      ja: 'プロフィール > サブスクリプション管理でリディームコードを入力できます。有効なコードを入力すると即座にPROが有効になります。',
      'zh-TW': '在個人資料 > 訂閱管理中輸入兌換碼。輸入有效代碼後PRO會立即啟用。',
      vi: 'Nhap ma doi tai Ho so > Quan ly dang ky. Nhap ma hop le se kich hoat PRO ngay lap tuc.',
    },
  },
  {
    id: 'sub-9',
    category: 'subscription',
    question: {
      ko: '결제가 실패했어요.',
      ja: '決済に失敗しました。',
      'zh-TW': '付款失敗了。',
      vi: 'Thanh toan that bai.',
    },
    answer: {
      ko: '카드 정보가 올바른지, 잔액이 충분한지 확인해 주세요. 문제가 계속되면 다른 결제 수단을 등록하거나 support@shortee.app으로 문의해 주세요.',
      ja: 'カード情報が正しいか、残高が十分かをご確認ください。問題が続く場合は、別の支払い方法を登録するか、support@shortee.appまでお問い合わせください。',
      'zh-TW': '請確認信用卡資訊是否正確以及餘額是否充足。若問題持續，請更換付款方式或聯繫support@shortee.app。',
      vi: 'Vui long kiem tra thong tin the va so du. Neu van gap loi, hay dang ky phuong thuc thanh toan khac hoac lien he support@shortee.app.',
    },
  },
  {
    id: 'sub-10',
    category: 'subscription',
    question: {
      ko: 'PRO와 무료 버전의 차이점은 뭔가요?',
      ja: 'PROと無料版の違いは何ですか？',
      'zh-TW': 'PRO和免費版有什麼區別？',
      vi: 'Su khac biet giua PRO va ban mien phi la gi?',
    },
    answer: {
      ko: '무료 버전은 하루 10개 영상 시청이 가능합니다. PRO는 무제한 시청, 모든 학습 게임, 광고 없는 환경을 제공합니다.',
      ja: '無料版は1日10本の動画視聴が可能です。PROは無制限視聴、全学習ゲーム、広告なしの環境を提供します。',
      'zh-TW': '免費版每天可觀看10部影片。PRO提供無限觀看、所有學習遊戲和無廣告體驗。',
      vi: 'Ban mien phi xem duoc 10 video/ngay. PRO cung cap xem khong gioi han, tat ca tro choi hoc tap va khong quang cao.',
    },
  },

  // === VIDEO (10) ===
  {
    id: 'vid-1',
    category: 'video',
    question: {
      ko: '영상이 재생되지 않아요.',
      ja: '動画が再生されません。',
      'zh-TW': '影片無法播放。',
      vi: 'Video khong phat duoc.',
    },
    answer: {
      ko: '인터넷 연결을 확인하고, 앱을 새로고침해 보세요. YouTube가 차단된 환경에서는 영상이 재생되지 않을 수 있습니다.',
      ja: 'インターネット接続を確認し、アプリをリロードしてみてください。YouTubeがブロックされている環境では動画が再生されない場合があります。',
      'zh-TW': '請確認網路連線並重新整理應用程式。在封鎖YouTube的環境中，影片可能無法播放。',
      vi: 'Kiem tra ket noi mang va tai lai ung dung. Video co the khong phat duoc trong moi truong chan YouTube.',
    },
  },
  {
    id: 'vid-2',
    category: 'video',
    question: {
      ko: '자막이 안 보여요.',
      ja: '字幕が表示されません。',
      'zh-TW': '看不到字幕。',
      vi: 'Khong thay phu de.',
    },
    answer: {
      ko: '일부 영상은 자막이 준비 중일 수 있습니다. 설정에서 "안내" 옵션이 켜져 있는지 확인해 주세요.',
      ja: '一部の動画は字幕が準備中の場合があります。設定で「ガイド」オプションがオンになっているか確認してください。',
      'zh-TW': '部分影片的字幕可能仍在準備中。請確認設定中的「指南」選項是否已開啟。',
      vi: 'Mot so video co the dang chuan bi phu de. Hay kiem tra tuy chon "Huong dan" trong cai dat da bat chua.',
    },
  },
  {
    id: 'vid-3',
    category: 'video',
    question: {
      ko: '자막 번역이 이상해요.',
      ja: '字幕の翻訳がおかしいです。',
      'zh-TW': '字幕翻譯有誤。',
      vi: 'Ban dich phu de khong chinh xac.',
    },
    answer: {
      ko: '번역 품질 개선을 위해 지속적으로 업데이트하고 있습니다. 오역을 발견하면 support@shortee.app으로 알려주세요.',
      ja: '翻訳品質の向上のため、継続的に更新しています。誤訳を発見した場合はsupport@shortee.appまでお知らせください。',
      'zh-TW': '我們持續更新以提升翻譯品質。如發現翻譯錯誤，請告知support@shortee.app。',
      vi: 'Chung toi lien tuc cap nhat de nang cao chat luong dich. Neu phat hien loi dich, vui long bao cho support@shortee.app.',
    },
  },
  {
    id: 'vid-4',
    category: 'video',
    question: {
      ko: '특정 영상이 삭제됐어요.',
      ja: '特定の動画が削除されました。',
      'zh-TW': '某個影片被刪除了。',
      vi: 'Mot video cu the da bi xoa.',
    },
    answer: {
      ko: '원본 YouTube 영상이 삭제되거나 비공개로 전환되면 Shortee에서도 시청할 수 없게 됩니다. 비슷한 다른 콘텐츠를 추천해 드립니다.',
      ja: '元のYouTube動画が削除または非公開になると、Shorteeでも視聴できなくなります。類似のコンテンツをおすすめします。',
      'zh-TW': '原始YouTube影片被刪除或設為私人後，在Shortee中也無法觀看。我們會推薦類似的內容。',
      vi: 'Khi video YouTube goc bi xoa hoac an, ban se khong the xem tren Shortee. Chung toi se goi y noi dung tuong tu.',
    },
  },
  {
    id: 'vid-5',
    category: 'video',
    question: {
      ko: '영상 소리가 안 나와요.',
      ja: '動画の音声が出ません。',
      'zh-TW': '影片沒有聲音。',
      vi: 'Video khong co am thanh.',
    },
    answer: {
      ko: '기기의 음량과 무음 모드를 확인해 주세요. 블루투스 기기가 연결되어 있다면 해제 후 다시 시도해 보세요.',
      ja: '端末の音量とマナーモードを確認してください。Bluetoothデバイスが接続されている場合は解除してから再試行してください。',
      'zh-TW': '請確認裝置音量和靜音模式。如有連接藍牙裝置，請中斷連線後重試。',
      vi: 'Kiem tra am luong va che do im lang cua thiet bi. Neu dang ket noi Bluetooth, hay ngat ket noi va thu lai.',
    },
  },
  {
    id: 'vid-6',
    category: 'video',
    question: {
      ko: '영상이 버퍼링됩니다.',
      ja: '動画がバッファリングされます。',
      'zh-TW': '影片一直在緩衝。',
      vi: 'Video bi gian doan lien tuc.',
    },
    answer: {
      ko: '네트워크 속도가 느리면 버퍼링이 발생할 수 있습니다. Wi-Fi 환경에서 시청하시는 것을 권장합니다.',
      ja: 'ネットワーク速度が遅いとバッファリングが発生する可能性があります。Wi-Fi環境での視聴をおすすめします。',
      'zh-TW': '網路速度慢可能導致緩衝。建議在Wi-Fi環境下觀看。',
      vi: 'Toc do mang cham co the gay gian doan. Khuyen nghi xem trong moi truong Wi-Fi.',
    },
  },
  {
    id: 'vid-7',
    category: 'video',
    question: {
      ko: '난이도를 변경할 수 있나요?',
      ja: '難易度を変更できますか？',
      'zh-TW': '可以更改難度嗎？',
      vi: 'Toi co the thay doi do kho khong?',
    },
    answer: {
      ko: 'My 탭의 Stats 페이지에서 학습 레벨을 변경할 수 있습니다. 낮은 레벨은 즉시 변경되고, 높은 레벨은 레벨 챌린지를 통과해야 합니다.',
      ja: 'Myタブの統計ページで学習レベルを変更できます。低いレベルは即座に変更でき、高いレベルはレベルチャレンジに合格する必要があります。',
      'zh-TW': '在My頁面的統計頁面中可以更改學習等級。降低等級可立即更改，提高等級需要通過等級挑戰。',
      vi: 'Thay doi cap do hoc tap tai trang Thong ke trong tab My. Giam cap tuc thi, tang cap can vuot qua thu thach.',
    },
  },
  {
    id: 'vid-8',
    category: 'video',
    question: {
      ko: '쇼츠와 시리즈의 차이가 뭔가요?',
      ja: 'ショートとシリーズの違いは何ですか？',
      'zh-TW': 'Shorts和系列有什麼區別？',
      vi: 'Su khac biet giua Shorts va Series la gi?',
    },
    answer: {
      ko: '쇼츠는 1분 내외의 짧은 영상이고, 시리즈는 주제별로 구성된 긴 영상 모음입니다. 세로 스와이프로 쇼츠를, 탐색 탭에서 시리즈를 볼 수 있습니다.',
      ja: 'ショートは1分程度の短い動画で、シリーズはテーマ別に構成された長い動画コレクションです。縦スワイプでショートを、探索タブでシリーズを見ることができます。',
      'zh-TW': 'Shorts是約1分鐘的短影片，系列是按主題組織的長影片合集。垂直滑動觀看Shorts，在探索頁面觀看系列。',
      vi: 'Shorts la video ngan khoang 1 phut, Series la bo suu tap video dai theo chu de. Vuot doc de xem Shorts, vao tab Kham pha de xem Series.',
    },
  },
  {
    id: 'vid-9',
    category: 'video',
    question: {
      ko: '영상을 저장할 수 있나요?',
      ja: '動画を保存できますか？',
      'zh-TW': '可以儲存影片嗎？',
      vi: 'Toi co the luu video khong?',
    },
    answer: {
      ko: '영상을 오프라인으로 다운로드하는 기능은 없지만, 좋아하는 영상을 좋아요/저장하면 나중에 My 탭에서 다시 찾을 수 있습니다.',
      ja: '動画をオフラインでダウンロードする機能はありませんが、お気に入りの動画にいいね/保存すると、後でMyタブから再度見つけることができます。',
      'zh-TW': '沒有離線下載影片的功能，但您可以按讚/儲存喜歡的影片，之後在My頁面中找到它們。',
      vi: 'Khong co tinh nang tai video xem ngoai tuyen, nhung ban co the thich/luu video yeu thich de tim lai trong tab My.',
    },
  },
  {
    id: 'vid-10',
    category: 'video',
    question: {
      ko: '추천 영상은 어떻게 결정되나요?',
      ja: 'おすすめ動画はどのように決まりますか？',
      'zh-TW': '推薦影片是如何決定的？',
      vi: 'Video goi y duoc quyet dinh nhu the nao?',
    },
    answer: {
      ko: '학습 레벨, 시청 기록, 관심 카테고리를 기반으로 개인화된 추천을 제공합니다.',
      ja: '学習レベル、視聴履歴、関心カテゴリに基づいてパーソナライズされたおすすめを提供します。',
      'zh-TW': '根據您的學習等級、觀看記錄和興趣類別提供個人化推薦。',
      vi: 'De xuat ca nhan hoa dua tren cap do hoc tap, lich su xem va danh muc quan tam cua ban.',
    },
  },

  // === APP (10) ===
  {
    id: 'app-1',
    category: 'app',
    question: {
      ko: '앱이 느려요.',
      ja: 'アプリが遅いです。',
      'zh-TW': '應用程式很慢。',
      vi: 'Ung dung chay cham.',
    },
    answer: {
      ko: '브라우저 캐시를 삭제하고 앱을 새로고침해 보세요. 다른 탭이나 앱을 닫아 기기 메모리를 확보하면 도움이 됩니다.',
      ja: 'ブラウザのキャッシュを削除し、アプリをリロードしてください。他のタブやアプリを閉じて端末のメモリを確保すると改善されます。',
      'zh-TW': '請清除瀏覽器快取並重新整理應用程式。關閉其他分頁或應用程式以釋放裝置記憶體可能有幫助。',
      vi: 'Xoa cache trinh duyet va tai lai ung dung. Dong cac tab hoac ung dung khac de giai phong bo nho thiet bi.',
    },
  },
  {
    id: 'app-2',
    category: 'app',
    question: {
      ko: '게임 모드가 뭔가요?',
      ja: 'ゲームモードとは何ですか？',
      'zh-TW': '什麼是遊戲模式？',
      vi: 'Che do game la gi?',
    },
    answer: {
      ko: '영상 시청 중 표현과 단어를 자연스럽게 학습할 수 있는 미니 게임이 등장합니다. 설정에서 켜고 끌 수 있습니다.',
      ja: '動画視聴中に表現や単語を自然に学べるミニゲームが表示されます。設定でオン・オフを切り替えられます。',
      'zh-TW': '觀看影片時會出現迷你遊戲，讓您自然地學習表達和單字。可以在設定中開關。',
      vi: 'Mini game se xuat hien khi xem video, giup ban hoc tu vung va cach dien dat tu nhien. Co the bat/tat trong cai dat.',
    },
  },
  {
    id: 'app-3',
    category: 'app',
    question: {
      ko: '알림이 오지 않아요.',
      ja: '通知が届きません。',
      'zh-TW': '收不到通知。',
      vi: 'Toi khong nhan duoc thong bao.',
    },
    answer: {
      ko: '프로필 설정에서 알림이 켜져 있는지 확인해 주세요. 브라우저 알림 권한도 허용되어 있어야 합니다.',
      ja: 'プロフィール設定で通知がオンになっているか確認してください。ブラウザの通知許可も有効にする必要があります。',
      'zh-TW': '請確認個人資料設定中的通知是否已開啟。瀏覽器通知權限也需要允許。',
      vi: 'Kiem tra thong bao da bat trong cai dat ho so chua. Quyen thong bao trinh duyet cung can duoc cho phep.',
    },
  },
  {
    id: 'app-4',
    category: 'app',
    question: {
      ko: '스트릭이 초기화됐어요.',
      ja: 'ストリークがリセットされました。',
      'zh-TW': '連續天數被重置了。',
      vi: 'Chuoi ngay lien tiep da bi dat lai.',
    },
    answer: {
      ko: '하루라도 학습을 하지 않으면 스트릭이 초기화됩니다. 매일 최소 1개 영상을 시청하거나 게임을 완료하면 유지됩니다.',
      ja: '1日でも学習しないとストリークがリセットされます。毎日最低1本の動画を視聴するかゲームを完了すれば維持されます。',
      'zh-TW': '即使只有一天沒有學習，連續天數也會被重置。每天至少觀看1部影片或完成遊戲即可維持。',
      vi: 'Neu mot ngay khong hoc, chuoi ngay se bi dat lai. Xem it nhat 1 video hoac hoan thanh game moi ngay de duy tri.',
    },
  },
  {
    id: 'app-5',
    category: 'app',
    question: {
      ko: '다크/라이트 모드를 바꿀 수 있나요?',
      ja: 'ダーク/ライトモードの切り替えは？',
      'zh-TW': '可以切換深色/淺色模式嗎？',
      vi: 'Co the chuyen doi che do toi/sang khong?',
    },
    answer: {
      ko: '프로필 설정의 테마 섹션에서 배경(다크/라이트)과 색상 테마를 선택할 수 있습니다.',
      ja: 'プロフィール設定のテーマセクションで背景（ダーク/ライト）とカラーテーマを選択できます。',
      'zh-TW': '在個人資料設定的主題區域中可以選擇背景（深色/淺色）和色彩主題。',
      vi: 'Chon nen (toi/sang) va chu de mau tai phan Giao dien trong cai dat ho so.',
    },
  },
  {
    id: 'app-6',
    category: 'app',
    question: {
      ko: '진동을 끌 수 있나요?',
      ja: 'バイブレーションをオフにできますか？',
      'zh-TW': '可以關閉震動嗎？',
      vi: 'Co the tat rung khong?',
    },
    answer: {
      ko: '프로필 설정에서 "진동" 옵션을 끄면 됩니다.',
      ja: 'プロフィール設定で「バイブレーション」オプションをオフにしてください。',
      'zh-TW': '在個人資料設定中關閉「震動」選項即可。',
      vi: 'Tat tuy chon "Rung" trong cai dat ho so.',
    },
  },
  {
    id: 'app-7',
    category: 'app',
    question: {
      ko: '오프라인에서 사용할 수 있나요?',
      ja: 'オフラインで使えますか？',
      'zh-TW': '可以離線使用嗎？',
      vi: 'Co the su dung ngoai tuyen khong?',
    },
    answer: {
      ko: 'Shortee는 인터넷 연결이 필요합니다. 영상 재생과 학습 게임 모두 온라인 환경에서 사용할 수 있습니다.',
      ja: 'Shorteeにはインターネット接続が必要です。動画再生と学習ゲームはすべてオンライン環境で利用できます。',
      'zh-TW': 'Shortee需要網路連線。影片播放和學習遊戲都需要在線上環境中使用。',
      vi: 'Shortee can ket noi internet. Phat video va tro choi hoc tap deu can moi truong truc tuyen.',
    },
  },
  {
    id: 'app-8',
    category: 'app',
    question: {
      ko: '앱이 갑자기 꺼져요.',
      ja: 'アプリが突然終了します。',
      'zh-TW': '應用程式突然關閉。',
      vi: 'Ung dung dot ngot dong.',
    },
    answer: {
      ko: '브라우저나 기기를 최신 버전으로 업데이트해 주세요. 문제가 지속되면 브라우저 캐시를 삭제하고 다시 시도해 주세요.',
      ja: 'ブラウザや端末を最新バージョンに更新してください。問題が続く場合はブラウザのキャッシュを削除して再試行してください。',
      'zh-TW': '請將瀏覽器或裝置更新至最新版本。若問題持續，請清除瀏覽器快取後重試。',
      vi: 'Cap nhat trinh duyet hoac thiet bi len phien ban moi nhat. Neu van gap loi, xoa cache trinh duyet va thu lai.',
    },
  },
  {
    id: 'app-9',
    category: 'app',
    question: {
      ko: 'Key Picks가 뭔가요?',
      ja: 'Key Picksとは何ですか？',
      'zh-TW': '什麼是Key Picks？',
      vi: 'Key Picks la gi?',
    },
    answer: {
      ko: '영상에서 학습할 만한 핵심 표현과 단어를 자동으로 선별한 것입니다. 레벨에 맞는 표현을 우선 보여줍니다.',
      ja: '動画から学ぶべき重要な表現や単語を自動的に選別したものです。レベルに合った表現を優先的に表示します。',
      'zh-TW': '從影片中自動篩選出值得學習的關鍵表達和單字。優先顯示符合您等級的表達。',
      vi: 'Tu dong chon loc cac cach dien dat va tu vung quan trong tu video. Uu tien hien thi theo cap do cua ban.',
    },
  },
  {
    id: 'app-10',
    category: 'app',
    question: {
      ko: '어떤 브라우저를 지원하나요?',
      ja: 'どのブラウザに対応していますか？',
      'zh-TW': '支援哪些瀏覽器？',
      vi: 'Ho tro nhung trinh duyet nao?',
    },
    answer: {
      ko: 'Chrome, Safari, Edge, Firefox 최신 버전을 지원합니다. 최상의 경험을 위해 Chrome이나 Safari 최신 버전을 권장합니다.',
      ja: 'Chrome、Safari、Edge、Firefoxの最新バージョンに対応しています。最良の体験のためにChromeまたはSafariの最新バージョンをおすすめします。',
      'zh-TW': '支援Chrome、Safari、Edge、Firefox的最新版本。為獲得最佳體驗，建議使用Chrome或Safari最新版本。',
      vi: 'Ho tro Chrome, Safari, Edge, Firefox phien ban moi nhat. Khuyen nghi dung Chrome hoac Safari moi nhat de co trai nghiem tot nhat.',
    },
  },

  // === GENERAL (10) ===
  {
    id: 'gen-1',
    category: 'general',
    question: {
      ko: 'Shortee는 어떤 앱인가요?',
      ja: 'Shorteeはどんなアプリですか？',
      'zh-TW': 'Shortee是什麼應用程式？',
      vi: 'Shortee la ung dung gi?',
    },
    answer: {
      ko: 'Shortee는 YouTube 쇼츠와 시리즈 영상으로 영어를 자연스럽게 배우는 앱입니다. 공부가 아니라 재미있게 학습할 수 있습니다.',
      ja: 'ShorteeはYouTubeショートやシリーズ動画で英語を自然に学べるアプリです。勉強ではなく楽しく学習できます。',
      'zh-TW': 'Shortee是一款透過YouTube Shorts和系列影片自然學習英語的應用程式。不是死讀書，而是趣味學習。',
      vi: 'Shortee la ung dung hoc tieng Anh tu nhien qua YouTube Shorts va video theo series. Hoc vui, khong ap luc.',
    },
  },
  {
    id: 'gen-2',
    category: 'general',
    question: {
      ko: '어떤 레벨이 적합한가요?',
      ja: '自分に合ったレベルは？',
      'zh-TW': '哪個等級適合我？',
      vi: 'Cap do nao phu hop voi toi?',
    },
    answer: {
      ko: '처음 가입할 때 온보딩에서 레벨을 선택할 수 있습니다. A1(입문)부터 C2(최상급)까지 6단계가 있으며, 언제든 변경할 수 있습니다.',
      ja: '初回登録時のオンボーディングでレベルを選択できます。A1（入門）からC2（最上級）まで6段階があり、いつでも変更できます。',
      'zh-TW': '首次註冊時可在引導流程中選擇等級。從A1（入門）到C2（最高級）共6個等級，隨時可以更改。',
      vi: 'Chon cap do khi dang ky lan dau. Co 6 cap tu A1 (so cap) den C2 (cao cap nhat), co the thay doi bat ky luc nao.',
    },
  },
  {
    id: 'gen-3',
    category: 'general',
    question: {
      ko: '콘텐츠는 얼마나 자주 업데이트되나요?',
      ja: 'コンテンツはどのくらいの頻度で更新されますか？',
      'zh-TW': '內容多久更新一次？',
      vi: 'Noi dung duoc cap nhat thuong xuyen nhu the nao?',
    },
    answer: {
      ko: '새로운 영상과 시리즈가 정기적으로 추가됩니다. 현재 3,000개 이상의 영상과 200개 이상의 시리즈가 준비되어 있습니다.',
      ja: '新しい動画やシリーズが定期的に追加されます。現在3,000本以上の動画と200以上のシリーズが用意されています。',
      'zh-TW': '定期添加新影片和系列。目前已有超過3,000部影片和200多個系列。',
      vi: 'Video va series moi duoc them dinh ky. Hien co hon 3.000 video va 200 series.',
    },
  },
  {
    id: 'gen-4',
    category: 'general',
    question: {
      ko: '학습 진도는 어디서 확인하나요?',
      ja: '学習進捗はどこで確認できますか？',
      'zh-TW': '在哪裡查看學習進度？',
      vi: 'Xem tien do hoc tap o dau?',
    },
    answer: {
      ko: 'My 탭에서 오늘의 대시보드, 통계, XP 정보를 확인할 수 있습니다. 시청 기록과 저장한 표현도 여기서 관리합니다.',
      ja: 'Myタブで今日のダッシュボード、統計、XP情報を確認できます。視聴履歴や保存した表現もここで管理します。',
      'zh-TW': '在My頁面可查看今日儀表板、統計和XP資訊。觀看記錄和已儲存的表達也在這裡管理。',
      vi: 'Xem bang dieu khien hom nay, thong ke va thong tin XP tai tab My. Lich su xem va cach dien dat da luu cung duoc quan ly tai day.',
    },
  },
  {
    id: 'gen-5',
    category: 'general',
    question: {
      ko: '표현 사전은 어떻게 사용하나요?',
      ja: '表現辞書の使い方は？',
      'zh-TW': '如何使用表達詞典？',
      vi: 'Su dung tu dien cach dien dat nhu the nao?',
    },
    answer: {
      ko: '영상 시청 중 나타나는 표현을 탭하면 뜻과 예문을 볼 수 있습니다. 저장하면 나중에 게임으로 복습할 수 있습니다.',
      ja: '動画視聴中に表示される表現をタップすると意味と例文を見ることができます。保存すると後でゲームで復習できます。',
      'zh-TW': '觀看影片時點擊出現的表達即可查看含義和例句。儲存後可在之後透過遊戲複習。',
      vi: 'Nhan vao cach dien dat xuat hien khi xem video de xem nghia va vi du. Luu lai de on tap qua game sau.',
    },
  },
  {
    id: 'gen-6',
    category: 'general',
    question: {
      ko: '카테고리에는 어떤 것들이 있나요?',
      ja: 'カテゴリにはどんなものがありますか？',
      'zh-TW': '有哪些類別？',
      vi: 'Co nhung danh muc nao?',
    },
    answer: {
      ko: 'Daily, Movie, Entertainment, Drama, Animation, Music 6개 카테고리가 있습니다. 관심 분야의 영상으로 학습할 수 있습니다.',
      ja: 'Daily、Movie、Entertainment、Drama、Animation、Musicの6カテゴリがあります。興味のある分野の動画で学習できます。',
      'zh-TW': '共有Daily、Movie、Entertainment、Drama、Animation、Music 6個類別。您可以用感興趣的領域的影片來學習。',
      vi: 'Co 6 danh muc: Daily, Movie, Entertainment, Drama, Animation, Music. Hoc tu video trong linh vuc ban quan tam.',
    },
  },
  {
    id: 'gen-7',
    category: 'general',
    question: {
      ko: '문의는 어디로 보내나요?',
      ja: 'お問い合わせはどこに送ればいいですか？',
      'zh-TW': '在哪裡發送諮詢？',
      vi: 'Gui yeu cau ho tro o dau?',
    },
    answer: {
      ko: 'support@shortee.app으로 이메일을 보내주시거나, 이 페이지의 AI 상담을 이용해 주세요.',
      ja: 'support@shortee.appにメールを送るか、このページのAIサポートをご利用ください。',
      'zh-TW': '請發送電子郵件至support@shortee.app，或使用本頁面的AI客服。',
      vi: 'Gui email den support@shortee.app hoac su dung AI ho tro tren trang nay.',
    },
  },
  {
    id: 'gen-8',
    category: 'general',
    question: {
      ko: '앱을 홈 화면에 추가할 수 있나요?',
      ja: 'アプリをホーム画面に追加できますか？',
      'zh-TW': '可以將應用程式加到主畫面嗎？',
      vi: 'Co the them ung dung vao man hinh chinh khong?',
    },
    answer: {
      ko: '모바일 브라우저에서 "홈 화면에 추가" 기능을 사용하면 앱처럼 바로 실행할 수 있습니다.',
      ja: 'モバイルブラウザの「ホーム画面に追加」機能を使うと、アプリのように直接起動できます。',
      'zh-TW': '使用行動瀏覽器的「加到主畫面」功能，即可像應用程式一樣直接啟動。',
      vi: 'Su dung tinh nang "Them vao man hinh chinh" tren trinh duyet di dong de mo nhanh nhu ung dung.',
    },
  },
  {
    id: 'gen-9',
    category: 'general',
    question: {
      ko: '어떤 종류의 영어를 배울 수 있나요?',
      ja: 'どんな種類の英語が学べますか？',
      'zh-TW': '可以學習什麼類型的英語？',
      vi: 'Co the hoc loai tieng Anh nao?',
    },
    answer: {
      ko: '일상 회화, 영화/드라마 대사, 엔터테인먼트 토크, 애니메이션 등 다양한 실생활 영어를 학습할 수 있습니다.',
      ja: '日常会話、映画/ドラマのセリフ、エンターテインメントトーク、アニメーションなど、様々な実生活の英語を学べます。',
      'zh-TW': '可以學習日常對話、電影/戲劇台詞、娛樂脫口秀、動畫等各種實用英語。',
      vi: 'Hoc tieng Anh thuc te tu hoi thoai hang ngay, loi thoai phim/drama, talk show giai tri, hoat hinh va nhieu hon nua.',
    },
  },
  {
    id: 'gen-10',
    category: 'general',
    question: {
      ko: 'XP는 어떻게 쌓이나요?',
      ja: 'XPはどのように貯まりますか？',
      'zh-TW': 'XP如何累積？',
      vi: 'XP duoc tich luy nhu the nao?',
    },
    answer: {
      ko: '게임 완료(12~15 XP), 영상 시청(3 XP), 스트릭 보너스(2~20 XP)로 쌓입니다. 하루 게임 XP 상한은 40입니다.',
      ja: 'ゲーム完了（12〜15 XP）、動画視聴（3 XP）、ストリークボーナス（2〜20 XP）で貯まります。1日のゲームXP上限は40です。',
      'zh-TW': '透過完成遊戲（12-15 XP）、觀看影片（3 XP）、連續天數獎勵（2-20 XP）來累積。每日遊戲XP上限為40。',
      vi: 'Tich luy qua hoan thanh game (12-15 XP), xem video (3 XP), thuong chuoi ngay (2-20 XP). Gioi han XP game moi ngay la 40.',
    },
  },
]
