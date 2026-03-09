import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.studyeng.app',
  appName: 'StudyEng',
  webDir: 'out',
  server: {
    // In production, load from deployed URL so API routes & SSR work
    // Set CAPACITOR_SERVER_URL in your build environment
    // e.g. https://studyeng.vercel.app
    url: process.env.CAPACITOR_SERVER_URL || undefined,
    cleartext: true,
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#000000',
    },
  },
}

export default config
