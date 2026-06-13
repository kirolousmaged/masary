'use client'
import { useEffect, useRef } from 'react'
import { usePortfolioStore } from '@/store/usePortfolioStore'
import { EGX_STOCKS } from '@/data/stocks'
import type { GoldKarat } from '@/data/gold'

const GOLDAPI_KEY    = process.env.NEXT_PUBLIC_GOLDAPI_KEY    ?? ''
const TWELVEDATA_KEY = process.env.NEXT_PUBLIC_TWELVEDATA_KEY ?? ''

// ── Gold — goldapi.io (EGP per gram direct) ───────────────────────────────────
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

// ── EGX stocks — Twelve Data (/price batch, exchange=EGX, currency=EGP) ───────
// Free tier: 800 credits/day, 8/min. 15 symbols = 15 credits per fetch.
// We fetch every 5 min (3 fetches/hr × 15 = 45 credits/hr) — well within limits.
// CapacitorHttp.enabled in capacitor.config.ts bypasses WebView CORS on Android.
async function fetchEGXPrices(): Promise<Record<string, number>> {
  if (!TWELVEDATA_KEY) return {}
  try {
    const symbols = EGX_STOCKS.map(s => s.ticker).join(',')
    const url =
      `https://api.twelvedata.com/price` +
      `?symbol=${symbols}` +
      `&exchange=EGX` +
      `&apikey=${TWELVEDATA_KEY}`

    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return {}
    const data = await res.json()

    const prices: Record<string, number> = {}

    // Single-symbol response: { "price": "741.25" }
    // Multi-symbol response:  { "ORAS": { "price": "741.25" }, "COMI": { "price": "82.50" }, ... }
    if (typeof data.price === 'string') {
      // shouldn't happen (we always send multiple), but handle it
      const p = parseFloat(data.price)
      if (!isNaN(p) && p > 0) prices[EGX_STOCKS[0].ticker] = p
    } else {
      for (const [ticker, val] of Object.entries(data)) {
        const v = val as { price?: string; code?: number }
        if (v.code) continue           // error entry (ticker not found)
        const p = parseFloat(v.price ?? '')
        if (!isNaN(p) && p > 0) prices[ticker] = p
      }
    }

    return prices
  } catch {
    return {}
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function usePriceSimulator() {
  const tickStock        = usePortfolioStore(s => s.tickStockPrice)
  const updateGoldPrices = usePortfolioStore(s => s.updateGoldPrices)
  const goldPrices       = usePortfolioStore(s => s.goldPrices)
  const stockPrices      = usePortfolioStore(s => s.stockPrices)

  const goldRef  = useRef(goldPrices)
  const stockRef = useRef(stockPrices)
  goldRef.current  = goldPrices
  stockRef.current = stockPrices

  useEffect(() => {
    // ── Real gold: immediately + every 30 s ───────────────────────────────
    const loadGold = async () => {
      const prices = await fetchGoldPricesEGP()
      if (prices) updateGoldPrices(prices)
    }
    loadGold()
    const goldId = setInterval(loadGold, 30_000)

    // ── Real EGX: immediately + every 5 min (respects free-tier limits) ──
    const loadStocks = async () => {
      const prices = await fetchEGXPrices()
      for (const [ticker, price] of Object.entries(prices)) {
        tickStock(ticker, price)
      }
    }
    loadStocks()
    const stockId = setInterval(loadStocks, 5 * 60_000)

    // ── 2-second micro-tick: visual live movement between real fetches ─────
    const microId = setInterval(() => {
      // Gold ±0.03% per tick, all karats derived from current 24K
      const g24 = goldRef.current['24K']
      if (g24 > 0) {
        const n    = g24 * 0.0003 * (Math.random() * 2 - 1)
        const new24 = Math.max(g24 * 0.8, g24 + n)
        updateGoldPrices({
          '24K':  parseFloat(new24.toFixed(2)),
          '21K':  parseFloat((new24 * 21 / 24).toFixed(2)),
          '18K':  parseFloat((new24 * 18 / 24).toFixed(2)),
          pound:  parseFloat((new24 * 21 / 24 * 8.5).toFixed(2)),
        })
      }

      // Stocks: one random ticker per tick, ±volatility scaled by market status
      const scale = isMarketOpen() ? 1 : 0.05
      const stock = EGX_STOCKS[Math.floor(Math.random() * EGX_STOCKS.length)]
      const cur   = stockRef.current[stock.ticker]?.current ?? stock.basePrice
      const delta = cur * stock.volatility * scale * (Math.random() * 2 - 1)
      tickStock(stock.ticker, parseFloat(Math.max(cur * 0.5, cur + delta).toFixed(2)))
    }, 2_000)

    return () => {
      clearInterval(goldId)
      clearInterval(stockId)
      clearInterval(microId)
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
