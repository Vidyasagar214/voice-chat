import { useEffect, useRef } from 'react'
import type { MicVAD as MicVADType } from '@ricky0123/vad-web'
import { formatMediaError } from '../utils/browserCapabilities'
import { useVoiceStore } from '../store/voiceStore'

interface UseVoiceDetectionOptions {
  enabled: boolean
  sensitivity: number
  onSpeechStart?: () => void
  onSpeechEnd?: () => void
}

function computeRmsLevel(frame: Float32Array): number {
  let sum = 0
  for (let i = 0; i < frame.length; i++) {
    sum += frame[i] * frame[i]
  }
  return Math.min(Math.sqrt(sum / frame.length) * 12, 1)
}

function buildVadThresholds(sensitivity: number) {
  const clamped = Math.min(Math.max(sensitivity, 0), 1)
  return {
    positiveSpeechThreshold: Math.max(0.22, 0.62 - clamped * 0.42),
    negativeSpeechThreshold: Math.max(0.12, 0.42 - clamped * 0.35),
  }
}

export function useVoiceDetection({
  enabled,
  sensitivity,
  onSpeechStart,
  onSpeechEnd,
}: UseVoiceDetectionOptions) {
  const vadRef = useRef<MicVADType | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const onSpeechStartRef = useRef(onSpeechStart)
  const onSpeechEndRef = useRef(onSpeechEnd)

  onSpeechStartRef.current = onSpeechStart
  onSpeechEndRef.current = onSpeechEnd

  const setVoiceLevel = useVoiceStore((s) => s.setVoiceLevel)
  const setMicrophoneEnabled = useVoiceStore((s) => s.setMicrophoneEnabled)
  const setMicError = useVoiceStore((s) => s.setMicError)
  const setConversationState = useVoiceStore((s) => s.setConversationState)
  const conversationState = useVoiceStore((s) => s.conversationState)
  const selectedMicrophone = useVoiceStore((s) => s.settings.selectedMicrophone)

  useEffect(() => {
    if (!enabled || !vadRef.current) return

    if (
      conversationState === 'ASSISTANT_SPEAKING' ||
      conversationState === 'TURN_COMPLETE' ||
      useVoiceStore.getState().isProcessingTurn
    ) {
      vadRef.current.pause()
      setVoiceLevel(0)
      return
    }

    void vadRef.current.start()
  }, [conversationState, enabled, setVoiceLevel])

  useEffect(() => {
    if (!enabled) {
      vadRef.current?.pause()
      setVoiceLevel(0)
      setMicrophoneEnabled(false)
      if (useVoiceStore.getState().conversationState !== 'ASSISTANT_SPEAKING') {
        setConversationState('IDLE')
      }
      return
    }

    let cancelled = false

    const initVAD = async () => {
      try {
        setMicError(null)

        if (!window.isSecureContext && location.hostname !== 'localhost') {
          setMicError(
            'Microphone requires HTTPS. Open this app over a secure connection',
          )
          setMicrophoneEnabled(false)
          setConversationState('IDLE')
          return
        }

        if (!navigator.mediaDevices?.getUserMedia) {
          setMicError('This browser does not support microphone access')
          setMicrophoneEnabled(false)
          setConversationState('IDLE')
          return
        }

        const audioConstraints: MediaTrackConstraints = {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          ...(selectedMicrophone ? { deviceId: { ideal: selectedMicrophone } } : {}),
        }

        const stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }

        streamRef.current = stream
        setMicrophoneEnabled(true)
        setConversationState('LISTENING')

        const { positiveSpeechThreshold, negativeSpeechThreshold } =
          buildVadThresholds(sensitivity)

        const vadModule = await import('@ricky0123/vad-web')
        const MicVAD = vadModule.MicVAD

        const vad = await MicVAD.new({
          getStream: async () => stream,
          positiveSpeechThreshold,
          negativeSpeechThreshold,
          minSpeechMs: 120,
          redemptionMs: 1500,
          preSpeechPadMs: 450,
          onnxWASMBasePath:
            'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/',
          baseAssetPath:
            'https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.30/dist/',
          onFrameProcessed: (_probs, frame) => {
            setVoiceLevel(computeRmsLevel(frame))
          },
          onSpeechStart: () => {
            const { isProcessingTurn, conversationState } = useVoiceStore.getState()
            if (
              isProcessingTurn ||
              conversationState === 'ASSISTANT_SPEAKING' ||
              conversationState === 'TURN_COMPLETE'
            ) {
              return
            }
            onSpeechStartRef.current?.()
          },
          onSpeechEnd: () => {
            const { isProcessingTurn, conversationState } = useVoiceStore.getState()
            if (
              isProcessingTurn ||
              conversationState === 'ASSISTANT_SPEAKING' ||
              conversationState === 'TURN_COMPLETE'
            ) {
              return
            }
            onSpeechEndRef.current?.()
          },
          onVADMisfire: () => {},
        })

        if (cancelled) {
          vad.destroy()
          return
        }

        vadRef.current = vad
        await vad.start()
      } catch (err) {
        setMicError(formatMediaError(err))
        setMicrophoneEnabled(false)
        setConversationState('IDLE')
      }
    }

    initVAD()

    return () => {
      cancelled = true

      if (vadRef.current) {
        vadRef.current.destroy()
        vadRef.current = null
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }

      setVoiceLevel(0)
      setMicrophoneEnabled(false)
    }
  }, [
    enabled,
    sensitivity,
    selectedMicrophone,
    setVoiceLevel,
    setMicrophoneEnabled,
    setMicError,
    setConversationState,
  ])
}
