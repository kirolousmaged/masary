'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePortfolioStore } from '@/store/usePortfolioStore'
import { useHydrated } from '@/hooks/useHydrated'

export default function Root() {
  const router = useRouter()
  const hydrated   = useHydrated()
  const isOnboarded = usePortfolioStore(s => s.isOnboarded)

  useEffect(() => {
    if (!hydrated) return
    router.replace(isOnboarded ? '/dashboard' : '/onboarding')
  }, [hydrated, isOnboarded, router])

  return (
    <div className="min-h-dvh bg-[#0D1117] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-[0_0_32px_rgba(16,185,129,0.45)] animate-pulse">
          <span className="text-black font-bold text-2xl">م</span>
        </div>
        <p className="text-[#484F58] text-sm font-medium">مصرى</p>
      </div>
    </div>
  )
}
