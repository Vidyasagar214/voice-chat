import type { VercelRequest, VercelResponse } from '@vercel/node'
import { isValidGroqKey } from '../backend/server/groq.js'

export default function handler(_req: VercelRequest, res: VercelResponse) {
  if (_req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.GROQ_API_KEY ?? ''

  return res.status(200).json({
    ok: true,
    assistantConfigured: Boolean(apiKey),
    keyLooksValid: isValidGroqKey(apiKey),
    provider: 'groq',
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    freeTier: true,
  })
}
