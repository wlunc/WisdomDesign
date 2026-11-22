<!-- GENERATED FILE - DO NOT EDIT. -->
<!-- Source: wisdomdesign design truth sources via tools/ai-skill/lib/extract-design.js. -->
<!-- Regenerate with: node tools/ai-skill/lib/extract-design.js | node tools/ai-skill/lib/generate-core-catalog.js --out <dir> -->
<!-- No platform API claims are included. -->

# WDBadge 语义卡

Component: `WDBadge`
Spec: `docs/specs/01-basic.md` (number 11)
Contract: `contracts/WDBadge.yaml` (sha256 `2c5e0c0ce26ad5d3568e100dab59d03efcb02f845b3b9042d37103b1c582f860`)

## 用途（来自正式规格 §1）

状态与计数的紧凑表达。**徽标不单独承载信息**，必须依附在主体上。

- **用**：任务状态（已完成 / 已逾期）、未读数、在线点
- **不要用**：作为主要信息的载体（状态应当同时有文字）；装饰性点缀

## 来源追溯

- `docs/specs/01-basic.md:1031`
- `docs/specs/01-basic.md:1033`
- `docs/specs/01-basic.md:1036`
- `docs/specs/01-basic.md:1035`
- `docs/specs/01-basic.md:1063`
- `docs/specs/01-basic.md:1065`
- `docs/specs/01-basic.md:1066`
- `docs/specs/01-basic.md:1074`
- `docs/specs/01-basic.md:1076`
- `docs/specs/01-basic.md:1077`
- `docs/specs/01-basic.md:1088`
- `docs/specs/01-basic.md:1090`
- `docs/specs/01-basic.md:1091`
- `docs/specs/01-basic.md:1092`
- `docs/specs/01-basic.md:1093`

## 状态（来自正式规格 §5）

- 徽标本身是展示元素，没有按下态。计数为 0 时**整体隐藏**，不留空位。（`docs/specs/01-basic.md:1065`）
- 计数超过 99 显示 `99+`。（`docs/specs/01-basic.md:1066`）

## 内容（来自正式规格 §7）

- 状态胶囊文字 ≤ 4 个汉字，用名词短语（"已逾期"而不是"这个任务已经超过截止时间了"）（`docs/specs/01-basic.md:1076`）
- 徽标文字不换行、不截断；放不下就说明这一处置放的信息过多（`docs/specs/01-basic.md:1077`）

## 无障碍（来自正式规格 §10）

- 徽标不进入无障碍焦点序列，作为宿主朗读内容的一部分（`docs/specs/01-basic.md:1090`）
- 宿主朗读为"提醒，3 条未读"而不是分成两个元素（`docs/specs/01-basic.md:1091`）
- 状态胶囊的颜色不是唯一信号：**图标形状必须不同**（对勾 / 三角 / 实心禁止）（`docs/specs/01-basic.md:1092`）
- 文字与底色对比度 ≥ 4.5:1（`docs/specs/01-basic.md:1093`）

## 契约摘要（来自 YAML）

- params: 3
- slots: label
- enums: WDBadgeVariant

## 检索与组合 overlay（不得覆盖真源）

- searchAliases: none
- combinesWith: none
- pageRegions: none

## 平台说明

本卡不包含任何 Swift / Kotlin 平台 API 猜测。平台实现与证据只由对应 Provider 提供。
