export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatRequestBody {
  messages: ChatMessage[]
}

export interface ChatResponseBody {
  reply: string
}

export interface ErrorResponseBody {
  error: string
}
