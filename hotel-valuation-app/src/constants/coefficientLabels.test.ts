import { describe, test, expect } from 'vitest';
import { coefficientLabel } from './coefficientLabels';

describe('coefficientLabel', () => {
  test('静态系数中文说明', () => {
    expect(coefficientLabel('adr.ctrip_discount')).toContain('携程');
    expect(coefficientLabel('occupancy.bias_correction')).toContain('出租率');
    expect(coefficientLabel('scenario.cap_delta_bps')).toContain('Cap');
    expect(coefficientLabel('cost_rates.ffe_rate')).toContain('FF&E');
  });

  test('按档次动态生成说明', () => {
    expect(coefficientLabel('cap_rate_base.by_segment.S3')).toBe('Cap Rate 基准·档次 S3 - 中高端');
    expect(coefficientLabel('owner_expense_coef.by_segment.S1')).toBe('业主费用系数·档次 S1 - 豪华');
  });

  test('按业态动态生成说明', () => {
    expect(coefficientLabel('gop_rate.by_property_type_adj.P1')).toBe('GOP 率·业态调整 P1 - 综合型');
  });

  test('地段系数说明', () => {
    expect(coefficientLabel('location_coefficient.table.一线.CBD')).toBe('地段系数·一线 / CBD');
  });

  test('未知路径回退为原路径', () => {
    expect(coefficientLabel('unknown.path')).toBe('unknown.path');
  });
});
