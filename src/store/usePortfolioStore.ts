import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GoldKarat } from '@/data/gold'
import { MOCK_TRANSACTIONS, type SMSTransaction } from '@/data/transactions'
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
      transactions: MOCK_TRANSACTIONS,

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

      reset: () =>
        set({
          isOnboarded: false,
          cashBalance: 0,
          goldHoldings: [],
          stockHoldings: [],
          goldPrices: defaultGoldPrices,
          stockPrices: buildDefaultStockPrices(),
          transactions: MOCK_TRANSACTIONS,
        }),
    }),
    {
      name: 'masary-portfolio',
      partialize: state => ({
        isOnboarded: state.isOnboarded,
        cashBalance: state.cashBalance,
        goldHoldings: state.goldHoldings,
        stockHoldings: state.stockHoldings,
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
