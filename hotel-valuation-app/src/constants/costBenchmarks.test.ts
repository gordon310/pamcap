import { describe, test, expect } from 'vitest';
import { suggestConstructionCost, CONSTRUCTION_COST_BY_SEGMENT } from './costBenchmarks';

describe('suggestConstructionCost', () => {
  test('按档次给出造价区间', () => {
    const s = suggestConstructionCost('S6', '二线');
    expect(s?.segmentLabel).toBe('经济型/快捷');
    expect(s?.minSqm).toBe(2000);
    expect(s?.maxSqm).toBe(3500);
  });

  test('城市能级调整：一线高于二线', () => {
    const first = suggestConstructionCost('S3', '一线');
    const second = suggestConstructionCost('S3', '二线');
    expect(first!.minSqm).toBeGreaterThan(second!.minSqm);
  });

  test('未选档次返回 null', () => {
    expect(suggestConstructionCost(undefined, '一线')).toBeNull();
  });

  test('每个档次都有参考数据', () => {
    (['S1', 'S2', 'S3', 'S4', 'S5', 'S6'] as const).forEach((s) => {
      expect(CONSTRUCTION_COST_BY_SEGMENT[s].min).toBeGreaterThan(0);
    });
  });
});
