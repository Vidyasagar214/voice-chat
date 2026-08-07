import { AnimatePresence, motion } from 'framer-motion'
import { MessageSquare, Mic, Moon, Play, Sun, Volume2, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AppSettings } from '../types'
import {
  ASSISTANT_VOICE_PRESETS,
  getPreviewSampleText,
  getVoicePreset,
  isValidAssistantVoice,
  normalizeAssistantVoice,
  resolveVoiceMatch,
} from '../constants/voicePresets'
import { getAvailableVoices, speakText, stopSpeaking } from '../hooks/useTextToSpeech'
import { mergeSettings, useVoiceStore } from '../store/voiceStore'

function settingsEqual(a: AppSettings, b: AppSettings): boolean {
  return (
    a.silenceTimeout === b.silenceTimeout &&
    a.forceCompleteTimeout === b.forceCompleteTimeout &&
    a.voiceSensitivity === b.voiceSensitivity &&
    a.theme === b.theme &&
    a.selectedMicrophone === b.selectedMicrophone &&
    a.assistantVoiceEnabled === b.assistantVoiceEnabled &&
    a.assistantVoice === b.assistantVoice &&
    a.speechRate === b.speechRate &&
    a.showTranscript === b.showTranscript
  )
}

export function SettingsDrawer() {
  const isOpen = useVoiceStore((s) => s.isSettingsOpen)
  const savedSettings = useVoiceStore((s) => s.settings)
  const setSettings = useVoiceStore((s) => s.setSettings)
  const setSettingsOpen = useVoiceStore((s) => s.setSettingsOpen)

  const [draft, setDraft] = useState<AppSettings>(savedSettings)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [previewing, setPreviewing] = useState(false)
  const [matchedVoiceName, setMatchedVoiceName] = useState<string | null>(null)

  const isDirty = useMemo(
    () => !settingsEqual(draft, savedSettings),
    [draft, savedSettings],
  )

  const patchDraft = useCallback((partial: Partial<AppSettings>) => {
    setDraft((current) => mergeSettings(current, partial))
  }, [])

  const loadDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) {
      setDevices([])
      return
    }

    try {
      if (navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        stream.getTracks().forEach((track) => track.stop())
      }
    } catch {
      /* labels may stay empty without permission */
    }

    try {
      const all = await navigator.mediaDevices.enumerateDevices()
      setDevices(all.filter((d) => d.kind === 'audioinput'))
    } catch {
      setDevices([])
    }
  }, [])

  useEffect(() => {
    if (!isOpen) return
    setDraft({ ...useVoiceStore.getState().settings })
    void loadDevices()
  }, [isOpen, loadDevices])

  useEffect(() => {
    if (!isOpen || !draft.assistantVoiceEnabled) {
      setMatchedVoiceName(null)
      return
    }

    let cancelled = false

    void (async () => {
      const voices = await getAvailableVoices()
      if (cancelled) return

      const sample = getPreviewSampleText(draft.assistantVoice)
      const match = resolveVoiceMatch(voices, draft.assistantVoice, sample)
      setMatchedVoiceName(match.voice?.name ?? null)
    })()

    return () => {
      cancelled = true
    }
  }, [isOpen, draft.assistantVoice, draft.assistantVoiceEnabled])

  const handlePreviewVoice = useCallback(async () => {
    if (!draft.assistantVoiceEnabled || previewing) return

    setPreviewing(true)
    stopSpeaking()

    try {
      await speakText(getPreviewSampleText(draft.assistantVoice), {
        rate: draft.speechRate,
        voicePreset: draft.assistantVoice,
      })
    } finally {
      setPreviewing(false)
    }
  }, [draft.assistantVoice, draft.assistantVoiceEnabled, draft.speechRate, previewing])

  const handleCancel = useCallback(() => {
    stopSpeaking()
    setPreviewing(false)
    setDraft({ ...savedSettings })
    setSettingsOpen(false)
  }, [savedSettings, setSettingsOpen])

  const handleSave = useCallback(() => {
    stopSpeaking()
    setPreviewing(false)

    const validMic =
      !draft.selectedMicrophone ||
      devices.some((device) => device.deviceId === draft.selectedMicrophone)

    setSettings(
      validMic ? draft : { ...draft, selectedMicrophone: '' },
    )
    setSettingsOpen(false)
  }, [draft, devices, setSettings, setSettingsOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-app-overlay backdrop-blur-sm"
            onClick={handleCancel}
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-border bg-app-panel pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] backdrop-blur-xl"
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-text">Settings</h2>
                {isDirty && (
                  <p className="mt-0.5 text-xs text-amber-400">Unsaved changes</p>
                )}
              </div>
              <button
                type="button"
                onClick={handleCancel}
                aria-label="Close settings"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-app-surface text-muted transition-colors hover:bg-app-surface-hover hover:text-text"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 space-y-8 overflow-y-auto px-6 py-6">
              {/* Microphone */}
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <Mic size={16} className="text-accent" />
                  <h3 className="text-sm font-medium text-text">Microphone</h3>
                </div>
                <select
                  value={draft.selectedMicrophone}
                  onChange={(e) => patchDraft({ selectedMicrophone: e.target.value })}
                  className="w-full rounded-xl border border-border bg-app-surface px-4 py-3 text-sm text-text outline-none focus:border-accent/50"
                >
                  <option value="" className="bg-[var(--app-select-bg)] text-text">
                    Default microphone
                  </option>
                  {devices.map((device) => (
                    <option
                      key={device.deviceId}
                      value={device.deviceId}
                      className="bg-[var(--app-select-bg)] text-text"
                    >
                      {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-muted">
                  Applied on save — restarts mic if a session is active. Speech recognition
                  uses your system default microphone.
                </p>
              </section>

              {/* Silence Timeout */}
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 size={16} className="text-accent" />
                    <h3 className="text-sm font-medium text-text">Silence Timeout</h3>
                  </div>
                  <span className="text-sm text-accent-light">
                    {(draft.silenceTimeout / 1000).toFixed(1)}s
                  </span>
                </div>
                <input
                  type="range"
                  min={1000}
                  max={8000}
                  step={500}
                  value={draft.silenceTimeout}
                  onChange={(e) => patchDraft({ silenceTimeout: Number(e.target.value) })}
                  className="w-full accent-accent"
                />
                <p className="mt-2 text-xs text-muted">
                  Time of silence before your turn completes automatically
                </p>
              </section>

              {/* Force Complete */}
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-text">Force Complete</h3>
                  <span className="text-sm text-accent-light">
                    {(draft.forceCompleteTimeout / 1000).toFixed(1)}s
                  </span>
                </div>
                <input
                  type="range"
                  min={3000}
                  max={15000}
                  step={500}
                  value={draft.forceCompleteTimeout}
                  onChange={(e) =>
                    patchDraft({ forceCompleteTimeout: Number(e.target.value) })
                  }
                  className="w-full accent-accent"
                />
                <p className="mt-2 text-xs text-muted">
                  Maximum silence before turn is force-completed
                </p>
              </section>

              {/* Voice Sensitivity */}
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-text">Voice Sensitivity</h3>
                  <span className="text-sm text-accent-light">
                    {Math.round(draft.voiceSensitivity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={draft.voiceSensitivity}
                  onChange={(e) => patchDraft({ voiceSensitivity: Number(e.target.value) })}
                  className="w-full accent-accent"
                />
                <p className="mt-2 text-xs text-muted">
                  Higher sensitivity picks up quieter speech and reacts faster
                </p>
              </section>

              {/* Jane's Voice */}
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 size={16} className="text-accent" />
                    <h3 className="text-sm font-medium text-text">Jane&apos;s Voice</h3>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={draft.assistantVoiceEnabled}
                    onClick={() =>
                      patchDraft({ assistantVoiceEnabled: !draft.assistantVoiceEnabled })
                    }
                    className={`relative h-7 w-12 rounded-full transition-colors ${
                      draft.assistantVoiceEnabled ? 'bg-accent' : 'bg-app-surface'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition-transform ${
                        draft.assistantVoiceEnabled ? 'left-5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>
                <p className="mb-4 text-xs text-muted">
                  Jane speaks replies aloud — tap the speaker icon on any message to replay
                </p>

                <div className="mb-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-medium text-text">Voice Type</h3>
                    <button
                      type="button"
                      disabled={!draft.assistantVoiceEnabled || previewing}
                      onClick={() => void handlePreviewVoice()}
                      className="flex items-center gap-1.5 rounded-lg border border-border bg-app-surface px-3 py-1.5 text-xs font-medium text-text transition-colors hover:bg-app-surface-hover disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Play size={12} fill="currentColor" />
                      {previewing ? 'Playing…' : 'Preview'}
                    </button>
                  </div>
                  <select
                    value={draft.assistantVoice}
                    disabled={!draft.assistantVoiceEnabled}
                    onChange={(e) => {
                      const value = e.target.value
                      if (!isValidAssistantVoice(value)) return
                      patchDraft({ assistantVoice: value })
                    }}
                    className="w-full rounded-xl border border-border bg-app-surface px-4 py-3 text-sm text-text outline-none focus:border-accent/50 disabled:opacity-40"
                  >
                    {ASSISTANT_VOICE_PRESETS.map((preset) => (
                      <option
                        key={preset.id}
                        value={preset.id}
                        className="bg-[var(--app-select-bg)] text-text"
                      >
                        {preset.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-muted">
                    {getVoicePreset(normalizeAssistantVoice(draft.assistantVoice)).description}
                  </p>
                  {draft.assistantVoiceEnabled && (
                    <p className="mt-1 text-xs text-accent-light/80">
                      {matchedVoiceName
                        ? `System voice: ${matchedVoiceName}`
                        : 'Loading voices… — save and preview to confirm'}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted">
                    Hindi replies auto-switch to a Hindi voice for a natural accent
                  </p>
                </div>

                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-text">Speech Rate</h3>
                  <span className="text-sm text-accent-light">
                    {draft.speechRate.toFixed(2)}x
                  </span>
                </div>
                <input
                  type="range"
                  min={0.9}
                  max={1.6}
                  step={0.05}
                  value={draft.speechRate}
                  disabled={!draft.assistantVoiceEnabled}
                  onChange={(e) => patchDraft({ speechRate: Number(e.target.value) })}
                  className="w-full accent-accent disabled:opacity-40"
                />
                <p className="mt-2 text-xs text-muted">
                  Default is slightly faster for a natural conversation pace
                </p>
              </section>

              {/* Show Transcript */}
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={16} className="text-accent" />
                    <h3 className="text-sm font-medium text-text">Show Transcript</h3>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={draft.showTranscript}
                    onClick={() => patchDraft({ showTranscript: !draft.showTranscript })}
                    className={`relative h-7 w-12 rounded-full transition-colors ${
                      draft.showTranscript ? 'bg-accent' : 'bg-app-surface'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition-transform ${
                        draft.showTranscript ? 'left-5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-xs text-muted">
                  Show the conversation transcript panel by default
                </p>
              </section>

              {/* Theme */}
              <section>
                <div className="mb-3 flex items-center gap-2">
                  {draft.theme === 'dark' ? (
                    <Moon size={16} className="text-accent" />
                  ) : (
                    <Sun size={16} className="text-accent" />
                  )}
                  <h3 className="text-sm font-medium text-text">Theme</h3>
                </div>
                <div className="flex gap-2">
                  {(['dark', 'light'] as const).map((theme) => (
                    <button
                      key={theme}
                      type="button"
                      onClick={() => patchDraft({ theme })}
                      className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium capitalize transition-all ${
                        draft.theme === theme
                          ? 'bg-accent text-white'
                          : 'bg-app-surface text-muted hover:bg-app-surface-hover hover:text-text'
                      }`}
                    >
                      {theme}
                    </button>
                  ))}
                </div>
              </section>
            </div>

            <div className="border-t border-border px-6 py-4">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 rounded-xl border border-border bg-app-surface px-4 py-3 text-sm font-medium text-text transition-colors hover:bg-app-surface-hover"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!isDirty}
                  className="flex-1 rounded-xl bg-accent px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Save Changes
                </button>
              </div>
              <p className="mt-3 text-center text-xs text-muted">
                VoiceFlow v1.0 — Frontend Prototype
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
