import type { CapacitorConfig } from '@capacitor/cli'

const serverUrl = process.env.CAPACITOR_SERVER_URL

const config: CapacitorConfig = {
  appId: 'com.studyeng.app',
  appName: 'StudyEng',
  webDir: 'out',
  server: {
    // In production, load from the deployed web origin so API routes & SSR work.
    // Set CAPACITOR_SERVER_URL in your build environment
    // e.g. https://your-app.example.com
    url: serverUrl || undefined,
    cleartext: serverUrl?.startsWith('http://') ?? false,
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#000000',
    },
  },
}

export default config
