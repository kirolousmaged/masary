'use client'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { PriceFlashBadge } from '@/components/ui/PriceFlashBadge'
import { usePortfolioStore } from '@/store/usePortfolioStore'
import { GOLD_KARATS, getGoldKaratInfo } from '@/data/gold'
import { EGX_STOCKS } from '@/data/stocks'

type Tab = 'all' | 'gold' | 'stocks' | 'cash'

export function PortfolioContent() {
  const [tab, setTab] = useState<Tab>('all')

  const cashBalance   = usePortfolioStore(s => s.cashBalance)
  const goldHoldings  = usePortfolioStore(s => s.goldHoldings)
  const stockHoldings = usePortfolioStore(s => s.stockHoldings)
  const goldPrices    = usePortfolioStore(s => s.goldPrices)
  const stockPrices   = usePortfolioStore(s => s.stockPrices)
  const transactions  = usePortfolioStore(s => s.transactions)

  const totalGold = goldHoldings.reduce((s, h) => s + h.amount * goldPrices[h.karat], 0)
  const totalStocks = stockHoldings.reduce((s, h) => s + h.shares * (stockPrices[h.ticker]?.current ?? 0), 0)
  const total = cashBalance + totalGold + totalStocks

  const TABS: { key: Tab; label: string }[] = [
    { key: 'all',    label: 'All' },
    { key: 'gold',   label: 'Gold' },
    { key: 'stocks', label: 'Stocks' },
    { key: 'cash',   label: 'Cash' },
  ]

  return (
    <div className="px-4 pt-4 pb-2 space-y-4 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Portfolio</h1>
        <p className="text-sm text-[#8B949E]">{new Intl.NumberFormat('en', { maximumFractionDigits: 0 }).format(total)} EGP total</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-[0.96]
              ${tab === t.key
                ? 'bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                : 'bg-white/5 text-[#8B949E]'
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Gold Section */}
      {(tab === 'all' || tab === 'gold') && goldHoldings.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <SectionHeader title="Gold Holdings" value={totalGold} color="amber" />
          <div className="space-y-2 mt-2">
            {goldHoldings.map(h => {
              const info = getGoldKaratInfo(h.karat)
              const price = goldPrices[h.karat]
              const value = h.amount * price
              return (
                <div key={h.id} className="glass-card p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${info.color}18`, border: `1px solid ${info.color}30` }}>
                    <span className="text-base">🪙</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{info.label}</p>
                    <p className="text-[10px] text-[#484F58]">
                      {h.amount} {h.karat === 'pound' ? 'coins' : 'g'} × {price.toLocaleString('en', { maximumFractionDigits: 0 })} EGP
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-bold text-amber-400">
                      {value.toLocaleString('en', { maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-[10px] text-[#484F58]">EGP</p>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* All Karat Prices */}
      {(tab === 'gold') && (
        <div className="glass-card p-4 space-y-3">
          <p className="text-xs text-[#8B949E] font-medium">Spot Prices — Live</p>
          {GOLD_KARATS.map(k => (
            <div key={k.key} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: k.color }} />
                <span className="text-sm text-white">{k.label}</span>
              </div>
              <span className="text-sm font-mono text-amber-400">
                {goldPrices[k.key].toLocaleString('en', { maximumFractionDigits: 0 })} EGP/{k.key === 'pound' ? 'coin' : 'g'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Stocks Section */}
      {(tab === 'all' || tab === 'stocks') && stockHoldings.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}>
          <SectionHeader title="EGX Stocks" value={totalStocks} color="blue" />
          <div className="space-y-2 mt-2">
            {stockHoldings.map(h => {
              const info = EGX_STOCKS.find(s => s.ticker === h.ticker)
              const price = stockPrices[h.ticker]
              const value = h.shares * (price?.current ?? 0)
              return (
                <div key={h.id} className="glass-card p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <span className="text-xs font-mono font-bold text-blue-400">{h.ticker.slice(0, 2)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white">{h.ticker}</p>
                      {price && (
                        <PriceFlashBadge value={price.current} prev={price.prev} />
                      )}
                    </div>
                    <p className="text-[10px] text-[#484F58] truncate">{info?.name} · {h.shares.toLocaleString()} shares</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-bold text-white">
                      {value.toLocaleString('en', { maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-[10px] text-[#484F58]">{price?.current.toFixed(2)} EGP/sh</p>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Cash Section */}
      {(tab === 'all' || tab === 'cash') && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
          <SectionHeader title="Cash & Transactions" value={cashBalance} color="emerald" />
          <div className="space-y-2 mt-2">
            {transactions.map(tx => (
              <div key={tx.id} className="glass-card px-4 py-3 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                  ${tx.type === 'credit' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                  {tx.type === 'credit' ? '↓' : '↑'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{tx.merchant}</p>
                  <p className="text-[10px] text-[#484F58]">
                    {tx.bank} · {new Date(tx.date).toLocaleString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
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

function SectionHeader({ title, value, color }: { title: string; value: number; color: string }) {
  const colorMap: Record<string, string> = { amber: 'text-amber-400', blue: 'text-blue-400', emerald: 'text-emerald-400' }
  return (
    <div className="flex items-center justify-between px-1">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className={`text-sm font-mono font-bold ${colorMap[color] ?? 'text-white'}`}>
        {new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value)} EGP
      </p>
    </div>
  )
}
