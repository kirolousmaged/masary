'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.75}>
        <rect x="3" y="3" width="8" height="8" rx="2" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.75" />
        <rect x="13" y="3" width="8" height="8" rx="2" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.75" />
        <rect x="3" y="13" width="8" height="8" rx="2" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.75" />
        <rect x="13" y="13" width="8" height="8" rx="2" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.75" />
      </svg>
    ),
  },
  {
    href: '/portfolio',
    label: 'Portfolio',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" fill={active ? 'rgba(16,185,129,0.15)' : 'none'} />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
  },
  {
    href: '/markets',
    label: 'Markets',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        {active && <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke="rgba(16,185,129,0.4)" strokeWidth="4" />}
      </svg>
    ),
  },
  {
    href: '/insights',
    label: 'Insights',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" fill={active ? 'rgba(16,185,129,0.1)' : 'none'} />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.06] pb-safe"
         style={{ background: 'rgba(13,17,23,0.95)', backdropFilter: 'blur(16px)' }}>
      <div className="flex items-center justify-around h-[56px]">
        {NAV_ITEMS.map(item => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all duration-150
                ${active ? 'text-emerald-400' : 'text-[#484F58] active:text-[#8B949E]'}`}
              aria-label={item.label}
            >
              {item.icon(active)}
              <span className={`text-[10px] font-medium leading-none transition-opacity ${active ? 'opacity-100' : 'opacity-60'}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
