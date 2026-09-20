import type { Confidence } from './types';
import cityTierData from '../../utils/cityTier.json';

export type CityTier = '一线' | '新一线' | '二线' | '三线' | '四线及以下';

const data = cityTierData as unknown as Record<string, string[]>;

const TIER_ORDER: CityTier[] = ['一线', '新一线', '二线', '三线'];

export interface CityTierMatch {
  tier: CityTier;
  confidence: Confidence;
  matched?: string;
}

function normalize(raw: string): string {
  return (raw || '')
    .trim()
    .replace(/[省市]/g, '')
    .replace(/特别行政区|自治区|自治州|地区|盟$/g, '')
    .trim();
}

export function getCityTier(cityName: string): CityTierMatch {
  const input = (cityName || '').trim();
  if (!input) {
    return { tier: '四线及以下', confidence: 'low' };
  }

  const normalized = normalize(input);

  for (const tier of TIER_ORDER) {
    const list = data[tier] || [];
    if (list.includes(normalized)) {
      return { tier, confidence: 'high', matched: normalized };
    }
  }

  let best: { tier: CityTier; city: string } | null = null;
  for (const tier of TIER_ORDER) {
    for (const city of data[tier] || []) {
      if (input.includes(city) || normalized.includes(city)) {
        if (!best || city.length > best.city.length) {
          best = { tier, city };
        }
      }
    }
  }

  if (best) {
    return { tier: best.tier, confidence: 'high', matched: best.city };
  }

  return { tier: '四线及以下', confidence: 'low' };
}
