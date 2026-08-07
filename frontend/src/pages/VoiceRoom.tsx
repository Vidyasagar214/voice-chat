import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, MessageSquare, MessageSquarePlus, Settings, Waves } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CompatibilityBanner } from '../components/CompatibilityBanner'
import { JaneAssistPanel } from '../components/JaneAssistPanel'
import { LiveCaption } from '../components/LiveCaption'
import { SettingsDrawer } from '../components/SettingsDrawer'
import { TranscriptTimeline } from '../components/TranscriptTimeline'
import { VoiceIndicator } from '../components/VoiceIndicator'
import { VoiceOrb } from '../components/VoiceOrb'
import { ASSISTANT_VOICE_PRESETS } from '../constants/voicePresets'
import { ASSISTANT_NAME } from '../constants/assistant'
import { useConversation } from '../hooks/useConversation'
import { useSilenceDetection } from '../hooks/useSilenceDetection'
import { useVoiceDetection } from '../hooks/useVoiceDetection'
import { primeSpeechVoices } from '../hooks/useTextToSpeech'
import { checkAssistantHealth } from '../services/assistant'
import { useVoiceStore } from '../store/voiceStore'
import {
  getBrowserCapabilities,
  unlockAudioPlayback,
} from '../utils/browserCapabilities'

export function VoiceRoom() {
  const [sessionActive, setSessionActive] = useState(false)
  const [sessionSeconds, setSessionSeconds] = useState(0)
  const [assistantReady, setAssistantReady] = useState<boolean | null>(null)
  const sessionStartRef = useRef<number | null>(null)

  const caps = useMemo(() => getBrowserCapabilities(), [])

  const setSettingsOpen = useVoiceStore((s) => s.setSettingsOpen)
  const updateSettings = useVoiceStore((s) => s.updateSettings)
  const voiceSensitivity = useVoiceStore((s) => s.settings.voiceSensitivity)
  const showTranscript = useVoiceStore((s) => s.settings.showTranscript)
  const assistantVoiceEnabled = useVoiceStore((s) => s.settings.assistantVoiceEnabled)
  const assistantVoice = useVoiceStore((s) => s.settings.assistantVoice)
  const micError = useVoiceStore((s) => s.micError)
  const conversationState = useVoiceStore((s) => s.conversationState)
  const isProcessingTurn = useVoiceStore((s) => s.isProcessingTurn)

  const {
    handleSpeechStart,
    handleSpeechEnd,
    handleTurnComplete,
    startNewChat,
    stopSession,
    replayMessage,
    speechSupported,
  } = useConversation(sessionActive)

  const voiceChatSupported = speechSupported && caps.canStartVoiceChat

  const onTurnComplete = useCallback(() => {
    handleTurnComplete()
  }, [handleTurnComplete])

  useSilenceDetection({ onTurnComplete })

  useVoiceDetection({
    enabled: sessionActive,
    sensitivity: voiceSensitivity,
    onSpeechStart: handleSpeechStart,
    onSpeechEnd: handleSpeechEnd,
  })

  useEffect(() => {
    void primeSpeechVoices()
  }, [])

  useEffect(() => {
    checkAssistantHealth().then(({ ok, assistantConfigured, keyLooksValid }) => {
      setAssistantReady(ok && assistantConfigured && keyLooksValid)
    })
  }, [])

  useEffect(() => {
    if (!sessionActive) {
      sessionStartRef.current = null
      setSessionSeconds(0)
      return
    }

    sessionStartRef.current = Date.now()
    const interval = window.setInterval(() => {
      if (sessionStartRef.current) {
        setSessionSeconds(Math.floor((Date.now() - sessionStartRef.current) / 1000))
      }
    }, 1000)

    return () => window.clearInterval(interval)
  }, [sessionActive])

  const handleStartTalking = async () => {
    if (!voiceChatSupported) return
    useVoiceStore.getState().setMicError(null)
    await unlockAudioPlayback()
    setSessionActive(true)
  }

  const handleStop = () => {
    stopSession()
    setSessionActive(false)
  }

  const handleNewChat = () => {
    startNewChat()
  }

  const toggleTranscript = () => {
    updateSettings({ showTranscript: !showTranscript })
  }

  const voiceLabel =
    ASSISTANT_VOICE_PRESETS.find((preset) => preset.id === assistantVoice)?.label ??
    'Indian English — Female (Jane)'

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-background">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/3 h-[min(500px,70vw)] w-[min(700px,100vw)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/8 blur-[100px]" />
      </div>

      <header className="relative z-10 flex items-center justify-between gap-2 border-b border-border px-3 py-3 sm:px-4 sm:py-4 md:px-8">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <Link
            to="/"
            aria-label="Back to home"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-app-surface text-muted transition-colors hover:bg-app-surface-hover hover:text-text"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="flex min-w-0 items-center gap-2">
            <Waves size={18} className="hidden shrink-0 text-accent-light sm:block" />
            <span className="truncate font-semibold text-text">
              Talk with {ASSISTANT_NAME}
            </span>
            {sessionActive && (
              <span className="hidden items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-400 sm:flex">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
                Live
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          <button
            type="button"
            onClick={toggleTranscript}
            aria-label={showTranscript ? 'Hide transcript' : 'Show transcript'}
            className="flex h-10 items-center gap-2 rounded-full bg-app-surface px-3 text-sm text-muted transition-colors hover:bg-app-surface-hover hover:text-text sm:px-4"
          >
            <MessageSquare size={16} />
            <span className="hidden sm:inline">
              {showTranscript ? 'Hide Transcript' : 'Show Transcript'}
            </span>
          </button>
          <button
            type="button"
            onClick={handleNewChat}
            aria-label="New chat"
            className="flex h-10 items-center gap-2 rounded-full bg-app-surface px-3 text-sm text-muted transition-colors hover:bg-app-surface-hover hover:text-text sm:px-4"
          >
            <MessageSquarePlus size={16} />
            <span className="hidden sm:inline">New chat</span>
          </button>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label="Open settings"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-app-surface text-muted transition-colors hover:bg-app-surface-hover hover:text-text"
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-3 py-4 sm:px-4 sm:py-6 md:px-8 md:py-10">
        {!sessionActive && <CompatibilityBanner className="mx-auto mb-4 max-w-md" />}

        <div
          className={`grid gap-6 sm:gap-8 ${showTranscript ? 'lg:grid-cols-2 lg:items-start lg:gap-10' : 'grid-cols-1 place-items-center'}`}
        >
          <div
            className={`flex w-full justify-center ${showTranscript ? '' : 'min-h-[calc(100dvh-10rem)] items-center'}`}
          >
            <JaneAssistPanel
              sessionActive={sessionActive}
              sessionSeconds={sessionSeconds}
              conversationState={conversationState}
              isProcessingTurn={isProcessingTurn}
              assistantReady={assistantReady}
              micError={micError}
              speechSupported={voiceChatSupported}
              voiceLabel={voiceLabel}
              voiceEnabled={assistantVoiceEnabled}
              onStart={() => {
                void handleStartTalking()
              }}
              onStop={handleStop}
            >
              <div className="py-2 sm:py-4">
                <VoiceOrb />
              </div>
              <VoiceIndicator />
            </JaneAssistPanel>
          </div>

          <AnimatePresence mode="popLayout">
            {showTranscript && (
              <motion.div
                layout
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="glass w-full rounded-3xl p-4 sm:p-6 md:p-8"
                style={{ minHeight: 'min(400px, 55dvh)' }}
              >
                <TranscriptTimeline onReplay={replayMessage} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <LiveCaption />
      <SettingsDrawer />
    </div>
  )
}
