'use client'
import { motion } from 'framer-motion'
import { AnimatedCounter } from '@/components/ui/AnimatedCounter'
import { PriceFlashBadge } from '@/components/ui/PriceFlashBadge'
import { MarketStatusChip } from '@/components/ui/MarketStatusChip'
import {
  usePortfolioStore,
  useTotalNetWorth,
  useTotalGoldValue,
  useTotalStockValue,
} from '@/store/usePortfolioStore'
import { GOLD_KARATS } from '@/data/gold'
import { EGX_STOCKS } from '@/data/stocks'
import { useRef } from 'react'

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  }),
}

export function DashboardContent() {
  const cashBalance = usePortfolioStore(s => s.cashBalance)
  const goldHoldings = usePortfolioStore(s => s.goldHoldings)
  const stockHoldings = usePortfolioStore(s => s.stockHoldings)
  const goldPrices = usePortfolioStore(s => s.goldPrices)
  const stockPrices = usePortfolioStore(s => s.stockPrices)
  const transactions = usePortfolioStore(s => s.transactions)

  const totalNetWorth = useTotalNetWorth()
  const totalGold = useTotalGoldValue()
  const totalStocks = useTotalStockValue()

  const prevNetWorth = useRef(totalNetWorth)

  const goldPct   = totalNetWorth > 0 ? (totalGold / totalNetWorth) * 100 : 0
  const stockPct  = totalNetWorth > 0 ? (totalStocks / totalNetWorth) * 100 : 0
  const cashPct   = totalNetWorth > 0 ? (cashBalance / totalNetWorth) * 100 : 0

  const recentTx = transactions.slice(0, 3)
  const topStock = stockHoldings
    .map(h => ({ ...h, value: h.shares * (stockPrices[h.ticker]?.current ?? 0) }))
    .sort((a, b) => b.value - a.value)[0]

  return (
    <div className="px-4 pt-4 pb-2 space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[#8B949E] font-medium">Total Net Worth</p>
          <p className="text-[10px] text-[#484F58]">مصرى — {new Date().toLocaleDateString('ar-EG')}</p>
        </div>
        <MarketStatusChip />
      </div>

      {/* Net Worth Hero */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="glass-card p-6 text-center glow-emerald"
        style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(13,17,23,0.9) 60%)' }}
      >
        <AnimatedCounter
          value={totalNetWorth}
          className="text-[2.2rem] font-bold text-white leading-none"
          duration={900}
        />
        <div className="flex items-center justify-center gap-2 mt-2">
          <PriceFlashBadge value={totalNetWorth} prev={prevNetWorth.current} showValue />
          <span className="text-[10px] text-[#484F58]">Today</span>
        </div>

        {/* Allocation bar */}
        <div className="mt-5 space-y-2">
          <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
            <div className="bg-emerald-500 transition-all duration-700" style={{ width: `${cashPct}%` }} />
            <div className="bg-amber-400 transition-all duration-700" style={{ width: `${goldPct}%` }} />
            <div className="bg-blue-400 transition-all duration-700" style={{ width: `${stockPct}%` }} />
          </div>
          <div className="flex justify-center gap-4 text-[10px] text-[#8B949E]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />Cash {cashPct.toFixed(0)}%</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" />Gold {goldPct.toFixed(0)}%</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400" />Stocks {stockPct.toFixed(0)}%</span>
          </div>
        </div>
      </motion.div>

      {/* Breakdown Cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Cash', value: cashBalance, color: 'emerald', icon: '💵', pct: cashPct },
          { label: 'Gold', value: totalGold, color: 'amber', icon: '🪙', pct: goldPct },
          { label: 'Stocks', value: totalStocks, color: 'blue', icon: '📈', pct: stockPct },
        ].map((card, i) => (
          <motion.div key={card.label} custom={i} initial="hidden" animate="show" variants={cardVariants}
            className="glass-card p-3 flex flex-col gap-1">
            <span className="text-base">{card.icon}</span>
            <p className="text-[10px] text-[#8B949E]">{card.label}</p>
            <p className="text-sm font-mono font-bold text-white leading-tight">
              {new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(card.value)}
            </p>
            <p className="text-[10px] text-[#484F58]">{card.pct.toFixed(1)}%</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Gold Prices */}
      {goldHoldings.length > 0 && (
        <motion.div custom={3} initial="hidden" animate="show" variants={cardVariants} className="glass-card p-4">
          <p className="text-xs text-[#8B949E] font-medium mb-3">Live Gold Prices</p>
          <div className="grid grid-cols-2 gap-2">
            {GOLD_KARATS.filter(k => goldHoldings.find(h => h.karat === k.key)).map(k => (
              <div key={k.key} className="flex items-center justify-between">
                <span className="text-xs text-[#484F58]">{k.label}</span>
                <span className="text-xs font-mono text-amber-400">
                  {goldPrices[k.key].toLocaleString('en', { maximumFractionDigits: 0 })} EGP
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Top Stock */}
      {topStock && (
        <motion.div custom={4} initial="hidden" animate="show" variants={cardVariants} className="glass-card p-4">
          <p className="text-xs text-[#8B949E] font-medium mb-3">Top Stock Position</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <span className="text-xs font-mono font-bold text-blue-400">{topStock.ticker.slice(0, 2)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">{topStock.ticker}</p>
              <p className="text-[10px] text-[#484F58]">{topStock.shares.toLocaleString()} shares</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-mono font-bold text-white">
                {topStock.value.toLocaleString('en', { maximumFractionDigits: 0 })} EGP
              </p>
              <PriceFlashBadge
                value={stockPrices[topStock.ticker]?.current ?? 0}
                prev={stockPrices[topStock.ticker]?.prev ?? 0}
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Recent Transactions */}
      {recentTx.length > 0 && (
        <motion.div custom={5} initial="hidden" animate="show" variants={cardVariants} className="glass-card p-4">
          <p className="text-xs text-[#8B949E] font-medium mb-3">Recent Activity</p>
          <div className="space-y-3">
            {recentTx.map(tx => (
              <div key={tx.id} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm
                  ${tx.type === 'credit' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                  {tx.type === 'credit' ? '↓' : '↑'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{tx.merchant}</p>
                  <p className="text-[10px] text-[#484F58]">{tx.bank} · {new Date(tx.date).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <p className={`text-sm font-mono font-semibold ${tx.type === 'credit' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {tx.type === 'credit' ? '+' : '-'}{tx.amount.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
