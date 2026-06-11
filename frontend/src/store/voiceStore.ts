import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppSettings, ConversationState, Transcript } from '../types'
import type { AssistantVoicePreset } from '../constants/voicePresets'
import { normalizeAssistantVoice } from '../constants/voicePresets'

interface VoiceStore {
  conversationState: ConversationState
  transcripts: Transcript[]
  microphoneEnabled: boolean
  silenceTimer: number
  voiceLevel: number
  settings: AppSettings
  isSettingsOpen: boolean
  liveTranscript: string
  isProcessingTurn: boolean
  micError: string | null

  setConversationState: (state: ConversationState) => void
  addTranscript: (transcript: Omit<Transcript, 'id' | 'timestamp'>) => void
  setMicrophoneEnabled: (enabled: boolean) => void
  setSilenceTimer: (timer: number) => void
  setVoiceLevel: (level: number) => void
  updateSettings: (settings: Partial<AppSettings>) => void
  setSettings: (settings: AppSettings) => void
  setSettingsOpen: (open: boolean) => void
  setLiveTranscript: (text: string) => void
  appendLiveTranscript: (text: string) => void
  setProcessingTurn: (processing: boolean) => void
  setMicError: (error: string | null) => void
  resetSilenceTimer: () => void
  clearTranscripts: () => void
  resetConversation: () => void
}

const defaultSettings: AppSettings = {
  silenceTimeout: 4500,
  forceCompleteTimeout: 10000,
  voiceSensitivity: 0.8,
  theme: 'dark',
  selectedMicrophone: '',
  assistantVoiceEnabled: true,
  assistantVoice: 'indian-english-female' satisfies AssistantVoicePreset,
  speechRate: 1.15,
  showTranscript: false,
}

function normalizeSettings(partial: Partial<AppSettings>, current: AppSettings): AppSettings {
  const next = { ...current, ...partial }

  if (next.forceCompleteTimeout < next.silenceTimeout + 500) {
    next.forceCompleteTimeout = next.silenceTimeout + 500
  }

  if (next.silenceTimeout > next.forceCompleteTimeout - 500) {
    next.silenceTimeout = Math.max(1000, next.forceCompleteTimeout - 500)
  }

  next.assistantVoice = normalizeAssistantVoice(next.assistantVoice)

  return next
}

export function mergeSettings(
  current: AppSettings,
  partial: Partial<AppSettings>,
): AppSettings {
  return normalizeSettings(partial, current)
}

export function createDefaultSettings(): AppSettings {
  return { ...defaultSettings }
}

export const useVoiceStore = create<VoiceStore>()(
  persist(
    (set) => ({
      conversationState: 'IDLE',
      transcripts: [],
      microphoneEnabled: false,
      silenceTimer: 0,
      voiceLevel: 0,
      settings: defaultSettings,
      isSettingsOpen: false,
      liveTranscript: '',
      isProcessingTurn: false,
      micError: null,

      setConversationState: (conversationState) => set({ conversationState }),

      addTranscript: (transcript) =>
        set((state) => ({
          transcripts: [
            ...state.transcripts,
            {
              ...transcript,
              id: crypto.randomUUID(),
              timestamp: new Date(),
            },
          ],
        })),

      setMicrophoneEnabled: (microphoneEnabled) => set({ microphoneEnabled }),
      setSilenceTimer: (silenceTimer) => set({ silenceTimer }),
      setVoiceLevel: (voiceLevel) => set({ voiceLevel }),
      updateSettings: (partial) =>
        set((state) => ({
          settings: normalizeSettings(partial, state.settings),
        })),
      setSettings: (settings) =>
        set({
          settings: normalizeSettings(settings, { ...defaultSettings, ...settings }),
        }),
      setSettingsOpen: (isSettingsOpen) => set({ isSettingsOpen }),
      setLiveTranscript: (liveTranscript) => set({ liveTranscript }),
      appendLiveTranscript: (text) =>
        set((state) => ({
          liveTranscript: state.liveTranscript
            ? `${state.liveTranscript} ${text}`
            : text,
        })),
      setProcessingTurn: (isProcessingTurn) => set({ isProcessingTurn }),
      setMicError: (micError) => set({ micError }),
      resetSilenceTimer: () => set({ silenceTimer: 0 }),
      clearTranscripts: () => set({ transcripts: [], liveTranscript: '' }),
      resetConversation: () =>
        set((state) => ({
          transcripts: [],
          liveTranscript: '',
          silenceTimer: 0,
          isProcessingTurn: false,
          conversationState: state.microphoneEnabled ? 'LISTENING' : 'IDLE',
        })),
    }),
    {
      name: 'voiceflow-settings',
      partialize: (state) => ({ settings: state.settings }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.settings = normalizeSettings(
            { ...defaultSettings, ...state.settings },
            defaultSettings,
          )
          if (state.settings.theme) {
            document.documentElement.setAttribute('data-theme', state.settings.theme)
          }
        }
      },
    },
  ),
)

export const STATE_INFO: Record<
  ConversationState,
  { label: string; description: string; color: string }
> = {
  IDLE: {
    label: 'Idle',
    description: 'Ready to begin',
    color: '#71717a',
  },
  LISTENING: {
    label: 'Listening',
    description: 'Waiting for your voice',
    color: '#7c3aed',
  },
  SPEAKING: {
    label: 'Speaking',
    description: 'Capturing your words',
    color: '#a78bfa',
  },
  THINKING: {
    label: 'Thinking',
    description: 'Processing your message',
    color: '#6366f1',
  },
  TURN_COMPLETE: {
    label: 'Turn Complete',
    description: 'Message received',
    color: '#22c55e',
  },
  ASSISTANT_SPEAKING: {
    label: 'Responding',
    description: 'Jane is speaking',
    color: '#22d3ee',
  },
}
