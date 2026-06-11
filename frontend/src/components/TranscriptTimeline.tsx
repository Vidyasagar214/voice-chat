import { motion } from 'framer-motion'
import { MessageSquare } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useVoiceStore } from '../store/voiceStore'
import { TranscriptCard } from './TranscriptCard'

interface TranscriptTimelineProps {
  onReplay?: (text: string) => void
}

export function TranscriptTimeline({ onReplay }: TranscriptTimelineProps) {
  const transcripts = useVoiceStore((s) => s.transcripts)
  const liveTranscript = useVoiceStore((s) => s.liveTranscript)
  const conversationState = useVoiceStore((s) => s.conversationState)
  const scrollRef = useRef<HTMLDivElement>(null)

  const lastAssistantId = [...transcripts]
    .reverse()
    .find((t) => t.speaker === 'assistant')?.id

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [transcripts, liveTranscript])

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center gap-2 px-1">
        <MessageSquare size={16} className="text-muted" />
        <h2 className="text-sm font-medium text-muted">Conversation</h2>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto pr-2 scrollbar-thin"
        style={{ maxHeight: 'calc(100vh - 420px)' }}
      >
        {transcripts.length === 0 && !liveTranscript && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-app-surface">
              <MessageSquare size={20} className="text-muted" />
            </div>
            <p className="text-sm text-muted">Start speaking to begin the conversation</p>
            <p className="mt-1 text-xs text-muted/60">
              Your words will appear here automatically
            </p>
          </motion.div>
        )}

        {transcripts.map((transcript, index) => (
          <TranscriptCard
            key={transcript.id}
            transcript={transcript}
            index={index}
            isSpeaking={
              conversationState === 'ASSISTANT_SPEAKING' &&
              transcript.id === lastAssistantId
            }
            onReplay={transcript.speaker === 'assistant' ? onReplay : undefined}
          />
        ))}

        {liveTranscript && conversationState !== 'ASSISTANT_SPEAKING' && (
            <motion.div
              key="live-transcript"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/20">
                <motion.div
                  className="h-2 w-2 rounded-full bg-accent"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              </div>
              <div className="glass flex-1 rounded-2xl px-4 py-3">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-sm font-medium text-accent-light">You</span>
                  <span className="text-xs text-muted">
                    {conversationState === 'THINKING' ||
                    conversationState === 'TURN_COMPLETE'
                      ? 'Finalizing'
                      : 'Live'}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-app-live italic">
                  {liveTranscript}
                  <motion.span
                    className="ml-0.5 inline-block h-4 w-0.5 bg-accent"
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  />
                </p>
              </div>
            </motion.div>
          )}
      </div>
    </div>
  )
}
