import type { Metadata, Viewport } from 'next'
import { Noto_Sans_KR, Space_Grotesk } from 'next/font/google'
import { ThemeProvider } from '@/components/ThemeProvider'
import './globals.css'

const uiFont = Noto_Sans_KR({
  variable: '--font-ui',
  weight: ['400', '500', '600', '700', '800'],
})

const displayFont = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '700'],
})

export const metadata: Metadata = {
  title: 'Shortee - 보다 보면 귀가 먼저 익숙해집니다',
  description: '짧은 장면과 반복으로 영어가 덜 낯설어지는 쇼츠 피드',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Shortee',
  },
  openGraph: {
    title: 'Shortee - 보다 보면 귀가 먼저 익숙해집니다',
    description: '짧은 장면과 반복으로 영어가 덜 낯설어지는 쇼츠 피드',
    type: 'website',
    locale: 'ko_KR',
    siteName: 'Shortee',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shortee - 보다 보면 귀가 먼저 익숙해집니다',
    description: '짧은 장면과 반복으로 영어가 덜 낯설어지는 쇼츠 피드',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#000000',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="ko"
      className={`${uiFont.variable} ${displayFont.variable} dark`}
      data-theme="teal-dark"
      suppressHydrationWarning
    >
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
                colorTheme = 'teal';
              } else if (legacyTheme === 'light-blue') {
                backgroundTheme = 'light';
                colorTheme = 'blue';
              } else {
                backgroundTheme = 'dark';
                colorTheme = 'teal';
              }
            }

            if (colorTheme === 'violet') {
              colorTheme = 'teal';
            }

            if (backgroundTheme && colorTheme) {
              var themeId;
              if (backgroundTheme === 'dark') {
                themeId = colorTheme === 'blue' ? 'blue-dark' : 'teal-dark';
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
