import { motion } from 'framer-motion'
import { useVoiceStore } from '../store/voiceStore'
import { getSilenceProgress } from '../hooks/useSilenceDetection'
import { ASSISTANT_NAME } from '../constants/assistant'

export function VoiceIndicator() {
  const voiceLevel = useVoiceStore((s) => s.voiceLevel)
  const conversationState = useVoiceStore((s) => s.conversationState)
  const silenceTimer = useVoiceStore((s) => s.silenceTimer)
  const silenceTimeout = useVoiceStore((s) => s.settings.silenceTimeout)
  const liveTranscript = useVoiceStore((s) => s.liveTranscript)

  const bars = 20
  const silenceProgress = getSilenceProgress(
    conversationState,
    silenceTimer,
    silenceTimeout,
  )

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.div
        className="flex h-8 items-end gap-0.5"
        animate={conversationState === 'LISTENING' ? { opacity: [0.7, 1, 0.7] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {Array.from({ length: bars }).map((_, i) => {
          const threshold = i / bars
          const isAssistantSpeaking = conversationState === 'ASSISTANT_SPEAKING'
          const isActive =
            conversationState === 'SPEAKING'
              ? voiceLevel > threshold || silenceProgress > threshold
              : isAssistantSpeaking
                ? i % 5 < 3
                : conversationState === 'LISTENING'
                  ? liveTranscript
                    ? silenceProgress > threshold
                    : i % 3 === 0
                  : conversationState === 'THINKING'
                    ? silenceProgress > threshold
                    : false

          const height =
            conversationState === 'SPEAKING'
              ? isActive
                ? 4 + voiceLevel * 28
                : 4
              : isAssistantSpeaking
                ? isActive
                  ? 16
                  : 6
                : conversationState === 'LISTENING'
                  ? liveTranscript
                    ? 4 + silenceProgress * 24
                    : isActive
                      ? 12
                      : 4
                  : conversationState === 'THINKING'
                    ? 4 + silenceProgress * 24
                    : 4

          return (
            <motion.div
              key={i}
              className="w-1 rounded-full"
              animate={{
                height: isAssistantSpeaking ? [6, 16, 6] : height,
                backgroundColor: isActive
                  ? conversationState === 'THINKING'
                    ? '#6366f1'
                    : isAssistantSpeaking
                      ? '#22d3ee'
                      : '#a78bfa'
                  : 'var(--app-bar-inactive)',
              }}
              transition={
                isAssistantSpeaking
                  ? { duration: 0.8, repeat: Infinity, delay: i * 0.04 }
                  : { duration: 0.1 }
              }
            />
          )
        })}
      </motion.div>
      <span className="text-xs text-muted">
        {conversationState === 'SPEAKING'
          ? silenceTimer > 0
            ? `Finishing ${(silenceTimer / 1000).toFixed(1)}s`
            : 'Voice detected'
          : conversationState === 'ASSISTANT_SPEAKING'
            ? `${ASSISTANT_NAME} is speaking`
            : conversationState === 'THINKING'
              ? `Silence ${(silenceTimer / 1000).toFixed(1)}s`
              : conversationState === 'LISTENING'
                ? liveTranscript && silenceTimer > 0
                  ? `Finishing ${(silenceTimer / 1000).toFixed(1)}s`
                  : 'Awaiting speech'
                : 'Inactive'}
      </span>
    </div>
  )
}
