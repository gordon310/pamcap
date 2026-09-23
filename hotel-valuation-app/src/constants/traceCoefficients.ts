import type { ValuationInput } from '../types';

/**
 * 计算过程的每个步骤所用到的基准系数路径（用于在过程表内直接调整）。
 * 与 valuation-engine 中 `usedCoefficients` 的路径命名保持一致。
 */
export function coefficientPathsForStep(step: string, input: ValuationInput | null): string[] {
  if (!input) return [];
  const segment = input.segment || 'S3';
  const propertyType = input.property_type || 'P1';
  const cityTier = input.city_tier || '二线';
  const location = input.location || 'CBD';

  switch (step) {
    case 'S1':
      return ['adr.ctrip_discount'];
    case 'S2':
      return ['occupancy.bias_correction'];
    case 'S4':
      return ['revenue.days_per_year'];
    case 'S7':
      return [`gop_rate.by_segment.${segment}`, `gop_rate.by_property_type_adj.${propertyType}`];
    case 'S8':
      return ['cost_rates.ffe_rate'];
    case 'S9':
      return ['cost_rates.management_fee_rate'];
    case 'S10':
      return ['cost_rates.property_tax_rate'];
    case 'S11':
      return ['cost_rates.insurance_rate'];
    case 'S13':
      return [`owner_expense_coef.by_segment.${segment}`];
    case 'S16':
      return [`location_coefficient.table.${cityTier}.${location}`];
    case 'S17':
      return [`cap_rate_base.by_segment.${segment}`];
    case 'S21':
      return [
        'scenario.adr_delta',
        'scenario.occ_delta',
        'scenario.cap_delta_bps',
        'scenario.multiple_delta',
      ];
    case 'S22':
      return ['financing.interest_rate'];
    default:
      return [];
  }
}
