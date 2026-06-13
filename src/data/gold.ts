export type GoldKarat = '24K' | '21K' | '18K' | 'pound'

export interface GoldKaratInfo {
  key: GoldKarat
  label: string
  labelAr: string
  purity: number
  basePrice: number
  gramsPerUnit: number
  color: string
}

export const GOLD_KARATS: GoldKaratInfo[] = [
  { key: '24K',   label: '24 Karat',         labelAr: '٢٤ قيراط',    purity: 1.000, basePrice: 3820, gramsPerUnit: 1, color: '#FFD700' },
  { key: '21K',   label: '21 Karat',         labelAr: '٢١ قيراط',    purity: 0.875, basePrice: 3342, gramsPerUnit: 1, color: '#FFC125' },
  { key: '18K',   label: '18 Karat',         labelAr: '١٨ قيراط',    purity: 0.750, basePrice: 2865, gramsPerUnit: 1, color: '#FFB347' },
  { key: 'pound', label: 'Gold Pound (جنيه)', labelAr: 'جنيه دهب',    purity: 0.875, basePrice: 26736, gramsPerUnit: 8, color: '#F59E0B' },
]

export function getGoldKaratInfo(key: GoldKarat): GoldKaratInfo {
  return GOLD_KARATS.find(k => k.key === key)!
}

export function calcGoldValue(
  karat: GoldKarat,
  amount: number,
  prices: Record<GoldKarat, number>,
): number {
  const info = getGoldKaratInfo(karat)
  return karat === 'pound'
    ? amount * prices[karat]
    : amount * prices[karat]
}
