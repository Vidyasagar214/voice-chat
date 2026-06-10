import { useEffect, useRef } from 'react'
import { useVoiceStore } from '../store/voiceStore'
import type { ConversationState } from '../types'

interface UseSilenceDetectionOptions {
  onTurnComplete: () => void
}

const CAPTURE_STATES: ConversationState[] = ['LISTENING', 'SPEAKING', 'THINKING']

function shouldMonitorSilence(
  state: ConversationState,
  liveTranscript: string,
  isProcessingTurn: boolean,
): boolean {
  if (isProcessingTurn) return false
  if (state === 'ASSISTANT_SPEAKING' || state === 'TURN_COMPLETE' || state === 'IDLE') {
    return false
  }

  if (state === 'THINKING') return true

  return CAPTURE_STATES.includes(state) && liveTranscript.trim().length > 0
}

export function useSilenceDetection({ onTurnComplete }: UseSilenceDetectionOptions) {
  const conversationState = useVoiceStore((s) => s.conversationState)
  const liveTranscript = useVoiceStore((s) => s.liveTranscript)
  const isProcessingTurn = useVoiceStore((s) => s.isProcessingTurn)
  const silenceTimeout = useVoiceStore((s) => s.settings.silenceTimeout)
  const forceCompleteTimeout = useVoiceStore((s) => s.settings.forceCompleteTimeout)
  const setSilenceTimer = useVoiceStore((s) => s.setSilenceTimer)
  const setConversationState = useVoiceStore((s) => s.setConversationState)
  const resetSilenceTimer = useVoiceStore((s) => s.resetSilenceTimer)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const silenceStartRef = useRef<number | null>(null)
  const completedRef = useRef(false)
  const prevTranscriptRef = useRef('')
  const onTurnCompleteRef = useRef(onTurnComplete)

  onTurnCompleteRef.current = onTurnComplete

  const monitoring = shouldMonitorSilence(
    conversationState,
    liveTranscript,
    isProcessingTurn,
  )

  useEffect(() => {
    if (!monitoring) {
      prevTranscriptRef.current = liveTranscript
      return
    }

    if (liveTranscript && liveTranscript !== prevTranscriptRef.current) {
      silenceStartRef.current = Date.now()
      setSilenceTimer(0)
      completedRef.current = false

      if (conversationState === 'LISTENING') {
        setConversationState('SPEAKING')
      }
    }

    prevTranscriptRef.current = liveTranscript
  }, [
    liveTranscript,
    conversationState,
    monitoring,
    setSilenceTimer,
    setConversationState,
  ])

  useEffect(() => {
    if (!monitoring) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      silenceStartRef.current = null
      resetSilenceTimer()
      return
    }

    if (!silenceStartRef.current) {
      silenceStartRef.current = Date.now()
    }
    completedRef.current = false

    intervalRef.current = setInterval(() => {
      if (!silenceStartRef.current || completedRef.current) return

      const elapsed = Date.now() - silenceStartRef.current
      setSilenceTimer(elapsed)

      if (elapsed >= forceCompleteTimeout) {
        completedRef.current = true
        setConversationState('TURN_COMPLETE')
        onTurnCompleteRef.current()
      } else if (elapsed >= silenceTimeout) {
        completedRef.current = true
        setConversationState('TURN_COMPLETE')
        onTurnCompleteRef.current()
      }
    }, 50)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [
    monitoring,
    silenceTimeout,
    forceCompleteTimeout,
    setSilenceTimer,
    setConversationState,
    resetSilenceTimer,
  ])
}

export function getSilenceProgress(
  state: ConversationState,
  silenceTimer: number,
  silenceTimeout: number,
): number {
  if (silenceTimer <= 0) return 0
  if (state === 'THINKING' || state === 'SPEAKING' || state === 'LISTENING') {
    return Math.min(silenceTimer / silenceTimeout, 1)
  }
  return 0
}
