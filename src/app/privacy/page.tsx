'use client'

import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-dvh bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--bg-primary)] border-b border-[var(--border-card)] px-4 py-3 flex items-center gap-3">
        <Link
          href="/"
          className="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--bg-card)] text-[var(--text-secondary)]"
          aria-label="뒤로 가기"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
          </svg>
        </Link>
        <h1 className="text-lg font-bold">개인정보처리방침</h1>
      </div>

      {/* Content */}
      <div className="px-5 py-6 pb-20 max-w-2xl mx-auto space-y-8 text-sm leading-relaxed text-[var(--text-secondary)]">
        <p className="text-[var(--text-muted)] text-xs">
          시행일: 2026년 3월 7일 | 최종 수정: 2026년 3월 7일
        </p>

        <p>
          Shortee(이하 &quot;회사&quot;)은 개인정보 보호법 등 관련 법령에 따라 이용자의 개인정보를 보호하고,
          이와 관련된 고충을 신속하고 원활하게 처리하기 위하여 다음과 같이 개인정보처리방침을 수립 및 공개합니다.
        </p>

        <section>
          <h2 className="text-base font-bold text-[var(--text-primary)] mb-3">제1조 (수집하는 개인정보 항목)</h2>
          <p className="mb-3">회사는 서비스 제공을 위해 다음의 개인정보를 수집합니다:</p>

          <div className="bg-[var(--bg-card)] rounded-xl p-4 space-y-3 border border-[var(--border-card)]">
            <div>
              <p className="text-[var(--text-primary)] font-medium text-xs mb-1">필수 수집 항목</p>
              <p className="text-xs">Google 계정 이메일, 이름, 프로필 사진 URL</p>
            </div>
            <div>
              <p className="text-[var(--text-primary)] font-medium text-xs mb-1">자동 수집 항목</p>
              <p className="text-xs">서비스 이용 기록, 학습 데이터(시청 기록, 저장한 표현, 게임 결과), 접속 일시, IP 주소, 기기 정보, 브라우저 정보</p>
            </div>
            <div>
              <p className="text-[var(--text-primary)] font-medium text-xs mb-1">선택 수집 항목</p>
              <p className="text-xs">결제 시: 결제 정보(결제 대행사를 통해 처리)</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-base font-bold text-[var(--text-primary)] mb-3">제2조 (개인정보의 수집 및 이용 목적)</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>회원 가입 및 관리: 본인 확인, 회원 식별, 서비스 부정 이용 방지</li>
            <li>서비스 제공: 학습 콘텐츠 제공, 학습 진도 관리, 개인화된 학습 추천</li>
            <li>서비스 개선: 이용 통계 분석, 서비스 품질 향상, 신규 서비스 개발</li>
            <li>고객 지원: 이용자 문의 대응, 공지사항 전달</li>
            <li>결제 처리: 유료 서비스 결제 및 환불 처리</li>
            <li>마케팅: 이벤트 및 광고 정보 제공 (별도 동의 시)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-[var(--text-primary)] mb-3">제3조 (개인정보의 보유 및 이용 기간)</h2>
          <p className="mb-3">
            회사는 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.
            다만, 관련 법령에 의해 보관이 필요한 경우 아래 기간 동안 보관합니다:
          </p>
          <div className="bg-[var(--bg-card)] rounded-xl p-4 space-y-2 border border-[var(--border-card)] text-xs">
            <div className="flex justify-between">
              <span>계약 또는 청약철회 기록</span>
              <span className="text-[var(--text-primary)] font-medium">5년</span>
            </div>
            <div className="flex justify-between">
              <span>대금 결제 및 재화 공급 기록</span>
              <span className="text-[var(--text-primary)] font-medium">5년</span>
            </div>
            <div className="flex justify-between">
              <span>소비자 불만 또는 분쟁 처리 기록</span>
              <span className="text-[var(--text-primary)] font-medium">3년</span>
            </div>
            <div className="flex justify-between">
              <span>서비스 이용 기록, 접속 로그</span>
              <span className="text-[var(--text-primary)] font-medium">3개월</span>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-base font-bold text-[var(--text-primary)] mb-3">제4조 (개인정보의 제3자 제공)</h2>
          <p className="mb-2">
            회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만, 다음의 경우는 예외로 합니다:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>이용자가 사전에 동의한 경우</li>
            <li>법령의 규정에 의하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-[var(--text-primary)] mb-3">제5조 (개인정보 처리 위탁)</h2>
          <p className="mb-3">회사는 서비스 제공을 위해 다음과 같이 개인정보 처리를 위탁하고 있습니다:</p>
          <div className="bg-[var(--bg-card)] rounded-xl p-4 space-y-2 border border-[var(--border-card)] text-xs">
            <div className="flex justify-between">
              <span>Supabase (데이터베이스, 인증)</span>
              <span className="text-[var(--text-muted)]">데이터 저장 및 인증</span>
            </div>
            <div className="flex justify-between">
              <span>Vercel (호스팅)</span>
              <span className="text-[var(--text-muted)]">서비스 호스팅</span>
            </div>
            <div className="flex justify-between">
              <span>Google (소셜 로그인)</span>
              <span className="text-[var(--text-muted)]">인증 처리</span>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-base font-bold text-[var(--text-primary)] mb-3">제6조 (개인정보의 파기)</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>회사는 개인정보 보유 기간의 경과, 처리 목적 달성 등으로 개인정보가 불필요하게 된 때에는 지체 없이 해당 개인정보를 파기합니다.</li>
            <li>전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제합니다.</li>
            <li>종이에 출력된 개인정보는 분쇄기로 분쇄하거나 소각하여 파기합니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-base font-bold text-[var(--text-primary)] mb-3">제7조 (이용자의 권리와 행사 방법)</h2>
          <p className="mb-2">이용자는 언제든지 다음의 권리를 행사할 수 있습니다:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>개인정보 열람 요구</li>
            <li>개인정보 정정 및 삭제 요구</li>
            <li>개인정보 처리 정지 요구</li>
            <li>동의 철회 (회원 탈퇴)</li>
          </ul>
          <p className="mt-2">
            위 권리 행사는 서비스 내 설정 메뉴 또는 이메일(support@studyeng.app)을 통해 가능하며,
            회사는 지체 없이 조치하겠습니다.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-[var(--text-primary)] mb-3">제8조 (개인정보의 안전성 확보 조치)</h2>
          <p className="mb-2">회사는 개인정보의 안전성 확보를 위해 다음의 조치를 취하고 있습니다:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>개인정보의 암호화: 비밀번호 등은 암호화하여 저장 및 관리</li>
            <li>해킹 등에 대한 기술적 대책: SSL/TLS 통신 암호화, 보안 프로그램 운영</li>
            <li>접근 제한: 개인정보 처리 시스템에 대한 접근 권한 관리</li>
            <li>개인정보 처리 직원의 최소화 및 교육</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-[var(--text-primary)] mb-3">제9조 (쿠키의 사용)</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>회사는 이용자에게 맞춤형 서비스를 제공하기 위해 쿠키(cookie)를 사용합니다.</li>
            <li>쿠키는 이용자의 브라우저 설정을 통해 거부할 수 있으나, 이 경우 서비스 이용에 제한이 있을 수 있습니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-base font-bold text-[var(--text-primary)] mb-3">제10조 (개인정보 보호책임자)</h2>
          <div className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border-card)] text-xs space-y-1">
            <p><span className="text-[var(--text-primary)] font-medium">담당:</span> 개인정보 보호 담당자</p>
            <p><span className="text-[var(--text-primary)] font-medium">이메일:</span> privacy@studyeng.app</p>
          </div>
          <p className="mt-3 text-xs">
            기타 개인정보 관련 신고나 상담은 아래 기관에 문의하실 수 있습니다:
          </p>
          <ul className="list-disc list-inside text-xs space-y-1 mt-2">
            <li>개인정보 침해신고센터 (privacy.kisa.or.kr / 국번없이 118)</li>
            <li>대검찰청 사이버수사과 (spo.go.kr / 국번없이 1301)</li>
            <li>경찰청 사이버수사국 (ecrm.police.go.kr / 국번없이 182)</li>
          </ul>
        </section>

        <section className="border-t border-[var(--border-card)] pt-6">
          <p className="text-[var(--text-muted)] text-xs">
            본 개인정보처리방침은 2026년 3월 7일부터 시행됩니다.
          </p>
          <p className="text-[var(--text-muted)] text-xs mt-1">
            관련 법률:{' '}
            <span className="text-[var(--text-secondary)]">
              개인정보 보호법, 정보통신망 이용촉진 및 정보보호 등에 관한 법률
            </span>
          </p>
        </section>
      </div>
    </div>
  )
}
