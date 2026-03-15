import type { SupportedLocale } from '@/stores/useLocaleStore'

/**
 * UI string translations for the explore/home pages.
 * Each key maps to translations in ko, ja, zh-TW, vi.
 */
const translations = {
  recommended: {
    ko: '추천 영상',
    ja: 'おすすめ',
    'zh-TW': '推薦影片',
    vi: 'Đề xuất',
  },
  recommendedBadge: {
    ko: '추천',
    ja: 'おすすめ',
    'zh-TW': '推薦',
    vi: 'Đề xuất',
  },
  continueWatching: {
    ko: '이어보는 시리즈',
    ja: '視聴中のシリーズ',
    'zh-TW': '繼續觀看',
    vi: 'Tiếp tục xem',
  },
  shorts: {
    ko: '쇼츠',
    ja: 'ショート',
    'zh-TW': '短片',
    vi: 'Shorts',
  },
  series: {
    ko: '시리즈',
    ja: 'シリーズ',
    'zh-TW': '系列',
    vi: 'Series',
  },
  watchNow: {
    ko: '바로 보기',
    ja: '今すぐ見る',
    'zh-TW': '立即觀看',
    vi: 'Xem ngay',
  },
  viewSeries: {
    ko: '시리즈 보기',
    ja: 'シリーズを見る',
    'zh-TW': '查看系列',
    vi: 'Xem series',
  },
  seeAll: {
    ko: '상세보기',
    ja: '詳細',
    'zh-TW': '查看更多',
    vi: 'Xem thêm',
  },
  all: {
    ko: '전체',
    ja: 'すべて',
    'zh-TW': '全部',
    vi: 'Tất cả',
  },
  progress: {
    ko: '진행률',
    ja: '進捗',
    'zh-TW': '進度',
    vi: 'Tiến độ',
  },
  // Category labels
  catDaily: {
    ko: '일상',
    ja: '日常',
    'zh-TW': '日常',
    vi: 'Hàng ngày',
  },
  catDrama: {
    ko: '드라마',
    ja: 'ドラマ',
    'zh-TW': '戲劇',
    vi: 'Phim truyền hình',
  },
  catMovie: {
    ko: '영화',
    ja: '映画',
    'zh-TW': '電影',
    vi: 'Phim',
  },
  catEntertainment: {
    ko: '예능',
    ja: 'バラエティ',
    'zh-TW': '綜藝',
    vi: 'Giải trí',
  },
  catMusic: {
    ko: '음악',
    ja: '音楽',
    'zh-TW': '音樂',
    vi: 'Âm nhạc',
  },
  catAnimation: {
    ko: '애니',
    ja: 'アニメ',
    'zh-TW': '動畫',
    vi: 'Hoạt hình',
  },
  // Search
  searchPlaceholder: {
    ko: '표현, 장면, 상황 검색',
    ja: '表現・シーン・状況を検索',
    'zh-TW': '搜尋表達、場景、情境',
    vi: 'Tìm kiếm biểu đạt, cảnh, tình huống',
  },
  searchSeriesPlaceholder: {
    ko: '시리즈 제목이나 키워드 검색',
    ja: 'シリーズ名やキーワードで検索',
    'zh-TW': '搜尋系列標題或關鍵字',
    vi: 'Tìm tên series hoặc từ khóa',
  },
  clearSearch: {
    ko: '검색어 지우기',
    ja: '検索をクリア',
    'zh-TW': '清除搜尋',
    vi: 'Xóa tìm kiếm',
  },
  resultsCount: {
    ko: '개 결과',
    ja: '件',
    'zh-TW': '個結果',
    vi: ' kết quả',
  },
  goToScene: {
    ko: '이 장면으로 바로 이동',
    ja: 'このシーンへ移動',
    'zh-TW': '前往此場景',
    vi: 'Đi đến cảnh này',
  },
  noResults: {
    ko: '아직 맞는 장면이 없습니다',
    ja: '該当するシーンがまだありません',
    'zh-TW': '尚無符合的場景',
    vi: 'Chưa có cảnh phù hợp',
  },
  noResultsHint: {
    ko: '다른 키워드로 좁혀 보거나 빠른 키워드를 눌러보세요.',
    ja: '他のキーワードで検索してみてください。',
    'zh-TW': '試試其他關鍵字搜尋。',
    vi: 'Thử tìm kiếm với từ khóa khác.',
  },
  noSeriesMatch: {
    ko: '조건에 맞는 시리즈가 없습니다.',
    ja: '条件に合うシリーズがありません。',
    'zh-TW': '沒有符合條件的系列。',
    vi: 'Không có series phù hợp.',
  },
  next: {
    ko: '다음',
    ja: '次',
    'zh-TW': '下一個',
    vi: 'Tiếp theo',
  },
  shortsCount: {
    ko: '개의 영상',
    ja: '本の動画',
    'zh-TW': '部影片',
    vi: ' video',
  },
  seriesVideosDescription: {
    ko: '개 시리즈',
    ja: 'シリーズ',
    'zh-TW': '個系列',
    vi: ' series',
  },
  videosUnit: {
    ko: '개 영상',
    ja: '本の動画',
    'zh-TW': '部影片',
    vi: ' video',
  },
  episodesUnit: {
    ko: '개',
    ja: '話',
    'zh-TW': '集',
    vi: ' tập',
  },
  searchExpressionLabel: {
    ko: '표현 또는 주제 검색',
    ja: '表現やトピックを検索',
    'zh-TW': '搜尋表達或主題',
    vi: 'Tìm biểu đạt hoặc chủ đề',
  },
  // Collection browser
  collections: {
    ko: '컬렉션',
    ja: 'コレクション',
    'zh-TW': '合集',
    vi: 'Bộ sưu tập',
  },
  sentencesUnit: {
    ko: '문장',
    ja: '文',
    'zh-TW': '句',
    vi: ' câu',
  },
  tagDataPreparing: {
    ko: '태그 데이터 준비 중',
    ja: 'タグデータ準備中',
    'zh-TW': '標籤資料準備中',
    vi: 'Đang chuẩn bị dữ liệu thẻ',
  },
  tagDataPreparingDescription: {
    ko: '상황, 분위기, 문법 등 다양한 컬렉션이 곧 추가됩니다.',
    ja: 'シチュエーション、雰囲気、文法など様々なコレクションがまもなく追加されます。',
    'zh-TW': '情境、氛圍、文法等各種合集即將推出。',
    vi: 'Các bộ sưu tập theo tình huống, ngữ pháp... sẽ sớm được thêm vào.',
  },
  // Collection detail
  collectionLoadError: {
    ko: '컬렉션 데이터를 불러올 수 없습니다',
    ja: 'コレクションデータを読み込めません',
    'zh-TW': '無法載入合集資料',
    vi: 'Không thể tải dữ liệu bộ sưu tập',
  },
  collectionLoadErrorDescription: {
    ko: '아직 준비 중이거나 네트워크 문제일 수 있습니다. 잠시 후 다시 시도해 주세요.',
    ja: 'まだ準備中か、ネットワークの問題かもしれません。しばらくしてから再度お試しください。',
    'zh-TW': '可能尚在準備中或網路問題，請稍後再試。',
    vi: 'Có thể đang chuẩn bị hoặc lỗi mạng. Vui lòng thử lại sau.',
  },
  collectionEmpty: {
    ko: '이 컬렉션에 아직 영상이 없습니다',
    ja: 'このコレクションにはまだ動画がありません',
    'zh-TW': '此合集尚無影片',
    vi: 'Bộ sưu tập này chưa có video',
  },
  collectionEmptyDescription: {
    ko: '곧 관련 영상이 추가될 예정입니다.',
    ja: 'まもなく関連動画が追加される予定です。',
    'zh-TW': '相關影片即將加入。',
    vi: 'Video liên quan sẽ sớm được thêm vào.',
  },
  back: {
    ko: '뒤로',
    ja: '戻る',
    'zh-TW': '返回',
    vi: 'Quay lại',
  },
  // Login gate modal
  loginGateEyebrow: {
    ko: '이어보기',
    ja: '続きを見る',
    'zh-TW': '繼續觀看',
    vi: 'Xem tiếp',
  },
  loginGateTitle: {
    ko: '로그인하고 이어보기',
    ja: 'ログインして続きを見る',
    'zh-TW': '登入以繼續觀看',
    vi: 'Đăng nhập để xem tiếp',
  },
  loginGateDescription: {
    ko: '게스트로는 여기까지입니다. 로그인하면 본 흐름과 저장 표현이 그대로 붙습니다.',
    ja: 'ゲストではここまでです。ログインすると視聴履歴と保存した表現がそのまま引き継がれます。',
    'zh-TW': '訪客模式到此為止。登入後觀看記錄與儲存的表達將同步保留。',
    vi: 'Chế độ khách đến đây thôi. Đăng nhập để giữ lại lịch sử xem và biểu đạt đã lưu.',
  },
  loginUnavailable: {
    ko: '로그인 연결이 아직 비어 있습니다.',
    ja: 'ログイン接続がまだ設定されていません。',
    'zh-TW': '登入連線尚未設定。',
    vi: 'Kết nối đăng nhập chưa được thiết lập.',
  },
  loginUnavailableDescription: {
    ko: '지금은 게스트 상태로 화면만 점검할 수 있습니다. Supabase 환경 변수를 연결하면 로그인 버튼이 활성화됩니다.',
    ja: '現在はゲスト状態で画面の確認のみ可能です。Supabase環境変数を接続するとログインボタンが有効になります。',
    'zh-TW': '目前以訪客狀態僅能檢視畫面。連結Supabase環境變數後登入按鈕將啟用。',
    vi: 'Hiện tại chỉ có thể xem giao diện ở chế độ khách. Kết nối biến môi trường Supabase để kích hoạt nút đăng nhập.',
  },
  featureSavedExpressions: {
    ko: '저장 표현 유지',
    ja: '保存した表現を維持',
    'zh-TW': '保留儲存的表達',
    vi: 'Giữ biểu đạt đã lưu',
  },
  featureSyncHistory: {
    ko: '이어보기 동기화',
    ja: '視聴履歴の同期',
    'zh-TW': '同步觀看記錄',
    vi: 'Đồng bộ lịch sử xem',
  },
  featurePersonalized: {
    ko: '개인화 추천 반영',
    ja: 'パーソナライズおすすめ',
    'zh-TW': '個人化推薦',
    vi: 'Gợi ý cá nhân hóa',
  },
  continueWithGoogle: {
    ko: 'Google로 이어가기',
    ja: 'Googleで続ける',
    'zh-TW': '使用Google繼續',
    vi: 'Tiếp tục với Google',
  },
  continueWithKakao: {
    ko: '카카오로 이어가기',
    ja: 'Kakaoで続ける',
    'zh-TW': '使用Kakao繼續',
    vi: 'Tiếp tục với Kakao',
  },
  later: {
    ko: '나중에',
    ja: 'あとで',
    'zh-TW': '稍後',
    vi: 'Để sau',
  },
  // Login page
  loginHeroTitle1: {
    ko: '짧은 장면을 넘기다 보면',
    ja: '短いシーンをめくっていると',
    'zh-TW': '翻看短片場景時',
    vi: 'Lướt qua các cảnh ngắn',
  },
  loginHeroTitle2: {
    ko: '귀가 먼저 익숙해집니다',
    ja: '耳が先に慣れていきます',
    'zh-TW': '耳朵會先適應',
    vi: 'tai bạn sẽ quen trước',
  },
  loginHeroDescription: {
    ko: '로그인하면 본 장면, 저장 표현, 이어보기가 한 계정에 정리되어 다시 들어와도 흐름이 이어집니다.',
    ja: 'ログインすると視聴したシーン、保存した表現、続きがひとつのアカウントにまとまり、いつでも続きから始められます。',
    'zh-TW': '登入後觀看過的場景、儲存的表達、繼續觀看都會整合在一個帳號中，隨時接續。',
    vi: 'Đăng nhập để các cảnh đã xem, biểu đạt đã lưu, và lịch sử xem được gộp vào một tài khoản, tiếp tục bất cứ lúc nào.',
  },
  loginFlowTagShorts: {
    ko: '쇼츠',
    ja: 'ショート',
    'zh-TW': '短片',
    vi: 'Shorts',
  },
  loginFlowTagSubtitles: {
    ko: '자막',
    ja: '字幕',
    'zh-TW': '字幕',
    vi: 'Phụ đề',
  },
  loginFlowTagSave: {
    ko: '저장',
    ja: '保存',
    'zh-TW': '儲存',
    vi: 'Lưu',
  },
  loginFlowTitle: {
    ko: '쇼츠와 시리즈에서 보고, 자막에서 멈추고, Learn에서 다시 꺼내 보세요.',
    ja: 'ショートやシリーズで見て、字幕で止めて、Learnでまた取り出しましょう。',
    'zh-TW': '在短片和系列中觀看，在字幕處暫停，在Learn中再次取出。',
    vi: 'Xem trong Shorts va Series, dừng lại ở phụ đề, lấy lại trong Learn.',
  },
  loginFlowDescription: {
    ko: '계정을 연결하면 이어보기, 저장 표현, XP와 게임 복습 흐름이 한 계정에 묶입니다.',
    ja: 'アカウントを連携すると、続き視聴、保存した表現、XPとゲーム復習がひとつのアカウントにまとまります。',
    'zh-TW': '連結帳號後，繼續觀看、儲存的表達、XP和遊戲複習都會綁定在同一帳號。',
    vi: 'Liên kết tài khoản để tiếp tục xem, biểu đạt đã lưu, XP và ôn tập trò chơi gộp vào một tài khoản.',
  },
  loginFeatureContinueTitle: {
    ko: '이어보기',
    ja: '続きを見る',
    'zh-TW': '繼續觀看',
    vi: 'Xem tiếp',
  },
  loginFeatureContinueDesc: {
    ko: '보던 흐름이 그대로 이어집니다.',
    ja: '視聴の流れがそのまま続きます。',
    'zh-TW': '觀看進度會直接延續。',
    vi: 'Tiến trình xem sẽ được tiếp tục.',
  },
  loginFeatureSavedTitle: {
    ko: '저장 표현',
    ja: '保存した表現',
    'zh-TW': '儲存的表達',
    vi: 'Biểu đạt đã lưu',
  },
  loginFeatureSavedDesc: {
    ko: '남겨둔 문장을 다시 꺼낼 수 있습니다.',
    ja: '保存した文をいつでも取り出せます。',
    'zh-TW': '隨時取出儲存的句子。',
    vi: 'Lấy lại các câu đã lưu bất cứ lúc nào.',
  },
  loginFeatureRecommendTitle: {
    ko: '반응형 추천',
    ja: 'パーソナライズ推薦',
    'zh-TW': '個人化推薦',
    vi: 'Gợi ý cá nhân hóa',
  },
  loginFeatureRecommendDesc: {
    ko: '내 레벨과 본 흐름이 홈과 쇼츠 추천에 바로 반영됩니다.',
    ja: 'レベルと視聴履歴がホームとショートのおすすめにすぐ反映されます。',
    'zh-TW': '你的等級和觀看記錄會即時反映在首頁和短片推薦中。',
    vi: 'Cấp độ và lịch sử xem sẽ phản ánh ngay trong gợi ý Trang chủ và Shorts.',
  },
  loginFeatureGameTitle: {
    ko: '게임과 XP',
    ja: 'ゲームとXP',
    'zh-TW': '遊戲與XP',
    vi: 'Trò chơi và XP',
  },
  loginFeatureGameDesc: {
    ko: 'Learn에서 저장 표현과 게임, XP 흐름이 이어집니다.',
    ja: 'Learnで保存した表現、ゲーム、XPの流れが続きます。',
    'zh-TW': '在Learn中儲存的表達、遊戲和XP進度會延續。',
    vi: 'Biểu đạt đã lưu, trò chơi và tiến trình XP trong Learn sẽ được tiếp tục.',
  },
  loginCardEyebrow: {
    ko: '계정 연결',
    ja: 'アカウント連携',
    'zh-TW': '帳號連結',
    vi: 'Liên kết tài khoản',
  },
  loginCardTitle: {
    ko: '로그인하고 이어서 보기',
    ja: 'ログインして続きを見る',
    'zh-TW': '登入以繼續觀看',
    vi: 'Đăng nhập để xem tiếp',
  },
  loginCardDescription: {
    ko: '한 번 로그인하면 오늘 장면과 저장 표현, 이어보기가 같은 흐름으로 붙습니다.',
    ja: '一度ログインすれば、今日のシーン、保存した表現、続きがひとつの流れにまとまります。',
    'zh-TW': '只要登入一次，今天的場景、儲存的表達和繼續觀看就會連成一體。',
    vi: 'Chỉ cần đăng nhập một lần, các cảnh hôm nay, biểu đạt đã lưu và lịch sử xem sẽ gộp thành một.',
  },
  loginBadgeSyncHistory: {
    ko: '이어보기 동기화',
    ja: '視聴履歴の同期',
    'zh-TW': '同步觀看記錄',
    vi: 'Đồng bộ lịch sử xem',
  },
  loginBadgeSavedExpressions: {
    ko: '저장 표현 유지',
    ja: '保存した表現を維持',
    'zh-TW': '保留儲存的表達',
    vi: 'Giữ biểu đạt đã lưu',
  },
  loginBadgeLevelRecommend: {
    ko: '레벨 맞춤 추천',
    ja: 'レベル別おすすめ',
    'zh-TW': '等級推薦',
    vi: 'Gợi ý theo cấp độ',
  },
  loginBadgeLearnReview: {
    ko: 'Learn 복습',
    ja: 'Learn 復習',
    'zh-TW': 'Learn 複習',
    vi: 'Ôn tập Learn',
  },
  loginAuthUnavailableTitle: {
    ko: '로그인 연결이 아직 비어 있습니다.',
    ja: 'ログイン接続がまだ設定されていません。',
    'zh-TW': '登入連線尚未設定。',
    vi: 'Kết nối đăng nhập chưa được thiết lập.',
  },
  loginAuthUnavailableDesc: {
    ko: '지금은 둘러보기만 가능합니다. Supabase 환경 변수를 연결하면 로그인 버튼이 활성화됩니다.',
    ja: '現在は閲覧のみ可能です。Supabase環境変数を接続するとログインボタンが有効になります。',
    'zh-TW': '目前只能瀏覽。連結Supabase環境變數後登入按鈕將啟用。',
    vi: 'Hiện chỉ có thể duyệt xem. Kết nối biến môi trường Supabase để kích hoạt nút đăng nhập.',
  },
  loginBrowseFirst: {
    ko: '먼저 둘러보기',
    ja: 'まず見てみる',
    'zh-TW': '先逛逛',
    vi: 'Duyệt xem trước',
  },
  loginTermsAgreePre: {
    ko: '계속하면',
    ja: '続行すると',
    'zh-TW': '繼續即表示同意',
    vi: 'Tiếp tục đồng nghĩa với việc đồng ý',
  },
  loginTermsLink: {
    ko: '이용약관',
    ja: '利用規約',
    'zh-TW': '服務條款',
    vi: 'Điều khoản sử dụng',
  },
  loginTermsAnd: {
    ko: '및',
    ja: 'および',
    'zh-TW': '和',
    vi: 'va',
  },
  loginPrivacyLink: {
    ko: '개인정보처리방침',
    ja: 'プライバシーポリシー',
    'zh-TW': '隱私權政策',
    vi: 'Chính sách bảo mật',
  },
  loginTermsAgreePost: {
    ko: '에 동의한 것으로 간주됩니다.',
    ja: 'に同意したものとみなされます。',
    'zh-TW': '。',
    vi: '.',
  },
  // Push notification prompt
  pushStreakDays: {
    ko: '일 연속 중',
    ja: '日連続',
    'zh-TW': '天連續',
    vi: ' ngày liên tiếp',
  },
  pushKeepStreak: {
    ko: '연속 기록을 이어가세요',
    ja: '連続記録を続けよう',
    'zh-TW': '保持連續紀錄',
    vi: 'Duy trì chuỗi ngày liên tiếp',
  },
  pushDescription: {
    ko: '매일 알림을 받아 연속 기록을 이어가세요. 언제든 설정에서 끌 수 있어요.',
    ja: '毎日の通知で連続記録を続けましょう。いつでも設定でオフにできます。',
    'zh-TW': '透過每日通知保持連續紀錄。隨時可在設定中關閉。',
    vi: 'Nhận thông báo hàng ngày để duy trì chuỗi. Có thể tắt bất cứ lúc nào trong cài đặt.',
  },
  pushAllow: {
    ko: '알림 받기',
    ja: '通知を許可',
    'zh-TW': '允許通知',
    vi: 'Cho phép thông báo',
  },
  // Delete account modal
  deleteAccountTitle: {
    ko: '계정 삭제',
    ja: 'アカウント削除',
    'zh-TW': '刪除帳號',
    vi: 'Xóa tài khoản',
  },
  deleteAccountConfirm: {
    ko: '정말 삭제하시겠습니까? 모든 데이터가 영구 삭제됩니다.',
    ja: '本当に削除しますか？すべてのデータが完全に削除されます。',
    'zh-TW': '確定要刪除嗎？所有資料將永久刪除。',
    vi: 'Bạn có chắc muốn xóa? Tất cả dữ liệu sẽ bị xóa vĩnh viễn.',
  },
  deleteAccountCancel: {
    ko: '취소',
    ja: 'キャンセル',
    'zh-TW': '取消',
    vi: 'Hủy',
  },
  deleteAccountDeleting: {
    ko: '삭제 중...',
    ja: '削除中...',
    'zh-TW': '刪除中...',
    vi: 'Đang xóa...',
  },
  deleteAccountDelete: {
    ko: '삭제',
    ja: '削除',
    'zh-TW': '刪除',
    vi: 'Xóa',
  },
  // Share button
  shareLabel: {
    ko: '공유하기',
    ja: '共有する',
    'zh-TW': '分享',
    vi: 'Chia sẻ',
  },
  shareTextWithTitle: {
    ko: 'Shortee에서 이 장면 다시 보기',
    ja: 'Shorteeでこのシーンをもう一度見る',
    'zh-TW': '在Shortee重新觀看此場景',
    vi: 'Xem lại cảnh này trên Shortee',
  },
  shareLinkCopied: {
    ko: '링크를 복사했어요',
    ja: 'リンクをコピーしました',
    'zh-TW': '已複製連結',
    vi: 'Đã sao chép liên kết',
  },
  // Bookmark button
  bookmarkRemove: {
    ko: '북마크 해제',
    ja: 'ブックマーク解除',
    'zh-TW': '取消書籤',
    vi: 'Bỏ đánh dấu',
  },
  bookmarkAdd: {
    ko: '북마크',
    ja: 'ブックマーク',
    'zh-TW': '加入書籤',
    vi: 'Đánh dấu',
  },
  // Like button
  likeRemove: {
    ko: '좋아요 취소',
    ja: 'いいね解除',
    'zh-TW': '取消喜歡',
    vi: 'Bỏ thích',
  },
  likeAdd: {
    ko: '좋아요',
    ja: 'いいね',
    'zh-TW': '喜歡',
    vi: 'Thích',
  },
  // Repeat button
  repeatPlay: {
    ko: '반복 재생',
    ja: 'リピート再生',
    'zh-TW': '重複播放',
    vi: 'Phát lặp lại',
  },
} as const

