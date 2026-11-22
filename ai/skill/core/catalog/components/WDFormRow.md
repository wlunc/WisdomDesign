<!-- GENERATED FILE - DO NOT EDIT. -->
<!-- Source: wisdomdesign design truth sources via tools/ai-skill/lib/extract-design.js. -->
<!-- Regenerate with: node tools/ai-skill/lib/extract-design.js | node tools/ai-skill/lib/generate-core-catalog.js --out <dir> -->
<!-- No platform API claims are included. -->

# WDFormRow 语义卡

Component: `WDFormRow`
Spec: `docs/specs/02-advanced.md` (number 24)
Contract: `contracts/WDFormRow.yaml` (sha256 `bbc401c07a7e27cf9a9c5d930d31a30faecbffe286c5e0af2166896bda2df94f`)

## 用途（来自正式规格 §1）

表单里的一行：一个标签配一个控件。**它定义的是排布与对齐，不是控件本身**。

- **用**：设置页、新建表单里成组出现的"标签 + 控件"
- **不要用**：内容型列表（用 `WDListRow`）；只有一行输入且没有标签（直接用 `WDTextField`）

## 来源追溯

- `docs/specs/02-advanced.md:331`
- `docs/specs/02-advanced.md:333`
- `docs/specs/02-advanced.md:336`
- `docs/specs/02-advanced.md:335`
- `docs/specs/02-advanced.md:365`
- `docs/specs/02-advanced.md:369`
- `docs/specs/02-advanced.md:370`
- `docs/specs/02-advanced.md:371`
- `docs/specs/02-advanced.md:372`
- `docs/specs/02-advanced.md:381`
- `docs/specs/02-advanced.md:383`
- `docs/specs/02-advanced.md:384`
- `docs/specs/02-advanced.md:385`
- `docs/specs/02-advanced.md:386`
- `docs/specs/02-advanced.md:401`
- `docs/specs/02-advanced.md:403`
- `docs/specs/02-advanced.md:404`
- `docs/specs/02-advanced.md:405`
- `docs/specs/02-advanced.md:406`

## 状态（来自正式规格 §5）

- 状态=默认; 视觉=标签 `text.primary`（`docs/specs/02-advanced.md:369`）
- 状态=聚焦; 视觉=该行的分割线或描边换 `text.brand`（`docs/specs/02-advanced.md:370`）
- 状态=错误; 视觉=说明文字换成 danger 色错误文案（`docs/specs/02-advanced.md:371`）
- 状态=禁用; 视觉=标签与控件整体 40%（`docs/specs/02-advanced.md:372`）

## 内容（来自正式规格 §7）

- 标签 2–8 个汉字，名词短语，**不加冒号**（`docs/specs/02-advanced.md:383`）
- 标签与控件的值语义要区分：标签"截止日期"，值"明天"，不要两边都写日期（`docs/specs/02-advanced.md:384`）
- 说明文字一行，≤ 20 个汉字；错误文字一行，越短越好（`docs/specs/02-advanced.md:385`）
- 错误文字必须说清"哪里错 + 怎么改"（`docs/specs/02-advanced.md:386`）

## 无障碍（来自正式规格 §10）

- 标签与控件必须关联，读屏先读标签再读控件（`docs/specs/02-advanced.md:403`）
- 出错时读"截止日期，错误，日期不能早于今天"（`docs/specs/02-advanced.md:404`）
- 左右排布时，点击标签也能聚焦控件（标签的可点区域与行等高）（`docs/specs/02-advanced.md:405`）
- 分组时每个分组有组标签（如"提醒设置"）（`docs/specs/02-advanced.md:406`）

## 契约摘要（来自 YAML）

- params: 6
- slots: label, control
- enums: WDFormRowLayout

## 检索与组合 overlay（不得覆盖真源）

- searchAliases: none
- combinesWith: none
- pageRegions: none

## 平台说明

本卡不包含任何 Swift / Kotlin 平台 API 猜测。平台实现与证据只由对应 Provider 提供。
