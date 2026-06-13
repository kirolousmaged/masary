'use client'
import { BottomNav } from './BottomNav'
import { usePriceSimulator } from '@/hooks/usePriceSimulator'

export function AppShell({ children }: { children: React.ReactNode }) {
  usePriceSimulator()

  return (
    <>
      <main className="min-h-dvh bg-[#0D1117] pb-[72px] pt-safe">
        {children}
      </main>
      <BottomNav />
    </>
  )
}
