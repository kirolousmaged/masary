// Parses Egyptian bank SMS messages into structured transaction data.
// All parsing happens on-device — no SMS content is ever transmitted externally.

export interface ParsedSMSTransaction {
  type: 'credit' | 'debit'
  amount: number
  bank: string
  merchant: string
  ref?: string
  rawText: string
}

// QNB / InstaPay (IPN = InstaPay Network)
// "IPN transfer sent with amount of EGP 200.00 from 3683 on 12/06 at 06:13 PM. Ref# becfe431. For more details call 16607."
// "IPN transfer received with amount of EGP 500.00 from 1234 on 12/06 at 02:30 PM. Ref# abc12345."
function parseQNBInstaPay(text: string): ParsedSMSTransaction | null {
  const m = text.match(
    /IPN transfer\s+(sent|received)\s+with amount of EGP\s+([\d,]+\.?\d*)/i
  )
  if (!m) return null
  const ref = (text.match(/Ref#\s*(\w+)/i) ?? [])[1]
  return {
    type: m[1].toLowerCase() === 'received' ? 'credit' : 'debit',
    amount: parseFloat(m[2].replace(/,/g, '')),
    bank: 'QNB',
    merchant: 'InstaPay (IPN)',
    ref,
    rawText: text,
  }
}

// QNB generic debit/credit
// "Your QNB account XXXX3683 was debited EGP 200.00 on 12/06/2025."
// "Your QNB account XXXX3683 was credited EGP 1000.00 on 12/06/2025."
function parseQNBAccount(text: string): ParsedSMSTransaction | null {
  const m = text.match(/QNB account.*?was\s+(debited|credited)\s+EGP\s+([\d,]+\.?\d*)/i)
  if (!m) return null
  return {
    type: m[1].toLowerCase() === 'credited' ? 'credit' : 'debit',
    amount: parseFloat(m[2].replace(/,/g, '')),
    bank: 'QNB',
    merchant: 'QNB Account',
    rawText: text,
  }
}

// CIB (Commercial International Bank)
// "Your CIB account XXXX1234 was debited EGP 500.00..."
// "Dear CIB customer, EGP 1000.00 has been credited to your account..."
function parseCIB(text: string): ParsedSMSTransaction | null {
  const m1 = text.match(/CIB account.*?was\s+(debited|credited)\s+EGP\s+([\d,]+\.?\d*)/i)
  if (m1) {
    return {
      type: m1[1].toLowerCase() === 'credited' ? 'credit' : 'debit',
      amount: parseFloat(m1[2].replace(/,/g, '')),
      bank: 'CIB', merchant: 'CIB Account', rawText: text,
    }
  }
  const m2 = text.match(/EGP\s+([\d,]+\.?\d*)\s+has been (credited|debited).*?CIB/i)
  if (m2) {
    return {
      type: m2[2].toLowerCase() === 'credited' ? 'credit' : 'debit',
      amount: parseFloat(m2[1].replace(/,/g, '')),
      bank: 'CIB', merchant: 'CIB Account', rawText: text,
    }
  }
  return null
}

// Banque Misr / NBE / Alex Bank generic pattern
// "تم خصم مبلغ 200 جنيه من حسابك"  (Arabic debit)
// "تم إضافة مبلغ 500 جنيه لحسابك"  (Arabic credit)
function parseArabicBankSMS(text: string): ParsedSMSTransaction | null {
  const debitM = text.match(/تم خصم مبلغ\s*([\d,]+\.?\d*)\s*جنيه/u)
  if (debitM) {
    return {
      type: 'debit',
      amount: parseFloat(debitM[1].replace(/,/g, '')),
      bank: 'Bank', merchant: 'Bank Transfer', rawText: text,
    }
  }
  const creditM = text.match(/تم إضافة مبلغ\s*([\d,]+\.?\d*)\s*جنيه/u)
  if (creditM) {
    return {
      type: 'credit',
      amount: parseFloat(creditM[1].replace(/,/g, '')),
      bank: 'Bank', merchant: 'Bank Transfer', rawText: text,
    }
  }
  return null
}

// Vodafone Cash / Fawry
// "Received EGP 200 from 01012345678 via Vodafone Cash"
function parseVodafoneCash(text: string): ParsedSMSTransaction | null {
  const m = text.match(/(Received|Sent)\s+EGP\s+([\d,]+\.?\d*).*?(?:via\s+)?Vodafone Cash/i)
  if (!m) return null
  return {
    type: m[1].toLowerCase() === 'received' ? 'credit' : 'debit',
    amount: parseFloat(m[2].replace(/,/g, '')),
    bank: 'Vodafone Cash', merchant: 'Vodafone Cash Transfer', rawText: text,
  }
}

export function parseBankSMS(text: string): ParsedSMSTransaction | null {
  return (
    parseQNBInstaPay(text) ??
    parseQNBAccount(text) ??
    parseCIB(text) ??
    parseArabicBankSMS(text) ??
    parseVodafoneCash(text) ??
    null
  )
}
