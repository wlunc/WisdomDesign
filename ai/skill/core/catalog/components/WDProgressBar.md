<!-- GENERATED FILE - DO NOT EDIT. -->
<!-- Source: wisdomdesign design truth sources via tools/ai-skill/lib/extract-design.js. -->
<!-- Regenerate with: node tools/ai-skill/lib/extract-design.js | node tools/ai-skill/lib/generate-core-catalog.js --out <dir> -->
<!-- No platform API claims are included. -->

# WDProgressBar 语义卡

Component: `WDProgressBar`
Spec: `docs/specs/01-basic.md` (number 15)
Contract: `contracts/WDProgressBar.yaml` (sha256 `bfd7dbda63e9896e68a5124be9347d85b2f444fccf3f7ce3af87ae4ac5b97ae8`)

## 用途（来自正式规格 §1）

线性进度。任务完成度、上传下载、多步骤流程。

- **用**：有一个明确的总量，进度可以量化
- **不要用**：等待时间未知且没有总量（用不确定态或 Skeleton）；强调单一指标（用 `WDProgressRing`）

## 来源追溯

- `docs/specs/01-basic.md:1371,1373,1375,1376,1400,1404,1405,1406,1407,1416,1418,1419,1420,1436,1438,1439,1440,1441,1442`

## 状态（来自正式规格 §5）

- 状态=进行中; 视觉=填充 `gradient.mid`; 动效=数值变化 240ms 线性（`docs/specs/01-basic.md:1404`）
- 状态=完成; 视觉=填充换 `status.success`; 动效=到达 100% 时 300ms 过渡 + 一次成功触觉（`docs/specs/01-basic.md:1405`）
- 状态=不确定; 视觉=一段 35% 宽来回移动; 动效=1.4s 循环（`docs/specs/01-basic.md:1406`）
- 状态=禁用; 视觉=整体 45%; 动效=无（`docs/specs/01-basic.md:1407`）

## 内容（来自正式规格 §7）

- 百分比用等宽数字（`docs/specs/01-basic.md:1418`）
- 分段模式显示"3 / 5"而不是"60%"（`docs/specs/01-basic.md:1419`）
- 数值不超过 100%，超过时截断并记录错误（`docs/specs/01-basic.md:1420`）

## 无障碍（来自正式规格 §10）

- 角色为 `progressbar`，必须提供 `valuenow` / `valuemin` / `valuemax`（`docs/specs/01-basic.md:1438`）
- 朗读"上传进度，45%"（`docs/specs/01-basic.md:1439`）
- 不确定态不提供 `valuenow`，朗读"加载中"（`docs/specs/01-basic.md:1440`）
- 进度变化不做实时 `aria-live` 播报，只在跨越 25% / 50% / 75% / 100% 时播报（`docs/specs/01-basic.md:1441`）
- 填充与轨道的对比度 ≥ 3:1（`docs/specs/01-basic.md:1442`）

## 契约摘要（来自 YAML）

- params: 5
- slots: label, valueText
- enums: none

## 检索与组合 overlay（不得覆盖真源）

- searchAliases: none
- combinesWith: none
- pageRegions: none

## 平台说明

本卡不包含任何 Swift / Kotlin 平台 API 猜测。平台实现与证据只由对应 Provider 提供。
