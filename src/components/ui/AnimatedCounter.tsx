'use client'
import { useEffect, useRef, useState } from 'react'

interface Props {
  value: number
  duration?: number
  prefix?: string
  decimals?: number
  className?: string
}

export function AnimatedCounter({ value, duration = 700, prefix = 'EGP', decimals = 2, className }: Props) {
  const [displayed, setDisplayed] = useState(value)
  const prevRef = useRef(value)
  const rafRef  = useRef<number>(0)

  useEffect(() => {
    const start   = prevRef.current
    const diff    = value - start
    const startMs = performance.now()

    cancelAnimationFrame(rafRef.current)

    const tick = (now: number) => {
      const t = Math.min((now - startMs) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplayed(start + diff * eased)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        prevRef.current = value
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [value, duration])

  const formatted = new Intl.NumberFormat('en-EG', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(displayed)

  return (
    <span className={className}>
      <span className="text-[0.55em] font-medium opacity-70 mr-1">{prefix}</span>
      <span className="font-mono tabular-nums">{formatted}</span>
    </span>
  )
}
