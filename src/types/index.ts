import type { AssistantVoicePreset } from '../constants/voicePresets'

export type ConversationState =
  | 'IDLE'
  | 'LISTENING'
  | 'SPEAKING'
  | 'THINKING'
  | 'TURN_COMPLETE'
  | 'ASSISTANT_SPEAKING'

export type Speaker = 'user' | 'assistant'

export interface Transcript {
  id: string
  speaker: Speaker
  text: string
  timestamp: Date
}

export interface AppSettings {
  silenceTimeout: number
  forceCompleteTimeout: number
  voiceSensitivity: number
  theme: 'dark' | 'light'
  selectedMicrophone: string
  assistantVoiceEnabled: boolean
  assistantVoice: AssistantVoicePreset
  speechRate: number
  showTranscript: boolean
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ConversationStateInfo {
  label: string
  description: string
  color: string
}
