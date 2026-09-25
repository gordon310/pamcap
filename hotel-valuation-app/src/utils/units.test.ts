import { describe, test, expect } from 'vitest';
import { percentToRatio, ratioToPercent, repairLegacyRatio } from './units';

describe('percentToRatio', () => {
  test('100% -> 1', () => {
    expect(percentToRatio(100)).toBe(1);
  });

  test('72.5% -> 0.725', () => {
    expect(percentToRatio(72.5)).toBeCloseTo(0.725);
  });

  test('0% -> 0', () => {
    expect(percentToRatio(0)).toBe(0);
  });
});

describe('ratioToPercent', () => {
  test('1 -> 100%', () => {
    expect(ratioToPercent(1)).toBe(100);
  });

  test('0.6 -> 60%', () => {
    expect(ratioToPercent(0.6)).toBeCloseTo(60);
  });

  test('round-trips with percentToRatio', () => {
    expect(ratioToPercent(percentToRatio(72.5))).toBeCloseTo(72.5);
  });
});

describe('repairLegacyRatio', () => {
  test('0.007 -> 0.7 (多除一次100的历史值)', () => {
    expect(repairLegacyRatio(0.007)).toBeCloseTo(0.7);
  });

  test('正常的 0.7 不变', () => {
    expect(repairLegacyRatio(0.7)).toBe(0.7);
  });

  test('0 不变', () => {
    expect(repairLegacyRatio(0)).toBe(0);
  });

  test('0.15 不变', () => {
    expect(repairLegacyRatio(0.15)).toBe(0.15);
  });
});
