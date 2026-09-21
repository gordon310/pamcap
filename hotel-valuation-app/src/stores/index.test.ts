import { describe, test, expect, beforeEach } from 'vitest';
import type { ValuationInput } from '../types';
import { useStore } from './index';

const sampleInput: ValuationInput = {
  hotel_name: '华东_高端_003',
  rooms: 320,
  opening_date: '2018-06-01',
  gfa: 42000,
  city_tier: '一线',
  location: 'CBD',
  segment: 'S3',
  property_type: 'P1',
  operation_mode: 'M1',
  ctrip_adr: 1250,
  occupancy_input: 0.72,
  fb_ratio: 0.35,
  owner_ebitda: 3200,
  other_income: 0,
  capex_type: 'new',
  construction_cost: 86000,
  equity: 38000,
};

beforeEach(() => {
  useStore.setState({
    records: [],
    adjustmentLog: [],
    experts: [],
    expert: null,
    input: null,
    result: null,
    overrides: {},
    adjustments: [],
    currentRecordId: null,
    evaluation: null,
  });
});

describe('store expert records', () => {
  test('loginExpert 登记并记入本机名单', () => {
    useStore.getState().loginExpert({ name: ' 张三 ', email: 'Z@Example.com' });
    expect(useStore.getState().expert).toEqual({ name: '张三', email: 'Z@Example.com' });
    expect(useStore.getState().experts).toHaveLength(1);
  });

  test('calculate 生成 initial 记录并归属当前专家', () => {
    useStore.getState().loginExpert({ name: '张三', email: 'z@example.com' });
    useStore.getState().calculate(sampleInput);
    const { records, currentRecordId } = useStore.getState();
    expect(records).toHaveLength(1);
    expect(records[0].kind).toBe('initial');
    expect(records[0].expert.name).toBe('张三');
    expect(currentRecordId).toBe(records[0].id);
  });

  test('revalue 追加一条 revalue 记录', () => {
    useStore.getState().loginExpert({ name: '张三', email: 'z@example.com' });
    useStore.getState().calculate(sampleInput);
    useStore.getState().revalue();
    const { records } = useStore.getState();
    expect(records).toHaveLength(2);
    expect(records[1].kind).toBe('revalue');
  });

  test('adjustCoefficient 写入系数调整日志', () => {
    useStore.getState().loginExpert({ name: '李四', email: 'li@example.com' });
    useStore.getState().calculate(sampleInput);
    useStore.getState().adjustCoefficient('cap_rate.base', 0.055, '市场回暖');
    const { adjustmentLog } = useStore.getState();
    expect(adjustmentLog).toHaveLength(1);
    expect(adjustmentLog[0].expert.name).toBe('李四');
    expect(adjustmentLog[0].hotel_name).toBe('华东_高端_003');
    expect(adjustmentLog[0].new).toBe(0.055);
    expect(adjustmentLog[0].reason).toBe('市场回暖');
  });

  test('exportAdjustmentSubmission 返回 JSON 与 CSV', () => {
    useStore.getState().loginExpert({ name: '李四', email: 'li@example.com' });
    useStore.getState().calculate(sampleInput);
    useStore.getState().adjustCoefficient('cap_rate.base', 0.055, '市场回暖');
    const { json, csv, count } = useStore.getState().exportAdjustmentSubmission();
    expect(count).toBe(1);
    expect(JSON.parse(json).adjustments).toHaveLength(1);
    expect(csv).toContain('cap_rate.base');
  });
});
