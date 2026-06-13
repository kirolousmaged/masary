'use client'
import { useEffect } from 'react'
import { usePortfolioStore } from '@/store/usePortfolioStore'
import { parseBankSMS } from '@/utils/parseSMS'

// Recognised Egyptian bank / fintech SMS senders
const BANK_SENDERS = [
  'QNB', 'QNBALAHLI', '16607',     // QNB Al Ahli
  'CIB', 'CIBEGYPT',               // Commercial International Bank
  'NBE', 'NBEBANK',                // National Bank of Egypt
  'ALEXBANK',                       // Alexandria Bank
  'BANQUEMISR', 'BM',              // Banque Misr
  'INSTAPAY', 'IPN',               // InstaPay
  'VODAFONE', 'VFCASH',            // Vodafone Cash
  'FAWRY', 'FAWRYPAY',             // Fawry
]

function isBankSender(sender: string): boolean {
  const s = sender.toUpperCase().replace(/\s/g, '')
  return BANK_SENDERS.some(b => s.includes(b))
}

// Listens for new SMS arriving while the app is open, parses bank messages,
// and automatically adds matching transactions to the portfolio.
// Requires RECEIVE_SMS permission — Android will prompt the user on first run.
export function useSmsListener() {
  const addTransaction = usePortfolioStore(s => s.addTransaction)
  const adjustCash     = usePortfolioStore(s => s.adjustCashForTransaction)

  useEffect(() => {
    if (typeof window === 'undefined') return

    let removeListener: (() => void) | undefined

    const init = async () => {
      try {
        const { SmsPlugin } = await import('@/plugins/SmsPlugin')

        // Request RECEIVE_SMS permission — prompts user if not yet granted
        await SmsPlugin.requestPermission().catch(() => {})

        const handle = await SmsPlugin.addListener('smsReceived', ({ sender, body }) => {
          if (!isBankSender(sender)) return
          const parsed = parseBankSMS(body)
          if (!parsed) return

          addTransaction({
            id: `sms-${Date.now()}`,
            type: parsed.type,
            amount: parsed.amount,
            merchant: parsed.merchant,
            bank: parsed.bank,
            date: new Date().toISOString(),
            rawText: body,
          })
          adjustCash(parsed.type, parsed.amount)
        })

        removeListener = () => handle.remove()
      } catch {
        // Not on Android, or native plugin not loaded
      }
    }

    init()
    return () => { removeListener?.() }
  }, [addTransaction, adjustCash])
}
