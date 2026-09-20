import { describe, test, expect } from 'vitest';
import { getCityTier } from './cityTier';

describe('cityTier', () => {
  test('识别一线城市（含市后缀）', () => {
    const r = getCityTier('北京市');
    expect(r.tier).toBe('一线');
    expect(r.confidence).toBe('high');
  });

  test('从省份全称中提取城市', () => {
    const r = getCityTier('广东省深圳市');
    expect(r.tier).toBe('一线');
    expect(r.matched).toBe('深圳');
  });

  test('识别新一线城市', () => {
    expect(getCityTier('杭州市').tier).toBe('新一线');
    expect(getCityTier('成都').tier).toBe('新一线');
  });

  test('识别二线城市', () => {
    expect(getCityTier('厦门市').tier).toBe('二线');
  });

  test('未命中城市默认四线及以下且低置信度', () => {
    const r = getCityTier('某某县城');
    expect(r.tier).toBe('四线及以下');
    expect(r.confidence).toBe('low');
  });

  test('空输入安全返回', () => {
    expect(getCityTier('').tier).toBe('四线及以下');
  });
});
