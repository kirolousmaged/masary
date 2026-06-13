import type { Metadata, Viewport } from 'next'
import { Roboto } from 'next/font/google'
import ThemeRegistry from '@/lib/ThemeRegistry'
import './globals.css'

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
})

export const metadata: Metadata = {
  title: 'مصرى — Egyptian Wealth Tracker',
  description: 'Track your Egyptian net worth: gold, EGX stocks, and bank balances in real time.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'مصرى' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0D1117',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="ltr" className={roboto.variable}>
      <body>
        <ThemeRegistry>
          {children}
        </ThemeRegistry>
      </body>
    </html>
  )
}
