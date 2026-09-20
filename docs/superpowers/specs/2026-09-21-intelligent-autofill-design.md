# 智能填充（酒店信息自动识别）设计规格

| 项 | 内容 |
|---|---|
| 日期 | 2026-09-21 |
| 状态 | 已批准 |
| 关联 | 《酒店资产估值验证应用_开发需求_V1.0_20260920.md》§4 输入模型 |
| 交付形态 | 纯前端功能模块，无后端；构建于现有 React SPA 内 |

## 1. 目标

在输入页提供两种**辅助录入**能力，减少专家手工填写：

1. **联网识别**：输入酒店名称，调用高德地图 JS API 搜索酒店 POI，自动推导分类字段。
2. **粘贴解析**：专家粘贴携程等页面可见文字，前端抽取数值/日期字段。

所有识别结果**必须经专家核对勾选后**才写入表单，且每个字段标注来源与置信度。

## 2. 非目标

- 不抓取携程/任何第三方站点（CORS 与合规）。
- 不引入后端、数据库或 API 代理。
- 不自动填入无来源的数字（缺则留空，由专家手工输入）。
- 不改变现有计算引擎与基准逻辑。

## 3. 架构

```
src/services/autofill/
├── types.ts        # AutoFillField / AutoFillResult / AmapPoi
├── amap.ts         # 动态加载高德 JS API；searchHotels()
├── cityTier.ts     # 城市名 → 城市等级（读取 cityTier.json）
├── classify.ts     # AmapPoi → 分类字段（纯函数）
└── pasteParser.ts  # 页面文字 → 数值/日期字段（纯函数）
src/utils/cityTier.json             # 城市分级数据
src/components/AutoFillDrawer.tsx   # 核对抽屉（地图搜索 / 粘贴解析 两个 Tab）
```

数据流：
```
hotel_name ──▶ amap.searchHotels ──▶ 用户选择 POI ──▶ classify() ──┐
页面文字   ──▶ pasteParser.parse() ───────────────────────────────┤
                                                                  ▼
                                              AutoFillField[]（含置信度/来源/片段）
                                                                  ▼
                                        核对抽屉（勾选+可编辑）──▶ form.setFieldsValue
                                                                  ▼
                                                        现有 calculate() 流程不变
```

## 4. 字段覆盖范围

| 来源 | 字段 |
|---|---|
| 高德 classify | `city_tier`、`location`、`segment`、`property_type` |
| 粘贴解析 | `rooms`、`opening_date`、`gfa`、`ctrip_adr`、`hotel_name`、地址（展示用） |

高德无法提供房量/面积/ADR/出租率；这些字段缺省留空或由粘贴解析补齐。

## 5. 数据模型

```ts
type Confidence = 'high' | 'medium' | 'low';

interface AutoFillField {
  key: string;            // ValuationInput 字段名
  label: string;          // 中文名
  value: string | number; // 候选值
  confidence: Confidence;
  source: string;         // 来源描述（高德/粘贴解析）
  snippet?: string;       // 原文命中片段（粘贴解析）
}

interface AutoFillResult {
  fields: AutoFillField[];
  warnings: string[];
  provider: string;
}
```

## 6. 分类推导规则（classify.ts）

优先级：明确关键词 > 类型字段 > 人均消费/评分 > 默认值（低置信度）。

- **city_tier**：城市名归一化后查 `cityTier.json`；未命中 → `四线及以下`（low）。
- **segment**：
  - 名称/类型含 奢华/五星/豪华 → S1；高端/精品/四星 → S2；中高端/三星 → S3；中档/商务 → S4；经济/快捷/二星 → S5；民宿/青旅/有限服务 → S6。
  - 否则按 `biz_ext.cost` 人均消费分档。
  - 均无 → S3（low）。
- **property_type**：度假/温泉/海/山/古镇 → P3；会议/会展 → P4；公寓/长住/服务式 → P5；主题/亲子/电竞 → P6；精品/设计 → P7；商务 → P2；否则 P1（low）。
- **location**：机场/高铁/火车站 → 机场高铁；产业园/开发区/科技园 → 产业园区；景区/度假/温泉/海滩/山/湖 → 景区度假地；CBD/中央商务/核心商务区 → CBD；近郊/新区 → 近郊新区；默认 → 次中心（low）。

## 7. 粘贴解析规则（pasteParser.ts）

逐字段正则/关键词匹配，命中即产出并附带原文片段；未命中不产出。

- `rooms`：`(\d{2,5})\s*(间|间房|客房)`
- `opening_date`：`开业(时间|于)?[:：]?\s*(\d{4})[-年/](\d{1,2})?`
- `gfa`：`建筑面积[:：]?\s*([\d,\.]+)\s*(平方米|㎡|平米)`
- `ctrip_adr`：`(均价|平均房价|起价|门市价)[:：]?\s*[¥￥]?\s*([\d,]+)`
- `hotel_name`：`(酒店名称|名称)[:：]?\s*(.+)` 或首行含“酒店/宾馆/度假村”
- 置信度：显式标签（“客房数：”）→ high；泛匹配 → medium。

## 8. UI 与交互

- 输入页“酒店名称”旁新增按钮：**「联网识别」**、**「粘贴解析」**（同一 `AutoFillDrawer` 的两个 Tab）。
- 抽屉内容：
  - 地图搜索：关键词输入 → 候选列表（单选）→ 推导字段表（勾选框 + 可编辑值 + 置信度标签）→「应用选中项」。
  - 粘贴解析：多行文本框 →「解析」→ 字段表（含原文片段）→「应用选中项」。
  - 底部“设置”：高德 Key 输入与保存。
- 应用时仅写入勾选字段；`opening_date` 字符串转 dayjs 写入表单。
- 低置信度字段默认**不勾选**。

## 9. Key 管理与部署

- 读取顺序：`localStorage['pamcap.amapKey']` → `import.meta.env.VITE_AMAP_KEY`。
- 前端 Key 属公开信息，依赖高德控制台**域名白名单**（`gordon310.github.io`，开发加 `localhost`）。
- 部署工作流构建步骤注入 `VITE_AMAP_KEY: ${{ vars.AMAP_KEY }}`。

## 10. 错误处理与容错

- 未配置 Key / 加载失败 / 超额 / 无结果：抽屉内中文提示，手动录入不受影响。
- 粘贴无任何命中：提示“未识别到字段，请检查粘贴内容”。
- 全程不静默覆盖现有表单值。

## 11. 测试

- 纯函数单元测试：`cityTier`、`classify`、`pasteParser`，含固定样例与边界。
- 高德调用在测试中 mock，不发真实网络请求。

## 12. 验收标准

1. 输入酒店名（如“上海外滩茂悦大酒店”）联网识别后，可自动带出城市等级/区位/档次/业态，且逐项标来源与置信度。
2. 粘贴含“客房数：320 间、开业时间：2018年6月、建筑面积：42000 平方米、均价 1250 元”的文本，可正确解析对应字段。
3. 应用后仅覆盖勾选项，其余手工值保留。
4. 未配置 Key 或高德不可用时，手动录入与估值流程完全正常。
5. 单元测试通过。
