import { useEffect } from 'react'
import { useVoiceStore } from '../store/voiceStore'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useVoiceStore((s) => s.settings.theme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return children
}
