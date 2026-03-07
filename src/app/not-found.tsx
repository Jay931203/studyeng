import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="h-dvh flex flex-col items-center justify-center bg-black text-white px-6">
      <p className="text-7xl font-bold text-blue-500">404</p>
      <p className="mt-4 text-lg text-gray-300">
        페이지를 찾을 수 없습니다
      </p>
      <Link
        href="/"
        className="mt-8 px-6 py-3 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-colors"
      >
        홈으로 돌아가기
      </Link>
    </div>
  )
}