export type UITranslationKey = keyof typeof translations

/**
 * Get a translated UI string for the given locale.
 */
export function t(key: UITranslationKey, locale: SupportedLocale): string {
  return translations[key][locale]
}

/**
 * Build localized category labels record based on locale.
 */
export function getCategoryLabels(
  locale: SupportedLocale,
): Record<'daily' | 'drama' | 'movie' | 'entertainment' | 'music' | 'animation', string> {
  return {
    daily: t('catDaily', locale),
    drama: t('catDrama', locale),
    movie: t('catMovie', locale),
    entertainment: t('catEntertainment', locale),
    music: t('catMusic', locale),
    animation: t('catAnimation', locale),
  }
}

/**
 * Format series + video count description.
 * e.g. ko: "12개 시리즈 · 45개 영상"
 */
export function formatSeriesDescription(
  seriesCount: number,
  videoCount: number,
  locale: SupportedLocale,
): string {
  const seriesUnit = t('seriesVideosDescription', locale)
  const videoUnit = t('videosUnit', locale)

  switch (locale) {
    case 'ko':
      return `${seriesCount}${seriesUnit} · ${videoCount}${videoUnit}`
    case 'ja':
      return `${seriesCount}${seriesUnit} · ${videoCount}${videoUnit}`
    case 'zh-TW':
      return `${seriesCount}${seriesUnit} · ${videoCount}${videoUnit}`
    case 'vi':
      return `${seriesCount}${seriesUnit} · ${videoCount}${videoUnit}`
    default:
      return `${seriesCount}${seriesUnit} · ${videoCount}${videoUnit}`
  }
}

/**
 * Format results count for search.
 * e.g. ko: "3개 결과", ja: "3件"
 */
export function formatResultsCount(
  count: number,
  locale: SupportedLocale,
): string {
  const unit = t('resultsCount', locale)
  return `${count}${unit}`
}

/**
 * Format shorts count.
 * e.g. ko: "42개의 영상", ja: "42本の動画"
 */
export function formatShortsCount(
  count: number,
  locale: SupportedLocale,
): string {
  const unit = t('shortsCount', locale)
  return `${count}${unit}`
}

/**
 * Format episode count badge.
 * e.g. ko: "12개", ja: "12話"
 */
export function formatEpisodeCount(
  count: number,
  locale: SupportedLocale,
): string {
  const unit = t('episodesUnit', locale)
  return `${count}${unit}`
}
