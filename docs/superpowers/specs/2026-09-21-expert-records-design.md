# 专家生成记录与系数调整汇总 设计规格

| 项 | 内容 |
|---|---|
| 日期 | 2026-09-21 |
| 状态 | 已批准 |
| 关联 | 《酒店资产估值验证应用_开发需求_V1.0_20260920.md》§9/§10；智能填充设计规格 |
| 交付形态 | 纯前端，无后端；数据仅存本机浏览器，可导出/导入 JSON |

## 1. 目标

1. **保存生成数据**：每次「计算估值」「重新估值」成功后，落一条记录（专家 + 输入 + overrides + 结果含 trace），供后期校对与复现。
2. **保存系数调整记录**：每次专家调整系数，落一条调整明细（专家 / 酒店 / 系数路径 / 原值 / 新值 / 原因 / 时间）。
3. **提交汇总给你**：一键导出「系数调整汇总」为 **JSON + CSV**，供算法负责人汇总修改估值算法。
4. **显式重新估值**：保留调系数实时重算，另加「重新估值」按钮，手动触发并生成 revalue 记录。
5. **登录校验**：专家以「姓名 + 邮箱」登录；命中本机名单直接进入，未命中弹确认登记。

## 2. 非目标

- 不引入后端/数据库/账号体系；不抓取第三方。
- 不改动计算引擎与基准逻辑（`valuation-engine` 与黄金样例不变）。
- 不做跨设备自动同步（通过导出/导入汇总）。

## 3. 存储

localStorage 键：

| 键 | 内容 |
|---|---|
| `pamcap.records` | `ValuationRecord[]` |
| `pamcap.experts` | `Expert[]`（本机专家名单） |
| `pamcap.adjustments` | `AdjustmentEntry[]`（系数调整明细日志） |
| `pamcap.expert` | 当前登录专家（沿用） |

- 记录总字节超过 `MAX_RECORDS_BYTES`（3.5MB）时，按时间从旧到新剔除，返回 `pruned` 数量并提示导出留存。
- 存储层为可注入的 `StorageLike`，单测注入内存 mock，不依赖 DOM。

## 4. 数据模型

```ts
type RecordKind = 'initial' | 'revalue';

interface ValuationRecord {
  id: string;
  at: string;                       // ISO
  kind: RecordKind;
  expert: Expert;
  input: ValuationInput;
  overrides: Record<string, any>;
  result: ValuationResult;          // 含 trace
  evaluation: Evaluation | null;
}

interface AdjustmentEntry {
  id: string;
  at: string;
  expert: Expert;
  hotel_name: string;
  key: string;                      // 系数路径
  old: number | string;
  new: number;
  reason: string;
  recordId?: string;
}
```

## 5. 纯函数（`services/records.ts`）

- `isExpertRegistered(expert, experts)`：邮箱不区分大小写，姓名/邮箱去空格比较。
- `upsertExpert(experts, expert)`：新增或返回原列表（幂等）。
- `appendRecord(records, record, maxBytes)`：追加并裁剪，返回 `{ records, pruned }`。
- `adjustmentRows(entries)`：转为表格行对象。
- `adjustmentsToCSV(entries)`：CSV 文本（含表头，正确转义逗号/引号/换行）。
- `parseImport(json)`：解析导入包（可含 records / experts / adjustments）。

IO 包装：`load*/save*`（默认 localStorage）。

## 6. Store 变更（`stores/index.ts`）

- 新增 state：`records`、`experts`、`adjustmentLog`、`currentRecordId`。
- `calculate(input)`：计算后追加 `initial` 记录并持久化。
- `revalue()`：按当前 input+overrides 重算，追加 `revalue` 记录并持久化。
- `adjustCoefficient(...)`：原逻辑 + 追加 `AdjustmentEntry` 到日志并持久化。
- `loginExpert(expert)`：命中名单或登记后写入 `experts`，设为当前专家。
- `deleteRecord(id)`、`importRecords(json)`。
- `exportAdjustmentSubmission()`：返回 `{ json, csv }`。

## 7. UI

- **记录页（新 Tab）**：表格（酒店/专家/时间/类型/估值基准值）；按专家、关键词筛选；查看详情抽屉、删除；导出/导入 JSON。
- **系数调整页**：新增「重新估值」与「导出系数调整汇总（JSON+CSV）」按钮。
- **ExpertGate**：登录/登记；未命中名单时 `Modal.confirm` 确认登记后进入。

## 8. 测试

- `services/records.ts` 单测：名单校验、记录追加与裁剪、CSV 转义、导出/导入往返。
- 其余为 UI/antd 行为，走 build + 真机验证。
