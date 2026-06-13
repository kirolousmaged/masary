export interface SMSTransaction {
  id: string
  type: 'credit' | 'debit'
  amount: number
  merchant: string
  bank: string
  date: string
  rawText: string
}

export const MOCK_TRANSACTIONS: SMSTransaction[] = [
  {
    id: 'tx1',
    type: 'credit',
    amount: 5000,
    merchant: 'Ahmed Mohamed',
    bank: 'NBE',
    date: new Date(Date.now() - 1 * 3600000).toISOString(),
    rawText: 'NBE: تم استلام مبلغ 5,000.00 ج.م من أحمد محمد عبر InstaPay في 13/06/26',
  },
  {
    id: 'tx2',
    type: 'debit',
    amount: 450,
    merchant: 'CARREFOUR',
    bank: 'CIB',
    date: new Date(Date.now() - 3 * 3600000).toISOString(),
    rawText: 'CIB: تم خصم 450.00 ج.م من حسابك المنتهي بـ4521 لـ CARREFOUR في 13/06/26',
  },
  {
    id: 'tx3',
    type: 'debit',
    amount: 1200,
    merchant: 'Ramy Hassan',
    bank: 'InstaPay',
    date: new Date(Date.now() - 5 * 3600000).toISOString(),
    rawText: 'InstaPay: تحويل 1,200.00 ج.م إلى رامي حسن في 13/06/26',
  },
  {
    id: 'tx4',
    type: 'debit',
    amount: 250,
    merchant: 'VODAFONE',
    bank: 'BMisr',
    date: new Date(Date.now() - 8 * 3600000).toISOString(),
    rawText: 'BMisr: تم خصم 250.00 ج.م من حسابك لـ VODAFONE EGYPT في 13/06/26',
  },
  {
    id: 'tx5',
    type: 'credit',
    amount: 12500,
    merchant: 'Salary Transfer',
    bank: 'CIB',
    date: new Date(Date.now() - 24 * 3600000).toISOString(),
    rawText: 'CIB: تم إيداع 12,500.00 ج.م في حسابك المنتهي بـ4521 - راتب يونيو 2026',
  },
  {
    id: 'tx6',
    type: 'debit',
    amount: 380,
    merchant: 'SPINNEYS',
    bank: 'NBE',
    date: new Date(Date.now() - 26 * 3600000).toISOString(),
    rawText: 'NBE: تم خصم 380.00 ج.م من حسابك لـ SPINNEYS في 12/06/26',
  },
  {
    id: 'tx7',
    type: 'credit',
    amount: 2000,
    merchant: 'Sara Ali',
    bank: 'InstaPay',
    date: new Date(Date.now() - 30 * 3600000).toISOString(),
    rawText: 'InstaPay: تم استلام 2,000.00 ج.م من سارة علي في 12/06/26',
  },
  {
    id: 'tx8',
    type: 'debit',
    amount: 95,
    merchant: 'STARBUCKS',
    bank: 'CIB',
    date: new Date(Date.now() - 32 * 3600000).toISOString(),
    rawText: 'CIB: تم خصم 95.00 ج.م من حسابك المنتهي بـ4521 لـ STARBUCKS EGYPT في 12/06/26',
  },
]

export function parseSMSAmount(raw: string): number | null {
  const match = raw.match(/(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)(?:\s*)(ج\.م|EGP)/i)
  if (!match) return null
  return parseFloat(match[1].replace(/,/g, ''))
}

export function parseSMSType(raw: string): 'credit' | 'debit' {
  const creditKeywords = ['استلام', 'إيداع', 'received', 'credit', 'added']
  return creditKeywords.some(k => raw.toLowerCase().includes(k)) ? 'credit' : 'debit'
}
