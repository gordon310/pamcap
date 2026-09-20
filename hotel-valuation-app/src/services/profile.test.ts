import { describe, test, expect, beforeEach, vi } from 'vitest';
import { isValidEmail, hasEvaluation, loadExpert, saveExpert, clearExpert } from './profile';

function memoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    removeItem: (k: string) => {
      store.delete(k);
    },
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
  };
}

describe('isValidEmail', () => {
  test('接受合法邮箱', () => {
    expect(isValidEmail('expert@pamshare.com')).toBe(true);
    expect(isValidEmail('a.b-c@sub.domain.cn')).toBe(true);
  });

  test('拒绝非法邮箱', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('abc')).toBe(false);
    expect(isValidEmail('a@b')).toBe(false);
    expect(isValidEmail('a@b.c')).toBe(false);
    expect(isValidEmail('a b@c.com')).toBe(false);
  });
});

describe('hasEvaluation', () => {
  const base = { author: 'a', email: 'a@b.com', at: '2026-01-01' };
  test('空/空白视为未填写', () => {
    expect(hasEvaluation(null)).toBe(false);
    expect(hasEvaluation({ ...base, content: '' })).toBe(false);
    expect(hasEvaluation({ ...base, content: '   ' })).toBe(false);
  });
  test('有内容视为已填写', () => {
    expect(hasEvaluation({ ...base, content: 'GOP 率偏高' })).toBe(true);
  });
});

describe('expert persistence', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage());
  });

  test('保存后可读取', () => {
    saveExpert({ name: '张三', email: 'zhang@pam.com' });
    expect(loadExpert()).toEqual({ name: '张三', email: 'zhang@pam.com' });
  });

  test('清除后读取为 null', () => {
    saveExpert({ name: '李四', email: 'li@pam.com' });
    clearExpert();
    expect(loadExpert()).toBeNull();
  });

  test('损坏数据安全返回 null', () => {
    localStorage.setItem('pamcap.expert', '{not-json');
    expect(loadExpert()).toBeNull();
  });
});
