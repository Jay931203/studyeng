import type { Metadata, Viewport } from 'next'
import { ThemeProvider } from '@/components/ThemeProvider'
import './globals.css'

export const metadata: Metadata = {
  title: 'StudyEng - 영어 공부',
  description: '숏폼으로 쉽고 재밌게 영어 공부',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'StudyEng',
  },
  openGraph: {
    title: 'StudyEng - 숏폼으로 영어 공부',
    description: '유튜브 영상으로 쉽고 재밌게 영어를 배워요. 자막, 게임, 반복학습까지.',
    type: 'website',
    locale: 'ko_KR',
    siteName: 'StudyEng',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StudyEng - 숏폼으로 영어 공부',
    description: '유튜브 영상으로 쉽고 재밌게 영어를 배워요',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" className="dark" data-theme="purple-dark">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var stored = JSON.parse(localStorage.getItem('studyeng-theme') || '{}');
            var theme = stored.state && stored.state.theme;
            if (theme) {
              // Migrate old values
              if (theme === 'dark') theme = 'purple-dark';
              document.documentElement.setAttribute('data-theme', theme);
              if (theme === 'light') {
                document.documentElement.classList.remove('dark');
                document.documentElement.style.colorScheme = 'light';
              }
            }
          } catch(e) {}
        ` }} />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
