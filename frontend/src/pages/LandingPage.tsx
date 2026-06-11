import { motion } from 'framer-motion'
import { ArrowRight, Mic, Sparkles, Waves, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'

const features = [
  {
    icon: Mic,
    title: 'Just Speak',
    description:
      'No buttons, no typing. Simply talk and VoiceFlow handles the rest.',
  },
  {
    icon: Waves,
    title: 'Smart Turn Detection',
    description:
      'Advanced VAD detects when you start, pause, and finish speaking.',
  },
  {
    icon: Sparkles,
    title: 'Live Transcription',
    description:
      'Your words appear in real time as you speak — fully automatic.',
  },
  {
    icon: Zap,
    title: 'Instant Responses',
    description:
      'The assistant responds naturally when your turn completes.',
  },
]

export function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Background gradients */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[600px] translate-x-1/4 translate-y-1/4 rounded-full bg-indigo-600/10 blur-[100px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-6 md:px-12">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/20">
            <Waves size={18} className="text-accent-light" />
          </div>
          <span className="text-lg font-semibold text-text">VoiceFlow</span>
        </div>
        <Link
          to="/room"
          className="hidden rounded-full bg-app-surface px-5 py-2 text-sm text-muted transition-colors hover:bg-app-surface-hover hover:text-text md:block"
        >
          Enter Room
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-24 pt-16 text-center md:px-12 md:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-app-surface px-4 py-1.5 text-sm text-muted"
          >
            <Sparkles size={14} className="text-accent-light" />
            Voice-first communication, reimagined
          </motion.div>

          <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight md:text-7xl">
            <span className="gradient-text">Speak naturally.</span>
            <br />
            <span className="text-hero-sub">We&apos;ll handle the rest.</span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-muted md:text-xl">
            VoiceFlow is a premium voice conversation experience. No send buttons,
            no stop recording — just pure, intelligent voice communication powered
            by smart turn detection.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Link
              to="/room"
              className="group inline-flex items-center gap-3 rounded-2xl bg-accent px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-accent/25 transition-all hover:bg-accent/90 hover:shadow-accent/40"
            >
              Start Voice Conversation
              <ArrowRight
                size={20}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </motion.div>
        </motion.div>

        {/* Orb preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 1 }}
          className="relative mx-auto mt-20 flex h-48 w-48 items-center justify-center"
        >
          <motion.div
            className="absolute h-40 w-40 rounded-full orb-glow"
            style={{
              background:
                'radial-gradient(circle at 35% 35%, rgba(167,139,250,0.8) 0%, rgba(124,58,237,0.6) 40%, rgba(79,70,229,0.4) 100%)',
            }}
            animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute h-48 w-48 rounded-full border border-accent/20"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut' }}
          />
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-32 md:px-12">
        <div className="grid gap-4 sm:grid-cols-2">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + i * 0.1 }}
              className="glass rounded-2xl p-6 transition-colors hover:bg-app-surface-hover"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20">
                <feature.icon size={20} className="text-accent-light" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-text">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-muted">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="relative z-10 border-t border-border px-6 py-16 text-center md:px-12">
        <p className="mb-6 text-muted">Ready to experience voice-first communication?</p>
        <Link
          to="/room"
          className="inline-flex items-center gap-2 text-accent-light transition-colors hover:text-text"
        >
          Enter the voice room
          <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  )
}
