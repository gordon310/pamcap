import { describe, test, expect } from 'vitest';
import { percentToRatio } from './units';

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
