import { useEffect } from 'react'
import { useVoiceStore } from '../store/voiceStore'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useVoiceStore((s) => s.settings.theme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)

    const color = theme === 'light' ? '#f4f4f5' : '#050505'
    let meta = document.querySelector(
      'meta[name="theme-color"]:not([media])',
    ) as HTMLMetaElement | null

    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', 'theme-color')
      document.head.appendChild(meta)
    }
    meta.setAttribute('content', color)
  }, [theme])

  return children
}
