'use client'
import { useEffect, useRef } from 'react'
import { usePortfolioStore } from '@/store/usePortfolioStore'
import { EGX_STOCKS } from '@/data/stocks'
import type { GoldKarat } from '@/data/gold'

const GOLDAPI_KEY = process.env.NEXT_PUBLIC_GOLDAPI_KEY ?? ''

// ── Gold ─────────────────────────────────────────────────────────────────────
// goldapi.io /api/XAU/EGP returns per-gram prices already converted to EGP:
//   price_gram_24k  — pure gold per gram in EGP
//   price_gram_21k  — 21K per gram in EGP  (= 24K × 21/24)
//   price_gram_18k  — 18K per gram in EGP  (= 24K × 18/24)
//   pound           — Egyptian Gold Pound = 21K per gram × 8.5 g
async function fetchGoldPricesEGP(): Promise<Record<GoldKarat, number> | null> {
  if (!GOLDAPI_KEY) return null
  try {
    const res = await fetch('https://www.goldapi.io/api/XAU/EGP', {
      headers: { 'x-access-token': GOLDAPI_KEY, 'Content-Type': 'application/json' },
      cache: 'no-store',
    })
    if (!res.ok) return null
    const d = await res.json()
    if (!d.price_gram_24k) return null
    return {
      '24K':  parseFloat(d.price_gram_24k.toFixed(2)),
      '21K':  parseFloat(d.price_gram_21k.toFixed(2)),
      '18K':  parseFloat(d.price_gram_18k.toFixed(2)),
      pound:  parseFloat((d.price_gram_21k * 8.5).toFixed(2)),
    }
  } catch {
    return null
  }
}

// ── EGX Stocks ───────────────────────────────────────────────────────────────
// TradingView Egypt scanner — no API key required, returns real EGP prices.
// CapacitorHttp (capacitor.config.ts) routes this through native Android HTTP,
// bypassing WebView CORS restrictions.
async function fetchEGXPrices(tickers: string[]): Promise<Record<string, number>> {
  if (tickers.length === 0) return {}
  try {
    const tvTickers = tickers.map(t => `EGX:${t}`)
    const res = await fetch('https://scanner.tradingview.com/egypt/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbols: { tickers: tvTickers }, columns: ['close'] }),
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
// Only real prices are written to the store — no simulation, no fake movement.
// A ref holds the latest stockHoldings so we don't restart the interval on
// every portfolio change.
export function usePriceSimulator() {
  const tickStock        = usePortfolioStore(s => s.tickStockPrice)
  const updateGoldPrices = usePortfolioStore(s => s.updateGoldPrices)
  const stockHoldings    = usePortfolioStore(s => s.stockHoldings)

  const holdingsRef = useRef(stockHoldings)
  useEffect(() => { holdingsRef.current = stockHoldings }, [stockHoldings])

  useEffect(() => {
    const loadGold = async () => {
      const prices = await fetchGoldPricesEGP()
      if (prices) updateGoldPrices(prices)
    }

    const loadStocks = async () => {
      const presetSet     = new Set(EGX_STOCKS.map(s => s.ticker))
      const customTickers = holdingsRef.current
        .map(h => h.ticker)
        .filter(t => !presetSet.has(t))
      const allTickers = [...EGX_STOCKS.map(s => s.ticker), ...customTickers]

      const prices = await fetchEGXPrices(allTickers)
      for (const [ticker, price] of Object.entries(prices)) {
        tickStock(ticker, price)
      }
    }

    loadGold()
    loadStocks()

    // Real-time during market hours; slow poll when closed
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
  // EGX: Sunday–Thursday 10:00–14:30 Cairo (UTC+3)
  return day >= 0 && day <= 4 && mins >= 10 * 60 && mins < 14 * 60 + 30
}
