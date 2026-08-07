import { motion } from 'framer-motion'
import janeAvatar from '../assets/jane-avatar1.jpg'
import { useVoiceStore } from '../store/voiceStore'
import type { ConversationState } from '../types'

const STATE_STYLES: Record<
  ConversationState,
  { scale: number[]; opacity: number[]; y: number[]; duration: number }
> = {
  IDLE: { scale: [1, 1.03, 1], opacity: [0.85, 1, 0.85], y: [0, -6, 0], duration: 3.2 },
  LISTENING: { scale: [1, 1.06, 1], opacity: [0.9, 1, 0.9], y: [0, -10, 0], duration: 2 },
  SPEAKING: { scale: [1, 1, 1], opacity: [1, 1, 1], y: [0, 0, 0], duration: 0.3 },
  THINKING: { scale: [1, 1.04, 1], opacity: [0.88, 1, 0.88], y: [0, -7, 0], duration: 2.6 },
  TURN_COMPLETE: { scale: [1, 1.12, 1], opacity: [1, 1, 1], y: [0, -4, 0], duration: 0.8 },
  ASSISTANT_SPEAKING: {
    scale: [1, 1.05, 1],
    opacity: [0.92, 1, 0.92],
    y: [0, -8, 0],
    duration: 1.4,
  },
}

export function VoiceOrb() {
  const conversationState = useVoiceStore((s) => s.conversationState)
  const voiceLevel = useVoiceStore((s) => s.voiceLevel)
  const isProcessingTurn = useVoiceStore((s) => s.isProcessingTurn)

  const state =
    conversationState === 'ASSISTANT_SPEAKING'
      ? 'ASSISTANT_SPEAKING'
      : isProcessingTurn
        ? 'THINKING'
        : conversationState
  const styles = STATE_STYLES[state]

  const speakingScale = 1 + voiceLevel * 0.12
  const baseSize = 168
  const isSpeaking = state === 'SPEAKING'

  return (
    <div className="relative flex scale-90 items-center justify-center sm:scale-100">
      {/* Ambient glow */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: baseSize * 2.4,
          height: baseSize * 2.4,
          background:
            'radial-gradient(circle, rgba(124,58,237,0.22) 0%, rgba(168,85,247,0.08) 45%, transparent 72%)',
        }}
        animate={{
          scale: isSpeaking ? [1, 1 + voiceLevel * 0.25, 1] : [1, 1.12, 1],
          opacity: state === 'IDLE' ? 0.35 : 0.7,
        }}
        transition={{ duration: styles.duration, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Ripple rings for TURN_COMPLETE */}
      {state === 'TURN_COMPLETE' && (
        <>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute rounded-full border border-accent/40"
              style={{ width: baseSize, height: baseSize }}
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: 2.5, opacity: 0 }}
              transition={{
                duration: 1.5,
                delay: i * 0.3,
                repeat: Infinity,
                ease: 'easeOut',
              }}
            />
          ))}
        </>
      )}

      {/* Outer ring */}
      <motion.div
        className="absolute rounded-full border border-violet-400/20 bg-violet-500/5"
        style={{ width: baseSize + 36, height: baseSize + 36 }}
        animate={{
          scale:
            state === 'LISTENING'
              ? [1, 1.04, 1]
              : isSpeaking
                ? speakingScale * 1.06
                : styles.scale,
          rotate: state === 'THINKING' ? [0, 180, 360] : 0,
          y: isSpeaking ? 0 : styles.y,
        }}
        transition={{
          duration: isSpeaking ? 0.1 : styles.duration,
          repeat: isSpeaking ? 0 : Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Avatar orb */}
      <motion.div
        className="relative overflow-hidden rounded-full orb-glow ring-2 ring-white/15"
        style={{ width: baseSize, height: baseSize }}
        animate={{
          scale:
            isSpeaking
              ? speakingScale
              : state === 'TURN_COMPLETE'
                ? [1, 1.1, 1]
                : styles.scale,
          opacity: styles.opacity,
          y: isSpeaking ? [0, -3, 0] : styles.y,
        }}
        transition={{
          duration: isSpeaking ? 0.12 : styles.duration,
          repeat:
            isSpeaking ? Infinity : state === 'TURN_COMPLETE' ? 0 : Infinity,
          ease: 'easeInOut',
        }}
      >
        <img
          src={janeAvatar}
          alt="Jane assistant avatar"
          className="h-full w-full object-cover object-top"
          draggable={false}
        />

        {/* Soft vignette for depth */}
        <div
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            background:
              'radial-gradient(circle at 50% 18%, rgba(255,255,255,0.18) 0%, transparent 42%), radial-gradient(circle at 50% 100%, rgba(46,16,101,0.35) 0%, transparent 55%)',
          }}
        />

        {/* Assistant speaking shimmer */}
        {state === 'ASSISTANT_SPEAKING' && (
          <motion.div
            className="pointer-events-none absolute inset-0 rounded-full bg-cyan-400/10"
            animate={{ opacity: [0.15, 0.35, 0.15] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </motion.div>

      {/* Voice level bars — below avatar when user is speaking */}
      {isSpeaking && (
        <motion.div
          className="absolute flex items-end justify-center gap-1"
          style={{ bottom: -28, width: baseSize }}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {Array.from({ length: 7 }).map((_, i) => (
            <motion.div
              key={i}
              className="w-1.5 rounded-full bg-violet-300/90"
              animate={{
                height: [8 + voiceLevel * 18, 18 + voiceLevel * 36, 8 + voiceLevel * 18],
              }}
              transition={{
                duration: 0.28 + i * 0.04,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ))}
        </motion.div>
      )}

      {/* Listening pulse ring */}
      {state === 'LISTENING' && (
        <motion.div
          className="absolute rounded-full border-2 border-accent/35"
          style={{ width: baseSize + 18, height: baseSize + 18 }}
          animate={{ scale: [1, 1.28, 1], opacity: [0.55, 0, 0.55] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
        />
      )}
    </div>
  )
}
