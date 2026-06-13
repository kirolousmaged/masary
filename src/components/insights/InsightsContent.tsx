'use client'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { usePortfolioStore } from '@/store/usePortfolioStore'
import { EGX_STOCKS, generateEGX30History } from '@/data/stocks'
import { useState, useMemo } from 'react'

const HISTORY = generateEGX30History()

type Range = '30d' | '6m'

export function InsightsContent() {
  const [range, setRange] = useState<Range>('30d')
  const stockPrices = usePortfolioStore(s => s.stockPrices)

  const chartData = useMemo(() => {
    const slice = range === '30d' ? HISTORY.slice(-30) : HISTORY
    if (slice.length === 0) return []
    const base = slice[0]
    return slice.map(d => ({
      date: d.date,
      egx:  parseFloat(((d.value / base.value - 1) * 100).toFixed(2)),
      gold: parseFloat(((d.goldEgp / base.goldEgp - 1) * 100).toFixed(2)),
    }))
  }, [range])

  const valueScreener = EGX_STOCKS
    .filter(s => s.pe > 0 && s.pe < 15 && s.dividendYield > 4)
    .sort((a, b) => b.dividendYield - a.dividendYield)
    .slice(0, 6)

  const momentum = EGX_STOCKS
    .map(s => ({ ...s, changePct: stockPrices[s.ticker]?.changePct ?? 0 }))
    .sort((a, b) => b.changePct - a.changePct)
    .slice(0, 5)

  const lastEgx  = chartData.at(-1)?.egx ?? 0
  const lastGold = chartData.at(-1)?.gold ?? 0
  const winner   = lastGold >= lastEgx ? 'Gold' : 'EGX30'
  const spread   = Math.abs(lastEgx - lastGold).toFixed(2)

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; dataKey: string }[]; label?: string }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="glass-card px-3 py-2 text-xs">
        <p className="text-[#484F58] mb-1">{label}</p>
        {payload.map(p => (
          <p key={p.dataKey} className={p.dataKey === 'gold' ? 'text-amber-400' : 'text-blue-400'}>
            {p.dataKey === 'gold' ? 'Gold' : 'EGX30'}: {p.value >= 0 ? '+' : ''}{p.value}%
          </p>
        ))}
      </div>
    )
  }

  return (
    <div className="px-4 pt-4 pb-2 space-y-4 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-white">Insights</h1>
        <p className="text-sm text-[#8B949E]">Alpha opportunities in Egyptian markets</p>
      </div>

      {/* Gold vs EGX30 Chart */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-white">Gold vs EGX30</p>
            <p className="text-[10px] text-[#484F58]">CAGR % return comparison</p>
          </div>
          <div className="flex gap-1.5">
            {(['30d', '6m'] as Range[]).map(r => (
              <button key={r} onClick={() => setRange(r)}
                className={`px-3 py-1 rounded-full text-[10px] font-semibold transition-all
                  ${range === r ? 'bg-white/10 text-white' : 'text-[#484F58]'}`}>
                {r === '30d' ? '30D' : '6M'}
              </button>
            ))}
          </div>
        </div>

        {/* Summary badges */}
        <div className="flex gap-2 mb-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-[10px] font-semibold text-amber-400">Gold {lastGold >= 0 ? '+' : ''}{lastGold}%</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span className="text-[10px] font-semibold text-blue-400">EGX30 {lastEgx >= 0 ? '+' : ''}{lastEgx}%</span>
          </div>
          <div className="ml-auto px-2.5 py-1 rounded-full bg-white/5 text-[10px] text-[#8B949E]">
            {winner} leads by {spread}%
          </div>
        </div>

        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
            <defs>
              <linearGradient id="gradGold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradEgx" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#60A5FA" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#60A5FA" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: '#484F58', fontSize: 9 }} tickFormatter={d => d.slice(5)} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fill: '#484F58', fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="gold" stroke="#F59E0B" strokeWidth={1.5} fill="url(#gradGold)" dot={false} />
            <Area type="monotone" dataKey="egx"  stroke="#60A5FA" strokeWidth={1.5} fill="url(#gradEgx)"  dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* EGX Value Screener */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.07 }}
        className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-white">Value Screener</p>
          <span className="text-[10px] text-[#484F58] ml-auto">P/E &lt; 15 + DY &gt; 4%</span>
        </div>
        <div className="space-y-2.5">
          {valueScreener.map(s => (
            <div key={s.ticker} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <span className="text-[10px] font-mono font-bold text-emerald-400">{s.ticker.slice(0, 2)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white">{s.ticker}</p>
                <p className="text-[10px] text-[#484F58] truncate">{s.sector}</p>
              </div>
              <div className="flex gap-2">
                <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-[10px] text-blue-400 font-mono">P/E {s.pe}</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-[10px] text-emerald-400 font-mono">DY {s.dividendYield}%</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <p className="text-[10px] text-[#484F58] leading-relaxed">
            Screener filters for EGX equities trading below 15× trailing earnings with positive dividend yield — classic Egyptian value investing criteria.
          </p>
        </div>
      </motion.div>

      {/* Momentum Breakouts */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.14 }}
        className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-white">Momentum Leaders</p>
          <span className="text-[10px] text-[#484F58] ml-auto">Intraday movers</span>
        </div>
        <div className="space-y-2.5">
          {momentum.map((s, i) => (
            <div key={s.ticker} className="flex items-center gap-3">
              <span className="text-[10px] text-[#484F58] w-4 text-right">{i + 1}</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <span className="text-[10px] font-mono font-bold text-amber-400">{s.ticker.slice(0, 2)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white">{s.ticker}</p>
                <p className="text-[10px] text-[#484F58] truncate">{s.name}</p>
              </div>
              <div className="text-right">
                <p className={`text-xs font-mono font-bold ${s.changePct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {s.changePct >= 0 ? '+' : ''}{s.changePct.toFixed(2)}%
                </p>
                <p className="text-[10px] text-[#484F58]">
                  {stockPrices[s.ticker]?.current.toFixed(2)} EGP
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Rebalancing Tip */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.21 }}>
        <div className="glass-card p-4 border-amber-500/20 bg-amber-500/[0.04]">
          <div className="flex items-start gap-3">
            <span className="text-base mt-0.5">💡</span>
            <div>
              <p className="text-xs font-semibold text-amber-400 mb-1">Rebalancing Insight</p>
              <p className="text-[11px] text-[#8B949E] leading-relaxed">
                {lastGold > lastEgx
                  ? `Gold has outperformed EGX30 by ${spread}% over the past ${range === '30d' ? '30 days' : '6 months'}. Consider taking some gold profit and rotating into undervalued EGX equities from the screener above.`
                  : `EGX30 has outperformed gold by ${spread}% over the past ${range === '30d' ? '30 days' : '6 months'}. Adding physical gold can hedge against currency risk and balance your EGP exposure.`
                }
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
