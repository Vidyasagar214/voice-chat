import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chatRouter } from './routes/chat.js'
import { isValidGroqKey } from './groq.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT) || 8787
const isProduction = process.env.NODE_ENV === 'production'

const app = express()

app.use(cors({ origin: true }))
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_req, res) => {
  const apiKey = process.env.GROQ_API_KEY ?? ''

  res.json({
    ok: true,
    assistantConfigured: Boolean(apiKey),
    keyLooksValid: isValidGroqKey(apiKey),
    provider: 'groq',
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    freeTier: true,
  })
})

app.use('/api', chatRouter)

if (isProduction) {
  const distPath = path.join(__dirname, '../dist')
  app.use(express.static(distPath))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`VoiceFlow server running on http://localhost:${PORT}`)

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    console.warn('Warning: GROQ_API_KEY is not set. Chat requests will fail.')
  } else if (!isValidGroqKey(apiKey)) {
    console.warn(
      'Warning: GROQ_API_KEY does not look valid. Free keys from Groq start with "gsk_".',
    )
    console.warn('Create one at: https://console.groq.com/keys')
  }
}).on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `Port ${PORT} is already in use. Set a different PORT in .env (e.g. PORT=8787) and restart.`,
    )
  } else {
    console.error('Server failed to start:', err.message)
  }
  process.exit(1)
})
