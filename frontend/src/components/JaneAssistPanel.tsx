import { motion } from 'framer-motion'
import {
  CheckCircle2,
  Mic,
  Sparkles,
  Square,
  Volume2,
} from 'lucide-react'
import type { ReactNode } from 'react'
import janeAvatar from '../assets/jane-avatar1.jpg'
import { ASSISTANT_NAME, ASSISTANT_TAGLINE, JANE_CAPABILITIES } from '../constants/assistant'
import type { ConversationState } from '../types'

interface JaneAssistPanelProps {
  sessionActive: boolean
  sessionSeconds: number
  conversationState: ConversationState
  isProcessingTurn: boolean
  assistantReady: boolean | null
  micError: string | null
  speechSupported?: boolean
  voiceLabel?: string
  voiceEnabled?: boolean
  onStart: () => void
  onStop: () => void
  children: ReactNode
}

function formatSessionTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function getStatusPill(
  sessionActive: boolean,
  conversationState: ConversationState,
  isProcessingTurn: boolean,
): { text: string; className: string } {
  if (!sessionActive) {
    return {
      text: 'Ready to talk',
      className: 'bg-app-surface text-muted',
    }
  }

  if (conversationState === 'TURN_COMPLETE') {
    return {
      text: 'Sending your message…',
      className: 'bg-green-500/15 text-green-400',
    }
  }

  if (conversationState === 'ASSISTANT_SPEAKING') {
    return {
      text: `${ASSISTANT_NAME} is speaking…`,
      className: 'bg-cyan-500/15 text-cyan-400',
    }
  }

  if (isProcessingTurn || conversationState === 'THINKING') {
    return {
      text: `${ASSISTANT_NAME} is thinking…`,
      className: 'bg-indigo-500/15 text-indigo-300',
    }
  }

  if (conversationState === 'SPEAKING') {
    return {
      text: 'Listening to you…',
      className: 'bg-violet-500/15 text-violet-300',
    }
  }

  if (conversationState === 'LISTENING') {
    return {
      text: `${ASSISTANT_NAME} is listening…`,
      className: 'bg-accent/15 text-accent-light',
    }
  }

  return {
    text: 'Session active',
    className: 'bg-green-500/10 text-green-400',
  }
}

export function JaneAssistPanel({
  sessionActive,
  sessionSeconds,
  conversationState,
  isProcessingTurn,
  assistantReady,
  micError,
  speechSupported = true,
  voiceLabel,
  voiceEnabled = true,
  onStart,
  onStop,
  children,
}: JaneAssistPanelProps) {
  const status = getStatusPill(sessionActive, conversationState, isProcessingTurn)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="glass w-full max-w-md rounded-3xl border border-border p-4 shadow-xl sm:p-6 md:p-8"
    >
      {/* Profile header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-violet-400/30 shadow-lg shadow-violet-500/25">
            <img
              src={janeAvatar}
              alt={`${ASSISTANT_NAME} avatar`}
              className="h-full w-full object-cover object-top"
              draggable={false}
            />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text">{ASSISTANT_NAME}</h2>
            <p className="text-sm text-muted">{ASSISTANT_TAGLINE}</p>
            {voiceEnabled && voiceLabel && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-accent-light">
                <Volume2 size={12} />
                {voiceLabel}
              </p>
            )}
          </div>
        </div>
        <span
          className={`max-w-[9.5rem] shrink-0 truncate rounded-full px-2.5 py-1 text-[11px] font-medium sm:max-w-none sm:px-3 sm:text-xs ${status.className}`}
        >
          {status.text}
        </span>
      </div>

      {/* Voice orb + indicator */}
      <div className="mb-6 flex flex-col items-center py-2">{children}</div>

      {/* Session timer */}
      {sessionActive && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 text-center font-mono text-2xl tracking-widest text-text"
        >
          {formatSessionTime(sessionSeconds)}
        </motion.p>
      )}

      {/* Primary controls */}
      <div className="mb-8 flex flex-col items-center gap-3">
        {!sessionActive ? (
          <button
            type="button"
            onClick={onStart}
            disabled={assistantReady === false || !speechSupported}
            className="flex min-h-12 w-full max-w-xs items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-violet-500/30 transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:px-8 sm:py-4"
          >
            <Mic size={20} />
            Start Talking
          </button>
        ) : (
          <button
            type="button"
            onClick={onStop}
            className="flex min-h-12 w-full max-w-xs items-center justify-center gap-2 rounded-2xl border-2 border-red-500/40 bg-red-500/10 px-6 py-3.5 text-base font-semibold text-red-400 transition-colors hover:bg-red-500/20 sm:px-8 sm:py-4"
          >
            <Square size={18} fill="currentColor" />
            Stop
          </button>
        )}

        {sessionActive && (
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <Mic size={12} />
            Mic on — speak naturally, no extra buttons needed
          </p>
        )}

        {!sessionActive && !speechSupported && (
          <p className="px-2 text-center text-xs leading-relaxed text-amber-400">
            Voice chat needs microphone + speech recognition. Use the latest Chrome or Edge
            on desktop or mobile for the best results.
          </p>
        )}

        {!sessionActive && speechSupported && (
          <p className="text-center text-xs text-muted">
            Press Start Talking to begin your voice session with {ASSISTANT_NAME}
          </p>
        )}
      </div>

      {micError && (
        <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-center text-sm leading-relaxed text-red-300">
          {micError}
        </div>
      )}

      {/* AI engine — compact while session is active */}
      {!sessionActive && (
        <div className="mb-6">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
            AI Engine
          </p>
          <div className="rounded-2xl border border-border bg-app-surface px-4 py-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-accent-light" />
              <span className="font-semibold text-text">Groq</span>
              <span className="text-xs text-muted">Llama 3.3 · free tier</span>
            </div>
            <p className="mt-2 text-xs">
              {assistantReady === null && (
                <span className="text-muted">Checking connection…</span>
              )}
              {assistantReady === true && (
                <span className="flex items-center gap-1 text-green-400">
                  <CheckCircle2 size={14} />
                  Engine ready
                </span>
              )}
              {assistantReady === false && (
                <span className="text-amber-400">
                  Not ready — check API connection / GROQ_API_KEY
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {sessionActive && assistantReady === false && (
        <div className="mb-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-300">
          AI engine not ready — responses may fail until GROQ_API_KEY is set.
        </div>
      )}

      {/* Capabilities — hidden during active session for focus */}
      {!sessionActive && (
        <div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
            What {ASSISTANT_NAME} can help with
          </p>
          <ul className="space-y-2.5">
            {JANE_CAPABILITIES.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-app-body">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-accent-light" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  )
}
