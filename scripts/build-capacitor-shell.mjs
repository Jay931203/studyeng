import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: '.env.local', override: false, quiet: true })
loadEnv({ quiet: true })

const outDir = join(process.cwd(), 'out')
const serverUrl = process.env.CAPACITOR_SERVER_URL?.trim() ?? ''

if (!serverUrl) {
  throw new Error(
    'CAPACITOR_SERVER_URL is required for cap:prepare. Set it in the shell or .env.local before syncing the native shell.',
  )
}

mkdirSync(outDir, { recursive: true })

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, viewport-fit=cover"
    />
    <title>StudyEng</title>
    <style>
      :root {
        color-scheme: dark;
      }

      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #050505;
        color: #f8fafc;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      main {
        width: min(420px, calc(100vw - 40px));
        text-align: center;
      }

      h1 {
        margin: 0 0 12px;
        font-size: 22px;
        font-weight: 700;
      }

      p {
        margin: 0;
        line-height: 1.5;
        color: rgba(248, 250, 252, 0.72);
      }

      a {
        color: #5eead4;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>StudyEng</h1>
      <p>Loading the mobile app shell.</p>
      <p style="margin-top: 12px;">If loading does not continue, open <a href="${serverUrl}">${serverUrl}</a>.</p>
    </main>
  </body>
</html>
`

writeFileSync(join(outDir, 'index.html'), html, 'utf8')
