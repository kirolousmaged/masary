'use client'
import { useMarketStatus } from '@/hooks/useMarketStatus'

export function MarketStatusChip() {
  const { isOpen, label } = useMarketStatus()

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border
        ${isOpen
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          : 'bg-white/5 border-white/10 text-[#8B949E]'
        }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${isOpen ? 'bg-emerald-400 animate-pulse-dot' : 'bg-[#484F58]'}`}
      />
      {label}
    </span>
  )
}
