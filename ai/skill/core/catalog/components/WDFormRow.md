<!-- GENERATED FILE - DO NOT EDIT. -->
<!-- Source: wisdomdesign design truth sources via tools/ai-skill/lib/extract-design.js. -->
<!-- Regenerate with: node tools/ai-skill/lib/extract-design.js | node tools/ai-skill/lib/generate-core-catalog.js --out <dir> -->
<!-- No platform API claims are included. -->

# WDFormRow 语义卡

Component: `WDFormRow`
Spec: `docs/specs/02-advanced.md` (number 24)
Contract: `contracts-digest.json#WDFormRow` (source `contracts/WDFormRow.yaml`, sha256 `bbc401c07a7e27cf9a9c5d930d31a30faecbffe286c5e0af2166896bda2df94f`)

## 用途（来自正式规格 §1）

表单里的一行：一个标签配一个控件。**它定义的是排布与对齐，不是控件本身**。

- **用**：设置页、新建表单里成组出现的"标签 + 控件"
- **不要用**：内容型列表（用 `WDListRow`）；只有一行输入且没有标签（直接用 `WDTextField`）

## 来源追溯

- `docs/specs/02-advanced.md:331,333,335,336,338,342,343,344,345,347,351,352,353,354,355,357,361,362,363,365,369,370,371,372,381,383,384,385,386,401,403,404,405,406`

## 设计者摘要

行最小高 44；标签与控件间距 `space.4`（12）；行与行之间 `space.5`（16）；说明 / 错误文字与控件间距 `space.2`（4）；必有 标签 / 控件；可选 说明文字。

## 解剖（来自正式规格 §2）

- 段=标签; 是否必有=必有; 说明=`type.subheadline` 15，色 `text.primary`（`type.subheadline` = 15/20 · 400；`text.primary` = 浅 #0A1B24 / 深 #E6F1F6）（`docs/specs/02-advanced.md:342`）
- 段=控件; 是否必有=必有; 说明=任意输入类组件（`docs/specs/02-advanced.md:343`）
- 段=说明文字; 是否必有=可选; 说明=`type.footnote` 13，色 `text.secondary`（`type.footnote` = 13/18 · 400；`text.secondary` = 浅 #3E5764 / 深 #A4BCCB）（`docs/specs/02-advanced.md:344`）
- 段=错误文字; 是否必有=条件; 说明=同为 `type.footnote`，色 `status.danger`；**替换**说明文字，不叠加（`type.footnote` = 13/18 · 400；`status.danger` = 浅 #B8564D / 深 #EDA79E）（`docs/specs/02-advanced.md:345`）

## 尺寸（来自正式规格 §3）

- 项=行最小高; 值=44（`docs/specs/02-advanced.md:351`）
- 项=标签与控件间距; 值=`space.4`（12）（`docs/specs/02-advanced.md:352`）
- 项=行与行之间; 值=`space.5`（16）（`docs/specs/02-advanced.md:353`）
- 项=说明 / 错误文字与控件间距; 值=`space.2`（4）（`docs/specs/02-advanced.md:354`）
- 项=标签列宽（左右排布）; 值=96，超出时标签换到上方排布（`docs/specs/02-advanced.md:355`）

## 变体（来自正式规格 §4）

- 变体=左右; 排布=标签居左、控件居右; 用在哪=控件窄（开关、步进器、选择器）（`docs/specs/02-advanced.md:361`）
- 变体=上下; 排布=标签在上、控件在下并全宽; 用在哪=控件宽（输入框、多行）（`docs/specs/02-advanced.md:362`）
- 变体=分组; 排布=多行合并进一个卡片，行内用分割线; 用在哪=设置页（`docs/specs/02-advanced.md:363`）

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

- searchAliases: 表单行, 设置行, 表单项, form row
- combinesWith: WDTextField, WDSwitch, WDPicker
- pageRegions: form

## 平台说明

本卡不包含任何 Swift / Kotlin 平台 API 猜测。平台实现与证据只由对应 Provider 提供。
