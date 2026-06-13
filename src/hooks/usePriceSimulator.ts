'use client'
import { useEffect, useRef } from 'react'
import { usePortfolioStore } from '@/store/usePortfolioStore'
import { EGX_STOCKS } from '@/data/stocks'
import type { GoldKarat } from '@/data/gold'

async function fetchGoldPricesEGP(): Promise<Record<GoldKarat, number> | null> {
  try {
    const [metalRes, fxRes] = await Promise.all([
      fetch('https://api.metals.live/v1/spot/gold', { cache: 'no-store' }),
      fetch('https://open.er-api.com/v6/latest/USD', { cache: 'no-store' }),
    ])
    if (!metalRes.ok || !fxRes.ok) return null
    const [metalData, fxData] = await Promise.all([metalRes.json(), fxRes.json()])

    // metals.live returns [{ gold: 3247 }] or { gold: 3247 }
    const spotUSD: number = Array.isArray(metalData) ? metalData[0]?.gold : metalData?.gold
    const egpRate: number = fxData?.rates?.EGP

    if (!spotUSD || !egpRate) return null

    const per24k = (spotUSD / 31.1035) * egpRate
    return {
      '24K': parseFloat(per24k.toFixed(2)),
      '21K': parseFloat((per24k * 21 / 24).toFixed(2)),
      '18K': parseFloat((per24k * 18 / 24).toFixed(2)),
      pound: parseFloat((per24k * 21 / 24 * 8.5).toFixed(2)),
    }
  } catch {
    return null
  }
}

export function usePriceSimulator() {
  const tickStock        = usePortfolioStore(s => s.tickStockPrice)
  const updateGoldPrices = usePortfolioStore(s => s.updateGoldPrices)
  const stockPrices      = usePortfolioStore(s => s.stockPrices)

  const stockPricesRef = useRef(stockPrices)
  stockPricesRef.current = stockPrices

  useEffect(() => {
    // Real gold prices — fetch immediately then every 60 s
    const loadGold = async () => {
      const prices = await fetchGoldPricesEGP()
      if (prices) updateGoldPrices(prices)
    }
    loadGold()
    const goldInterval = setInterval(loadGold, 60000)

    // EGX simulation (1.2 s ticks, weekdays 10:00–14:30 Cairo)
    const stockInterval = setInterval(() => {
      if (!isMarketOpen()) return
      const stock = EGX_STOCKS[Math.floor(Math.random() * EGX_STOCKS.length)]
      const cur = stockPricesRef.current[stock.ticker]?.current ?? stock.basePrice
      const delta = cur * stock.volatility * (Math.random() * 2 - 1)
      const next = Math.max(cur * 0.5, cur + delta)
      tickStock(stock.ticker, parseFloat(next.toFixed(2)))
    }, 1200)

    return () => {
      clearInterval(goldInterval)
      clearInterval(stockInterval)
    }
  }, [tickStock, updateGoldPrices])
}

export function isMarketOpen(): boolean {
  const now = new Date()
  const cairoOffset = 3
  const utcHour = now.getUTCHours()
  const utcMin  = now.getUTCMinutes()
  const cairoHour = (utcHour + cairoOffset) % 24
  const day = (now.getUTCDay() + (utcHour + cairoOffset >= 24 ? 1 : 0)) % 7

  const isWeekday = day >= 0 && day <= 4
  const totalMins = cairoHour * 60 + utcMin
  return isWeekday && totalMins >= 10 * 60 && totalMins < 14 * 60 + 30
}
