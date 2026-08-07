import { useCallback, useEffect, useRef } from 'react'
import { getRecognitionLang } from '../constants/voicePresets'
import { useVoiceStore } from '../store/voiceStore'

const RESTART_DELAY_MS = 50
const FLUSH_TIMEOUT_MS = 2200

function getSpeechRecognitionCtor(): (new () => SpeechRecognition) | null {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognitionCtor() !== null
}

export function useSpeechRecognition(enabled: boolean, restartKey = '') {
  const setLiveTranscript = useVoiceStore((s) => s.setLiveTranscript)
  const assistantVoice = useVoiceStore((s) => s.settings.assistantVoice)
  const recognitionLang = getRecognitionLang(assistantVoice)

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const finalizedRef = useRef('')
  const interimRef = useRef('')
  const shouldRunRef = useRef(false)
  const isRunningRef = useRef(false)
  const flushResolveRef = useRef<((text: string) => void) | null>(null)
  const flushTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const restartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startSessionRef = useRef<() => void>(() => {})

  const clearRestartTimeout = useCallback(() => {
    if (restartTimeoutRef.current) {
      window.clearTimeout(restartTimeoutRef.current)
      restartTimeoutRef.current = null
    }
  }, [])

  const syncLiveTranscript = useCallback(() => {
    const text = [finalizedRef.current, interimRef.current]
      .filter(Boolean)
      .join(' ')
      .trim()
    setLiveTranscript(text)
  }, [setLiveTranscript])

  const getFullTranscript = useCallback(() => {
    return [finalizedRef.current, interimRef.current]
      .filter(Boolean)
      .join(' ')
      .trim()
  }, [])

  const clearBuffers = useCallback(() => {
    finalizedRef.current = ''
    interimRef.current = ''
    setLiveTranscript('')
  }, [setLiveTranscript])

  const scheduleRestart = useCallback(
    (delay = RESTART_DELAY_MS) => {
      clearRestartTimeout()
      if (!shouldRunRef.current) return

      restartTimeoutRef.current = window.setTimeout(() => {
        restartTimeoutRef.current = null
        startSessionRef.current()
      }, delay)
    },
    [clearRestartTimeout],
  )

  const handleResult = useCallback(
    (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const transcript = result[0]?.transcript?.trim() ?? ''
        if (!transcript) continue

        if (result.isFinal) {
          finalizedRef.current = finalizedRef.current
            ? `${finalizedRef.current} ${transcript}`
            : transcript
          interimRef.current = ''
        }
      }

      let latestInterim = ''
      for (let i = event.results.length - 1; i >= 0; i--) {
        const result = event.results[i]
        if (!result.isFinal) {
          latestInterim = result[0]?.transcript?.trim() ?? ''
          break
        }
      }

      interimRef.current = latestInterim

      syncLiveTranscript()
    },
    [syncLiveTranscript],
  )

  const startSession = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor()
    if (!Ctor || !shouldRunRef.current || isRunningRef.current) return

    if (!recognitionRef.current) {
      const recognition = new Ctor()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.maxAlternatives = 3
      recognition.lang = recognitionLang

      recognition.onresult = handleResult

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        isRunningRef.current = false

        if (event.error === 'no-speech' || event.error === 'aborted') {
          const state = useVoiceStore.getState().conversationState
          const hasText = Boolean(getFullTranscript())
          scheduleRestart(
            state === 'SPEAKING' || (state === 'THINKING' && hasText) ? 300 : RESTART_DELAY_MS,
          )
          return
        }

        if (event.error === 'not-allowed') {
          useVoiceStore.getState().setMicError('Speech recognition permission denied')
          return
        }

        scheduleRestart(250)
      }

      recognition.onend = () => {
        isRunningRef.current = false

        if (flushResolveRef.current) {
          const text = getFullTranscript()
          flushResolveRef.current(text)
          flushResolveRef.current = null
          return
        }

        scheduleRestart()
      }

      recognitionRef.current = recognition
    }

    try {
      recognitionRef.current.start()
      isRunningRef.current = true
    } catch (err) {
      if (err instanceof DOMException && err.name === 'InvalidStateError') {
        isRunningRef.current = true
        return
      }
      scheduleRestart(250)
    }
  }, [handleResult, getFullTranscript, scheduleRestart, recognitionLang])

  startSessionRef.current = startSession

  const start = useCallback(() => {
    if (!isSpeechRecognitionSupported()) return
    shouldRunRef.current = true
    clearRestartTimeout()
    startSession()
  }, [startSession, clearRestartTimeout])

  const stop = useCallback(() => {
    shouldRunRef.current = false
    isRunningRef.current = false

    if (flushTimeoutRef.current) {
      window.clearTimeout(flushTimeoutRef.current)
      flushTimeoutRef.current = null
    }

    if (flushResolveRef.current) {
      const resolve = flushResolveRef.current
      flushResolveRef.current = null
      resolve(getFullTranscript())
    }

    clearRestartTimeout()

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort()
      } catch {
        /* ignore */
      }
      recognitionRef.current = null
    }
  }, [clearRestartTimeout, getFullTranscript])

  const flushAndReset = useCallback(
    (options?: { restart?: boolean }): Promise<string> => {
      const shouldRestart = options?.restart !== false

      return new Promise<string>((resolve) => {
        const preFlush = getFullTranscript()

        if (!recognitionRef.current || !isRunningRef.current) {
          clearBuffers()
          resolve(preFlush)
          return
        }

        const timeout = window.setTimeout(() => {
          if (flushResolveRef.current) {
            flushResolveRef.current(getFullTranscript() || preFlush)
            flushResolveRef.current = null
            flushTimeoutRef.current = null
          }
        }, FLUSH_TIMEOUT_MS)
        flushTimeoutRef.current = timeout

        flushResolveRef.current = (text) => {
          window.clearTimeout(timeout)
          flushTimeoutRef.current = null
          clearBuffers()
          resolve(text || preFlush)
        }

        try {
          recognitionRef.current.stop()
        } catch {
          window.clearTimeout(timeout)
          flushTimeoutRef.current = null
          flushResolveRef.current = null
          clearBuffers()
          resolve(preFlush)
        }
      }).then((text) => {
        if (shouldRestart && shouldRunRef.current) {
          scheduleRestart(100)
        }
        return text
      })
    },
    [clearBuffers, getFullTranscript, scheduleRestart],
  )

  useEffect(() => {
    if (enabled) {
      start()
    } else {
      stop()
      clearBuffers()
    }

    return () => {
      stop()
      clearBuffers()
    }
  }, [enabled, restartKey, start, stop, clearBuffers])

  return {
    start,
    stop,
    flushAndReset,
    getFullTranscript,
    clearBuffers,
    isSupported: isSpeechRecognitionSupported(),
  }
}
