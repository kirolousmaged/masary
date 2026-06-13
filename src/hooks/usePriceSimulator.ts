'use client'
import { useEffect, useRef } from 'react'
import { usePortfolioStore } from '@/store/usePortfolioStore'
import { EGX_STOCKS } from '@/data/stocks'
import type { GoldKarat } from '@/data/gold'

export function usePriceSimulator() {
  const tickStock = usePortfolioStore(s => s.tickStockPrice)
  const tickGold  = usePortfolioStore(s => s.tickGoldPrice)
  const stockPrices = usePortfolioStore(s => s.stockPrices)
  const goldPrices  = usePortfolioStore(s => s.goldPrices)

  const stockPricesRef = useRef(stockPrices)
  const goldPricesRef  = useRef(goldPrices)
  stockPricesRef.current = stockPrices
  goldPricesRef.current  = goldPrices

  useEffect(() => {
    const stockInterval = setInterval(() => {
      if (!isMarketOpen()) return
      const stock = EGX_STOCKS[Math.floor(Math.random() * EGX_STOCKS.length)]
      const cur = stockPricesRef.current[stock.ticker]?.current ?? stock.basePrice
      const delta = cur * stock.volatility * (Math.random() * 2 - 1)
      const next = Math.max(cur * 0.5, cur + delta)
      tickStock(stock.ticker, parseFloat(next.toFixed(2)))
    }, 1200)

    const goldInterval = setInterval(() => {
      const karats: GoldKarat[] = ['24K', '21K', '18K', 'pound']
      karats.forEach(k => {
        const cur = goldPricesRef.current[k]
        const delta = cur * 0.0006 * (Math.random() * 2 - 1)
        tickGold(k, parseFloat((cur + delta).toFixed(2)))
      })
    }, 60000)

    return () => {
      clearInterval(stockInterval)
      clearInterval(goldInterval)
    }
  }, [tickStock, tickGold])
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
  const open  = 10 * 60
  const close = 14 * 60 + 30
  return isWeekday && totalMins >= open && totalMins < close
}

export function nextMarketOpen(): string {
  const now = new Date()
  const cairoOffset = 3
  const day = (now.getUTCDay() + (now.getUTCHours() + cairoOffset >= 24 ? 1 : 0)) % 7
  const daysUntilSun = day === 5 ? 2 : day === 6 ? 1 : 0
  if (daysUntilSun > 0) return `Opens ${daysUntilSun === 1 ? 'Tomorrow' : 'Sunday'} 10:00 AM`
  return 'Opens Tomorrow 10:00 AM'
}
