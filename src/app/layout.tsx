import type { Metadata, Viewport } from 'next'
import { Noto_Sans_KR, Space_Grotesk } from 'next/font/google'
import { ThemeProvider } from '@/components/ThemeProvider'
import { GoogleAnalytics } from '@/components/GoogleAnalytics'
import './globals.css'

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'https://studyeng-nine.vercel.app')

const appTitle = 'Shortee - Learn English with Shorts'
const appDescription = 'Pick up English naturally through short clips and review games'

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
  metadataBase: new URL(siteUrl),
  title: appTitle,
  description: appDescription,
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: ['/favicon-32x32.png'],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Shortee',
  },
  openGraph: {
    title: appTitle,
    description: appDescription,
    type: 'website',
    locale: 'en_US',
    siteName: 'Shortee',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Shortee - Learn English with Shorts' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: appTitle,
    description: appDescription,
    images: ['/og-image.png'],
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
      lang="en"
      className={`${uiFont.variable} ${displayFont.variable} dark`}
      data-theme="teal-dark"
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
          try {
            var stored = JSON.parse(localStorage.getItem('studyeng-theme') || '{}');
            var state = stored.state || {};
            var colorTheme = state.colorTheme;
            var legacyTheme = state.theme;

            if (!colorTheme && legacyTheme) {
              if (legacyTheme === 'blue-dark' || legacyTheme === 'light-blue') {
                colorTheme = 'blue';
              } else if (legacyTheme === 'purple-dark' || legacyTheme === 'light-purple') {
                colorTheme = 'purple';
              } else if (legacyTheme === 'rainbow-dark' || legacyTheme === 'light-rainbow') {
                colorTheme = 'rainbow';
              } else {
                colorTheme = 'teal';
              }
            }

            if (colorTheme === 'violet') {
              colorTheme = 'purple';
            }

            if (colorTheme) {
              var themeId;
              if (colorTheme === 'blue') {
                themeId = 'blue-dark';
              } else if (colorTheme === 'purple') {
                themeId = 'purple-dark';
              } else if (colorTheme === 'rainbow') {
                themeId = 'rainbow-dark';
              } else {
                themeId = 'teal-dark';
              }
              document.documentElement.setAttribute('data-theme', themeId);
            }
          } catch(e) {}
        `,
          }}
        />
      </head>
      <body>
        <GoogleAnalytics />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
