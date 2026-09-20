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

## 智能填充（新增）

输入页“酒店名称”旁提供两种辅助录入：

- **联网识别**：调用高德地图 JS API 搜索酒店 POI，自动推导城市等级 / 区位 / 档次 / 业态。需配置高德 Key。
- **粘贴解析**：粘贴携程等页面可见文字，前端抽取房间数 / 开业时间 / 建筑面积 / 携程均价。

识别结果均进入“核对抽屉”，逐字段显示来源与置信度，专家勾选后才写入表单。

### 配置高德 Key

1. 在高德开放平台创建 **Web端(JS API)** Key。
2. 在控制台为该 Key 绑定域名：`gordon310.github.io`（本地开发再加 `localhost`）。
3. 任选一种方式注入：
   - GitHub 仓库 **Settings → Secrets and variables → Actions → Variables** 新建变量 `AMAP_KEY`（值即 Key），重新运行部署工作流；或
   - 在应用“智能填充 → 设置 Key”中填写（存于浏览器 localStorage）。

> 前端 Key 属公开信息，务必通过高德控制台的域名白名单限制使用范围。

## 功能

- 输入酒店信息 → 自动生成 RevPAR / GOP / NOI / EBITDA / Cap Rate / IRR / 估值区间
- 完整计算过程（每步公式、代入值、结果、来源、置信度）
- 专家纠偏（只调系数，自动重算并留痕）
- 专家意见（绑定步骤/系数/结论）
- 版本快照、对比、回滚、定稿
- 导出 Skill 包（标准 JSON Schema + 计算逻辑）

## 免责声明

本工具仅用于**内部预估/验证**，对外正式估值报告仍须持证评估师复核。
