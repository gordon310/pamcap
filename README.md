# 酒店资产估值验证应用（专家版）

纯前端 SPA（React 18 + TypeScript + Vite），零后端；内置行业基准库；专家可调系数、录入意见、版本留痕；定稿后导出 Skill 包。

## 在线访问（公网）

部署后由 GitHub Pages 提供，专家可直接打开测试：

> https://gordon310.github.io/pamcap/

每次推送到 `main` 分支会通过 GitHub Actions 自动构建并发布。

## 目录结构

```
.
├── 酒店资产估值验证应用_开发需求_V1.0_20260920.md   # 需求文档
├── hotel-valuation-app/                            # 应用源码
│   ├── src/
│   │   ├── components/                             # 输入表单 / 结果 / 系数调整 / 意见 / 版本
│   │   ├── services/valuation-engine.ts            # 纯函数计算引擎（§6）
│   │   ├── stores/                                 # Zustand 状态管理
│   │   ├── types/                                  # 数据模型（§11）
│   │   └── utils/baseline.json                     # 行业基准库（§5）
│   └── ...
└── .github/workflows/deploy.yml                    # GitHub Pages 自动部署
```

## 本地运行

```bash
cd hotel-valuation-app
npm install
npm run dev      # 开发服务器
npm test         # 单元测试（含黄金样例）
npm run build    # 生产构建
```

## 功能

- 输入酒店信息 → 自动生成 RevPAR / GOP / NOI / EBITDA / Cap Rate / IRR / 估值区间
- 完整计算过程（每步公式、代入值、结果、来源、置信度）
- 专家纠偏（只调系数，自动重算并留痕）
- 专家意见（绑定步骤/系数/结论）
- 版本快照、对比、回滚、定稿
- 导出 Skill 包（标准 JSON Schema + 计算逻辑）

## 免责声明

本工具仅用于**内部预估/验证**，对外正式估值报告仍须持证评估师复核。
