import { MetadataRoute } from 'next'
import { getPublicSiteUrl } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getPublicSiteUrl()
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/auth/'] },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
