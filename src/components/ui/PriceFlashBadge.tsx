'use client'
import { useEffect, useRef, useState } from 'react'

interface Props {
  value: number
  prev: number
  showValue?: boolean
  className?: string
}

export function PriceFlashBadge({ value, prev, showValue = false, className }: Props) {
  const [flashClass, setFlashClass] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (value === prev) return
    const cls = value > prev ? 'animate-flash-green' : 'animate-flash-red'
    setFlashClass(cls)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setFlashClass(''), 700)
    return () => clearTimeout(timerRef.current)
  }, [value, prev])

  const change = prev === 0 ? 0 : ((value - prev) / prev) * 100
  const isUp = change >= 0
  const color = isUp ? 'text-emerald-400' : 'text-red-400'
  const arrow = isUp ? '▲' : '▼'

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 font-mono text-xs tabular-nums transition-colors ${color} ${flashClass} ${className ?? ''}`}
    >
      <span>{arrow}</span>
      {showValue && <span>{Math.abs(value - prev).toFixed(2)}</span>}
      <span>{Math.abs(change).toFixed(2)}%</span>
    </span>
  )
}
