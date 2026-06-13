'use client'
import { useEffect, useRef } from 'react'
import { usePortfolioStore } from '@/store/usePortfolioStore'
import { EGX_STOCKS } from '@/data/stocks'
import type { GoldKarat } from '@/data/gold'

// Baked in at build time from NEXT_PUBLIC_GOLDAPI_KEY GitHub Secret
const GOLDAPI_KEY = process.env.NEXT_PUBLIC_GOLDAPI_KEY ?? ''

// ── Gold (goldapi.io) ─────────────────────────────────────────────────────────
// Returns per-gram EGP prices for each karat directly — no conversion needed.
// Egyptian Gold Pound = 8.5 g of 21K gold.
async function fetchGoldPricesEGP(): Promise<Record<GoldKarat, number> | null> {
  if (!GOLDAPI_KEY) return null
  try {
    const res = await fetch('https://www.goldapi.io/api/XAU/EGP', {
      headers: {
        'x-access-token': GOLDAPI_KEY,
        'Content-Type': 'application/json',
      },
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

// ── EGX stocks (Yahoo Finance — .CA suffix = Cairo exchange) ──────────────────
// CapacitorHttp (enabled in capacitor.config.ts) routes this through native
// Android HTTP, bypassing the WebView CORS restriction.
async function fetchEGXPrices(): Promise<Record<string, number>> {
  try {
    const symbols = EGX_STOCKS.map(s => `${s.ticker}.CA`).join(',')
    const res = await fetch(
      `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}&fields=regularMarketPrice,symbol`,
      { cache: 'no-store' }
    )
    if (!res.ok) return {}
    const data = await res.json()
    const results: Array<{ symbol: string; regularMarketPrice?: number }> =
      data?.quoteResponse?.result ?? []
    const prices: Record<string, number> = {}
    for (const r of results) {
      if (r.regularMarketPrice && r.symbol) {
        prices[r.symbol.replace('.CA', '')] = r.regularMarketPrice
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
    // ── Real gold — fetch immediately then every 30 s ──────────────────────
    const loadGold = async () => {
      const prices = await fetchGoldPricesEGP()
      if (prices) updateGoldPrices(prices)
    }
    loadGold()
    const goldFetchId = setInterval(loadGold, 30_000)

    // ── Real EGX — fetch immediately then every 30 s ───────────────────────
    const loadStocks = async () => {
      const prices = await fetchEGXPrices()
      for (const [ticker, price] of Object.entries(prices)) {
        tickStock(ticker, price)
      }
    }
    loadStocks()
    const stockFetchId = setInterval(loadStocks, 30_000)

    // ── 2-second micro-tick for visual live movement ───────────────────────
    // Applies tiny noise between real fetches so numbers visibly animate.
    // Outside market hours, stock noise is dampened ×0.05.
    const microId = setInterval(() => {
      // Gold: ±0.03% per tick, all karats derived from current 24K
      const g24 = goldRef.current['24K']
      if (g24 > 0) {
        const noise  = g24 * 0.0003 * (Math.random() * 2 - 1)
        const new24k = Math.max(g24 * 0.8, g24 + noise)
        updateGoldPrices({
          '24K':  parseFloat(new24k.toFixed(2)),
          '21K':  parseFloat((new24k * 21 / 24).toFixed(2)),
          '18K':  parseFloat((new24k * 18 / 24).toFixed(2)),
          pound:  parseFloat((new24k * 21 / 24 * 8.5).toFixed(2)),
        })
      }

      // Stocks: one random ticker per tick
      const scale = isMarketOpen() ? 1 : 0.05
      const stock  = EGX_STOCKS[Math.floor(Math.random() * EGX_STOCKS.length)]
      const cur    = stockRef.current[stock.ticker]?.current ?? stock.basePrice
      const delta  = cur * stock.volatility * scale * (Math.random() * 2 - 1)
      tickStock(stock.ticker, parseFloat(Math.max(cur * 0.5, cur + delta).toFixed(2)))
    }, 2_000)

    return () => {
      clearInterval(goldFetchId)
      clearInterval(stockFetchId)
      clearInterval(microId)
    }
  }, [tickStock, updateGoldPrices])
}

export function isMarketOpen(): boolean {
  const now       = new Date()
  const utcH      = now.getUTCHours()
  const utcM      = now.getUTCMinutes()
  const cairoH    = (utcH + 3) % 24
  const day       = (now.getUTCDay() + (utcH + 3 >= 24 ? 1 : 0)) % 7
  const totalMins = cairoH * 60 + utcM
  return day >= 0 && day <= 4 && totalMins >= 10 * 60 && totalMins < 14 * 60 + 30
}
