export interface SMSTransaction {
  id: string
  type: 'credit' | 'debit'
  amount: number
  merchant: string
  bank: string
  date: string
  rawText: string
}

export function parseSMSAmount(raw: string): number | null {
  const match = raw.match(/(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)(?:\s*)(ج\.م|EGP)/i)
  if (!match) return null
  return parseFloat(match[1].replace(/,/g, ''))
}

export function parseSMSType(raw: string): 'credit' | 'debit' {
  const creditKeywords = ['استلام', 'إيداع', 'received', 'credit', 'added']
  return creditKeywords.some(k => raw.toLowerCase().includes(k)) ? 'credit' : 'debit'
}
