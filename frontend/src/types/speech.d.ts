export {}

declare global {
  interface SpeechRecognitionResultItem {
    transcript: string
    confidence: number
  }

  interface SpeechRecognitionResult {
    isFinal: boolean
    length: number
    [index: number]: SpeechRecognitionResultItem
  }

  interface SpeechRecognitionResultList {
    length: number
    [index: number]: SpeechRecognitionResult
  }

  interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList
    resultIndex: number
  }

  interface SpeechRecognitionErrorEvent extends Event {
    error: string
    message?: string
  }

  interface SpeechRecognition extends EventTarget {
    continuous: boolean
    interimResults: boolean
    lang: string
    maxAlternatives: number
    start: () => void
    stop: () => void
    abort: () => void
    onresult: ((event: SpeechRecognitionEvent) => void) | null
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
    onend: (() => void) | null
    onstart: (() => void) | null
  }

  var SpeechRecognition: {
    prototype: SpeechRecognition
    new (): SpeechRecognition
  }

  var webkitSpeechRecognition: {
    prototype: SpeechRecognition
    new (): SpeechRecognition
  }

  interface Window {
    SpeechRecognition?: typeof SpeechRecognition
    webkitSpeechRecognition?: typeof webkitSpeechRecognition
    webkitAudioContext?: typeof AudioContext
  }
}
