import Groq from 'groq-sdk'
import { Router } from 'express'
import { getGroqReply } from '../groq.js'
import type { ChatRequestBody, ChatResponseBody, ErrorResponseBody } from '../types.js'

export const chatRouter = Router()

function formatGroqError(error: unknown): { message: string; status: number } {
  if (error instanceof Groq.APIError) {
    if (error.status === 401) {
      return {
        status: 401,
        message:
          'Invalid Groq API key. Create a free key at console.groq.com (starts with "gsk_") and update .env.',
      }
    }
    if (error.status === 429) {
      return {
        status: 429,
        message:
          'Groq free tier rate limit reached. Wait a moment and retry.',
      }
    }
    return {
      status: error.status || 500,
      message: error.message || 'Groq API request failed',
    }
  }

  const raw = error instanceof Error ? error.message : 'Failed to generate a response'

  if (raw.includes('GROQ_API_KEY')) {
    return { status: 503, message: raw }
  }

  return { status: 500, message: raw }
}

chatRouter.post('/chat', async (req, res) => {
  try {
    const { messages } = req.body as ChatRequestBody
    const reply = await getGroqReply(messages)

    const response: ChatResponseBody = { reply }
    res.json(response)
  } catch (error) {
    console.error('[Groq chat error]', error)

    const { message, status } = formatGroqError(error)
    const body: ErrorResponseBody = { error: message }

    res.status(status).json(body)
  }
})
