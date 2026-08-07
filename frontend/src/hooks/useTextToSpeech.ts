import type { AssistantVoicePreset } from '../constants/voicePresets'
import {
  getVoicePreset,
  pickVoiceForPreset,
  resolveSpeakingPreset,
} from '../constants/voicePresets'

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

function waitForVoices(timeoutMs = 2500): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const existing = speechSynthesis.getVoices()
    if (existing.length > 0) {
      resolve(existing)
      return
    }

    let settled = false

    const finish = (voices: SpeechSynthesisVoice[]) => {
      if (settled) return
      settled = true
      speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged)
      window.clearTimeout(timeoutId)
      resolve(voices)
    }

    const onVoicesChanged = () => {
      finish(speechSynthesis.getVoices())
    }

    const timeoutId = window.setTimeout(() => {
      finish(speechSynthesis.getVoices())
    }, timeoutMs)

    speechSynthesis.addEventListener('voiceschanged', onVoicesChanged)
    speechSynthesis.getVoices()
  })
}

export async function getAvailableVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!isSpeechSynthesisSupported()) return []

  let voices = speechSynthesis.getVoices()
  if (voices.length > 0) return voices

  voices = await waitForVoices()
  if (voices.length > 0) return voices

  speechSynthesis.getVoices()
  return speechSynthesis.getVoices()
}

export async function primeSpeechVoices(): Promise<void> {
  if (!isSpeechSynthesisSupported()) return
  await getAvailableVoices()
}

interface SpeakOptions {
  rate?: number
  pitch?: number
  voicePreset?: AssistantVoicePreset
}

export function stopSpeaking(): void {
  if (!isSpeechSynthesisSupported()) return
  speechSynthesis.cancel()
}

export async function speakText(text: string, options: SpeakOptions = {}): Promise<void> {
  if (!isSpeechSynthesisSupported() || !text.trim()) return

  stopSpeaking()

  const trimmed = text.trim()
  const presetId = resolveSpeakingPreset(
    options.voicePreset ?? 'indian-english-female',
    trimmed,
  )
  const preset = getVoicePreset(presetId)
  const voices = await getAvailableVoices()
  const voice = pickVoiceForPreset(voices, presetId)

  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(trimmed)

    if (voice) utterance.voice = voice
    utterance.lang = voice?.lang ?? preset.lang
    utterance.rate = options.rate ?? 1.15
    utterance.pitch = options.pitch ?? (preset.lang === 'hi-IN' ? 1.02 : 1)
    utterance.volume = 1

    let resumeInterval = 0
    let settled = false

    const finish = () => {
      if (settled) return
      settled = true
      window.clearInterval(resumeInterval)

      const waitUntilDone = () => {
        if (!speechSynthesis.speaking && !speechSynthesis.pending) {
          resolve()
          return
        }
        window.setTimeout(waitUntilDone, 50)
      }
      waitUntilDone()
    }

    utterance.onend = finish
    utterance.onerror = finish

    speechSynthesis.speak(utterance)

    resumeInterval = window.setInterval(() => {
      if (speechSynthesis.paused) {
        speechSynthesis.resume()
      }
    }, 250)
  })
}

export function useTextToSpeech() {
  return {
    speak: speakText,
    stop: stopSpeaking,
    prime: primeSpeechVoices,
    getVoices: getAvailableVoices,
    isSupported: isSpeechSynthesisSupported(),
  }
}
