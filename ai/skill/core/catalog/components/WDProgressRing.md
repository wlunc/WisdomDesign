<!-- GENERATED FILE - DO NOT EDIT. -->
<!-- Source: wisdomdesign design truth sources via tools/ai-skill/lib/extract-design.js. -->
<!-- Regenerate with: node tools/ai-skill/lib/extract-design.js | node tools/ai-skill/lib/generate-core-catalog.js --out <dir> -->
<!-- No platform API claims are included. -->

# WDProgressRing 语义卡

Component: `WDProgressRing`
Spec: `docs/specs/01-basic.md` (number 16)
Contract: `contracts-digest.json#WDProgressRing` (source `contracts/WDProgressRing.yaml`, sha256 `9df7760a1c90b040558955524391dc62486c1dc82fbe140c5a939db419639fc6`)

## 用途（来自正式规格 §1）

环形进度。用于**需要强调的单一指标**，因为环比线占用更多视觉重量。

- **用**：一张卡片里的核心指标（本周家务完成度）、连续打卡
- **不要用**：一行里出现 3 个以上（视觉过载）；纯等待（用不确定态）

## 来源追溯

- `docs/specs/01-basic.md:1465,1467,1469,1470,1472,1474,1476,1480,1481,1482,1483,1485,1489,1490,1491,1493,1497,1498,1499,1508,1510,1511,1512,1528,1530,1531,1532,1533`

## 设计者摘要

直径 60（标准）/ 44（紧凑）；线宽 6（标准）/ 5（紧凑）；起点 12 点方向，顺时针；环内留白 直径 − 2 × 线宽。

## 解剖（来自正式规格 §2）

- 轨道环 + 进度弧 + 环内内容（数值或图标）。（`docs/specs/01-basic.md:1474`）

## 尺寸（来自正式规格 §3）

- 项=直径; 值=60（标准）/ 44（紧凑）（`docs/specs/01-basic.md:1480`）
- 项=线宽; 值=6（标准）/ 5（紧凑）（`docs/specs/01-basic.md:1481`）
- 项=起点; 值=12 点方向，顺时针（`docs/specs/01-basic.md:1482`）
- 项=环内留白; 值=直径 − 2 × 线宽（`docs/specs/01-basic.md:1483`）

## 变体（来自正式规格 §4）

- 变体=百分比; 说明=环内显示"60%"（`docs/specs/01-basic.md:1489`）
- 变体=计数; 说明=环内显示"3/5"，用于离散总量（`docs/specs/01-basic.md:1490`）
- 变体=完成; 说明=环色换 `status.success`，环内显示对勾（`status.success` = 浅 #2A7F5C / 深 #7FD3B4）（`docs/specs/01-basic.md:1491`）

## 状态（来自正式规格 §5）

- 状态=增长; 视觉=弧从 0 长到目标值; 动效=3200ms 缓出，数字同步递增（`docs/specs/01-basic.md:1497`）
- 状态=完成; 视觉=环色转 `status.success`; 动效=弹一下 + 成功触觉，只播一次（`docs/specs/01-basic.md:1498`）
- 状态=停滞; 视觉=环色降饱和到 70%; 动效=无（`docs/specs/01-basic.md:1499`）

## 内容（来自正式规格 §7）

- 环内数字不超过 4 个字符（"60%"、"3/5"、"完成"）（`docs/specs/01-basic.md:1510`）
- 环外必须有说明文字，环本身不解释自己代表什么（`docs/specs/01-basic.md:1511`）
- 计数模式的分子不超过分母（`docs/specs/01-basic.md:1512`）

## 无障碍（来自正式规格 §10）

- 作为整体朗读"本周家务，已完成 3 项，共 5 项，60%"（`docs/specs/01-basic.md:1530`）
- 环本身标记为装饰，信息由文字承担（`docs/specs/01-basic.md:1531`）
- 旋转的进度弧不触发持续播报，只在完成时播报一次（`docs/specs/01-basic.md:1532`）
- 环与轨道对比度 ≥ 3:1；环内数字与环内底色对比度 ≥ 4.5:1（`docs/specs/01-basic.md:1533`）

## 契约摘要（来自 YAML）

- params: 4
- slots: label, valueText
- enums: WDProgressRingSize

## 检索与组合 overlay（不得覆盖真源）

- searchAliases: 进度环, 环形进度, 圆环, progress ring
- combinesWith: none
- pageRegions: card, overview

## 平台说明

本卡不包含任何 Swift / Kotlin 平台 API 猜测。平台实现与证据只由对应 Provider 提供。
