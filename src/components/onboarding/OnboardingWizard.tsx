'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { usePortfolioStore } from '@/store/usePortfolioStore'
import type { GoldHolding, StockHolding } from '@/store/usePortfolioStore'
import { GOLD_KARATS, type GoldKarat } from '@/data/gold'
import { EGX_STOCKS } from '@/data/stocks'

const STEPS = ['Cash Balance', 'Gold Assets', 'EGX Stocks', 'Permissions']
const STEP_SUBTITLES = [
  'Enter your total liquid bank & wallet balance',
  'Add your gold holdings by karat type',
  'Add your Egyptian Exchange stock positions',
  'Allow SMS reading to auto-track transactions',
]

export function OnboardingWizard() {
  const router = useRouter()
  const { setCashBalance, setGoldHoldings, setStockHoldings, setIsOnboarded } = usePortfolioStore()

  const [step, setStep] = useState(0)
  const [cash, setCash] = useState('')
  const [goldHoldings, setLocalGold] = useState<GoldHolding[]>([
    { id: '1', karat: '21K', amount: 0 },
  ])
  const [stockHoldings, setLocalStocks] = useState<StockHolding[]>([
    { id: '1', ticker: 'COMI', shares: 0 },
  ])
  const [stockSearch, setStockSearch] = useState('')

  const addGold = () =>
    setLocalGold(prev => [...prev, { id: Date.now().toString(), karat: '21K', amount: 0 }])
  const removeGold = (id: string) => setLocalGold(prev => prev.filter(h => h.id !== id))
  const updateGold = (id: string, field: keyof GoldHolding, value: unknown) =>
    setLocalGold(prev => prev.map(h => h.id === id ? { ...h, [field]: value } : h))

  const addStock = (ticker: string) => {
    if (stockHoldings.find(s => s.ticker === ticker)) return
    setLocalStocks(prev => [...prev, { id: Date.now().toString(), ticker, shares: 0 }])
    setStockSearch('')
  }
  const removeStock = (id: string) => setLocalStocks(prev => prev.filter(s => s.id !== id))
  const updateStock = (id: string, shares: number) =>
    setLocalStocks(prev => prev.map(s => s.id === id ? { ...s, shares } : s))

  const filteredStocks = EGX_STOCKS.filter(
    s =>
      !stockHoldings.find(h => h.ticker === s.ticker) &&
      (s.ticker.toLowerCase().includes(stockSearch.toLowerCase()) ||
        s.name.toLowerCase().includes(stockSearch.toLowerCase()))
  ).slice(0, 6)

  const handleFinish = () => {
    setCashBalance(parseFloat(cash) || 0)
    setGoldHoldings(goldHoldings.filter(h => h.amount > 0))
    setStockHoldings(stockHoldings.filter(s => s.shares > 0))
    setIsOnboarded(true)
    router.push('/dashboard')
  }

  const canProceed = () => {
    if (step === 0) return cash !== '' && parseFloat(cash) >= 0
    return true
  }

  return (
    <div className="min-h-dvh flex flex-col bg-[#0D1117] px-5 pt-safe">
      {/* Header */}
      <div className="pt-8 pb-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
            <span className="text-black font-bold text-sm">م</span>
          </div>
          <h1 className="text-xl font-bold text-white">مصرى</h1>
        </div>

        {/* Step indicator */}
        <div className="flex gap-1.5 mb-6">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                i <= step ? 'bg-emerald-500' : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        <p className="text-xs text-[#8B949E] font-medium tracking-wide uppercase mb-1">
          Step {step + 1} of {STEPS.length}
        </p>
        <h2 className="text-2xl font-bold text-white">{STEPS[step]}</h2>
        <p className="text-sm text-[#8B949E] mt-1">{STEP_SUBTITLES[step]}</p>
      </div>

      {/* Step content */}
      <div className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            {step === 0 && <CashStep value={cash} onChange={setCash} />}
            {step === 1 && (
              <GoldStep
                holdings={goldHoldings}
                onAdd={addGold}
                onRemove={removeGold}
                onUpdate={updateGold}
              />
            )}
            {step === 2 && (
              <StocksStep
                holdings={stockHoldings}
                search={stockSearch}
                filtered={filteredStocks}
                onSearch={setStockSearch}
                onAdd={addStock}
                onRemove={removeStock}
                onUpdate={updateStock}
              />
            )}
            {step === 3 && <PermissionsStep />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="py-6 flex gap-3">
        {step > 0 && (
          <button
            onClick={() => setStep(s => s - 1)}
            className="flex-1 h-12 rounded-xl border border-white/10 text-[#8B949E] font-semibold text-sm active:scale-[0.97] transition-transform"
          >
            Back
          </button>
        )}
        <button
          onClick={() => (step < STEPS.length - 1 ? setStep(s => s + 1) : handleFinish())}
          disabled={!canProceed()}
          className={`flex-1 h-12 rounded-xl font-semibold text-sm transition-all active:scale-[0.97]
            ${canProceed()
              ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]'
              : 'bg-white/5 text-[#484F58] cursor-not-allowed'
            }`}
        >
          {step < STEPS.length - 1 ? 'Continue' : 'Get Started'}
        </button>
      </div>
    </div>
  )
}

/* ── Step sub-components ── */

function CashStep({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="glass-card p-4">
        <label className="text-xs text-[#8B949E] font-medium uppercase tracking-wide">Total Balance</label>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[#8B949E] text-sm font-medium w-10">EGP</span>
          <input
            type="number"
            inputMode="decimal"
            placeholder="0.00"
            value={value}
            onChange={e => onChange(e.target.value)}
            className="flex-1 bg-transparent text-2xl font-mono font-semibold text-white focus:outline-none placeholder:text-[#484F58]"
          />
        </div>
        <div className="mt-3 h-px bg-emerald-500/30" />
      </div>
      <p className="text-xs text-[#484F58] leading-relaxed">
        This includes all your bank accounts, CIB, NBE, Banque Misr, wallets (InstaPay, Fawry), and cash on hand.
      </p>
    </div>
  )
}

function GoldStep({
  holdings, onAdd, onRemove, onUpdate,
}: {
  holdings: GoldHolding[]
  onAdd: () => void
  onRemove: (id: string) => void
  onUpdate: (id: string, field: keyof GoldHolding, value: unknown) => void
}) {
  return (
    <div className="space-y-3">
      {holdings.map(h => (
        <div key={h.id} className="glass-card p-4 flex items-center gap-3">
          <select
            value={h.karat}
            onChange={e => onUpdate(h.id, 'karat', e.target.value as GoldKarat)}
            className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-amber-400/50"
          >
            {GOLD_KARATS.map(k => (
              <option key={k.key} value={k.key}>{k.label}</option>
            ))}
          </select>
          <input
            type="number"
            inputMode="decimal"
            placeholder={h.karat === 'pound' ? 'Coins' : 'Grams'}
            value={h.amount || ''}
            onChange={e => onUpdate(h.id, 'amount', parseFloat(e.target.value) || 0)}
            className="flex-1 bg-transparent font-mono text-white text-sm focus:outline-none placeholder:text-[#484F58] min-w-0"
          />
          <span className="text-[#484F58] text-xs">{h.karat === 'pound' ? 'coins' : 'g'}</span>
          {holdings.length > 1 && (
            <button onClick={() => onRemove(h.id)} className="text-[#484F58] p-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      ))}
      <button onClick={onAdd} className="w-full h-10 rounded-xl border border-dashed border-amber-500/30 text-amber-400 text-sm font-medium active:scale-[0.97] transition-transform">
        + Add Another Karat
      </button>
    </div>
  )
}

function StocksStep({
  holdings, search, filtered, onSearch, onAdd, onRemove, onUpdate,
}: {
  holdings: StockHolding[]
  search: string
  filtered: typeof EGX_STOCKS
  onSearch: (v: string) => void
  onAdd: (ticker: string) => void
  onRemove: (id: string) => void
  onUpdate: (id: string, shares: number) => void
}) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#484F58]" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search EGX ticker (e.g. COMI, FWRY)"
          value={search}
          onChange={e => onSearch(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 placeholder:text-[#484F58]"
        />
      </div>

      {search && filtered.length > 0 && (
        <div className="glass-card divide-y divide-white/[0.06] overflow-hidden">
          {filtered.map(s => (
            <button
              key={s.ticker}
              onClick={() => onAdd(s.ticker)}
              className="w-full flex items-center gap-3 px-4 py-2.5 active:bg-white/5 text-left"
            >
              <span className="text-xs font-mono font-bold text-emerald-400 w-12">{s.ticker}</span>
              <span className="text-xs text-[#8B949E] truncate">{s.name}</span>
            </button>
          ))}
        </div>
      )}

      {holdings.map(h => {
        const stock = EGX_STOCKS.find(s => s.ticker === h.ticker)
        return (
          <div key={h.id} className="glass-card p-4 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-mono font-bold text-emerald-400">{h.ticker}</p>
              <p className="text-[10px] text-[#484F58] truncate">{stock?.name}</p>
            </div>
            <input
              type="number"
              inputMode="numeric"
              placeholder="Shares"
              value={h.shares || ''}
              onChange={e => onUpdate(h.id, parseInt(e.target.value) || 0)}
              className="w-20 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm font-mono text-white text-right focus:outline-none focus:border-emerald-500/50"
            />
            <button onClick={() => onRemove(h.id)} className="text-[#484F58] p-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )
      })}
    </div>
  )
}

function PermissionsStep() {
  return (
    <div className="space-y-4">
      <div className="glass-card p-5 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.75" strokeLinecap="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-white mb-1">SMS Auto-Tracking</h3>
          <p className="text-sm text-[#8B949E] leading-relaxed">
            Masary reads bank SMS notifications from <span className="text-white">CIB, NBE, Banque Misr,</span> and <span className="text-white">InstaPay</span> to automatically update your cash balance.
          </p>
        </div>
        <div className="space-y-2">
          {[
            { icon: '🔒', text: 'All parsing happens on-device — zero SMS content is ever sent to external servers' },
            { icon: '⚡', text: 'Credits and debits auto-adjust your balance in real time' },
            { icon: '📋', text: 'Transaction history is stored locally, encrypted on your device' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className="text-base mt-0.5">{item.icon}</span>
              <p className="text-xs text-[#8B949E] leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="glass-card p-4 border-amber-500/20 bg-amber-500/5">
        <p className="text-xs text-amber-400/80 leading-relaxed">
          You can revoke this permission at any time in Android Settings → Apps → مصرى → Permissions. The app continues to work manually without it.
        </p>
      </div>
    </div>
  )
}
