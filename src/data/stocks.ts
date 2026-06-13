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

export const EGX_STOCKS: EGXStock[] = [
  { ticker: 'COMI',  name: 'Commercial International Bank', nameAr: 'البنك التجاري الدولي',       sector: 'Banking',      basePrice: 78.50,  pe: 8.2,  dividendYield: 4.5,  marketCapM: 156000, volatility: 0.008 },
  { ticker: 'FWRY',  name: 'Fawry for Banking Technology',  nameAr: 'فوري للتكنولوجيا المالية',    sector: 'Fintech',      basePrice: 14.20,  pe: 22.5, dividendYield: 0,    marketCapM: 12000,  volatility: 0.018 },
  { ticker: 'ORAS',  name: 'Orascom Construction',          nameAr: 'أوراسكوم للإنشاء',            sector: 'Construction', basePrice: 89.30,  pe: 12.1, dividendYield: 3.2,  marketCapM: 42000,  volatility: 0.010 },
  { ticker: 'HRHO',  name: 'Herfy Food Services',           nameAr: 'هيرفي للخدمات الغذائية',     sector: 'Food & Bev',   basePrice: 18.75,  pe: 15.3, dividendYield: 5.1,  marketCapM: 8500,   volatility: 0.012 },
  { ticker: 'EKHO',  name: 'EKH Egyptian Group',            nameAr: 'المجموعة المصرية للإسكان',  sector: 'Real Estate',  basePrice: 12.40,  pe: 6.8,  dividendYield: 6.2,  marketCapM: 6200,   volatility: 0.014 },
  { ticker: 'ETEL',  name: 'Telecom Egypt',                 nameAr: 'المصرية للاتصالات',           sector: 'Telecom',      basePrice: 24.80,  pe: 7.5,  dividendYield: 7.3,  marketCapM: 35000,  volatility: 0.009 },
  { ticker: 'SKPC',  name: 'Sidi Kerir Petrochemicals',     nameAr: 'سيدي كرير للبتروكيماويات',    sector: 'Chemicals',    basePrice: 8.60,   pe: 9.2,  dividendYield: 8.5,  marketCapM: 4300,   volatility: 0.016 },
  { ticker: 'EAST',  name: 'Eastern Company',               nameAr: 'الشركة الشرقية للدخان',       sector: 'Tobacco',      basePrice: 15.90,  pe: 11.4, dividendYield: 9.1,  marketCapM: 9500,   volatility: 0.007 },
  { ticker: 'MNHD',  name: 'Madinet Nasr Housing',          nameAr: 'مدينة نصر للإسكان',           sector: 'Real Estate',  basePrice: 6.85,   pe: 5.2,  dividendYield: 0,    marketCapM: 5200,   volatility: 0.019 },
  { ticker: 'CLHO',  name: 'Cleopatra Hospital Group',      nameAr: 'مجموعة كليوباترا',            sector: 'Healthcare',   basePrice: 9.20,   pe: 18.6, dividendYield: 2.3,  marketCapM: 4600,   volatility: 0.013 },
  { ticker: 'AMOC',  name: 'Alexandria Mineral Oils',       nameAr: 'الإسكندرية للزيوت المعدنية', sector: 'Oil & Gas',    basePrice: 6.15,   pe: 7.1,  dividendYield: 10.2, marketCapM: 3100,   volatility: 0.015 },
  { ticker: 'ORTE',  name: 'Orascom Technology Solutions',  nameAr: 'أوراسكوم للتكنولوجيا',       sector: 'Technology',   basePrice: 32.60,  pe: 28.3, dividendYield: 0,    marketCapM: 18000,  volatility: 0.022 },
  { ticker: 'MPCI',  name: 'Misr Petroleum',                nameAr: 'مصر للبترول',                sector: 'Oil & Gas',    basePrice: 11.20,  pe: 4.3,  dividendYield: 11.8, marketCapM: 5600,   volatility: 0.011 },
  { ticker: 'ALCN',  name: 'Al-Ahli Bank Egypt',            nameAr: 'البنك الأهلي المصري',         sector: 'Banking',      basePrice: 42.30,  pe: 9.7,  dividendYield: 6.8,  marketCapM: 85000,  volatility: 0.008 },
  { ticker: 'TMGH',  name: 'Talaat Moustafa Group',         nameAr: 'طلعت مصطفى',                  sector: 'Real Estate',  basePrice: 26.80,  pe: 14.2, dividendYield: 2.1,  marketCapM: 34000,  volatility: 0.013 },
]

export function generateEGX30History(days = 180) {
  const data: { date: string; value: number; goldEgp: number }[] = []
  let egx = 28500
  let gold = 3200
  for (let i = days; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
    if (d.getDay() === 0 || d.getDay() === 6) continue
    egx  = egx  * (1 + (seededRand(i * 7 + 1)  - 0.48) * 0.022)
    gold = gold * (1 + (seededRand(i * 13 + 3) - 0.47) * 0.008)
    data.push({
      date: d.toISOString().slice(0, 10),
      value: Math.round(egx),
      goldEgp: parseFloat(gold.toFixed(2)),
    })
  }
  return data
}

function seededRand(seed: number): number {
  const x = Math.sin(seed + 1) * 10000
  return x - Math.floor(x)
}
