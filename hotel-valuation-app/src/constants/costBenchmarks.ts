import type { ValuationInput } from '../types';

type Segment = NonNullable<ValuationInput['segment']>;
type CityTier = NonNullable<ValuationInput['city_tier']>;

export interface CostBenchmark {
  label: string;
  min: number;
  max: number;
  note: string;
}

// 单方造价（元/㎡），来源：行业造价估算指标汇总（网上公开搜索记录，仅供参考）
export const CONSTRUCTION_COST_BY_SEGMENT: Record<Segment, CostBenchmark> = {
  S1: { label: '五星级/豪华', min: 10000, max: 20000, note: '高档建材，智能化系统，景观园林，全服务配套' },
  S2: { label: '超奢华/精品', min: 20000, max: 30000, note: '顶级定制，艺术化设计，无明确上限' },
  S3: { label: '四星级/高端', min: 6000, max: 9000, note: '品质建材，健身房/宴会厅，行政楼层' },
  S4: { label: '中端/有限服务', min: 4000, max: 6000, note: '中央空调，完整公区，中档精装，含会议室/餐厅' },
  S5: { label: '中端/有限服务', min: 4000, max: 6000, note: '中央空调，完整公区，中档精装，含会议室/餐厅' },
  S6: { label: '经济型/快捷', min: 2000, max: 3500, note: '无中央空调，公区极简，标准化装修' },
};

// 城市能级对造价的调整（相对二线基准）
export const CITY_TIER_FACTOR: Record<CityTier, { factor: number; note: string }> = {
  一线: { factor: 1.3, note: '较二线上浮约 20–40%' },
  新一线: { factor: 0.95, note: '与二线接近，略低' },
  二线: { factor: 1.0, note: '基准' },
  三线: { factor: 0.85, note: '下浮约 15–25%' },
  四线及以下: { factor: 0.8, note: '下浮约 15–25%' },
};

export interface CostSuggestion {
  segmentLabel: string;
  base: CostBenchmark;
  factor: number;
  cityNote: string;
  minSqm: number;
  maxSqm: number;
}

export function suggestConstructionCost(
  segment?: ValuationInput['segment'],
  cityTier?: ValuationInput['city_tier'],
): CostSuggestion | null {
  if (!segment) return null;
  const base = CONSTRUCTION_COST_BY_SEGMENT[segment];
  if (!base) return null;
  const tier = cityTier ? CITY_TIER_FACTOR[cityTier] : { factor: 1, note: '' };
  return {
    segmentLabel: base.label,
    base,
    factor: tier.factor,
    cityNote: tier.note,
    minSqm: Math.round(base.min * tier.factor),
    maxSqm: Math.round(base.max * tier.factor),
  };
}
