import { Mic, MicOff, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { useVoiceStore } from '../store/voiceStore'

export function MicrophoneStatus() {
  const microphoneEnabled = useVoiceStore((s) => s.microphoneEnabled)
  const micError = useVoiceStore((s) => s.micError)
  const conversationState = useVoiceStore((s) => s.conversationState)

  if (micError) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 rounded-full bg-red-500/10 px-4 py-2 text-sm text-red-400"
      >
        <AlertCircle size={16} />
        <span>Microphone unavailable</span>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm ${
        microphoneEnabled
          ? 'bg-green-500/10 text-green-400'
          : 'bg-app-surface text-muted'
      }`}
    >
      {microphoneEnabled ? (
        <>
          <motion.div
            animate={
              conversationState === 'SPEAKING'
                ? { scale: [1, 1.2, 1] }
                : { scale: 1 }
            }
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            <Mic size={16} />
          </motion.div>
          <span>Microphone active</span>
          <motion.div
            className="h-2 w-2 rounded-full bg-green-400"
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </>
      ) : (
        <>
          <MicOff size={16} />
          <span>Microphone off</span>
        </>
      )}
    </motion.div>
  )
}
