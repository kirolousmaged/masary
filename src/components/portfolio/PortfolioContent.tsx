'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { PriceFlashBadge } from '@/components/ui/PriceFlashBadge'
import { usePortfolioStore } from '@/store/usePortfolioStore'
import { GOLD_KARATS, getGoldKaratInfo, type GoldKarat } from '@/data/gold'
import { EGX_STOCKS } from '@/data/stocks'

type Tab = 'all' | 'gold' | 'stocks' | 'cash'

interface TradeSheet {
  mode: 'buy' | 'sell'
  asset: 'stock' | 'gold'
  ticker?: string
  karat?: GoldKarat
  label: string
  currentPrice: number
  maxSell: number
}

function fmt(n: number) {
  return new Intl.NumberFormat('en', { maximumFractionDigits: 0 }).format(n)
}

export function PortfolioContent() {
  const [tab, setTab] = useState<Tab>('all')
  const [sheet, setSheet] = useState<TradeSheet | null>(null)
  const [qty, setQty] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Cash manual entry sheet
  const [cashSheet, setCashSheet] = useState<'deposit' | 'withdraw' | null>(null)
  const [cashAmt, setCashAmt] = useState('')
  const [cashNote, setCashNote] = useState('')
  const [cashErr, setCashErr] = useState('')
  const [cashOk, setCashOk] = useState('')

  const cashBalance      = usePortfolioStore(s => s.cashBalance)
  const goldHoldings     = usePortfolioStore(s => s.goldHoldings)
  const stockHoldings    = usePortfolioStore(s => s.stockHoldings)
  const goldPrices       = usePortfolioStore(s => s.goldPrices)
  const stockPrices      = usePortfolioStore(s => s.stockPrices)
  const transactions     = usePortfolioStore(s => s.transactions)
  const buyStock         = usePortfolioStore(s => s.buyStock)
  const sellStock        = usePortfolioStore(s => s.sellStock)
  const buyGold          = usePortfolioStore(s => s.buyGold)
  const sellGold         = usePortfolioStore(s => s.sellGold)
  const manualCashEntry  = usePortfolioStore(s => s.manualCashEntry)

  const openCashSheet = (type: 'deposit' | 'withdraw') => {
    setCashSheet(type)
    setCashAmt('')
    setCashNote('')
    setCashErr('')
    setCashOk('')
  }
  const closeCashSheet = () => setCashSheet(null)

  const confirmCash = () => {
    if (!cashSheet) return
    const amt = parseFloat(cashAmt)
    const err = manualCashEntry(cashSheet === 'deposit' ? 'credit' : 'debit', amt, cashNote)
    if (err) { setCashErr(err) } else {
      setCashOk(cashSheet === 'deposit' ? 'Deposit recorded' : 'Withdrawal recorded')
      setTimeout(closeCashSheet, 900)
    }
  }

  const totalGold   = goldHoldings.reduce((s, h) => s + h.amount * goldPrices[h.karat], 0)
  const totalStocks = stockHoldings.reduce((s, h) => s + h.shares * (stockPrices[h.ticker]?.current ?? 0), 0)
  const total       = cashBalance + totalGold + totalStocks

  const TABS: { key: Tab; label: string }[] = [
    { key: 'all',    label: 'All' },
    { key: 'gold',   label: 'Gold' },
    { key: 'stocks', label: 'Stocks' },
    { key: 'cash',   label: 'Cash' },
  ]

  const openSheet = (s: TradeSheet) => {
    setSheet(s)
    setQty('')
    setError('')
    setSuccess('')
  }
  const closeSheet = () => setSheet(null)

  const qtyNum = parseFloat(qty) || 0
  const total_cost = sheet ? parseFloat((sheet.currentPrice * qtyNum).toFixed(2)) : 0

  const confirm = () => {
    if (!sheet) return
    let err: string | null = null
    if (sheet.asset === 'stock' && sheet.ticker) {
      err = sheet.mode === 'buy'
        ? buyStock(sheet.ticker, qtyNum)
        : sellStock(sheet.ticker, qtyNum)
    } else if (sheet.asset === 'gold' && sheet.karat) {
      err = sheet.mode === 'buy'
        ? buyGold(sheet.karat, qtyNum)
        : sellGold(sheet.karat, qtyNum)
    }
    if (err) {
      setError(err)
    } else {
      setSuccess(sheet.mode === 'buy' ? 'Purchase complete' : 'Sale complete')
      setTimeout(closeSheet, 900)
    }
  }

  return (
    <div className="px-4 pt-4 pb-2 space-y-4 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Portfolio</h1>
        <p className="text-sm text-[#8B949E]">{fmt(total)} EGP total</p>
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

      {/* ── Gold Holdings ─────────────────────────────── */}
      {(tab === 'all' || tab === 'gold') && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <SectionHeader title="Gold Holdings" value={totalGold} color="amber" />

          {goldHoldings.length === 0 ? (
            <EmptyState
              label="No gold yet"
              action="Buy Gold"
              onAction={() => openSheet({
                mode: 'buy', asset: 'gold', karat: '21K',
                label: '21K Gold', currentPrice: goldPrices['21K'], maxSell: 0,
              })}
            />
          ) : (
            <div className="space-y-2 mt-2">
              {goldHoldings.map(h => {
                const info  = getGoldKaratInfo(h.karat)
                const price = goldPrices[h.karat]
                const value = h.amount * price
                return (
                  <div key={h.id} className="glass-card p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `${info.color}18`, border: `1px solid ${info.color}30` }}>
                        <span className="text-base">🪙</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white">{info.label}</p>
                        <p className="text-[10px] text-[#484F58]">
                          {h.amount} {h.karat === 'pound' ? 'coins' : 'g'} × {fmt(price)} EGP
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-mono font-bold text-amber-400">{fmt(value)}</p>
                        <p className="text-[10px] text-[#484F58]">EGP</p>
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => openSheet({ mode: 'buy', asset: 'gold', karat: h.karat, label: `${h.karat} Gold`, currentPrice: price, maxSell: 0 })}
                        className="flex-1 py-1.5 text-xs rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 active:scale-[0.96] transition-transform"
                      >
                        Buy More
                      </button>
                      <button
                        onClick={() => openSheet({ mode: 'sell', asset: 'gold', karat: h.karat, label: `${h.karat} Gold`, currentPrice: price, maxSell: h.amount })}
                        className="flex-1 py-1.5 text-xs rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 active:scale-[0.96] transition-transform"
                      >
                        Sell
                      </button>
                    </div>
                  </div>
                )
              })}
              {/* Buy new karat */}
              <GoldBuyButtons goldPrices={goldPrices} heldKarats={goldHoldings.map(h => h.karat)} onBuy={openSheet} />
            </div>
          )}

          {/* Spot prices panel */}
          {tab === 'gold' && (
            <div className="glass-card p-4 space-y-3 mt-2">
              <p className="text-xs text-[#8B949E] font-medium">Live Spot Prices</p>
              {GOLD_KARATS.map(k => (
                <div key={k.key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: k.color }} />
                    <span className="text-sm text-white">{k.label}</span>
                  </div>
                  <span className="text-sm font-mono text-amber-400">
                    {fmt(goldPrices[k.key])} EGP/{k.key === 'pound' ? 'coin' : 'g'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ── Stock Holdings ────────────────────────────── */}
      {(tab === 'all' || tab === 'stocks') && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}>
          <SectionHeader title="EGX Stocks" value={totalStocks} color="blue" />

          {stockHoldings.length === 0 ? (
            <EmptyState label="No stocks yet" />
          ) : (
            <div className="space-y-2 mt-2">
              {stockHoldings.map(h => {
                const info  = EGX_STOCKS.find(s => s.ticker === h.ticker)
                const price = stockPrices[h.ticker]
                const value = h.shares * (price?.current ?? 0)
                return (
                  <div key={h.id} className="glass-card p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                        <span className="text-xs font-mono font-bold text-blue-400">{h.ticker.slice(0, 2)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-white">{h.ticker}</p>
                          {price && <PriceFlashBadge value={price.current} prev={price.prev} />}
                        </div>
                        <p className="text-[10px] text-[#484F58] truncate">
                          {info?.name} · {h.shares.toLocaleString()} shares
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-mono font-bold text-white">{fmt(value)}</p>
                        <p className="text-[10px] text-[#484F58]">{price?.current.toFixed(2)} EGP/sh</p>
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => openSheet({ mode: 'buy', asset: 'stock', ticker: h.ticker, label: h.ticker, currentPrice: price?.current ?? 0, maxSell: 0 })}
                        className="flex-1 py-1.5 text-xs rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 active:scale-[0.96] transition-transform"
                      >
                        Buy More
                      </button>
                      <button
                        onClick={() => openSheet({ mode: 'sell', asset: 'stock', ticker: h.ticker, label: h.ticker, currentPrice: price?.current ?? 0, maxSell: h.shares })}
                        className="flex-1 py-1.5 text-xs rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 active:scale-[0.96] transition-transform"
                      >
                        Sell
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* ── Cash & Transactions ───────────────────────── */}
      {(tab === 'all' || tab === 'cash') && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
          <SectionHeader title="Cash & Activity" value={cashBalance} color="emerald" />

          {/* Quick cash actions */}
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => openCashSheet('deposit')}
              className="flex-1 py-2 text-xs rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold active:scale-[0.96] transition-transform"
            >
              + Deposit
            </button>
            <button
              onClick={() => openCashSheet('withdraw')}
              className="flex-1 py-2 text-xs rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 font-semibold active:scale-[0.96] transition-transform"
            >
              − Withdraw
            </button>
          </div>

          {transactions.length === 0 ? (
            <div className="glass-card p-6 text-center mt-2">
              <p className="text-sm text-[#8B949E]">No transactions yet</p>
              <p className="text-[11px] text-[#484F58] mt-1">Trades and SMS bank activity will appear here</p>
            </div>
          ) : (
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
                    {tx.type === 'credit' ? '+' : '-'}{fmt(tx.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ── Trade Bottom Sheet ────────────────────────── */}
      <AnimatePresence>
        {sheet && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/60"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeSheet}
            />
            <motion.div
              className="fixed bottom-0 inset-x-0 z-50 bg-[#161B22] rounded-t-2xl p-6 pb-safe"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            >
              {/* Handle */}
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />

              <p className="text-base font-bold text-white mb-1">
                {sheet.mode === 'buy' ? 'Buy' : 'Sell'} {sheet.label}
              </p>
              <p className="text-xs text-[#8B949E] mb-5">
                Price: <span className="text-amber-400 font-mono">{fmt(sheet.currentPrice)} EGP</span>
                {sheet.mode === 'sell' && (
                  <span> · Available: <span className="text-white font-mono">{sheet.maxSell}</span></span>
                )}
                {sheet.mode === 'buy' && (
                  <span> · Cash: <span className="text-emerald-400 font-mono">{fmt(cashBalance)} EGP</span></span>
                )}
              </p>

              {/* Amount input */}
              <label className="block text-xs text-[#8B949E] mb-1.5">
                {sheet.asset === 'stock' ? 'Number of shares' : sheet.karat === 'pound' ? 'Number of coins' : 'Grams'}
              </label>
              <input
                type="number"
                min="0"
                step={sheet.asset === 'stock' ? '1' : '0.01'}
                value={qty}
                onChange={e => { setQty(e.target.value); setError('') }}
                placeholder="0"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-base font-mono focus:outline-none focus:border-emerald-500/60 mb-3"
                autoFocus
              />

              {/* Total */}
              {qtyNum > 0 && (
                <div className="flex justify-between text-sm mb-4">
                  <span className="text-[#8B949E]">Total {sheet.mode === 'buy' ? 'cost' : 'proceeds'}</span>
                  <span className={`font-mono font-bold ${sheet.mode === 'buy' ? 'text-red-400' : 'text-emerald-400'}`}>
                    {sheet.mode === 'buy' ? '-' : '+'}{fmt(total_cost)} EGP
                  </span>
                </div>
              )}

              {error && <p className="text-xs text-red-400 mb-3">{error}</p>}
              {success && <p className="text-xs text-emerald-400 mb-3">{success}</p>}

              <button
                onClick={confirm}
                disabled={qtyNum <= 0}
                className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all active:scale-[0.97]
                  ${qtyNum > 0
                    ? sheet.mode === 'buy'
                      ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                      : 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                    : 'bg-white/5 text-[#484F58] cursor-not-allowed'
                  }`}
              >
                {sheet.mode === 'buy' ? 'Confirm Purchase' : 'Confirm Sale'}
              </button>
              <button onClick={closeSheet} className="w-full py-3 mt-2 text-sm text-[#8B949E]">Cancel</button>
            </motion.div>
          </>
        )}

        {/* ── Cash Entry Sheet ─────────────────────── */}
        {cashSheet && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/60"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeCashSheet}
            />
            <motion.div
              className="fixed bottom-0 inset-x-0 z-50 bg-[#161B22] rounded-t-2xl p-6 pb-safe"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            >
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />

              <p className="text-base font-bold text-white mb-1">
                {cashSheet === 'deposit' ? 'Deposit Cash' : 'Withdraw Cash'}
              </p>
              <p className="text-xs text-[#8B949E] mb-5">
                Balance: <span className="text-emerald-400 font-mono">{fmt(cashBalance)} EGP</span>
              </p>

              <label className="block text-xs text-[#8B949E] mb-1.5">Amount (EGP)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={cashAmt}
                onChange={e => { setCashAmt(e.target.value); setCashErr('') }}
                placeholder="0"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-base font-mono focus:outline-none focus:border-emerald-500/60 mb-3"
                autoFocus
              />

              <label className="block text-xs text-[#8B949E] mb-1.5">Note (optional)</label>
              <input
                type="text"
                value={cashNote}
                onChange={e => setCashNote(e.target.value)}
                placeholder={cashSheet === 'deposit' ? 'e.g. Salary, ATM deposit…' : 'e.g. Rent, groceries…'}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500/60 mb-4"
              />

              {cashErr && <p className="text-xs text-red-400 mb-3">{cashErr}</p>}
              {cashOk  && <p className="text-xs text-emerald-400 mb-3">{cashOk}</p>}

              <button
                onClick={confirmCash}
                disabled={!(parseFloat(cashAmt) > 0)}
                className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all active:scale-[0.97]
                  ${parseFloat(cashAmt) > 0
                    ? cashSheet === 'deposit'
                      ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                      : 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                    : 'bg-white/5 text-[#484F58] cursor-not-allowed'
                  }`}
              >
                {cashSheet === 'deposit' ? 'Confirm Deposit' : 'Confirm Withdrawal'}
              </button>
              <button onClick={closeCashSheet} className="w-full py-3 mt-2 text-sm text-[#8B949E]">Cancel</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function SectionHeader({ title, value, color }: { title: string; value: number; color: string }) {
  const colorMap: Record<string, string> = { amber: 'text-amber-400', blue: 'text-blue-400', emerald: 'text-emerald-400' }
  return (
    <div className="flex items-center justify-between px-1 mb-1">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className={`text-sm font-mono font-bold ${colorMap[color] ?? 'text-white'}`}>
        {new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value)} EGP
      </p>
    </div>
  )
}

function EmptyState({ label, action, onAction }: { label: string; action?: string; onAction?: () => void }) {
  return (
    <div className="glass-card p-6 text-center mt-2">
      <p className="text-sm text-[#8B949E]">{label}</p>
      {action && onAction && (
        <button
          onClick={onAction}
          className="mt-3 px-4 py-1.5 text-xs rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
        >
          {action}
        </button>
      )}
    </div>
  )
}

function GoldBuyButtons({
  goldPrices,
  heldKarats,
  onBuy,
}: {
  goldPrices: Record<GoldKarat, number>
  heldKarats: GoldKarat[]
  onBuy: (s: TradeSheet) => void
}) {
  const available = GOLD_KARATS.filter(k => !heldKarats.includes(k.key))
  if (available.length === 0) return null
  return (
    <div className="glass-card p-4 mt-2">
      <p className="text-xs text-[#8B949E] mb-3">Add another karat</p>
      <div className="flex flex-wrap gap-2">
        {available.map(k => (
          <button
            key={k.key}
            onClick={() => onBuy({ mode: 'buy', asset: 'gold', karat: k.key, label: `${k.key} Gold`, currentPrice: goldPrices[k.key], maxSell: 0 })}
            className="px-3 py-1.5 rounded-full text-xs border border-amber-500/20 text-amber-400 bg-amber-500/5 active:scale-[0.96] transition-transform"
          >
            Buy {k.label}
          </button>
        ))}
      </div>
    </div>
  )
}
