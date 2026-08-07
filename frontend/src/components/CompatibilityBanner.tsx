import { AlertTriangle, Info } from 'lucide-react'
import { useMemo } from 'react'
import { getBrowserCapabilities } from '../utils/browserCapabilities'

interface CompatibilityBannerProps {
  className?: string
}

export function CompatibilityBanner({ className = '' }: CompatibilityBannerProps) {
  const caps = useMemo(() => getBrowserCapabilities(), [])

  if (caps.blockers.length === 0 && caps.warnings.length === 0) {
    return null
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {caps.blockers.map((message) => (
        <div
          key={message}
          className="flex items-start gap-2 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-left text-xs leading-relaxed text-red-200 sm:text-sm"
        >
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-400" />
          <span>{message}</span>
        </div>
      ))}
      {caps.blockers.length === 0 &&
        caps.warnings.map((message) => (
          <div
            key={message}
            className="flex items-start gap-2 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-left text-xs leading-relaxed text-amber-200 sm:text-sm"
          >
            <Info size={16} className="mt-0.5 shrink-0 text-amber-400" />
            <span>{message}</span>
          </div>
        ))}
    </div>
  )
}
