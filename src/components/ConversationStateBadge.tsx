import { motion } from 'framer-motion'
import { STATE_INFO, useVoiceStore } from '../store/voiceStore'

export function ConversationStateBadge() {
  const conversationState = useVoiceStore((s) => s.conversationState)
  const isProcessingTurn = useVoiceStore((s) => s.isProcessingTurn)
  const silenceTimer = useVoiceStore((s) => s.silenceTimer)
  const silenceTimeout = useVoiceStore((s) => s.settings.silenceTimeout)

  const liveTranscript = useVoiceStore((s) => s.liveTranscript)

  const state =
    conversationState === 'ASSISTANT_SPEAKING'
      ? 'ASSISTANT_SPEAKING'
      : isProcessingTurn
        ? 'THINKING'
        : conversationState
  const info = STATE_INFO[state]

  return (
    <motion.div
      key={state}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass flex items-center gap-3 rounded-2xl px-5 py-3"
    >
      <motion.div
        className="h-3 w-3 rounded-full"
        style={{ backgroundColor: info.color }}
        animate={{
          scale:
            state === 'SPEAKING' || state === 'ASSISTANT_SPEAKING'
              ? [1, 1.4, 1]
              : [1, 1.1, 1],
          opacity: state === 'IDLE' ? 0.5 : 1,
        }}
        transition={{
          duration: state === 'SPEAKING' || state === 'ASSISTANT_SPEAKING' ? 0.4 : 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <div>
        <p className="text-sm font-semibold text-text">{info.label}</p>
        <p className="text-xs text-muted">
          {silenceTimer > 0 &&
          (state === 'THINKING' ||
            state === 'SPEAKING' ||
            (state === 'LISTENING' && liveTranscript))
            ? `Finishing in ${((silenceTimeout - silenceTimer) / 1000).toFixed(1)}s`
            : info.description}
        </p>
      </div>
    </motion.div>
  )
}
