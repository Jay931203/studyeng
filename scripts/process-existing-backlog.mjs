#!/usr/bin/env node

import { spawn } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const snapshotScriptPath = join(__dirname, 'content-batch-snapshot.mjs')

const child = spawn(process.execPath, [snapshotScriptPath], {
  stdio: 'inherit',
})

child.on('error', (error) => {
  console.error('[content:process:existing] failed to start:', error)
  process.exit(1)
})

child.on('exit', (code) => {
  if (code === 0) {
    console.log(
      '[content:process:existing] backlog snapshot saved to src/data/content-existing-batch.json'
    )
    console.log(
      '[content:process:existing] continue whisper/translation jobs with --ids-file=src/data/content-existing-batch.json'
    )
  }

  process.exit(code ?? 1)
})
