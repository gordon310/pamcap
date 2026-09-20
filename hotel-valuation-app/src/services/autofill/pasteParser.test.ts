import { describe, test, expect } from 'vitest';
import { parseHotelText } from './pasteParser';

function value(result: ReturnType<typeof parseHotelText>, key: string) {
  return result.fields.find((f) => f.key === key)?.value;
}

describe('pasteParser', () => {
  const sample = `上海外滩茂悦大酒店
地址：上海市黄浦区南苏州路 199 号
客房数：320 间
开业时间：2018年6月
建筑面积：42000 平方米
均价：￥1250`;

  test('解析显式标签字段', () => {
    const result = parseHotelText(sample);
    expect(value(result, 'rooms')).toBe(320);
    expect(value(result, 'opening_date')).toBe('2018-06-01');
    expect(value(result, 'gfa')).toBe(42000);
    expect(value(result, 'ctrip_adr')).toBe(1250);
    expect(value(result, 'hotel_name')).toBe('上海外滩茂悦大酒店');
  });

  test('开业仅年份时补 01 月', () => {
    const result = parseHotelText('某某酒店 开业时间：2015年');
    expect(value(result, 'opening_date')).toBe('2015-01-01');
  });

  test('通用匹配（无显式标签）为中置信度', () => {
    const result = parseHotelText('酒店位于市中心，共 200间房，参考价 ¥ 880 元。');
    const rooms = result.fields.find((f) => f.key === 'rooms');
    expect(rooms?.value).toBe(200);
    expect(rooms?.confidence).toBe('medium');
  });

  test('空输入返回告警', () => {
    const result = parseHotelText('   ');
    expect(result.fields.length).toBe(0);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  test('无命中给出提示', () => {
    const result = parseHotelText('这是一段与酒店无关的文本。');
    expect(result.warnings.some((w) => w.includes('未识别到'))).toBe(true);
  });
});
