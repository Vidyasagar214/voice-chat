import { useCallback, useEffect, useRef } from 'react'
import { getAssistantReply } from '../services/assistant'
import { useSpeechRecognition } from './useSpeechRecognition'
import { useTextToSpeech } from './useTextToSpeech'
import { useVoiceStore } from '../store/voiceStore'
import type { ChatMessage } from '../types'

function buildChatMessages(
  transcripts: { speaker: 'user' | 'assistant'; text: string }[],
  latestUserMessage: string,
): ChatMessage[] {
  return [
    ...transcripts.map((t) => ({
      role: t.speaker,
      content: t.text,
    })),
    { role: 'user', content: latestUserMessage },
  ]
}

function isListeningBlocked(): boolean {
  const { conversationState, isProcessingTurn } = useVoiceStore.getState()
  return (
    isProcessingTurn ||
    conversationState === 'ASSISTANT_SPEAKING' ||
    conversationState === 'TURN_COMPLETE'
  )
}

export function useConversation(micReady: boolean) {
  const addTranscript = useVoiceStore((s) => s.addTranscript)
  const setConversationState = useVoiceStore((s) => s.setConversationState)
  const setLiveTranscript = useVoiceStore((s) => s.setLiveTranscript)
  const setProcessingTurn = useVoiceStore((s) => s.setProcessingTurn)
  const resetSilenceTimer = useVoiceStore((s) => s.resetSilenceTimer)
  const resetConversation = useVoiceStore((s) => s.resetConversation)
  const selectedMicrophone = useVoiceStore((s) => s.settings.selectedMicrophone)
  const assistantVoice = useVoiceStore((s) => s.settings.assistantVoice)

  const isProcessingRef = useRef(false)
  const sessionEpochRef = useRef(0)
  const micReadyRef = useRef(micReady)

  micReadyRef.current = micReady

  const speech = useSpeechRecognition(micReady, `${selectedMicrophone}:${assistantVoice}`)
  const tts = useTextToSpeech()

  const speechRef = useRef(speech)
  const ttsRef = useRef(tts)
  speechRef.current = speech
  ttsRef.current = tts

  const invalidateSession = useCallback(() => {
    sessionEpochRef.current += 1
    isProcessingRef.current = false
  }, [])

  const isSessionActive = useCallback((epoch: number) => {
    return epoch === sessionEpochRef.current && micReadyRef.current
  }, [])

  const resumeListening = useCallback(() => {
    setProcessingTurn(false)
    isProcessingRef.current = false
    resetSilenceTimer()

    if (!micReadyRef.current) {
      setConversationState('IDLE')
      return
    }

    setConversationState('LISTENING')

    if (speechRef.current.isSupported) {
      speechRef.current.start()
    }
  }, [setProcessingTurn, resetSilenceTimer, setConversationState])

  const speakAssistantReply = useCallback(
    async (text: string, epoch: number) => {
      if (!isSessionActive(epoch)) return

      setConversationState('ASSISTANT_SPEAKING')

      const { assistantVoiceEnabled, speechRate, assistantVoice } =
        useVoiceStore.getState().settings
      if (assistantVoiceEnabled && ttsRef.current.isSupported) {
        await ttsRef.current.speak(text, { rate: speechRate, voicePreset: assistantVoice })
      }
    },
    [setConversationState, isSessionActive],
  )

  const handleSpeechStart = useCallback(() => {
    if (isListeningBlocked()) return

    ttsRef.current.stop()
    resetSilenceTimer()
    setConversationState('SPEAKING')
  }, [resetSilenceTimer, setConversationState])

  const handleSpeechEnd = useCallback(() => {
    if (isListeningBlocked()) return

    const hasText = useVoiceStore.getState().liveTranscript.trim().length > 0
    if (hasText) {
      setConversationState('THINKING')
    }
  }, [setConversationState])

  const abortTurn = useCallback(
    (epoch: number) => {
      if (epoch !== sessionEpochRef.current) {
        isProcessingRef.current = false
        setProcessingTurn(false)
        return true
      }
      if (!micReadyRef.current) {
        isProcessingRef.current = false
        setProcessingTurn(false)
        setConversationState('IDLE')
        return true
      }
      return false
    },
    [setProcessingTurn, setConversationState],
  )

  const handleTurnComplete = useCallback(async () => {
    if (isProcessingRef.current) return

    const epoch = sessionEpochRef.current
    isProcessingRef.current = true
    setProcessingTurn(true)
    setConversationState('TURN_COMPLETE')

    const userText = speechRef.current.isSupported
      ? await speechRef.current.flushAndReset({ restart: false })
      : useVoiceStore.getState().liveTranscript.trim()

    if (abortTurn(epoch)) return

    if (speechRef.current.isSupported) speechRef.current.stop()

    const finalText = userText.trim()

    if (!finalText) {
      resumeListening()
      return
    }

    addTranscript({ speaker: 'user', text: finalText })
    setLiveTranscript('')
    setConversationState('THINKING')

    try {
      const priorTranscripts = useVoiceStore.getState().transcripts.slice(0, -1)
      const messages = buildChatMessages(priorTranscripts, finalText)
      const reply = await getAssistantReply(messages)

      if (abortTurn(epoch)) return

      addTranscript({ speaker: 'assistant', text: reply })
      setConversationState('ASSISTANT_SPEAKING')

      const { assistantVoiceEnabled, speechRate, assistantVoice } =
        useVoiceStore.getState().settings
      if (assistantVoiceEnabled && ttsRef.current.isSupported) {
        await ttsRef.current.speak(reply, { rate: speechRate, voicePreset: assistantVoice })
      }
    } catch (error) {
      if (abortTurn(epoch)) return

      const message =
        error instanceof Error
          ? error.message
          : 'Something went wrong while contacting the assistant.'

      const errorReply = `Sorry, I couldn't respond right now. ${message}`
      addTranscript({ speaker: 'assistant', text: errorReply })
      setConversationState('ASSISTANT_SPEAKING')

      const { assistantVoiceEnabled, speechRate, assistantVoice } =
        useVoiceStore.getState().settings
      if (assistantVoiceEnabled && ttsRef.current.isSupported) {
        await ttsRef.current.speak(errorReply, { rate: speechRate, voicePreset: assistantVoice })
      }
    }

    if (abortTurn(epoch)) return

    resumeListening()
  }, [
    addTranscript,
    setLiveTranscript,
    setConversationState,
    setProcessingTurn,
    resumeListening,
    abortTurn,
  ])

  const stopSession = useCallback(() => {
    invalidateSession()
    ttsRef.current.stop()
    speechRef.current.stop()
    speechRef.current.clearBuffers()
    resetSilenceTimer()
    setProcessingTurn(false)
    setLiveTranscript('')
    setConversationState('IDLE')
  }, [
    invalidateSession,
    resetSilenceTimer,
    setProcessingTurn,
    setLiveTranscript,
    setConversationState,
  ])

  const startNewChat = useCallback(() => {
    invalidateSession()
    ttsRef.current.stop()
    speechRef.current.clearBuffers()
    resetConversation()

    if (micReadyRef.current && speechRef.current.isSupported) {
      speechRef.current.start()
    }
  }, [invalidateSession, resetConversation])

  const replayMessage = useCallback(
    async (text: string) => {
      if (!micReadyRef.current || isProcessingRef.current) return

      const epoch = sessionEpochRef.current
      isProcessingRef.current = true
      setProcessingTurn(true)
      ttsRef.current.stop()
      if (speechRef.current.isSupported) speechRef.current.stop()

      await speakAssistantReply(text, epoch)

      if (abortTurn(epoch)) return

      resumeListening()
    },
    [speakAssistantReply, resumeListening, setProcessingTurn, abortTurn],
  )

  useEffect(() => {
    if (!micReady) {
      invalidateSession()
    }
  }, [micReady, invalidateSession])

  return {
    handleSpeechStart,
    handleSpeechEnd,
    handleTurnComplete,
    startNewChat,
    stopSession,
    replayMessage,
    speechSupported: speech.isSupported,
    ttsSupported: tts.isSupported,
  }
}
