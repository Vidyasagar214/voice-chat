export interface BrowserCapabilities {
  isSecureContext: boolean
  hasMediaDevices: boolean
  hasGetUserMedia: boolean
  hasSpeechRecognition: boolean
  hasSpeechSynthesis: boolean
  hasAudioContext: boolean
  isIOS: boolean
  isSafari: boolean
  isFirefox: boolean
  isChromium: boolean
  canStartVoiceChat: boolean
  warnings: string[]
  blockers: string[]
}

function detectIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

function detectSafari(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return /Safari/i.test(ua) && !/Chrome|CriOS|Chromium|Edg|OPR|Firefox|FxiOS/i.test(ua)
}

function detectFirefox(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Firefox|FxiOS/i.test(navigator.userAgent)
}

function detectChromium(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Chrome|CriOS|Chromium|Edg|EdgiOS|OPR/i.test(navigator.userAgent)
}

export function getBrowserCapabilities(): BrowserCapabilities {
  if (typeof window === 'undefined') {
    return {
      isSecureContext: false,
      hasMediaDevices: false,
      hasGetUserMedia: false,
      hasSpeechRecognition: false,
      hasSpeechSynthesis: false,
      hasAudioContext: false,
      isIOS: false,
      isSafari: false,
      isFirefox: false,
      isChromium: false,
      canStartVoiceChat: false,
      warnings: [],
      blockers: ['Running outside a browser environment'],
    }
  }

  const isSecureContext = window.isSecureContext || location.hostname === 'localhost'
  const hasMediaDevices = Boolean(navigator.mediaDevices)
  const hasGetUserMedia = Boolean(navigator.mediaDevices?.getUserMedia)
  const hasSpeechRecognition = Boolean(
    typeof window !== 'undefined' &&
      (window.SpeechRecognition || window.webkitSpeechRecognition),
  )
  const hasSpeechSynthesis = 'speechSynthesis' in window
  const hasAudioContext = Boolean(
    window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext,
  )

  const isIOS = detectIOS()
  const isSafari = detectSafari()
  const isFirefox = detectFirefox()
  const isChromium = detectChromium()

  const blockers: string[] = []
  const warnings: string[] = []

  if (!isSecureContext) {
    blockers.push(
      'Microphone access requires HTTPS (or localhost). Open this app over a secure connection.',
    )
  }

  if (!hasGetUserMedia) {
    blockers.push('This browser does not support microphone access.')
  }

  if (!hasSpeechRecognition) {
    blockers.push(
      'Live speech recognition is not supported here. Use the latest Chrome or Edge for the best experience.',
    )
  }

  if (!hasSpeechSynthesis) {
    warnings.push('Text-to-speech is unavailable — Jane can reply in text but may not speak aloud.')
  }

  if (isSafari || isIOS) {
    warnings.push(
      'On Safari/iOS, allow microphone access when prompted. Speech recognition can be less reliable than Chrome.',
    )
  }

  if (isFirefox) {
    warnings.push(
      'Firefox has limited voice-chat support. Chrome or Edge is recommended for full features.',
    )
  }

  const canStartVoiceChat = blockers.length === 0

  return {
    isSecureContext,
    hasMediaDevices,
    hasGetUserMedia,
    hasSpeechRecognition,
    hasSpeechSynthesis,
    hasAudioContext,
    isIOS,
    isSafari,
    isFirefox,
    isChromium,
    canStartVoiceChat,
    warnings,
    blockers,
  }
}

export function formatMediaError(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Microphone access failed'
  }

  const name = 'name' in error ? String((error as DOMException).name) : ''
  const message = error.message || ''

  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return 'Microphone permission denied. Allow mic access in your browser settings and try again'
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return 'No microphone found. Connect a mic and try again'
  }
  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return 'Microphone is busy or unavailable. Close other apps using the mic and try again'
  }
  if (name === 'OverconstrainedError') {
    return 'Selected microphone is unavailable. Choose another mic in Settings'
  }
  if (name === 'SecurityError') {
    return 'Microphone blocked by browser security. Use HTTPS and allow mic access'
  }
  if (name === 'AbortError') {
    return 'Microphone request was interrupted. Please try again'
  }

  if (/permission|denied|not allowed/i.test(message)) {
    return 'Microphone permission denied. Allow mic access and try again'
  }

  return message || 'Microphone access failed'
}

/** Unlock Web Audio on iOS/Safari after a user gesture (Start Talking). */
export async function unlockAudioPlayback(): Promise<void> {
  if (typeof window === 'undefined') return

  try {
    const AudioCtx =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return

    const ctx = new AudioCtx()
    if (ctx.state === 'suspended') {
      await ctx.resume()
    }

    const buffer = ctx.createBuffer(1, 1, 22050)
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(ctx.destination)
    source.start(0)

    if (typeof speechSynthesis !== 'undefined') {
      speechSynthesis.getVoices()
      // iOS sometimes needs a silent utterance unlock
      const unlock = new SpeechSynthesisUtterance(' ')
      unlock.volume = 0
      speechSynthesis.speak(unlock)
      speechSynthesis.cancel()
    }

    await ctx.close()
  } catch {
    /* unlock is best-effort */
  }
}
