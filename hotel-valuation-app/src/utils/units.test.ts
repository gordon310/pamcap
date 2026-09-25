import { describe, test, expect } from 'vitest';
import { percentToRatio, ratioToPercent } from './units';

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
