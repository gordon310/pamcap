export interface ValuationOption {
  value: string;
  label: string;
}

export const CITY_TIER_OPTIONS: ValuationOption[] = [
  { value: '一线', label: '一线' },
  { value: '新一线', label: '新一线' },
  { value: '二线', label: '二线' },
  { value: '三线', label: '三线' },
  { value: '四线及以下', label: '四线及以下' },
];

export const LOCATION_OPTIONS: ValuationOption[] = [
  { value: 'CBD', label: 'CBD' },
  { value: '次中心', label: '次中心' },
  { value: '近郊新区', label: '近郊新区' },
  { value: '景区度假地', label: '景区度假地' },
  { value: '机场高铁', label: '机场高铁' },
  { value: '产业园区', label: '产业园区' },
  { value: '其他', label: '其他' },
];

export const SEGMENT_OPTIONS: ValuationOption[] = [
  { value: 'S1', label: 'S1 - 豪华' },
  { value: 'S2', label: 'S2 - 超高端' },
  { value: 'S3', label: 'S3 - 高端' },
  { value: 'S4', label: 'S4 - 中高端' },
  { value: 'S5', label: 'S5 - 中档' },
  { value: 'S6', label: 'S6 - 经济型' },
];

export const PROPERTY_TYPE_OPTIONS: ValuationOption[] = [
  { value: 'P1', label: 'P1 - 综合型' },
  { value: 'P2', label: 'P2 - 商务型' },
  { value: 'P3', label: 'P3 - 度假型' },
  { value: 'P4', label: 'P4 - 会议型' },
  { value: 'P5', label: 'P5 - 长住型' },
  { value: 'P6', label: 'P6 - 主题型' },
  { value: 'P7', label: 'P7 - 精品型' },
];

export const OPERATION_MODE_OPTIONS: ValuationOption[] = [
  { value: 'M1', label: 'M1 - 自营' },
  { value: 'M2', label: 'M2 - 委托管理' },
  { value: 'M3', label: 'M3 - 特许经营' },
  { value: 'M4', label: 'M4 - 租赁经营' },
];

export const CAPEX_TYPE_OPTIONS: ValuationOption[] = [
  { value: 'new', label: '新建' },
  { value: 'acquisition', label: '存量购买' },
  { value: 'self_renew', label: '自有更新' },
];

const OPTION_FIELDS: Record<string, ValuationOption[]> = {
  city_tier: CITY_TIER_OPTIONS,
  location: LOCATION_OPTIONS,
  segment: SEGMENT_OPTIONS,
  property_type: PROPERTY_TYPE_OPTIONS,
  operation_mode: OPERATION_MODE_OPTIONS,
  capex_type: CAPEX_TYPE_OPTIONS,
};

export function getFieldOptions(key: string): ValuationOption[] | undefined {
  return OPTION_FIELDS[key];
}
