import type { ChatMessage } from '../types'

const API_BASE = import.meta.env.VITE_API_URL ?? ''

interface ChatResponse {
  reply: string
}

interface ErrorResponse {
  error: string
}

export async function getAssistantReply(messages: ChatMessage[]): Promise<string> {
  const response = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  })

  const data = (await response.json()) as ChatResponse | ErrorResponse

  if (!response.ok) {
    const errorMessage =
      'error' in data ? data.error : 'Failed to get a response from the assistant'
    throw new Error(errorMessage)
  }

  if (!('reply' in data) || !data.reply.trim()) {
    throw new Error('Assistant returned an empty response')
  }

  return data.reply.trim()
}

export async function checkAssistantHealth(): Promise<{
  ok: boolean
  assistantConfigured: boolean
  keyLooksValid: boolean
  provider: string
}> {
  try {
    const response = await fetch(`${API_BASE}/api/health`)
    if (!response.ok) {
      return {
        ok: false,
        assistantConfigured: false,
        keyLooksValid: false,
        provider: 'groq',
      }
    }
    const data = await response.json()
    return {
      ok: Boolean(data.ok),
      assistantConfigured: Boolean(data.assistantConfigured),
      keyLooksValid: Boolean(data.keyLooksValid),
      provider: data.provider ?? 'groq',
    }
  } catch {
    return {
      ok: false,
      assistantConfigured: false,
      keyLooksValid: false,
      provider: 'groq',
    }
  }
}
