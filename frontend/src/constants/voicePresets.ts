export type AssistantVoicePreset =
  | 'indian-english-female'
  | 'indian-english-male'
  | 'hindi-female'
  | 'hindi-male'
  | 'us-english-female'
  | 'uk-english-female'

export interface VoicePresetOption {
  id: AssistantVoicePreset
  label: string
  description: string
  lang: string
  namePatterns: string[]
}

export const ASSISTANT_VOICE_PRESETS: VoicePresetOption[] = [
  {
    id: 'indian-english-female',
    label: 'Indian English — Female (Jane)',
    description: 'Natural Indian English, warm and clear',
    lang: 'en-IN',
    namePatterns: ['Neerja', 'Veena', 'Heera', 'Lekha', 'English (India)', 'India Female'],
  },
  {
    id: 'indian-english-male',
    label: 'Indian English — Male',
    description: 'Indian English with a confident male tone',
    lang: 'en-IN',
    namePatterns: ['Prabhat', 'Rishi', 'India Male'],
  },
  {
    id: 'hindi-female',
    label: 'Hindi — Female',
    description: 'Fluent Hindi with a natural female voice',
    lang: 'hi-IN',
    namePatterns: ['Swara', 'Neerja', 'Hindi Female', 'हिन्दी', 'Hindi India Female'],
  },
  {
    id: 'hindi-male',
    label: 'Hindi — Male',
    description: 'Fluent Hindi with a natural male voice',
    lang: 'hi-IN',
    namePatterns: ['Madhur', 'Prabhat', 'Hindi Male', 'Hindi India Male'],
  },
  {
    id: 'us-english-female',
    label: 'US English — Female',
    description: 'American English, neutral and crisp',
    lang: 'en-US',
    namePatterns: ['Samantha', 'Zira', 'Google US English', 'Microsoft Aria', 'Jenny'],
  },
  {
    id: 'uk-english-female',
    label: 'UK English — Female',
    description: 'British English, polished and clear',
    lang: 'en-GB',
    namePatterns: ['Sonia', 'Hazel', 'Google UK English Female', 'Libby', 'Microsoft Sonia'],
  },
]

const PRESET_MAP = Object.fromEntries(
  ASSISTANT_VOICE_PRESETS.map((preset) => [preset.id, preset]),
) as Record<AssistantVoicePreset, VoicePresetOption>

const VALID_VOICE_PRESETS = new Set<AssistantVoicePreset>(
  ASSISTANT_VOICE_PRESETS.map((preset) => preset.id),
)

const DEVANAGARI_RE = /[\u0900-\u097F]/

export function isValidAssistantVoice(value: unknown): value is AssistantVoicePreset {
  return typeof value === 'string' && VALID_VOICE_PRESETS.has(value as AssistantVoicePreset)
}

export function normalizeAssistantVoice(value: unknown): AssistantVoicePreset {
  return isValidAssistantVoice(value) ? value : 'indian-english-female'
}

export function getPreviewSampleText(preset: AssistantVoicePreset): string {
  if (isHindiPreset(preset)) {
    return 'नमस्ते, मैं जेन हूँ। आज मैं आपकी कैसे मदद कर सकती हूँ?'
  }
  return "Hi, I'm Jane. How can I help you today?"
}

export function containsHindi(text: string): boolean {
  return DEVANAGARI_RE.test(text)
}

export function isHindiPreset(preset: AssistantVoicePreset): boolean {
  return preset === 'hindi-female' || preset === 'hindi-male'
}

export function getVoicePreset(id: AssistantVoicePreset): VoicePresetOption {
  return PRESET_MAP[id] ?? PRESET_MAP['indian-english-female']
}

/** Use Hindi voices automatically when Jane replies in Devanagari. */
export function resolveSpeakingPreset(
  preset: AssistantVoicePreset,
  text: string,
): AssistantVoicePreset {
  if (!containsHindi(text)) return preset
  if (isHindiPreset(preset)) return preset
  if (preset === 'indian-english-male') return 'hindi-male'
  return 'hindi-female'
}

export function getRecognitionLang(preset: AssistantVoicePreset): string {
  if (isHindiPreset(preset)) return 'hi-IN'
  if (preset === 'us-english-female') return 'en-US'
  if (preset === 'uk-english-female') return 'en-GB'
  return 'en-IN'
}

function langMatches(voiceLang: string, targetLang: string): boolean {
  const normalized = voiceLang.toLowerCase()
  const target = targetLang.toLowerCase()
  return normalized === target || normalized.startsWith(`${target.split('-')[0]}-`)
}

export function pickVoiceForPreset(
  voices: SpeechSynthesisVoice[],
  presetId: AssistantVoicePreset,
): SpeechSynthesisVoice | undefined {
  const preset = getVoicePreset(presetId)

  const localeVoices = voices.filter((voice) => langMatches(voice.lang, preset.lang))

  for (const pattern of preset.namePatterns) {
    const match = localeVoices.find((voice) =>
      voice.name.toLowerCase().includes(pattern.toLowerCase()),
    )
    if (match) return match
  }

  const naturalVoice = localeVoices.find((voice) => /natural|online|neural/i.test(voice.name))
  if (naturalVoice) return naturalVoice

  const localVoice = localeVoices.find((voice) => voice.localService)
  if (localVoice) return localVoice

  if (localeVoices.length > 0) return localeVoices[0]

  for (const pattern of preset.namePatterns) {
    const match = voices.find((voice) =>
      voice.name.toLowerCase().includes(pattern.toLowerCase()),
    )
    if (match) return match
  }

  return undefined
}

export function resolveVoiceMatch(
  voices: SpeechSynthesisVoice[],
  presetId: AssistantVoicePreset,
  sampleText?: string,
): { preset: AssistantVoicePreset; voice?: SpeechSynthesisVoice } {
  const preset = sampleText ? resolveSpeakingPreset(presetId, sampleText) : presetId
  return {
    preset,
    voice: pickVoiceForPreset(voices, preset),
  }
}
