'use client'

import Link from 'next/link'

export default function TermsPage() {
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
        <h1 className="text-lg font-bold">이용약관</h1>
      </div>

      {/* Content */}
      <div className="px-5 py-6 pb-20 max-w-2xl mx-auto space-y-8 text-sm leading-relaxed text-[var(--text-secondary)]">
        <p className="text-[var(--text-muted)] text-xs">
          시행일: 2026년 3월 7일 | 최종 수정: 2026년 3월 7일
        </p>

        <section>
          <h2 className="text-base font-bold text-[var(--text-primary)] mb-3">제1조 (목적)</h2>
          <p>
            이 약관은 StudyEng(이하 &quot;회사&quot;)이 제공하는 영어 학습 서비스(이하 &quot;서비스&quot;)의
            이용 조건 및 절차, 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-[var(--text-primary)] mb-3">제2조 (정의)</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>&quot;서비스&quot;란 회사가 제공하는 영어 학습 콘텐츠, 게임형 복습, AI 기반 학습 기능 등 일체의 서비스를 말합니다.</li>
            <li>&quot;이용자&quot;란 이 약관에 동의하고 서비스를 이용하는 자를 말합니다.</li>
            <li>&quot;회원&quot;이란 회사에 개인정보를 제공하고 회원 등록을 한 이용자를 말합니다.</li>
            <li>&quot;콘텐츠&quot;란 서비스에서 제공되는 영상, 텍스트, 음성, 이미지 등의 학습 자료를 말합니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-base font-bold text-[var(--text-primary)] mb-3">제3조 (약관의 효력 및 변경)</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>이 약관은 서비스 화면에 게시하거나 이용자에게 공지함으로써 효력이 발생합니다.</li>
            <li>회사는 관련 법령에 위배되지 않는 범위에서 이 약관을 변경할 수 있으며, 변경 시 최소 7일 전 공지합니다.</li>
            <li>변경된 약관에 동의하지 않을 경우 이용자는 서비스 이용을 중단하고 탈퇴할 수 있습니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-base font-bold text-[var(--text-primary)] mb-3">제4조 (서비스 이용)</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>서비스는 회사의 업무상 또는 기술상 특별한 지장이 없는 한 연중무휴, 1일 24시간 운영합니다.</li>
            <li>회사는 시스템 점검, 교체 및 고장, 통신 두절 등의 사유가 발생한 경우 서비스 제공을 일시적으로 중단할 수 있습니다.</li>
            <li>이용자는 서비스를 이용하여 얻은 정보를 회사의 사전 승낙 없이 복제, 전송, 출판, 배포, 방송 등의 방법으로 이용하거나 제3자에게 제공할 수 없습니다.</li>
            <li>비회원도 서비스의 일부 기능을 이용할 수 있으나, 학습 기록 저장 등 일부 기능은 회원에게만 제공됩니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-base font-bold text-[var(--text-primary)] mb-3">제5조 (회원가입 및 탈퇴)</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>회원가입은 이용자가 약관에 동의하고 Google 계정 등 소셜 로그인을 통해 완료됩니다.</li>
            <li>회원은 언제든지 서비스 내 설정 또는 고객센터를 통해 탈퇴를 요청할 수 있습니다.</li>
            <li>탈퇴 시 회원의 학습 기록 및 개인정보는 관련 법령에 따라 일정 기간 보관 후 파기됩니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-base font-bold text-[var(--text-primary)] mb-3">제6조 (개인정보 보호)</h2>
          <p>
            회사는 이용자의 개인정보를 &quot;개인정보 보호법&quot; 등 관련 법령에 따라 보호하며,
            개인정보의 수집, 이용, 제공에 대한 자세한 사항은{' '}
            <Link href="/privacy" className="text-blue-400 underline underline-offset-2">
              개인정보처리방침
            </Link>
            에서 확인하실 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-[var(--text-primary)] mb-3">제7조 (결제 및 환불)</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>서비스의 유료 콘텐츠 및 구독 상품의 가격은 서비스 내에 표시됩니다.</li>
            <li>결제는 인앱결제, 신용카드 등 회사가 정하는 방법으로 이루어집니다.</li>
            <li>이용자는 구매일로부터 7일 이내에 환불을 요청할 수 있습니다. 단, 이미 사용한 콘텐츠에 대해서는 환불이 제한될 수 있습니다.</li>
            <li>구독 상품의 경우, 결제일 기준 다음 결제 주기 시작 전까지 해지할 수 있으며, 이미 결제된 기간에 대한 환불은 제공되지 않습니다.</li>
            <li>환불 절차는 전자상거래 등에서의 소비자 보호에 관한 법률에 따릅니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-base font-bold text-[var(--text-primary)] mb-3">제8조 (이용자의 의무)</h2>
          <p className="mb-2">이용자는 다음 행위를 해서는 안 됩니다:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>회원가입 또는 정보 변경 시 허위 내용을 등록하는 행위</li>
            <li>타인의 계정을 도용하는 행위</li>
            <li>서비스를 이용하여 법령 또는 공서양속에 반하는 행위</li>
            <li>서비스의 운영을 방해하거나 안정성을 해치는 행위</li>
            <li>콘텐츠를 무단으로 복제, 배포, 전송하는 행위</li>
            <li>자동화된 수단(봇, 크롤러 등)을 이용하여 서비스에 접근하는 행위</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-[var(--text-primary)] mb-3">제9조 (면책조항)</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>회사는 천재지변, 전쟁, 기간통신사업자의 서비스 중지 등 불가항력적인 사유로 서비스를 제공할 수 없는 경우 책임을 지지 않습니다.</li>
            <li>회사는 이용자의 귀책사유로 인한 서비스 이용 장애에 대해 책임을 지지 않습니다.</li>
            <li>서비스에서 제공하는 학습 콘텐츠는 참고 자료이며, 해당 콘텐츠의 정확성이나 완전성을 보장하지 않습니다.</li>
            <li>제3자(YouTube 등)가 제공하는 콘텐츠에 대해서는 해당 플랫폼의 이용약관이 적용됩니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-base font-bold text-[var(--text-primary)] mb-3">제10조 (지적재산권)</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>서비스에 포함된 디자인, 로고, 텍스트, 소프트웨어 등에 대한 지적재산권은 회사에 귀속됩니다.</li>
            <li>이용자가 서비스를 이용하여 생성한 학습 기록 등의 데이터에 대한 권리는 이용자에게 있습니다.</li>
            <li>YouTube 콘텐츠의 저작권은 해당 콘텐츠 제작자에게 있으며, 서비스는 YouTube API를 통해 콘텐츠를 임베드합니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-base font-bold text-[var(--text-primary)] mb-3">제11조 (분쟁 해결)</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>서비스 이용과 관련하여 회사와 이용자 간에 분쟁이 발생한 경우, 양 당사자는 원만한 해결을 위해 성실히 협의합니다.</li>
            <li>협의로 해결되지 않는 경우, 관할 법원은 민사소송법에 따른 법원으로 합니다.</li>
            <li>이 약관에 명시되지 않은 사항은 관련 법령 및 상관례에 따릅니다.</li>
          </ol>
        </section>

        <section className="border-t border-[var(--border-card)] pt-6">
          <p className="text-[var(--text-muted)] text-xs">
            본 약관은 2026년 3월 7일부터 시행됩니다.
          </p>
          <p className="text-[var(--text-muted)] text-xs mt-1">
            문의: support@studyeng.app
          </p>
        </section>
      </div>
    </div>
  )
}
