'use client'
import { useEffect, useRef } from 'react'
import { usePortfolioStore } from '@/store/usePortfolioStore'
import { EGX_STOCKS } from '@/data/stocks'
import type { GoldKarat } from '@/data/gold'

// ── Real gold price (metals.live spot + USD/EGP rate) ─────────────────────────
async function fetchGoldPricesEGP(): Promise<Record<GoldKarat, number> | null> {
  try {
    const [metalRes, fxRes] = await Promise.all([
      fetch('https://api.metals.live/v1/spot/gold', { cache: 'no-store' }),
      fetch('https://open.er-api.com/v6/latest/USD', { cache: 'no-store' }),
    ])
    if (!metalRes.ok || !fxRes.ok) return null
    const [metalData, fxData] = await Promise.all([metalRes.json(), fxRes.json()])
    const spotUSD: number = Array.isArray(metalData) ? metalData[0]?.gold : metalData?.gold
    const egpRate: number = fxData?.rates?.EGP
    if (!spotUSD || !egpRate) return null
    const per24k = (spotUSD / 31.1035) * egpRate
    return {
      '24K':  parseFloat(per24k.toFixed(2)),
      '21K':  parseFloat((per24k * 21 / 24).toFixed(2)),
      '18K':  parseFloat((per24k * 18 / 24).toFixed(2)),
      pound:  parseFloat((per24k * 21 / 24 * 8.5).toFixed(2)),
    }
  } catch {
    return null
  }
}

// ── Real EGX prices from Yahoo Finance ───────────────────────────────────────
// Egyptian stocks trade on Yahoo Finance with the .CA suffix (Cairo exchange)
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

// ── Hook ─────────────────────────────────────────────────────────────────────
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
    // ── 1. Real gold fetch — immediately then every 30 s ──────────────────
    const loadGold = async () => {
      const prices = await fetchGoldPricesEGP()
      if (prices) updateGoldPrices(prices)
    }
    loadGold()
    const goldFetchId = setInterval(loadGold, 30_000)

    // ── 2. Real EGX fetch — immediately then every 30 s ───────────────────
    const loadStocks = async () => {
      const prices = await fetchEGXPrices()
      for (const [ticker, price] of Object.entries(prices)) {
        tickStock(ticker, price)
      }
    }
    loadStocks()
    const stockFetchId = setInterval(loadStocks, 30_000)

    // ── 3. 2-second micro-tick — visual "live" movement ───────────────────
    // Applies tiny noise between real fetches so prices visibly animate.
    // Outside market hours stocks drift very slowly (×0.05).
    const microId = setInterval(() => {
      // Gold: ±0.03% per tick
      const gp     = goldRef.current
      const g24    = gp['24K']
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

      // Stocks: rotate one random ticker per tick
      const open   = isMarketOpen()
      const stock  = EGX_STOCKS[Math.floor(Math.random() * EGX_STOCKS.length)]
      const cur    = stockRef.current[stock.ticker]?.current ?? stock.basePrice
      const scale  = open ? 1 : 0.05
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
  const now        = new Date()
  const cairoOff   = 3
  const utcH       = now.getUTCHours()
  const utcM       = now.getUTCMinutes()
  const cairoH     = (utcH + cairoOff) % 24
  const day        = (now.getUTCDay() + (utcH + cairoOff >= 24 ? 1 : 0)) % 7
  const isWeekday  = day >= 0 && day <= 4
  const totalMins  = cairoH * 60 + utcM
  return isWeekday && totalMins >= 10 * 60 && totalMins < 14 * 60 + 30
}
