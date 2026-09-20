import type { AutoFillField, AutoFillResult, Confidence } from './types';

const MAX_SNIPPET = 120;

function snippet(text: string, index: number): string {
  const start = Math.max(0, index - 20);
  const end = Math.min(text.length, index + 100);
  return text.slice(start, end).replace(/\s+/g, ' ').trim().slice(0, MAX_SNIPPET);
}

function toNumber(raw: string): number {
  return parseFloat(raw.replace(/,/g, ''));
}

function pushMatch(
  fields: AutoFillField[],
  text: string,
  match: RegExpMatchArray | null,
  field: Pick<AutoFillField, 'key' | 'label' | 'source'>,
  confidence: Confidence,
  value: string | number,
) {
  if (!match || match.index === undefined) return;
  fields.push({ ...field, value, confidence, snippet: snippet(text, match.index) });
}

export function parseHotelText(raw: string): AutoFillResult {
  const text = raw || '';
  const fields: AutoFillField[] = [];
  const warnings: string[] = [];
  const source = '粘贴解析';

  if (!text.trim()) {
    return { fields, warnings: ['内容为空，请粘贴酒店页面文字。'], provider: source };
  }

  const roomsLabeled = text.match(/(?:客房数|房间数|房量|客房总数|房间总数)[:：]?\s*(\d{2,5})/);
  if (roomsLabeled) {
    pushMatch(fields, text, roomsLabeled, { key: 'rooms', label: '房间数', source }, 'high', parseInt(roomsLabeled[1], 10));
  } else {
    const roomsGeneric = text.match(/(\d{2,5})\s*(?:间客房|间房|间)/);
    pushMatch(fields, text, roomsGeneric, { key: 'rooms', label: '房间数', source }, 'medium', roomsGeneric ? parseInt(roomsGeneric[1], 10) : 0);
  }

  const opening = text.match(/(?:开业(?:时间|于|日期)?|开业)[:：]?\s*(\d{4})\s*[-年/\.]\s*(\d{1,2})?/);
  if (opening && opening.index !== undefined) {
    const year = opening[1];
    const month = opening[2] ? String(parseInt(opening[2], 10)).padStart(2, '0') : '01';
    fields.push({
      key: 'opening_date',
      label: '开业时间',
      value: `${year}-${month}-01`,
      confidence: 'high',
      source,
      snippet: snippet(text, opening.index),
    });
  }

  const gfaLabeled = text.match(/(?:总建筑面积|建筑面积)[:：]?\s*([\d,]+(?:\.\d+)?)\s*(?:平方米|平米|㎡|m2|M2)/i);
  if (gfaLabeled) {
    pushMatch(fields, text, gfaLabeled, { key: 'gfa', label: '总建筑面积', source }, 'high', toNumber(gfaLabeled[1]));
  } else {
    const gfaGeneric = text.match(/([\d,]+(?:\.\d+)?)\s*(?:平方米|平米|㎡|m2|M2)/i);
    pushMatch(fields, text, gfaGeneric, { key: 'gfa', label: '总建筑面积', source }, 'medium', gfaGeneric ? toNumber(gfaGeneric[1]) : 0);
  }

  const adrLabeled = text.match(/(?:均价|平均房价|平均房价|门市价|参考价|起价|房价)[:：]?\s*[¥￥]?\s*([\d,]+(?:\.\d+)?)/);
  if (adrLabeled) {
    pushMatch(fields, text, adrLabeled, { key: 'ctrip_adr', label: '携程均价', source }, 'high', toNumber(adrLabeled[1]));
  } else {
    const adrGeneric = text.match(/[¥￥]\s*([\d,]+(?:\.\d+)?)\s*(?:元)?/);
    pushMatch(fields, text, adrGeneric, { key: 'ctrip_adr', label: '携程均价', source }, 'medium', adrGeneric ? toNumber(adrGeneric[1]) : 0);
  }

  const nameLabeled = text.match(/(?:酒店名称|酒店名|名称)[:：]\s*(.+)/);
  if (nameLabeled) {
    fields.push({
      key: 'hotel_name',
      label: '酒店名称',
      value: nameLabeled[1].trim().split(/\n/)[0].slice(0, 60),
      confidence: 'high',
      source,
      snippet: nameLabeled[0].slice(0, MAX_SNIPPET),
    });
  } else {
    const firstLine = text
      .split(/\n/)
      .map((l) => l.trim())
      .find((l) => /酒店|宾馆|度假村|饭店/.test(l) && !/[。！？；,，]/.test(l) && l.length <= 40);
    if (firstLine) {
      fields.push({
        key: 'hotel_name',
        label: '酒店名称',
        value: firstLine.slice(0, 60),
        confidence: 'medium',
        source,
        snippet: firstLine.slice(0, MAX_SNIPPET),
      });
    }
  }

  if (fields.length === 0) {
    warnings.push('未识别到任何字段，请检查粘贴内容是否包含“客房数/开业时间/建筑面积/均价”等信息。');
  }

  return { fields, warnings, provider: source };
}
