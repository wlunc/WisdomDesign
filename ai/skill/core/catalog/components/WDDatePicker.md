<!-- GENERATED FILE - DO NOT EDIT. -->
<!-- Source: wisdomdesign design truth sources via tools/ai-skill/lib/extract-design.js. -->
<!-- Regenerate with: node tools/ai-skill/lib/extract-design.js | node tools/ai-skill/lib/generate-core-catalog.js --out <dir> -->
<!-- No platform API claims are included. -->

# WDDatePicker 语义卡

Component: `WDDatePicker`
Spec: `docs/specs/02-advanced.md` (number 23)
Contract: `contracts/WDDatePicker.yaml` (sha256 `b27941cf9ef0513ba24d1049c8b7ac1b54b7582b0c285cb4ff695de81341ea8c`)

## 用途（来自正式规格 §1）

选日期、时间或时间范围。

- **用**：截止日期、提醒时间、体检预约
- **不要用**：自由文本输入日期（格式错误率高）；只需要"今天/明天"两个选项（用 Chip）

## 来源追溯

- `docs/specs/02-advanced.md:225,227,229,230,259,263,264,265,266,267,268,276,278,279,280,297,299,300,301,302,303`

## 状态（来自正式规格 §5）

- 状态=未选; 视觉="设置日期"，色 `text.tertiary`（`docs/specs/02-advanced.md:263`）
- 状态=已选; 视觉=格式化后的日期，色 `text.primary`（`docs/specs/02-advanced.md:264`）
- 状态=今天; 视觉=日历上带圆点标记（`docs/specs/02-advanced.md:265`）
- 状态=选中; 视觉=实心圆底 `text.brand` + 白字（`docs/specs/02-advanced.md:266`）
- 状态=已过期; 视觉=日期文字用 `status.danger`（`docs/specs/02-advanced.md:267`）
- 状态=禁用; 视觉=40%，日历中不可选的日期降到 30%（`docs/specs/02-advanced.md:268`）

## 内容（来自正式规格 §7）

- 日期格式跟随系统区域设置，**不硬编码为 YYYY-MM-DD**（`docs/specs/02-advanced.md:278`）
- 相对日期用自然语言："今天"、"明天"、"3 天后"（`docs/specs/02-advanced.md:279`）
- 范围显示"10月3日 – 10月7日"，中间用短横线（`docs/specs/02-advanced.md:280`）

## 无障碍（来自正式规格 §10）

- 触发行朗读"截止日期，已选，2026年10月3日，按钮"（`docs/specs/02-advanced.md:299`）
- 日历网格中每个日期朗读完整日期与状态（"10月3日，星期五，已选中"）（`docs/specs/02-advanced.md:300`）
- 触控热区 ≥ 44×44（日历单元本身就是 44）（`docs/specs/02-advanced.md:301`）
- 不用颜色单独表示"今天"，同时有圆点标记（`docs/specs/02-advanced.md:302`）
- 时间选择支持直接输入，避免滚轮被迫长时间滑动（`docs/specs/02-advanced.md:303`）

## 契约摘要（来自 YAML）

- params: 9
- slots: label
- enums: WDDatePickerMode

## 检索与组合 overlay（不得覆盖真源）

- searchAliases: none
- combinesWith: none
- pageRegions: none

## 平台说明

本卡不包含任何 Swift / Kotlin 平台 API 猜测。平台实现与证据只由对应 Provider 提供。
