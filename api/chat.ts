import type { VercelRequest, VercelResponse } from '@vercel/node'
import { formatGroqError } from '../backend/server/formatGroqError.js'
import { getGroqReply } from '../backend/server/groq.js'
import type { ChatRequestBody } from '../backend/server/types.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { messages } = req.body as ChatRequestBody
    const reply = await getGroqReply(messages)
    return res.status(200).json({ reply })
  } catch (error) {
    console.error('[Groq chat error]', error)
    const { message, status } = formatGroqError(error)
    return res.status(status).json({ error: message })
  }
}
