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
  viewportFit: 'cover',
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
            var state = stored.state || {};
            var backgroundTheme = state.backgroundTheme;
            var colorTheme = state.colorTheme;
            var legacyTheme = state.theme;

            if ((!backgroundTheme || !colorTheme) && legacyTheme) {
              if (legacyTheme === 'blue-dark') {
                backgroundTheme = 'dark';
                colorTheme = 'blue';
              } else if (legacyTheme === 'light') {
                backgroundTheme = 'light';
                colorTheme = 'violet';
              } else if (legacyTheme === 'light-blue') {
                backgroundTheme = 'light';
                colorTheme = 'blue';
              } else {
                backgroundTheme = 'dark';
                colorTheme = 'violet';
              }
            }

            if (backgroundTheme && colorTheme) {
              var themeId;
              if (backgroundTheme === 'dark') {
                themeId = colorTheme === 'blue' ? 'blue-dark' : 'purple-dark';
              } else {
                themeId = colorTheme === 'blue' ? 'light-blue' : 'light';
              }

              document.documentElement.setAttribute('data-theme', themeId);
              if (backgroundTheme === 'light') {
                document.documentElement.classList.remove('dark');
                document.documentElement.style.colorScheme = 'light';
              } else {
                document.documentElement.classList.add('dark');
                document.documentElement.style.colorScheme = 'dark';
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
