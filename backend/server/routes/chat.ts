import { Router } from 'express'
import { formatGroqError } from '../formatGroqError.js'
import { getGroqReply } from '../groq.js'
import type { ChatRequestBody, ChatResponseBody, ErrorResponseBody } from '../types.js'

export const chatRouter = Router()

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
