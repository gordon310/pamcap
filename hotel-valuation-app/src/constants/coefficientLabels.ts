import { SEGMENT_OPTIONS, PROPERTY_TYPE_OPTIONS, type ValuationOption } from './valuationOptions';

const STATIC_LABELS: Record<string, string> = {
  'adr.ctrip_discount': 'ADR·携程均价折扣',
  'occupancy.bias_correction': '出租率校正系数',
  'revenue.days_per_year': '年可售天数',
  'revenue.other_income_default': '其他收入默认值（万元）',
  'cost_rates.management_fee_rate': '管理费率（占 GOR）',
  'cost_rates.property_tax_rate': '物业税率（占 GOR）',
  'cost_rates.insurance_rate': '保险费率（占 GOR）',
  'cost_rates.ffe_rate': 'FF&E 计提率（占 GOR）',
  'financing.interest_rate': '贷款利率',
  'financing.loan_tenor_years': '贷款年限',
  'financing.holding_period_years': '持有年限',
  'cost_approach.land_benchmark_price_per_sqm': '土地基准价（元/㎡）',
  'cost_approach.depreciation_rate': '折旧率',
  'scenario.adr_delta': '情景·ADR 偏移',
  'scenario.occ_delta': '情景·出租率偏移',
  'scenario.cap_delta_bps': '情景·Cap Rate 偏移（基点）',
  'scenario.multiple_delta': '情景·EBITDA 倍数偏移',
};

function optionLabel(options: ValuationOption[], value: string): string {
  return options.find((o) => o.value === value)?.label || value;
}

export function coefficientLabel(path: string): string {
  if (STATIC_LABELS[path]) return STATIC_LABELS[path];

  let m = path.match(/^(gop_rate\.by_segment)\.(S\d)$/);
  if (m) return `GOP 率·档次 ${optionLabel(SEGMENT_OPTIONS, m[2])}`;

  m = path.match(/^(gop_rate\.by_property_type_adj)\.(P\d)$/);
  if (m) return `GOP 率·业态调整 ${optionLabel(PROPERTY_TYPE_OPTIONS, m[2])}`;

  m = path.match(/^(owner_expense_coef\.by_segment)\.(S\d)$/);
  if (m) return `业主费用系数·档次 ${optionLabel(SEGMENT_OPTIONS, m[2])}`;

  m = path.match(/^(cap_rate_base\.by_segment)\.(S\d)$/);
  if (m) return `Cap Rate 基准·档次 ${optionLabel(SEGMENT_OPTIONS, m[2])}`;

  m = path.match(/^(ebitda_multiple\.by_segment)\.(S\d)$/);
  if (m) return `EBITDA 倍数·档次 ${optionLabel(SEGMENT_OPTIONS, m[2])}`;

  m = path.match(/^location_coefficient\.table\.(.+)\.(.+)$/);
  if (m) return `地段系数·${m[1]} / ${m[2]}`;

  return path;
}
