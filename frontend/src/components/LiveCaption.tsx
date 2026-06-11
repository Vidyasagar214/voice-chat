import { AnimatePresence, motion } from 'framer-motion'
import { useVoiceStore } from '../store/voiceStore'

export function LiveCaption() {
  const liveTranscript = useVoiceStore((s) => s.liveTranscript)
  const conversationState = useVoiceStore((s) => s.conversationState)
  const showTranscript = useVoiceStore((s) => s.settings.showTranscript)

  const visible =
    !showTranscript &&
    liveTranscript.trim().length > 0 &&
    conversationState !== 'ASSISTANT_SPEAKING' &&
    conversationState !== 'IDLE'

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          className="pointer-events-none fixed bottom-6 left-1/2 z-20 w-[min(92vw,36rem)] -translate-x-1/2"
        >
          <div className="glass rounded-2xl border border-border px-5 py-3 shadow-xl">
            <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-accent-light">
              {conversationState === 'THINKING' || conversationState === 'TURN_COMPLETE'
                ? 'Finalizing'
                : 'You'}
            </p>
            <p className="line-clamp-3 text-sm leading-relaxed text-text">{liveTranscript}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
