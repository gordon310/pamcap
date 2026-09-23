import { describe, test, expect } from 'vitest';
import type { AdjustmentEntry, Expert, ValuationRecord } from '../types';
import {
  isExpertRegistered,
  upsertExpert,
  appendRecord,
  adjustmentRows,
  adjustmentsToCSV,
  parseImport,
  loadRecords,
  saveRecords,
  loadExperts,
  saveExperts,
  loadAdjustments,
  saveAdjustments,
  mergeExperts,
  isSuperUser,
  parseExpertsJson,
  RECORDS_KEY,
  EXPERTS_KEY,
  ADJUSTMENTS_KEY,
  type StorageLike,
} from './records';

function memStorage(): StorageLike & { data: Record<string, string> } {
  const data: Record<string, string> = {};
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = v;
    },
    removeItem: (k) => {
      delete data[k];
    },
  };
}

const expert = (name: string, email: string): Expert => ({ name, email });

function record(id: string, padding = 0): ValuationRecord {
  return {
    id,
    at: '2026-09-21T00:00:00.000Z',
    kind: 'initial',
    expert: expert('张三', 'z@example.com'),
    input: {} as any,
    overrides: {},
    result: { pad: 'x'.repeat(padding) } as any,
    evaluation: null,
  };
}

function entry(id: string, overrides: Partial<AdjustmentEntry> = {}): AdjustmentEntry {
  return {
    id,
    at: '2026-09-21T00:00:00.000Z',
    expert: expert('李四', 'li@example.com'),
    hotel_name: '测试酒店',
    key: 'cap_rate.base',
    old: 0.05,
    new: 0.055,
    reason: '市场回暖',
    recordId: 'r1',
    ...overrides,
  };
}

describe('isExpertRegistered', () => {
  test('邮箱不区分大小写、姓名去空格', () => {
    const list = [expert('张三', 'Z@Example.com')];
    expect(isExpertRegistered(expert(' 张三 ', 'z@example.com'), list)).toBe(true);
  });

  test('不同邮箱不命中', () => {
    expect(isExpertRegistered(expert('张三', 'other@example.com'), [expert('张三', 'z@example.com')])).toBe(false);
  });
});

describe('upsertExpert', () => {
  test('新增专家', () => {
    expect(upsertExpert([], expert('王五', 'w@example.com'))).toHaveLength(1);
  });

  test('重复专家不重复添加', () => {
    const list = upsertExpert([], expert('王五', 'w@example.com'));
    expect(upsertExpert(list, expert('王五', 'W@example.com'))).toHaveLength(1);
  });
});

describe('appendRecord', () => {
  test('追加记录', () => {
    const { records, pruned } = appendRecord([record('a')], record('b'));
    expect(records.map((r) => r.id)).toEqual(['a', 'b']);
    expect(pruned).toBe(0);
  });

  test('超限裁剪最旧记录', () => {
    const big = 500;
    const existing = [record('old1', big), record('old2', big)];
    const { records, pruned } = appendRecord(existing, record('new', big), 1500);
    expect(pruned).toBeGreaterThan(0);
    expect(records[records.length - 1].id).toBe('new');
    expect(records.length).toBeLessThan(3);
  });
});

describe('adjustmentsToCSV', () => {
  test('包含表头与正确转义', () => {
    const csv = adjustmentsToCSV([entry('a', { hotel_name: 'A,B"H', reason: '多行\n原因' })]);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('时间,专家,邮箱,酒店,系数路径,原值,新值,原因,记录ID');
    expect(csv).toContain('"A,B""H"');
    expect(csv).toContain('"多行\n原因"');
  });

  test('adjustmentRows 映射字段', () => {
    const [row] = adjustmentRows([entry('a')]);
    expect(row.expert_email).toBe('li@example.com');
    expect(row.key).toBe('cap_rate.base');
    expect(row.record_id).toBe('r1');
  });
});

describe('parseImport', () => {
  test('解析合法包', () => {
    const bundle = parseImport(JSON.stringify({ records: [record('a')], experts: [expert('A', 'a@b.com')], adjustments: [entry('e')] }));
    expect(bundle.records).toHaveLength(1);
    expect(bundle.experts).toHaveLength(1);
    expect(bundle.adjustments).toHaveLength(1);
  });

  test('非法 JSON 返回空对象', () => {
    expect(parseImport('not-json')).toEqual({});
  });
});

describe('expert registry helpers', () => {
  test('mergeExperts 按邮箱去重并保留管理员角色', () => {
    const remote = [expert('gordon', 'A@qq.com')].map((e) => ({ ...e, role: 'admin' as const }));
    const local = [expert('gordon', 'a@qq.com'), expert('张三', 'z@example.com')];
    const merged = mergeExperts(remote, local);
    expect(merged).toHaveLength(2);
    expect(merged.find((e) => e.email.toLowerCase() === 'a@qq.com')?.role).toBe('admin');
  });

  test('isSuperUser 命中 admin', () => {
    const list = [{ name: 'gordon', email: 'A@qq.com', role: 'admin' as const }];
    expect(isSuperUser(expert('gordon', 'a@qq.com'), list)).toBe(true);
    expect(isSuperUser(expert('张三', 'z@example.com'), list)).toBe(false);
    expect(isSuperUser(expert('x', 'x@example.com'), [])).toBe(false);
  });

  test('parseExpertsJson 支持对象与数组', () => {
    expect(parseExpertsJson('{"experts":[{"name":"gordon","email":"a@qq.com","role":"admin"}]}')).toHaveLength(1);
    expect(parseExpertsJson('[{"name":"a","email":"a@example.com"}]')).toHaveLength(1);
    expect(parseExpertsJson('nope')).toEqual([]);
  });
});

describe('storage round-trip', () => {
  test('records / experts / adjustments 持久化', () => {
    const s = memStorage();
    saveRecords([record('a')], s);
    saveExperts([expert('A', 'a@b.com')], s);
    saveAdjustments([entry('e')], s);
    expect(loadRecords(s).map((r) => r.id)).toEqual(['a']);
    expect(loadExperts(s).map((e) => e.email)).toEqual(['a@b.com']);
    expect(loadAdjustments(s).map((a) => a.id)).toEqual(['e']);
    expect(s.data[RECORDS_KEY]).toBeTruthy();
    expect(s.data[EXPERTS_KEY]).toBeTruthy();
    expect(s.data[ADJUSTMENTS_KEY]).toBeTruthy();
  });
});
