import type { ValuationInput, ValuationResult, TraceItem } from '../types';

// Import baseline data
import baselineData from '../utils/baseline.json';

interface Baseline {
  meta: { version: string; updated: string; source: string };
  adr: { ctrip_discount: number };
  occupancy: { bias_correction: number };
  revenue: { days_per_year: number; other_income_default: number };
  gop_rate: {
    by_segment: Record<string, number>;
    by_property_type_adj: Record<string, number>;
  };
  cost_rates: {
    management_fee_rate: number;
    property_tax_rate: number;
    insurance_rate: number;
    ffe_rate: number;
  };
  owner_expense_coef: { by_segment: Record<string, number> };
  cap_rate_base: { by_segment: Record<string, number> };
  ebitda_multiple: { by_segment: Record<string, [number, number]> };
  location_coefficient: {
    note: string;
    table: Record<string, Record<string, number>>;
  };
  financing: { interest_rate: number; loan_tenor_years: number; holding_period_years: number };
  cost_approach: { land_benchmark_price_per_sqm: number; depreciation_rate: number };
  scenario: { adr_delta: number; occ_delta: 0.03; cap_delta_bps: number; multiple_delta: number };
}

const baseline: Baseline = baselineData as unknown as Baseline;

export const calculateValuation = (
  input: ValuationInput,
  overrides: Partial<Baseline> = {}
): ValuationResult => {
  // Merge baseline with overrides
  const currentBaseline = { ...baseline, ...overrides } as Baseline;
  
  const trace: TraceItem[] = [];
  let metrics: any = {};
  let valuation: any = {};

  // S0: Classification (using values from input or defaults)
  const segment = input.segment || 'S3'; // Default to S3 if not provided
  const propertyType = input.property_type || 'P1';
  const cityTier = input.city_tier || '二线城市';
  const location = input.location || 'CBD';
  const operationMode = input.operation_mode || 'M1';

  // Add classification to trace
  trace.push({
    step: 'S0',
    name: '分类解析',
    formula: '由 hotel_name 映射（或手工）得 segment/property_type/city_tier/location/operation_mode',
    inputs: { hotel_name: input.hotel_name },
    result: 0, // Placeholder
    unit: '',
    source: '映射表/专家',
    adjusted: false,
    note: `档次: ${segment}, 业态: ${propertyType}, 城市等级: ${cityTier}, 区位: ${location}, 经营模式: ${operationMode}`
  });

  // Calculate total investment based on capex_type
  let totalInvestment = 0;
  switch (input.capex_type) {
    case 'new':
      totalInvestment = input.construction_cost || 0;
      break;
    case 'acquisition':
      totalInvestment = input.acquisition_price || 0;
      break;
    case 'self_renew':
      totalInvestment = (input.original_cost || 0) + (input.renovation_cost || 0);
      break;
  }

  // S1: ADR
  const adr = input.ctrip_adr * currentBaseline.adr.ctrip_discount;
  trace.push({
    step: 'S1',
    name: 'ADR',
    formula: 'adr = ctrip_adr × ctrip_discount',
    inputs: { ctrip_adr: input.ctrip_adr, ctrip_discount: currentBaseline.adr.ctrip_discount },
    result: adr,
    unit: '元',
    source: '携程 × 基准折扣',
    adjusted: false,
    note: ''
  });
  metrics.adr = adr;

  // S2: OCC
  const occ = input.occupancy_input * currentBaseline.occupancy.bias_correction;
  trace.push({
    step: 'S2',
    name: 'OCC',
    formula: 'occ = occupancy_input × occupancy.bias_correction',
    inputs: { occupancy_input: input.occupancy_input, bias_correction: currentBaseline.occupancy.bias_correction },
    result: occ,
    unit: '',
    source: '输入 × 校正',
    adjusted: false,
    note: ''
  });
  metrics.occ = occ;

  // S3: RevPAR
  const revpar = adr * occ;
  trace.push({
    step: 'S3',
    name: 'RevPAR',
    formula: 'revpar = adr × occ',
    inputs: { adr, occ },
    result: revpar,
    unit: '元',
    source: '计算',
    adjusted: false,
    note: ''
  });
  metrics.revpar = revpar;

  // S4: 客房收入
  const daysPerYear = currentBaseline.revenue.days_per_year;
  const roomRev = revpar * input.rooms * daysPerYear / 10000; // Convert to 万元
  trace.push({
    step: 'S4',
    name: '客房收入',
    formula: 'room_rev = revpar × rooms × days_per_year',
    inputs: { revpar, rooms: input.rooms, days_per_year: daysPerYear },
    result: roomRev,
    unit: '万元',
    source: '计算',
    adjusted: false,
    note: '万元换算'
  });

  // S5: 餐饮收入
  const fbRev = roomRev * input.fb_ratio;
  trace.push({
    step: 'S5',
    name: '餐饮收入',
    formula: 'fb_rev = room_rev × fb_ratio',
    inputs: { room_rev: roomRev, fb_ratio: input.fb_ratio },
    result: fbRev,
    unit: '万元',
    source: '输入比',
    adjusted: false,
    note: ''
  });

  // S6: GOR
  const otherIncome = input.other_income || currentBaseline.revenue.other_income_default;
  const gor = roomRev + fbRev + otherIncome;
  trace.push({
    step: 'S6',
    name: 'GOR',
    formula: 'gor = room_rev + fb_rev + other_income',
    inputs: { room_rev: roomRev, fb_rev: fbRev, other_income: otherIncome },
    result: gor,
    unit: '万元',
    source: '计算',
    adjusted: false,
    note: ''
  });
  metrics.gor = gor;

  // S7: GOP
  const gopRateSegment = currentBaseline.gop_rate.by_segment[segment] || 0.26;
  const gopRatePropertyAdj = currentBaseline.gop_rate.by_property_type_adj[propertyType] || 0;
  const gopRate = gopRateSegment + gopRatePropertyAdj;
  const gop = gor * gopRate;
  trace.push({
    step: 'S7',
    name: 'GOP',
    formula: 'gop = gor × gop_rate',
    inputs: { gor, gop_rate: gopRate, segment, property_type: propertyType },
    result: gop,
    unit: '万元',
    source: '基准',
    adjusted: false,
    note: `gop_rate = by_segment[${segment}] + by_property_type_adj[${propertyType}]`
  });
  metrics.gop = gop;

  // S8: FF&E
  const ffeRate = currentBaseline.cost_rates.ffe_rate;
  const ffe = gor * ffeRate;
  trace.push({
    step: 'S8',
    name: 'FF&E',
    formula: 'ffe = gor × ffe_rate',
    inputs: { gor, ffe_rate: ffeRate },
    result: ffe,
    unit: '万元',
    source: '基准 I402',
    adjusted: false,
    note: ''
  });

  // S9: 管理费
  const managementFeeRate = currentBaseline.cost_rates.management_fee_rate;
  const mgmtFee = gor * managementFeeRate;
  trace.push({
    step: 'S9',
    name: '管理费',
    formula: 'mgmt_fee = gor × management_fee_rate',
    inputs: { gor, management_fee_rate: managementFeeRate },
    result: mgmtFee,
    unit: '万元',
    source: '基准 R118',
    adjusted: false,
    note: ''
  });

  // S10: 物业税
  const propertyTaxRate = currentBaseline.cost_rates.property_tax_rate;
  const propTax = gor * propertyTaxRate;
  trace.push({
    step: 'S10',
    name: '物业税',
    formula: 'prop_tax = gor × property_tax_rate',
    inputs: { gor, property_tax_rate: propertyTaxRate },
    result: propTax,
    unit: '万元',
    source: '基准',
    adjusted: false,
    note: ''
  });

  // S11: 保险
  const insuranceRate = currentBaseline.cost_rates.insurance_rate;
  const insurance = gor * insuranceRate;
  trace.push({
    step: 'S11',
    name: '保险',
    formula: 'insurance = gor × insurance_rate',
    inputs: { gor, insurance_rate: insuranceRate },
    result: insurance,
    unit: '万元',
    source: '基准',
    adjusted: false,
    note: ''
  });

  // S12: NOI
  const noi = gop - mgmtFee - propTax - insurance - ffe;
  trace.push({
    step: 'S12',
    name: 'NOI',
    formula: 'noi = gop − mgmt_fee − prop_tax − insurance − ffe',
    inputs: { gop, mgmt_fee: mgmtFee, prop_tax: propTax, insurance, ffe },
    result: noi,
    unit: '万元',
    source: '计算',
    adjusted: false,
    note: ''
  });
  metrics.noi = noi;

  // S13: 业主费用
  const ownerExpenseCoef = currentBaseline.owner_expense_coef.by_segment[segment] || 0.02;
  const ownerExp = gor * ownerExpenseCoef;
  trace.push({
    step: 'S13',
    name: '业主费用',
    formula: 'owner_exp = gor × owner_expense_coef[segment]',
    inputs: { gor, segment, owner_expense_coef: ownerExpenseCoef },
    result: ownerExp,
    unit: '万元',
    source: '基准',
    adjusted: false,
    note: ''
  });

  // S14: EBITDA（估算）
  const ebitdaEst = noi - ownerExp;
  trace.push({
    step: 'S14',
    name: 'EBITDA（估算）',
    formula: 'ebitda_est = noi − owner_exp',
    inputs: { noi, owner_exp: ownerExp },
    result: ebitdaEst,
    unit: '万元',
    source: '计算',
    adjusted: false,
    note: ''
  });
  metrics.ebitda_est = ebitdaEst;

  // S15: 校准
  let ebitdaUsed = ebitdaEst;
  let delta = 0;
  if (input.owner_ebitda !== undefined && input.owner_ebitda !== null) {
    delta = input.owner_ebitda - ebitdaEst;
    // For simplicity, we'll use the input EBITDA if provided
    ebitdaUsed = input.owner_ebitda;
  }
  trace.push({
    step: 'S15',
    name: '校准',
    formula: 'delta = owner_ebitda − ebitda_est',
    inputs: { owner_ebitda: input.owner_ebitda, ebitda_est: ebitdaEst },
    result: delta,
    unit: '万元',
    source: '输入对照',
    adjusted: false,
    note: `采用值: ${ebitdaUsed}万元`
  });
  metrics.ebitda_used = ebitdaUsed;
  metrics.owner_ebitda = input.owner_ebitda;

  // S16: 地段系数
  const locationCoefficientTable = currentBaseline.location_coefficient.table;
  const locCoef = locationCoefficientTable[cityTier]?.[location] || 1.0;
  trace.push({
    step: 'S16',
    name: '地段系数',
    formula: 'loc_coef = location_coefficient.table[city_tier][location]',
    inputs: { city_tier: cityTier, location },
    result: locCoef,
    unit: '',
    source: 'GB/T 18507/18508',
    adjusted: false,
    note: ''
  });
  metrics.location_coef = locCoef;

  // S17: Cap Rate
  const capRateBase = currentBaseline.cap_rate_base.by_segment[segment] || 0.055;
  const cap = capRateBase * locCoef;
  trace.push({
    step: 'S17',
    name: 'Cap Rate',
    formula: 'cap = cap_rate_base[segment] × loc_coef',
    inputs: { segment, cap_rate_base: capRateBase, loc_coef: locCoef },
    result: cap,
    unit: '',
    source: '基准 × 地段',
    adjusted: false,
    note: ''
  });
  metrics.cap = cap;

  // S18: 收益法估值
  const vIncome = noi / cap;
  trace.push({
    step: 'S18',
    name: '收益法估值',
    formula: 'v_income = noi / cap',
    inputs: { noi, cap },
    result: vIncome,
    unit: '万元',
    source: '计算',
    adjusted: false,
    note: ''
  });

  // S19: 倍数法估值
  const ebitdaMultipleRange = currentBaseline.ebitda_multiple.by_segment[segment] || [20, 25];
  const ebitdaMultipleMid = (ebitdaMultipleRange[0] + ebitdaMultipleRange[1]) / 2;
  const vMultiple = ebitdaUsed * ebitdaMultipleMid;
  trace.push({
    step: 'S19',
    name: '倍数法估值',
    formula: 'v_multiple = ebitda × multiple',
    inputs: { ebitda: ebitdaUsed, multiple: ebitdaMultipleMid, segment },
    result: vMultiple,
    unit: '万元',
    source: '基准',
    adjusted: false,
    note: `multiple from ${ebitdaMultipleRange[0]}-${ebitdaMultipleRange[1]} range`
  });

  // S20: 成本法下限
  // Simplified calculation - in reality would need more detailed cost approach data
  const vCost = totalInvestment; // Placeholder - would include land value and depreciation in full implementation
  trace.push({
    step: 'S20',
    name: '成本法估值',
    formula: 'v_cost ≈ 总投资',
    inputs: { total_investment: totalInvestment },
    result: vCost,
    unit: '万元',
    source: '基准',
    adjusted: false,
    note: '简化计算，实际应包含土地价值和折旧'
  });

  // S21: 估值区间 (Conservative/Base/Optimistic)
  // Apply scenario adjustments to calculate ranges
  const adrConservative = adr * (1 - currentBaseline.scenario.adr_delta);
  const adrOptimistic = adr * (1 + currentBaseline.scenario.adr_delta);
  const occConservative = Math.max(0, occ - currentBaseline.scenario.occ_delta);
  const occOptimistic = Math.min(1, occ + currentBaseline.scenario.occ_delta);
  
  const revparConservative = adrConservative * occConservative;
  const revparOptimistic = adrOptimistic * occOptimistic;
  
  const gorConservative = (revparConservative * input.rooms * daysPerYear / 10000) + fbRev + otherIncome;
  const gorOptimistic = (revparOptimistic * input.rooms * daysPerYear / 10000) + fbRev + otherIncome;
  
  const noiConservative = gorConservative * gopRate - mgmtFee - propTax - insurance - ffe;
  const noiOptimistic = gorOptimistic * gopRate - mgmtFee - propTax - insurance - ffe;
  
  const capConservative = cap + (currentBaseline.scenario.cap_delta_bps / 10000); // Convert basis points to decimal
  const capOptimistic = Math.max(0.001, cap - (currentBaseline.scenario.cap_delta_bps / 10000)); // Prevent negative
  
  const vIncomeConservative = noiConservative / capConservative;
  const vIncomeOptimistic = noiOptimistic / capOptimistic;
  
  const ebitdaMultipleConservative = ebitdaMultipleMid - currentBaseline.scenario.multiple_delta;
  const ebitdaMultipleOptimistic = ebitdaMultipleMid + currentBaseline.scenario.multiple_delta;
  
  const vMultipleConservative = ebitdaUsed * ebitdaMultipleConservative;
  const vMultipleOptimistic = ebitdaUsed * ebitdaMultipleOptimistic;
  
  const conservativeVal = Math.min(vIncomeConservative, vMultipleConservative);
  const optimisticVal = Math.max(vIncomeOptimistic, vMultipleOptimistic);
  const baseVal = (vIncome + vMultiple) / 2; // Average of income and multiple methods

  trace.push({
    step: 'S21',
    name: '估值区间',
    formula: '保守/基准/乐观：对 ADR、OCC、Cap、multiple 施加 scenario 偏移后重算',
    inputs: { 
      adr_delta: currentBaseline.scenario.adr_delta, 
      occ_delta: currentBaseline.scenario.occ_delta,
      cap_delta_bps: currentBaseline.scenario.cap_delta_bps,
      multiple_delta: currentBaseline.scenario.multiple_delta
    },
    result: 0, // Placeholder
    unit: '万元',
    source: '计算',
    adjusted: false,
    note: `保守:${conservativeVal.toFixed(0)}, 基准:${baseVal.toFixed(0)}, 乐观:${optimisticVal.toFixed(0)}`
  });

  // S22: DSCR (Debt Service Coverage Ratio)
  const debt = totalInvestment - input.equity;
  const annualDebtService = debt * currentBaseline.financing.interest_rate; // Simplified calculation
  const dscr = noi / annualDebtService || 0; // Handle division by zero
  trace.push({
    step: 'S22',
    name: 'DSCR',
    formula: 'dscr = noi / 年还本付息',
    inputs: { noi, total_investment: totalInvestment, equity: input.equity, interest_rate: currentBaseline.financing.interest_rate },
    result: dscr,
    unit: '',
    source: '计算',
    adjusted: false,
    note: '贷款 = 总投资 − equity'
  });
  metrics.dscr = dscr;

  // S23: IRR (Internal Rate of Return)
  // Simplified IRR calculation - in practice would use iterative method
  // Using a simplified approach for demonstration
  const irr = (noi / input.equity) * 100; // Very simplified estimation
  trace.push({
    step: 'S23',
    name: 'IRR',
    formula: '简化IRR计算',
    inputs: { noi, equity: input.equity },
    result: irr,
    unit: '%',
    source: '计算',
    adjusted: false,
    note: '简化计算，实际需迭代求解'
  });
  metrics.irr = irr;

  // Prepare the final result
  valuation = {
    income: vIncome,
    multiple: vMultiple,
    cost_floor: vCost,
    range: {
      conservative: conservativeVal,
      base: baseVal,
      optimistic: optimisticVal
    },
    per_room: baseVal / input.rooms,
    per_sqm: baseVal / input.gfa,
    unit: '万元'
  };

  const result: ValuationResult = {
    metrics,
    valuation,
    trace,
    warnings: [] // Would add warnings based on validation in a full implementation
  };

  return result;
};