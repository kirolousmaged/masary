import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GoldKarat } from '@/data/gold'
import type { SMSTransaction } from '@/data/transactions'
import { EGX_STOCKS } from '@/data/stocks'

export interface GoldHolding {
  id: string
  karat: GoldKarat
  amount: number
}

export interface StockHolding {
  id: string
  ticker: string
  shares: number
}

export interface StockPriceState {
  current: number
  prev: number
  open: number
  change: number
  changePct: number
}

export type GoldPrices = Record<GoldKarat, number>

interface PortfolioStore {
  isOnboarded: boolean
  cashBalance: number
  goldHoldings: GoldHolding[]
  stockHoldings: StockHolding[]
  goldPrices: GoldPrices
  stockPrices: Record<string, StockPriceState>
  transactions: SMSTransaction[]

  setIsOnboarded: (v: boolean) => void
  setCashBalance: (v: number) => void
  setGoldHoldings: (v: GoldHolding[]) => void
  setStockHoldings: (v: StockHolding[]) => void
  updateGoldPrices: (v: GoldPrices) => void
  updateStockPrices: (v: Record<string, StockPriceState>) => void
  tickStockPrice: (ticker: string, newPrice: number) => void
  tickGoldPrice: (karat: GoldKarat, newPrice: number) => void
  addTransaction: (v: SMSTransaction) => void
  adjustCashForTransaction: (type: 'credit' | 'debit', amount: number) => void

  buyStock: (ticker: string, shares: number) => string | null
  sellStock: (ticker: string, shares: number) => string | null
  buyGold: (karat: GoldKarat, amount: number) => string | null
  sellGold: (karat: GoldKarat, amount: number) => string | null

  reset: () => void
}

const defaultGoldPrices: GoldPrices = {
  '24K': 3820,
  '21K': 3342,
  '18K': 2865,
  pound: 26736,
}

function buildDefaultStockPrices(): Record<string, StockPriceState> {
  return Object.fromEntries(
    EGX_STOCKS.map(s => [
      s.ticker,
      { current: s.basePrice, prev: s.basePrice, open: s.basePrice, change: 0, changePct: 0 },
    ])
  )
}

