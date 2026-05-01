export const DEFAULT_SITE_URL = 'https://benevolent-crostata-bd869a.netlify.app'

export function getPublicSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    DEFAULT_SITE_URL
  )
}

export const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? 'hyunjae.park93@gmail.com'
