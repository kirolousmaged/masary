'use client'
import { useEffect, useRef } from 'react'
import { usePortfolioStore } from '@/store/usePortfolioStore'
import { EGX_STOCKS } from '@/data/stocks'
import type { GoldKarat } from '@/data/gold'

const GOLDAPI_KEY = process.env.NEXT_PUBLIC_GOLDAPI_KEY ?? ''

// ── Gold (goldapi.io → EGP per gram for each karat) ──────────────────────────
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

// ── EGX stocks (Yahoo Finance v8 chart API) ───────────────────────────────────
// The v7 quote batch endpoint requires cookie-auth since 2024; the v8 chart
// endpoint is fetched per-ticker and remains publicly accessible.
// CapacitorHttp (enabled in capacitor.config.ts) routes these calls through
// native Android HTTP — no WebView CORS restriction applies.
async function fetchOneStockPrice(ticker: string): Promise<number | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}.CA?interval=1d&range=1d`,
      { cache: 'no-store' }
    )
    if (!res.ok) return null
    const data = await res.json()
    const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice
    return typeof price === 'number' && price > 0 ? price : null
  } catch {
    return null
  }
}

async function fetchEGXPrices(): Promise<Record<string, number>> {
  const settled = await Promise.allSettled(
    EGX_STOCKS.map(s =>
      fetchOneStockPrice(s.ticker).then(price => ({ ticker: s.ticker, price }))
    )
  )
  const prices: Record<string, number> = {}
  for (const r of settled) {
    if (r.status === 'fulfilled' && r.value.price !== null) {
      prices[r.value.ticker] = r.value.price
    }
  }
  return prices
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
    // Real gold — immediately then every 30 s
    const loadGold = async () => {
      const prices = await fetchGoldPricesEGP()
      if (prices) updateGoldPrices(prices)
    }
    loadGold()
    const goldFetchId = setInterval(loadGold, 30_000)

    // Real EGX — immediately then every 30 s
    const loadStocks = async () => {
      const prices = await fetchEGXPrices()
      for (const [ticker, price] of Object.entries(prices)) {
        tickStock(ticker, price)
      }
    }
    loadStocks()
    const stockFetchId = setInterval(loadStocks, 30_000)

    // 2-second micro-tick — visual live movement between real fetches
    const microId = setInterval(() => {
      // Gold ±0.03% per tick
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

      // Stocks — one random ticker per tick
      const scale  = isMarketOpen() ? 1 : 0.05
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
  const now    = new Date()
  const utcH   = now.getUTCHours()
  const cairoH = (utcH + 3) % 24
  const day    = (now.getUTCDay() + (utcH + 3 >= 24 ? 1 : 0)) % 7
  const mins   = cairoH * 60 + now.getUTCMinutes()
  return day >= 0 && day <= 4 && mins >= 10 * 60 && mins < 14 * 60 + 30
}
