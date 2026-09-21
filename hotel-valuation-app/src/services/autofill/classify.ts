import type { AmapPoi, AutoFillField, AutoFillResult, Confidence } from './types';
import { getCityTier } from './cityTier';

interface KeywordRule<T extends string> {
  value: T;
  keywords: string[];
}

const SEGMENT_RULES: KeywordRule<string>[] = [
  { value: 'S1', keywords: ['奢华', '豪华', '五星', '5星', '顶级', '瑰丽', '瑞吉', '丽思卡尔顿', '文华东方', '半岛', '四季', '柏悦', '君悦', '华尔道夫', '安缦', '悦榕庄', '洲际'] },
  { value: 'S2', keywords: ['高端', '高档', '四星', '4星', '精品', '威斯汀', '万豪', '喜来登', '希尔顿', '凯悦', '香格里拉', '索菲特', '朗廷', '皇冠假日'] },
  { value: 'S3', keywords: ['中高端', '三星', '3星', '亚朵', '全季', '桔子水晶', '美居', '诺富特', '欢朋', '智选假日', '维也纳国际'] },
  { value: 'S4', keywords: ['中档', '商务', '维也纳', '锦江之星', '如家精选', '汉庭', '格林豪泰', '宜必思'] },
  { value: 'S5', keywords: ['经济', '快捷', '二星', '2星', '七天', '7天', '城市便捷', '尚客优', '速8', '莫泰'] },
  { value: 'S6', keywords: ['民宿', '青旅', '青年旅舍', '客栈', '有限服务', '家庭旅馆'] },
];

const PROPERTY_TYPE_RULES: KeywordRule<string>[] = [
  { value: 'P3', keywords: ['度假', '温泉', '海滩', '海边', '海景', '滑雪', '避暑', '山庄', '水疗', 'spa', '古镇', '湖景', '山景'] },
  { value: 'P4', keywords: ['会议', '会展', '国展', '会堂'] },
  { value: 'P5', keywords: ['公寓', '长住', '服务式', '酒店式'] },
  { value: 'P6', keywords: ['主题', '亲子', '电竞', '动漫', '卡通', '城堡', '营地'] },
  { value: 'P7', keywords: ['精品', '设计', 'boutique', '设计师'] },
  { value: 'P2', keywords: ['商务'] },
];

const LOCATION_RULES: KeywordRule<string>[] = [
  { value: '机场高铁', keywords: ['机场', '航站', '高铁', '火车站', '高铁站', '车站', '客运站', '西站', '东站', '南站', '北站', '站前'] },
  { value: '产业园区', keywords: ['产业园', '开发区', '科技园', '工业园', '高新区', '经开区', '工业园区'] },
  { value: '景区度假地', keywords: ['景区', '度假', '温泉', '海滩', '海景', '古镇', '湿地', '森林公园', '旅游区', '索道', '湖', '山'] },
  { value: 'CBD', keywords: ['cbd', '中央商务', '国贸', '陆家嘴', '金融街', '珠江新城', '核心商务', '商务中心', '市中心', '外滩', '南京路', '人民广场', '天河', '春熙路', '解放碑', '观音桥', '武林', '五四广场'] },
  { value: '近郊新区', keywords: ['近郊', '新区', '城郊'] },
];

function matchRule(text: string, rules: KeywordRule<string>[]): string | null {
  const lower = text.toLowerCase();
  for (const rule of rules) {
    for (const kw of rule.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        return rule.value;
      }
    }
  }
  return null;
}

function segmentByCost(cost: number): { value: string; confidence: Confidence } | null {
  if (!isFinite(cost) || cost <= 0) return null;
  if (cost >= 800) return { value: 'S1', confidence: 'medium' };
  if (cost >= 500) return { value: 'S2', confidence: 'medium' };
  if (cost >= 300) return { value: 'S3', confidence: 'medium' };
  if (cost >= 180) return { value: 'S4', confidence: 'medium' };
  if (cost >= 100) return { value: 'S5', confidence: 'medium' };
  return { value: 'S6', confidence: 'medium' };
}

export function classify(poi: AmapPoi): AutoFillResult {
  const fields: AutoFillField[] = [];
  const warnings: string[] = [];
  const source = '高德地图';
  const text = [poi.name, poi.type, poi.business_area, poi.address].filter(Boolean).join(' ');

  const cityHints = [poi.cityname, poi.pname, poi.adname].filter(Boolean).join(' ');
  let cityMatch = getCityTier(cityHints);
  if (cityMatch.confidence !== 'high') {
    for (const fallback of [poi.name, [poi.address, poi.business_area].filter(Boolean).join(' ')]) {
      const candidate = getCityTier(fallback);
      if (candidate.confidence === 'high') {
        cityMatch = candidate;
        break;
      }
    }
  }
  fields.push({
    key: 'city_tier',
    label: '城市等级',
    value: cityMatch.tier,
    confidence: cityMatch.confidence,
    source,
  });
  if (cityMatch.confidence === 'low' && cityHints) {
    warnings.push(`城市「${cityHints}」未在分级表中，城市等级需人工确认。`);
  }

  const segByKeyword = matchRule(text, SEGMENT_RULES);
  if (segByKeyword) {
    fields.push({ key: 'segment', label: '档次', value: segByKeyword, confidence: 'high', source });
  } else {
    const cost = parseFloat(poi.biz_ext?.cost || '');
    const segByCost = segmentByCost(cost);
    if (segByCost) {
      fields.push({ key: 'segment', label: '档次', value: segByCost.value, confidence: segByCost.confidence, source: `${source}（人均消费 ¥${cost}）` });
    } else {
      fields.push({ key: 'segment', label: '档次', value: 'S3', confidence: 'low', source });
    }
  }

  const propType = matchRule(text, PROPERTY_TYPE_RULES);
  if (propType) {
    fields.push({ key: 'property_type', label: '业态', value: propType, confidence: 'high', source });
  } else {
    fields.push({ key: 'property_type', label: '业态', value: 'P1', confidence: 'low', source });
  }

  const loc = matchRule(text, LOCATION_RULES);
  if (loc) {
    fields.push({ key: 'location', label: '区位', value: loc, confidence: 'high', source });
  } else {
    fields.push({ key: 'location', label: '区位', value: '次中心', confidence: 'low', source });
  }

  return { fields, warnings, provider: source };
}
