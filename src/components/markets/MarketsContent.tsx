'use client'
import { motion } from 'framer-motion'
import { PriceFlashBadge } from '@/components/ui/PriceFlashBadge'
import { MarketStatusChip } from '@/components/ui/MarketStatusChip'
import { usePortfolioStore } from '@/store/usePortfolioStore'
import { GOLD_KARATS } from '@/data/gold'
import { EGX_STOCKS } from '@/data/stocks'

export function MarketsContent() {
  const goldPrices  = usePortfolioStore(s => s.goldPrices)
  const stockPrices = usePortfolioStore(s => s.stockPrices)

  const stocksWithChange = EGX_STOCKS.map(s => ({
    ...s,
    price: stockPrices[s.ticker],
  }))
    .filter(s => s.price)
    .sort((a, b) => Math.abs((b.price?.changePct ?? 0)) - Math.abs((a.price?.changePct ?? 0)))

  const gainers = stocksWithChange
    .filter(s => (s.price?.changePct ?? 0) >= 0)
    .slice(0, 5)
  const losers  = stocksWithChange
    .filter(s => (s.price?.changePct ?? 0) < 0)
    .slice(0, 5)

  return (
    <div className="px-4 pt-4 pb-2 space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Markets</h1>
        <MarketStatusChip />
      </div>

      {/* Gold Spot Prices */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">🪙</span>
          <p className="text-sm font-semibold text-white">Egyptian Gold — Live</p>
          <span className="text-[10px] text-amber-400 ml-auto">Updates every 60s</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {GOLD_KARATS.map(k => (
            <div key={k.key}
              className="rounded-xl p-3 flex flex-col gap-1"
              style={{ background: `${k.color}0C`, border: `1px solid ${k.color}20` }}>
              <p className="text-[10px] text-[#8B949E]">{k.label}</p>
              <p className="text-sm font-mono font-bold" style={{ color: k.color }}>
                {goldPrices[k.key].toLocaleString('en', { maximumFractionDigits: 0 })} EGP
              </p>
              <p className="text-[10px] text-[#484F58]">
                per {k.key === 'pound' ? 'coin (8g)' : 'gram'}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* EGX Top Gainers */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.06 }}
        className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <p className="text-sm font-semibold text-white">Top Gainers</p>
          <span className="text-[10px] text-[#484F58] ml-auto">EGX Today</span>
        </div>
        <div className="space-y-2.5">
          {gainers.map(s => (
            <div key={s.ticker} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <span className="text-[10px] font-mono font-bold text-emerald-400">{s.ticker.slice(0, 2)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white">{s.ticker}</p>
                <p className="text-[10px] text-[#484F58] truncate">{s.sector}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-mono text-white">{s.price?.current.toFixed(2)}</p>
                <PriceFlashBadge value={s.price?.current ?? 0} prev={s.price?.open ?? 0} />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* EGX Top Losers */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.12 }}
        className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-red-400" />
          <p className="text-sm font-semibold text-white">Top Losers</p>
          <span className="text-[10px] text-[#484F58] ml-auto">EGX Today</span>
        </div>
        <div className="space-y-2.5">
          {losers.map(s => (
            <div key={s.ticker} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                <span className="text-[10px] font-mono font-bold text-red-400">{s.ticker.slice(0, 2)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white">{s.ticker}</p>
                <p className="text-[10px] text-[#484F58] truncate">{s.sector}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-mono text-white">{s.price?.current.toFixed(2)}</p>
                <PriceFlashBadge value={s.price?.current ?? 0} prev={s.price?.open ?? 0} />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* All Stocks Ticker Table */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.18 }}
        className="glass-card p-4">
        <p className="text-sm font-semibold text-white mb-3">All EGX Tickers</p>
        <div className="space-y-2.5">
          {EGX_STOCKS.map(s => {
            const p = stockPrices[s.ticker]
            return (
              <div key={s.ticker} className="flex items-center gap-2">
                <div className="w-8 text-center">
                  <span className="text-[10px] font-mono font-bold text-[#8B949E]">{s.ticker}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <div className="h-4 flex-1 rounded-sm overflow-hidden bg-white/[0.03]">
                      <div
                        className={`h-full rounded-sm transition-all duration-300 ${(p?.changePct ?? 0) >= 0 ? 'bg-emerald-500/40' : 'bg-red-500/40'}`}
                        style={{ width: `${Math.min(100, 50 + (p?.changePct ?? 0) * 5)}%` }}
                      />
                    </div>
                  </div>
                </div>
                <span className="text-xs font-mono text-white w-16 text-right">{p?.current.toFixed(2)}</span>
                <PriceFlashBadge value={p?.current ?? 0} prev={p?.open ?? 0} className="w-16 justify-end" />
              </div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
