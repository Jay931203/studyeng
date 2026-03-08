import type { Metadata, Viewport } from 'next'
import { ThemeProvider } from '@/components/ThemeProvider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Shortee - Learn English with Shorts',
  description: 'Learn English with Shorts',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Shortee',
  },
  openGraph: {
    title: 'Shortee - Learn English with Shorts',
    description: 'Learn English with Shorts',
    type: 'website',
    locale: 'ko_KR',
    siteName: 'Shortee',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shortee - Learn English with Shorts',
    description: 'Learn English with Shorts',
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
    <html
      lang="ko"
      className="dark"
      data-theme="purple-dark"
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
