'use client'
import { useState, useEffect } from 'react'
import { isMarketOpen, nextMarketOpen } from './usePriceSimulator'

export function useMarketStatus() {
  const [open, setOpen] = useState(false)
  const [label, setLabel] = useState('')

  useEffect(() => {
    const update = () => {
      const isOpen = isMarketOpen()
      setOpen(isOpen)
      setLabel(isOpen ? 'Market Open' : nextMarketOpen())
    }
    update()
    const id = setInterval(update, 30000)
    return () => clearInterval(id)
  }, [])

  return { isOpen: open, label }
}
