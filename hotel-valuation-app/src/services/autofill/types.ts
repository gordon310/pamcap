export type Confidence = 'high' | 'medium' | 'low';

export interface AutoFillField {
  key: string;
  label: string;
  value: string | number;
  confidence: Confidence;
  source: string;
  snippet?: string;
}

export interface AutoFillResult {
  fields: AutoFillField[];
  warnings: string[];
  provider: string;
}

export interface AmapBizExt {
  rating?: string;
  cost?: string;
}

export interface AmapPoi {
  id?: string;
  name: string;
  address?: string;
  cityname?: string;
  adname?: string;
  pname?: string;
  business_area?: string;
  type?: string;
  tel?: string;
  location?: string;
  biz_ext?: AmapBizExt;
}
