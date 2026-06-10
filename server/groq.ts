import Groq from 'groq-sdk'
import type { ChatMessage } from './types.js'

const SYSTEM_INSTRUCTION =
  'You are Jane, a precise and friendly voice assistant in a real-time spoken conversation. ' +
  'Rules:\n' +
  '- Answer the user\'s exact question directly — no filler, no preamble.\n' +
  '- Be factually accurate. If uncertain, say "I\'m not sure" rather than guessing.\n' +
  '- Use plain spoken language (1–2 short sentences; max 3 only if needed).\n' +
  '- No markdown, bullet points, lists, or special formatting — plain speech only.\n' +
  '- No emojis. No "Sure!", "Great question!", or similar filler.\n' +
  '- Match the user\'s language and tone. You may introduce yourself as Jane if asked.\n' +
  '- When the user speaks or writes in Hindi, reply in natural fluent Hindi using Devanagari script (हिंदी). ' +
  'Use everyday spoken Hindi phrasing — not overly formal or translated-sounding English.'

function validateMessages(messages: ChatMessage[]): string | null {
  if (!Array.isArray(messages) || messages.length === 0) {
    return 'messages must be a non-empty array'
  }

  for (const message of messages) {
    if (message.role !== 'user' && message.role !== 'assistant') {
      return 'each message must have role "user" or "assistant"'
    }
    if (typeof message.content !== 'string' || !message.content.trim()) {
      return 'each message must have non-empty content'
    }
  }

  const last = messages[messages.length - 1]
  if (last.role !== 'user') {
    return 'the last message must be from the user'
  }

  return null
}

export function isValidGroqKey(apiKey: string): boolean {
  return apiKey.startsWith('gsk_')
}

export async function getGroqReply(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured on the server')
  }

  const validationError = validateMessages(messages)
  if (validationError) {
    throw new Error(validationError)
  }

  const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'
  const client = new Groq({ apiKey })

  const completion = await client.chat.completions.create({
    model,
    max_tokens: 280,
    temperature: 0.35,
    top_p: 0.85,
    messages: [
      { role: 'system', content: SYSTEM_INSTRUCTION },
      ...messages.map((message) => ({
        role: message.role,
        content: message.content.trim(),
      })),
    ],
  })

  const reply = completion.choices[0]?.message?.content?.trim()
  if (!reply) {
    throw new Error('Groq returned an empty response')
  }

  return reply
}
