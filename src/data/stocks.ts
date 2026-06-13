export interface EGXStock {
  ticker: string
  name: string
  nameAr: string
  sector: string
  basePrice: number
  pe: number
  dividendYield: number
  marketCapM: number
  volatility: number
}

// Base prices are approximate mid-2025 EGX values in EGP.
// They are replaced within seconds by live TradingView scanner prices at runtime.
export const EGX_STOCKS: EGXStock[] = [
  { ticker: 'COMI',  name: 'Commercial International Bank',   nameAr: 'البنك التجاري الدولي',            sector: 'Banking',      basePrice: 82.00,  pe: 8.2,  dividendYield: 4.5,  marketCapM: 163000, volatility: 0.008 },
  { ticker: 'FWRY',  name: 'Fawry for Banking Technology',    nameAr: 'فوري للتكنولوجيا المالية',         sector: 'Fintech',      basePrice: 12.50,  pe: 22.5, dividendYield: 0,    marketCapM: 10500,  volatility: 0.018 },
  { ticker: 'ORAS',  name: 'Orascom Construction',            nameAr: 'أوراسكوم للإنشاء والتشييد',       sector: 'Construction', basePrice: 741.25, pe: 12.1, dividendYield: 3.2,  marketCapM: 44000,  volatility: 0.010 },
  { ticker: 'HRHO',  name: 'EFG Hermes Holding',              nameAr: 'هيرميس للأوراق المالية',           sector: 'Investment',   basePrice: 45.00,  pe: 15.3, dividendYield: 2.1,  marketCapM: 38000,  volatility: 0.012 },
  { ticker: 'EKHO',  name: 'Egyptian Kuwaiti Holding',        nameAr: 'المصرية الكويتية القابضة',         sector: 'Diversified',  basePrice: 13.00,  pe: 6.8,  dividendYield: 6.2,  marketCapM: 6500,   volatility: 0.014 },
  { ticker: 'ETEL',  name: 'Telecom Egypt',                   nameAr: 'المصرية للاتصالات',                sector: 'Telecom',      basePrice: 28.00,  pe: 7.5,  dividendYield: 7.3,  marketCapM: 40000,  volatility: 0.009 },
  { ticker: 'SKPC',  name: 'Sidi Kerir Petrochemicals',       nameAr: 'سيدي كرير للبتروكيماويات',         sector: 'Chemicals',    basePrice: 10.00,  pe: 9.2,  dividendYield: 8.5,  marketCapM: 5000,   volatility: 0.016 },
  { ticker: 'EAST',  name: 'Eastern Company',                 nameAr: 'الشركة الشرقية للدخان',            sector: 'Tobacco',      basePrice: 17.50,  pe: 11.4, dividendYield: 9.1,  marketCapM: 10500,  volatility: 0.007 },
  { ticker: 'MNHD',  name: 'Madinet Nasr Housing',            nameAr: 'مدينة نصر للإسكان والتعمير',      sector: 'Real Estate',  basePrice: 8.50,   pe: 5.2,  dividendYield: 0,    marketCapM: 6400,   volatility: 0.019 },
  { ticker: 'CLHO',  name: 'Cleopatra Hospital Group',        nameAr: 'مجموعة كليوباترا للرعاية الصحية', sector: 'Healthcare',   basePrice: 11.00,  pe: 18.6, dividendYield: 2.3,  marketCapM: 5500,   volatility: 0.013 },
  { ticker: 'AMOC',  name: 'Alexandria Mineral Oils',         nameAr: 'الإسكندرية للزيوت المعدنية',      sector: 'Oil & Gas',    basePrice: 7.50,   pe: 7.1,  dividendYield: 10.2, marketCapM: 3750,   volatility: 0.015 },
  { ticker: 'ORTE',  name: 'Orange Egypt',                    nameAr: 'أورانج مصر',                       sector: 'Telecom',      basePrice: 18.00,  pe: 28.3, dividendYield: 0,    marketCapM: 10000,  volatility: 0.022 },
  { ticker: 'MPCI',  name: 'MOPCO',                           nameAr: 'موبكو للبتروكيماويات',             sector: 'Chemicals',    basePrice: 14.00,  pe: 4.3,  dividendYield: 11.8, marketCapM: 7000,   volatility: 0.011 },
  { ticker: 'ALCN',  name: 'Alexandria Container & Cargo',    nameAr: 'الإسكندرية للحاويات والشحن',      sector: 'Transport',    basePrice: 55.00,  pe: 9.7,  dividendYield: 6.8,  marketCapM: 9000,   volatility: 0.008 },
  { ticker: 'TMGH',  name: 'Talaat Moustafa Group',           nameAr: 'مجموعة طلعت مصطفى',               sector: 'Real Estate',  basePrice: 32.00,  pe: 14.2, dividendYield: 2.1,  marketCapM: 40000,  volatility: 0.013 },
]

export function generateEGX30History(days = 180) {
  const data: { date: string; value: number; goldEgp: number }[] = []
  let egx  = 28500
  let gold = 3200
  for (let i = days; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
    if (d.getDay() === 0 || d.getDay() === 6) continue
    egx  = egx  * (1 + (seededRand(i * 7 + 1)  - 0.48) * 0.022)
    gold = gold * (1 + (seededRand(i * 13 + 3) - 0.47) * 0.008)
    data.push({
      date:    d.toISOString().slice(0, 10),
      value:   Math.round(egx),
      goldEgp: parseFloat(gold.toFixed(2)),
    })
  }
  return data
}

function seededRand(seed: number): number {
  const x = Math.sin(seed + 1) * 10000
  return x - Math.floor(x)
}
