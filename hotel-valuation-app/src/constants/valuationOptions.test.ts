import { describe, test, expect } from 'vitest';
import { getFieldOptions } from './valuationOptions';

describe('valuationOptions', () => {
  test('档次选项带中文描述', () => {
    const opts = getFieldOptions('segment');
    expect(opts?.find((o) => o.value === 'S1')?.label).toBe('S1 - 豪华');
    expect(opts?.find((o) => o.value === 'S6')?.label).toBe('S6 - 有限服务');
  });

  test('业态选项带中文描述', () => {
    const opts = getFieldOptions('property_type');
    expect(opts?.find((o) => o.value === 'P1')?.label).toBe('P1 - 综合型');
    expect(opts?.find((o) => o.value === 'P7')?.label).toBe('P7 - 精品型');
  });

  test('城市等级与区位选项存在', () => {
    expect(getFieldOptions('city_tier')?.length).toBeGreaterThan(0);
    expect(getFieldOptions('location')?.length).toBeGreaterThan(0);
  });

  test('非选项字段返回 undefined', () => {
    expect(getFieldOptions('ctrip_adr')).toBeUndefined();
  });
});
