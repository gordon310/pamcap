import { describe, test, expect } from 'vitest';
import { classify } from './classify';

function fieldValue(result: ReturnType<typeof classify>, key: string) {
  return result.fields.find((f) => f.key === key)?.value;
}

describe('classify', () => {
  test('上海外滩豪华酒店 → 一线/CBD/S1', () => {
    const result = classify({
      name: '上海外滩豪华精选酒店',
      cityname: '上海市',
      adname: '黄浦区',
      business_area: '外滩',
      type: '住宿服务;宾馆酒店;五星级宾馆',
      biz_ext: { rating: '4.8', cost: '1200' },
    });

    expect(fieldValue(result, 'city_tier')).toBe('一线');
    expect(fieldValue(result, 'segment')).toBe('S1');
    expect(fieldValue(result, 'location')).toBe('CBD');
  });

  test('景区度假酒店 → 景区度假地/P3', () => {
    const result = classify({
      name: '千岛湖度假温泉酒店',
      cityname: '杭州市',
      type: '住宿服务;度假村',
      biz_ext: { cost: '600' },
    });

    expect(fieldValue(result, 'city_tier')).toBe('新一线');
    expect(fieldValue(result, 'property_type')).toBe('P3');
    expect(fieldValue(result, 'location')).toBe('景区度假地');
  });

  test('经济型连锁 → S5', () => {
    const result = classify({
      name: '7天连锁酒店(北京西站店)',
      cityname: '北京市',
      type: '住宿服务;经济型连锁酒店',
    });

    expect(fieldValue(result, 'segment')).toBe('S5');
    expect(fieldValue(result, 'location')).toBe('机场高铁');
  });

  test('无关键词且无人均消费 → 低置信默认值', () => {
    const result = classify({ name: '某某酒店', cityname: '未知城市' });
    const seg = result.fields.find((f) => f.key === 'segment');
    expect(seg?.value).toBe('S3');
    expect(seg?.confidence).toBe('low');
  });

  test('POI 缺少 cityname 时从名称/地址推断城市等级', () => {
    const result = classify({
      name: '杭州龙禧福朋喜来登酒店',
      address: '东信大道868号',
      adname: '滨江区',
      type: '住宿服务;宾馆酒店;四星级宾馆',
    });

    const cityField = result.fields.find((f) => f.key === 'city_tier');
    expect(cityField?.value).toBe('新一线');
    expect(cityField?.confidence).toBe('high');
  });

  test('按人均消费推导档次（中置信）', () => {
    const result = classify({
      name: '某某酒店',
      cityname: '南京市',
      type: '住宿服务;宾馆酒店',
      biz_ext: { cost: '520' },
    });
    const seg = result.fields.find((f) => f.key === 'segment');
    expect(seg?.value).toBe('S2');
    expect(seg?.confidence).toBe('medium');
  });
});
