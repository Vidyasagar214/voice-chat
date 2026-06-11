import { motion } from 'framer-motion'
import { Bot, User, Volume2 } from 'lucide-react'
import { useVoiceStore } from '../store/voiceStore'
import type { Transcript } from '../types'

interface TranscriptCardProps {
  transcript: Transcript
  index: number
  isSpeaking?: boolean
  onReplay?: (text: string) => void
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function TranscriptCard({
  transcript,
  index,
  isSpeaking = false,
  onReplay,
}: TranscriptCardProps) {
  const isUser = transcript.speaker === 'user'
  const assistantVoiceEnabled = useVoiceStore((s) => s.settings.assistantVoiceEnabled)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.4,
        delay: index * 0.05,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className="flex gap-3"
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          isUser ? 'bg-accent/20 text-accent-light' : 'bg-app-assistant text-text'
        }`}
      >
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>

      <div className="glass min-w-0 flex-1 rounded-2xl px-4 py-3">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-sm font-medium text-text">
            {isUser ? 'You' : 'Jane'}
          </span>
          <span className="text-xs text-muted">{formatTime(transcript.timestamp)}</span>
          {!isUser && assistantVoiceEnabled && onReplay && (
            <button
              type="button"
              onClick={() => onReplay(transcript.text)}
              aria-label={isSpeaking ? 'Jane is speaking' : 'Play response aloud'}
              className={`ml-auto flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                isSpeaking
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'bg-app-surface text-muted hover:bg-app-surface-hover hover:text-text'
              }`}
            >
              <motion.span
                animate={isSpeaking ? { scale: [1, 1.15, 1] } : {}}
                transition={{ duration: 0.6, repeat: isSpeaking ? Infinity : 0 }}
              >
                <Volume2 size={14} />
              </motion.span>
            </button>
          )}
        </div>
        <p className="text-sm leading-relaxed text-app-body">
          &ldquo;{transcript.text}&rdquo;
        </p>
      </div>
    </motion.div>
  )
}
