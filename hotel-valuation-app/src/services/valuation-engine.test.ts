import { describe, test, expect } from 'vitest';
import { calculateValuation } from './valuation-engine';
import type { ValuationInput } from '../types';

// Golden sample test case from requirements
const goldenSampleInput: ValuationInput = {
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
  equity: 38000
};

describe('Valuation Engine Tests', () => {
  test('should calculate valuation with expected results', () => {
    const result = calculateValuation(goldenSampleInput);
    
    // Basic validation - check that results are reasonable numbers
    expect(result.metrics.adr).toBeGreaterThan(0);
    expect(result.metrics.occ).toBeGreaterThan(0);
    expect(result.metrics.revpar).toBeGreaterThan(0);
    expect(result.metrics.gor).toBeGreaterThan(0);
    expect(result.metrics.gop).toBeGreaterThan(0);
    expect(result.metrics.noi).toBeGreaterThan(0);
    expect(result.metrics.ebitda_est).toBeGreaterThan(0);
    expect(result.metrics.ebitda_used).toBeGreaterThan(0);
    expect(result.metrics.cap).toBeGreaterThan(0);
    expect(result.metrics.location_coef).toBeGreaterThan(0);
    expect(result.metrics.dscr).toBeGreaterThanOrEqual(0); // Can be 0 if no debt
    
    // Check valuation ranges are reasonable
    expect(result.valuation.income).toBeGreaterThan(0);
    expect(result.valuation.multiple).toBeGreaterThan(0);
    expect(result.valuation.cost_floor).toBeGreaterThanOrEqual(0);
    expect(result.valuation.range.conservative).toBeLessThanOrEqual(result.valuation.range.optimistic);
    
    // Check per-room and per-sqm values
    expect(result.valuation.per_room).toBeGreaterThan(0);
    expect(result.valuation.per_sqm).toBeGreaterThan(0);
    
    // Check trace has steps
    expect(result.trace.length).toBeGreaterThan(0);
    
    console.log('Golden Sample Test Results:');
    console.log('ADR:', result.metrics.adr);
    console.log('OCC:', result.metrics.occ);
    console.log('RevPAR:', result.metrics.revpar);
    console.log('NOI:', result.metrics.noi);
    console.log('Cap Rate:', result.metrics.cap);
    console.log('Income Valuation:', result.valuation.income);
    console.log('Multiple Valuation:', result.valuation.multiple);
    console.log('Base Range:', result.valuation.range.base);
  });

  test('should handle different hotel segments correctly', () => {
    const inputS1: ValuationInput = {
      ...goldenSampleInput,
      segment: 'S1', // Luxury segment should have higher rates
      ctrip_adr: 1500,
      occupancy_input: 0.65
    };
    
    const inputS6: ValuationInput = {
      ...goldenSampleInput,
      segment: 'S6', // Budget segment should have lower rates
      ctrip_adr: 400,
      occupancy_input: 0.70
    };
    
    const resultS1 = calculateValuation(inputS1);
    const resultS6 = calculateValuation(inputS6);
    
    // S1 (luxury) should generally have higher valuation than S6 (budget)
    expect(resultS1.valuation.range.base).toBeGreaterThan(resultS6.valuation.range.base);
  });

  test('should apply location coefficient correctly', () => {
    const inputCBD: ValuationInput = {
      ...goldenSampleInput,
      location: 'CBD' // Prime location
    };
    
    const inputOther: ValuationInput = {
      ...goldenSampleInput,
      location: '其他' // Other location
    };
    
    const resultCBD = calculateValuation(inputCBD);
    const resultOther = calculateValuation(inputOther);
    
    // 地段系数应正确取自 baseline 表（CBD > 其他）
    expect(resultCBD.metrics.location_coef).toBeGreaterThan(resultOther.metrics.location_coef);
    // 两种情形均应产出有效估值
    expect(resultCBD.valuation.range.base).toBeGreaterThan(0);
    expect(resultOther.valuation.range.base).toBeGreaterThan(0);
  });

  test('should handle missing optional fields with defaults', () => {
    const minimalInput: ValuationInput = {
      hotel_name: 'Test Hotel',
      rooms: 100,
      opening_date: '2020-01-01',
      gfa: 10000,
      city_tier: '二线',
      location: '次中心',
      segment: 'S3',
      property_type: 'P1',
      operation_mode: 'M1',
      ctrip_adr: 800,
      occupancy_input: 0.70,
      fb_ratio: 0.25,
      owner_ebitda: undefined, // Optional field
      other_income: 0,
      capex_type: 'new',
      construction_cost: 20000,
      equity: 8000
    };
    
    const result = calculateValuation(minimalInput);
    
    // Should still produce valid results with optional fields
    expect(result.metrics.adr).toBeGreaterThan(0);
    expect(result.valuation.range.base).toBeGreaterThan(0);
  });
});