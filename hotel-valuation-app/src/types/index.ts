// Valuation Input Type (§11.1)
export interface ValuationInput {
  hotel_name: string;
  rooms: number;
  opening_date: string;
  gfa: number;
  city_tier?: '一线' | '新一线' | '二线' | '三线' | '四线及以下';
  location?: 'CBD' | '次中心' | '近郊新区' | '景区度假地' | '机场高铁' | '产业园区' | '其他';
  segment?: 'S1' | 'S2' | 'S3' | 'S4' | 'S5' | 'S6';
  property_type?: 'P1' | 'P2' | 'P3' | 'P4' | 'P5' | 'P6' | 'P7';
  operation_mode?: 'M1' | 'M2' | 'M3' | 'M4';
  ctrip_adr: number;
  occupancy_input: number;
  fb_ratio: number;
  owner_ebitda?: number;
  other_income: number;
  capex_type: 'new' | 'acquisition' | 'self_renew';
  construction_cost?: number;
  acquisition_price?: number;
  original_cost?: number;
  renovation_cost?: number;
  equity: number;
}

// Classification for hotel properties
export interface Classification {
  segment: 'S1' | 'S2' | 'S3' | 'S4' | 'S5' | 'S6';
  property_type: 'P1' | 'P2' | 'P3' | 'P4' | 'P5' | 'P6' | 'P7';
  city_tier: '一线' | '新一线' | '二线' | '三线' | '四线及以下';
  location: 'CBD' | '次中心' | '近郊新区' | '景区度假地' | '机场高铁' | '产业园区' | '其他';
  operation_mode: 'M1' | 'M2' | 'M3' | 'M4';
}

// Investment details
export interface Investment {
  capex_type: 'new' | 'acquisition' | 'self_renew';
  construction_cost?: number;
  acquisition_price?: number;
  original_cost?: number;
  renovation_cost?: number;
  equity: number;
}

// Trace item type (§11.3)
export interface TraceItem {
  step: string;
  name: string;
  formula: string;
  inputs: Record<string, any>;
  result: number;
  unit: string;
  source: string;
  flags?: string[];
  adjusted: boolean;
  note?: string;
}

// Valuation Result Type (§11.4)
export interface ValuationResult {
  metrics: {
    adr: number;
    occ: number;
    revpar: number;
    gor: number;
    gop: number;
    noi: number;
    ebitda_est: number;
    owner_ebitda?: number;
    ebitda_used: number;
    cap: number;
    location_coef: number;
    dscr: number;
    irr: number;
  };
  valuation: {
    income: number;
    multiple: number;
    cost_floor: number;
    range: {
      conservative: number;
      base: number;
      optimistic: number;
    };
    per_room: number;
    per_sqm: number;
    unit: string;
  };
  trace: TraceItem[];
  warnings: string[];
  usedCoefficients: string[];
}

// Expert identity (lightweight registration)
export interface Expert {
  name: string;
  email: string;
  role?: 'admin' | 'expert';
}

// Required expert evaluation after a valuation is produced
export interface Evaluation {
  content: string;
  author: string;
  email: string;
  at: string;
}

// Expert Opinion (§11.5)
export interface Opinion {
  id: string;
  target: string;
  content: string;
  author: string;
  at: string;
  status: '草稿' | '采纳' | '驳回';
}

// Adjustment record (§11.5)
export interface Adjustment {
  who: string;
  at: string;
  key: string;
  old: number;
  new: number;
  reason: string;
}

// Version information (§11.5)
export interface Version {
  id: string;
  status: string;
  at: string;
}

// Snapshot of one generated valuation (initial calculation or re-valuation)
export type RecordKind = 'initial' | 'revalue';

export interface ValuationRecord {
  id: string;
  at: string;
  kind: RecordKind;
  expert: Expert;
  input: ValuationInput;
  overrides: Record<string, any>;
  result: ValuationResult;
  evaluation: Evaluation | null;
}

// Persisted log entry for one expert coefficient adjustment
export interface AdjustmentEntry {
  id: string;
  at: string;
  expert: Expert;
  hotel_name: string;
  key: string;
  old: number | string;
  new: number;
  reason: string;
  recordId?: string;
}

// Full result with opinions and adjustments (§11.5)
export interface FullValuationResult {
  result: ValuationResult;
  opinions: Opinion[];
  adjustments: Adjustment[];
  versions: Version[];
}