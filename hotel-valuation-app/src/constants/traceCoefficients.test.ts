import { describe, test, expect } from 'vitest';
import type { ValuationInput } from '../types';
import { coefficientPathsForStep } from './traceCoefficients';

const input = {
  segment: 'S3',
  property_type: 'P1',
  city_tier: '一线',
  location: 'CBD',
} as ValuationInput;

describe('coefficientPathsForStep', () => {
  test('S1 -> 携程折扣', () => {
    expect(coefficientPathsForStep('S1', input)).toEqual(['adr.ctrip_discount']);
  });

  test('S2 -> 出租率校正', () => {
    expect(coefficientPathsForStep('S2', input)).toEqual(['occupancy.bias_correction']);
  });

  test('S7 -> GOP 率（档次 + 业态）', () => {
    expect(coefficientPathsForStep('S7', input)).toEqual([
      'gop_rate.by_segment.S3',
      'gop_rate.by_property_type_adj.P1',
    ]);
  });

  test('S16 -> 地段系数', () => {
    expect(coefficientPathsForStep('S16', input)).toEqual(['location_coefficient.table.一线.CBD']);
  });

  test('S21 -> 情景四系数', () => {
    expect(coefficientPathsForStep('S21', input)).toEqual([
      'scenario.adr_delta',
      'scenario.occ_delta',
      'scenario.cap_delta_bps',
      'scenario.multiple_delta',
    ]);
  });

  test('无对应系数的步骤返回空数组', () => {
    expect(coefficientPathsForStep('S3', input)).toEqual([]);
    expect(coefficientPathsForStep('S12', input)).toEqual([]);
  });
});