export const usePortfolioStore = create<PortfolioStore>()(
  persist(
    (set, get) => ({
      isOnboarded: false,
      cashBalance: 0,
      goldHoldings: [],
      stockHoldings: [],
      goldPrices: defaultGoldPrices,
      stockPrices: buildDefaultStockPrices(),
      transactions: [],

      setIsOnboarded: v => set({ isOnboarded: v }),
      setCashBalance: v => set({ cashBalance: v }),
      setGoldHoldings: v => set({ goldHoldings: v }),
      setStockHoldings: v => set({ stockHoldings: v }),

      updateGoldPrices: v => set({ goldPrices: v }),
      updateStockPrices: v => set({ stockPrices: v }),

      tickStockPrice: (ticker, newPrice) =>
        set(state => {
          const prev = state.stockPrices[ticker]
          if (!prev) return state
          return {
            stockPrices: {
              ...state.stockPrices,
              [ticker]: {
                ...prev,
                prev: prev.current,
                current: newPrice,
                change: newPrice - prev.open,
                changePct: ((newPrice - prev.open) / prev.open) * 100,
              },
            },
          }
        }),

      tickGoldPrice: (karat, newPrice) =>
        set(state => ({
          goldPrices: { ...state.goldPrices, [karat]: newPrice },
        })),

      addTransaction: v =>
        set(state => ({ transactions: [v, ...state.transactions] })),

      adjustCashForTransaction: (type, amount) =>
        set(state => ({
          cashBalance:
            type === 'credit'
              ? state.cashBalance + amount
              : Math.max(0, state.cashBalance - amount),
        })),

      buyStock: (ticker, shares) => {
        const state = get()
        const price = state.stockPrices[ticker]?.current ?? 0
        const cost = parseFloat((price * shares).toFixed(2))
        if (shares <= 0) return 'Invalid amount'
        if (cost > state.cashBalance) return 'Insufficient cash balance'

        const existing = state.stockHoldings.find(h => h.ticker === ticker)
        const newHoldings = existing
          ? state.stockHoldings.map(h =>
              h.ticker === ticker ? { ...h, shares: h.shares + shares } : h
            )
          : [...state.stockHoldings, { id: `${ticker}-${Date.now()}`, ticker, shares }]

        const tx: SMSTransaction = {
          id: `tx-${Date.now()}`,
          type: 'debit',
          amount: cost,
          merchant: `Buy ${shares} × ${ticker}`,
          bank: 'EGX',
          date: new Date().toISOString(),
          rawText: `Bought ${shares} shares of ${ticker} @ ${price.toFixed(2)} EGP`,
        }

        set({
          cashBalance: parseFloat((state.cashBalance - cost).toFixed(2)),
          stockHoldings: newHoldings,
          transactions: [tx, ...state.transactions],
        })
        return null
      },

      sellStock: (ticker, shares) => {
        const state = get()
        const existing = state.stockHoldings.find(h => h.ticker === ticker)
        if (!existing) return 'You do not hold this stock'
        if (shares <= 0) return 'Invalid amount'
        if (existing.shares < shares) return `Only ${existing.shares} shares available`

        const price = state.stockPrices[ticker]?.current ?? 0
        const proceeds = parseFloat((price * shares).toFixed(2))

        const newHoldings =
          existing.shares === shares
            ? state.stockHoldings.filter(h => h.ticker !== ticker)
            : state.stockHoldings.map(h =>
                h.ticker === ticker ? { ...h, shares: h.shares - shares } : h
              )

        const tx: SMSTransaction = {
          id: `tx-${Date.now()}`,
          type: 'credit',
          amount: proceeds,
          merchant: `Sell ${shares} × ${ticker}`,
          bank: 'EGX',
          date: new Date().toISOString(),
          rawText: `Sold ${shares} shares of ${ticker} @ ${price.toFixed(2)} EGP`,
        }

        set({
          cashBalance: parseFloat((state.cashBalance + proceeds).toFixed(2)),
          stockHoldings: newHoldings,
          transactions: [tx, ...state.transactions],
        })
        return null
      },

      buyGold: (karat, amount) => {
        const state = get()
        const price = state.goldPrices[karat]
        const cost = parseFloat((price * amount).toFixed(2))
        if (amount <= 0) return 'Invalid amount'
        if (cost > state.cashBalance) return 'Insufficient cash balance'

        const unit = karat === 'pound' ? 'coins' : 'g'
        const existing = state.goldHoldings.find(h => h.karat === karat)
        const newHoldings = existing
          ? state.goldHoldings.map(h =>
              h.karat === karat
                ? { ...h, amount: parseFloat((h.amount + amount).toFixed(4)) }
                : h
            )
          : [...state.goldHoldings, { id: `${karat}-${Date.now()}`, karat, amount }]

        const tx: SMSTransaction = {
          id: `tx-${Date.now()}`,
          type: 'debit',
          amount: cost,
          merchant: `Buy ${karat} Gold`,
          bank: 'Gold Market',
          date: new Date().toISOString(),
          rawText: `Bought ${amount} ${unit} of ${karat} gold @ ${price.toFixed(0)} EGP`,
        }

        set({
          cashBalance: parseFloat((state.cashBalance - cost).toFixed(2)),
          goldHoldings: newHoldings,
          transactions: [tx, ...state.transactions],
        })
        return null
      },

      sellGold: (karat, amount) => {
        const state = get()
        const existing = state.goldHoldings.find(h => h.karat === karat)
        if (!existing) return 'You do not hold this gold type'
        if (amount <= 0) return 'Invalid amount'
        if (existing.amount < amount - 0.0001) return `Only ${existing.amount} available`

        const price = state.goldPrices[karat]
        const proceeds = parseFloat((price * amount).toFixed(2))
        const unit = karat === 'pound' ? 'coins' : 'g'

        const newHoldings =
          Math.abs(existing.amount - amount) < 0.0001
            ? state.goldHoldings.filter(h => h.karat !== karat)
            : state.goldHoldings.map(h =>
                h.karat === karat
                  ? { ...h, amount: parseFloat((h.amount - amount).toFixed(4)) }
                  : h
              )

        const tx: SMSTransaction = {
          id: `tx-${Date.now()}`,
          type: 'credit',
          amount: proceeds,
          merchant: `Sell ${karat} Gold`,
          bank: 'Gold Market',
          date: new Date().toISOString(),
          rawText: `Sold ${amount} ${unit} of ${karat} gold @ ${price.toFixed(0)} EGP`,
        }

        set({
          cashBalance: parseFloat((state.cashBalance + proceeds).toFixed(2)),
          goldHoldings: newHoldings,
          transactions: [tx, ...state.transactions],
        })
        return null
      },

      reset: () =>
        set({
          isOnboarded: false,
          cashBalance: 0,
          goldHoldings: [],
          stockHoldings: [],
          goldPrices: defaultGoldPrices,
          stockPrices: buildDefaultStockPrices(),
          transactions: [],
        }),
    }),
    {
      name: 'masary-portfolio',
      partialize: state => ({
        isOnboarded: state.isOnboarded,
        cashBalance: state.cashBalance,
        goldHoldings: state.goldHoldings,
        stockHoldings: state.stockHoldings,
        transactions: state.transactions,
      }),
    }
  )
)

export function useTotalGoldValue() {
  return usePortfolioStore(state => {
    return state.goldHoldings.reduce((sum, h) => {
      const price = state.goldPrices[h.karat] ?? 0
      return sum + h.amount * price
    }, 0)
  })
}

export function useTotalStockValue() {
  return usePortfolioStore(state => {
    return state.stockHoldings.reduce((sum, h) => {
      const price = state.stockPrices[h.ticker]?.current ?? 0
      return sum + h.shares * price
    }, 0)
  })
}

export function useTotalNetWorth() {
  const cash = usePortfolioStore(s => s.cashBalance)
  const gold = useTotalGoldValue()
  const stocks = useTotalStockValue()
  return cash + gold + stocks
}
