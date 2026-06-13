'use client'
import { useEffect } from 'react'
import { usePortfolioStore } from '@/store/usePortfolioStore'
import { EGX_STOCKS } from '@/data/stocks'
import type { GoldKarat } from '@/data/gold'

const GOLDAPI_KEY = process.env.NEXT_PUBLIC_GOLDAPI_KEY ?? ''

// ── Gold ─────────────────────────────────────────────────────────────────────
// Source 1: goldapi.io  → XAU/EGP price per troy oz, then convert per karat
// Source 2: TradingView scanner (FOREXCOM:XAUEGP) as fallback
//
// Conversion:
//   price_per_gram_pure = oz_price_egp / 31.1035
//   21K per gram        = price_per_gram_pure × (21/24)
//   18K per gram        = price_per_gram_pure × (18/24)
//   Gold Pound (جنيه)   = 21K per gram × 8.5 g
async function fetchGoldPricesEGP(): Promise<Record<GoldKarat, number> | null> {
  // --- goldapi.io (primary) ---
  if (GOLDAPI_KEY) {
    try {
      const res = await fetch('https://www.goldapi.io/api/XAU/EGP', {
        headers: { 'x-access-token': GOLDAPI_KEY, 'Content-Type': 'application/json' },
        cache: 'no-store',
      })
      if (res.ok) {
        const d = await res.json()
        // goldapi.io returns per-gram prices directly
        if (d.price_gram_24k) {
          return {
            '24K':  parseFloat(d.price_gram_24k.toFixed(2)),
            '21K':  parseFloat(d.price_gram_21k.toFixed(2)),
            '18K':  parseFloat(d.price_gram_18k.toFixed(2)),
            pound:  parseFloat((d.price_gram_21k * 8.5).toFixed(2)),
          }
        }
      }
    } catch { /* fall through to TradingView */ }
  }

  // --- TradingView scanner (fallback) ---
  try {
    const res = await fetch('https://scanner.tradingview.com/forex/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symbols: { tickers: ['FOREXCOM:XAUEGP', 'OANDA:XAUEGP', 'FX:XAUEGP'] },
        columns: ['close'],
      }),
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = await res.json()
    const ozPriceEGP: number = data?.data?.[0]?.d?.[0]
    if (!ozPriceEGP || ozPriceEGP <= 0) return null

    const per_gram = ozPriceEGP / 31.1035
    return {
      '24K':  parseFloat(per_gram.toFixed(2)),
      '21K':  parseFloat((per_gram * 21 / 24).toFixed(2)),
      '18K':  parseFloat((per_gram * 18 / 24).toFixed(2)),
      pound:  parseFloat((per_gram * 21 / 24 * 8.5).toFixed(2)),
    }
  } catch {
    return null
  }
}

// ── EGX Stocks ───────────────────────────────────────────────────────────────
// TradingView Egypt scanner — returns real EGP prices, no API key required.
// CapacitorHttp (capacitor.config.ts) routes this through native Android HTTP.
async function fetchEGXPrices(): Promise<Record<string, number>> {
  try {
    const tickers = EGX_STOCKS.map(s => `EGX:${s.ticker}`)
    const res = await fetch('https://scanner.tradingview.com/egypt/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symbols: { tickers },
        columns: ['close'],
      }),
      cache: 'no-store',
    })
    if (!res.ok) return {}
    const data = await res.json()
    const prices: Record<string, number> = {}
    for (const row of (data?.data ?? [])) {
      const ticker = (row.s as string).replace('EGX:', '')
      const price  = row.d?.[0]
      if (typeof price === 'number' && price > 0) prices[ticker] = price
    }
    return prices
  } catch {
    return {}
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────
// NO simulation. Only real prices are written to the store.
// When market is closed prices stay at the last real close — no fake movement.
export function usePriceSimulator() {
  const tickStock        = usePortfolioStore(s => s.tickStockPrice)
  const updateGoldPrices = usePortfolioStore(s => s.updateGoldPrices)

  useEffect(() => {
    const loadGold = async () => {
      const prices = await fetchGoldPricesEGP()
      if (prices) updateGoldPrices(prices)
    }

    const loadStocks = async () => {
      const prices = await fetchEGXPrices()
      for (const [ticker, price] of Object.entries(prices)) {
        tickStock(ticker, price)
      }
    }

    // Fetch immediately on mount
    loadGold()
    loadStocks()

    // During market hours refresh every 30 s; outside hours every 5 min
    const interval = isMarketOpen() ? 30_000 : 5 * 60_000

    const goldId   = setInterval(loadGold,   interval)
    const stockId  = setInterval(loadStocks, interval)

    return () => {
      clearInterval(goldId)
      clearInterval(stockId)
    }
  }, [tickStock, updateGoldPrices])
}

export function isMarketOpen(): boolean {
  const now    = new Date()
  const utcH   = now.getUTCHours()
  const cairoH = (utcH + 3) % 24
  const day    = (now.getUTCDay() + (utcH + 3 >= 24 ? 1 : 0)) % 7
  const mins   = cairoH * 60 + now.getUTCMinutes()
  return day >= 0 && day <= 4 && mins >= 10 * 60 && mins < 14 * 60 + 30
}
